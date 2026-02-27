import { useState, useEffect, useRef, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { EdgeBatch } from './Edge'
import NeuronInstances from './NeuronInstances'
import ParticleSystem, { type ParticleData } from './ParticleSystem'
import type { LayerActivation } from '../utils/inference'

export const LAYER_SPACING = 3.5
const MAX_LAYER_HEIGHT = 5.0
const MAX_NEURON_SPACING = 1.2

const MAX_DISPLAY_NEURONS = 16

// 入力層グリッド設定
const INPUT_GRID_SIZE = 28          // 28×28（MNIST 解像度）
const INPUT_GRID_SPACING = 0.20     // グリッド間隔（27×0.20=5.40 単位、視覚サイズを維持）
const INPUT_NEURON_RADIUS = 0.065   // 28×28 に合わせて縮小

// 層ペアあたりのエッジ上限（隠れ層同士）
const MAX_EDGES_PER_PAIR = 60

// 入力層→隠れ層1 のエッジ上限
const MAX_INPUT_EDGES = 300
const INPUT_EDGE_OPACITY = 0.18

// 1層遷移あたりに表示するパーティクルの上限
const MAX_PARTICLES_PER_PAIR = 8

// 層間アニメーションの間隔 (ms)
const PHASE_DURATION_MS = 900

export interface NetworkConfig {
  layers: number[]
}

interface NeuralNetworkProps {
  config: NetworkConfig
  animRunId: number
  activations?: LayerActivation[]  // 推論結果（undefined ならダミー値を使用）
  onPhaseChange?: (phase: number, numLayers: number) => void
}

interface EdgeData {
  key: string
  layerPair: number
  start: [number, number, number]
  end: [number, number, number]
  weight: number
  opacity?: number
}

function calcYPositions(count: number): number[] {
  const spacing =
    count > 1 ? Math.min(MAX_NEURON_SPACING, MAX_LAYER_HEIGHT / (count - 1)) : 0
  const totalHeight = (count - 1) * spacing
  return Array.from({ length: count }, (_, i) => totalHeight / 2 - i * spacing)
}

function layerLabel(index: number, total: number, actualSize: number): string {
  if (index === 0) return `Input (${actualSize})`
  if (index === total - 1) return `Output (${actualSize})`
  return `Hidden ${index} (${actualSize})`
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * ReLU 出力など上限のない値を [0, 1] に正規化する。
 * 層内の最大値で割ることで相対的な強度を保つ。
 */
function normalizeLayer(values: number[]): number[] {
  const max = Math.max(...values)
  return max > 0 ? values.map(v => v / max) : values.map(() => 0)
}

/**
 * values から displayCount 個を等間隔でサンプリングする。
 * values.length <= displayCount の場合はそのまま返す。
 */
function sampleValues(values: number[], displayCount: number): number[] {
  if (values.length <= displayCount) return values
  const step = values.length / displayCount
  return Array.from({ length: displayCount }, (_, i) => values[Math.floor(i * step)])
}

function NeuralNetwork({ config, animRunId, activations: activationsProp, onPhaseChange }: NeuralNetworkProps) {
  const { layers } = config
  const numLayers = layers.length

  const [activeLayerPair, setActiveLayerPair] = useState(-1)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // 隠れ層・出力層（layers[1] 以降）のデータ
  const layerData = useMemo(
    () =>
      layers.map((size, i) => {
        const displayCount = Math.min(size, MAX_DISPLAY_NEURONS)
        let acts: number[]
        if (activationsProp && activationsProp[i]) {
          // 実アクティベーション: 正規化してから表示数にサンプリング
          const norm = normalizeLayer(activationsProp[i].values)
          acts = sampleValues(norm, displayCount)
        } else {
          acts = Array.from({ length: displayCount }, () => Math.random())
        }
        return { size, displayCount, activations: acts }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layers, activationsProp],
  )

  // 入力層（28×28 グリッド）のニューロン位置と activation
  const { inputPositions, inputActivations } = useMemo(() => {
    const positions: [number, number, number][] = []
    const x = 0
    const totalSpan = (INPUT_GRID_SIZE - 1) * INPUT_GRID_SPACING
    const offset = totalSpan / 2
    for (let row = 0; row < INPUT_GRID_SIZE; row++) {
      for (let col = 0; col < INPUT_GRID_SIZE; col++) {
        const y = offset - row * INPUT_GRID_SPACING
        const z = -offset + col * INPUT_GRID_SPACING
        positions.push([x, y, z])
      }
    }

    // 実アクティベーションがあればそのまま使用（MNIST データは既に [0,1]）
    // ない場合はダミー乱数
    const acts = activationsProp?.[0]?.values ??
      Array.from({ length: INPUT_GRID_SIZE * INPUT_GRID_SIZE }, () => Math.random())

    return { inputPositions: positions, inputActivations: acts }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, activationsProp])

  // 隠れ層・出力層のニューロン位置と activation（入力層以外）
  const { hiddenPositions, hiddenActivations } = useMemo(() => {
    const positions: [number, number, number][] = []
    const acts: number[] = []
    for (let i = 1; i < layerData.length; i++) {
      const x = i * LAYER_SPACING
      const ys = calcYPositions(layerData[i].displayCount)
      for (let j = 0; j < layerData[i].displayCount; j++) {
        positions.push([x, ys[j], 0])
        acts.push(layerData[i].activations[j])
      }
    }
    return { hiddenPositions: positions, hiddenActivations: acts }
  }, [layerData])

  // ラベル用のデータ
  const labels = useMemo(() => {
    const result: { text: string; position: [number, number, number] }[] = []

    // 入力層ラベル: グリッド下端の下
    const inputGridSpan = (INPUT_GRID_SIZE - 1) * INPUT_GRID_SPACING
    result.push({
      text: `Input (${INPUT_GRID_SIZE}×${INPUT_GRID_SIZE})`,
      position: [0, -(inputGridSpan / 2) - 0.65, 0],
    })

    // 隠れ層・出力層ラベル
    for (let i = 1; i < layerData.length; i++) {
      const layer = layerData[i]
      const spacing =
        layer.displayCount > 1
          ? Math.min(MAX_NEURON_SPACING, MAX_LAYER_HEIGHT / (layer.displayCount - 1))
          : 0
      const totalHeight = (layer.displayCount - 1) * spacing
      result.push({
        text: layerLabel(i, numLayers, layer.size),
        position: [i * LAYER_SPACING, -(totalHeight / 2) - 0.65, 0],
      })
    }

    return result
  }, [layerData, numLayers])

  // エッジデータ
  const edges = useMemo<EdgeData[]>(() => {
    const result: EdgeData[] = []

    // --- 入力層 (l=0) → 隠れ層1: グリッド座標を使用し weight 上位に間引き ---
    {
      const countB = layerData[1].displayCount
      const xB = 1 * LAYER_SPACING
      const yB = calcYPositions(countB)
      const countA = inputPositions.length // 784
      const rand = seededRandom(0 * 9973 + 1)

      // 全候補に weight を振って上位を選ぶ
      const candidates: { i: number; j: number; weight: number }[] = []
      for (let i = 0; i < countA; i++) {
        for (let j = 0; j < countB; j++) {
          candidates.push({ i, j, weight: rand() * 2 - 1 })
        }
      }
      candidates.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
      const selected = candidates.slice(0, MAX_INPUT_EDGES)

      for (const { i, j, weight } of selected) {
        result.push({
          key: `0-${i}-${j}`,
          layerPair: 0,
          start: inputPositions[i],
          end: [xB, yB[j], 0],
          weight,
          opacity: INPUT_EDGE_OPACITY,
        })
      }
    }

    // --- 隠れ層同士・隠れ層→出力層 (l>=1): 既存ロジック ---
    for (let l = 1; l < numLayers - 1; l++) {
      const countA = layerData[l].displayCount
      const countB = layerData[l + 1].displayCount
      const xA = l * LAYER_SPACING
      const xB = (l + 1) * LAYER_SPACING
      const yA = calcYPositions(countA)
      const yB = calcYPositions(countB)

      const totalPossible = countA * countB
      const rand = seededRandom(l * 9973 + 1)

      if (totalPossible <= MAX_EDGES_PER_PAIR) {
        for (let i = 0; i < countA; i++) {
          for (let j = 0; j < countB; j++) {
            const weight = rand() * 2 - 1
            result.push({
              key: `${l}-${i}-${j}`,
              layerPair: l,
              start: [xA, yA[i], 0],
              end: [xB, yB[j], 0],
              weight,
            })
          }
        }
      } else {
        const sampled = new Set<number>()
        while (sampled.size < MAX_EDGES_PER_PAIR) {
          sampled.add(Math.floor(rand() * totalPossible))
        }
        for (const idx of sampled) {
          const i = Math.floor(idx / countB)
          const j = idx % countB
          const weight = rand() * 2 - 1
          result.push({
            key: `${l}-${i}-${j}`,
            layerPair: l,
            start: [xA, yA[i], 0],
            end: [xB, yB[j], 0],
            weight,
          })
        }
      }
    }
    return result
  }, [layerData, numLayers, inputPositions])

  // パーティクルデータ（ParticleSystem 用にフラット化）
  const flatParticles = useMemo<ParticleData[]>(() => {
    const byPair = Array.from({ length: numLayers - 1 }, (_, l) =>
      edges
        .filter(e => e.layerPair === l)
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, MAX_PARTICLES_PER_PAIR),
    )
    return byPair.flatMap((group, pairIdx) =>
      group.map(e => ({
        startPos: e.start,
        endPos: e.end,
        color: e.weight >= 0 ? '#4a90e2' : '#e05252',
        layerPair: pairIdx,
      })),
    )
  }, [edges, numLayers])

  // アニメーションタイマー
  useEffect(() => {
    if (animRunId === 0) return

    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    const setPhase = (p: number) => {
      setActiveLayerPair(p)
      onPhaseChange?.(p, numLayers)
    }

    setPhase(0)

    for (let i = 1; i < numLayers - 1; i++) {
      const t = setTimeout(() => setPhase(i), i * PHASE_DURATION_MS)
      timeoutsRef.current.push(t)
    }

    const endT = setTimeout(
      () => setPhase(-1),
      (numLayers - 1) * PHASE_DURATION_MS,
    )
    timeoutsRef.current.push(endT)

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [animRunId, numLayers, onPhaseChange])

  const centerOffset = -((numLayers - 1) * LAYER_SPACING) / 2

  return (
    <group position={[centerOffset, 0, 0]}>
      <EdgeBatch edges={edges} />

      <NeuronInstances
        positions={inputPositions}
        activations={inputActivations}
        radius={INPUT_NEURON_RADIUS}
      />
      <NeuronInstances
        positions={hiddenPositions}
        activations={hiddenActivations}
      />

      {labels.map((l, i) => (
        <Text
          key={i}
          position={l.position}
          fontSize={0.28}
          color="#888888"
          anchorX="center"
          anchorY="top"
        >
          {l.text}
        </Text>
      ))}

      <ParticleSystem
        particles={flatParticles}
        activeLayerPair={activeLayerPair}
        animRunId={animRunId}
      />
    </group>
  )
}

export default NeuralNetwork
