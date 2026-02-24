import { useState, useEffect, useRef, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { EdgeBatch } from './Edge'
import NeuronInstances from './NeuronInstances'
import ParticleSystem, { type ParticleData } from './ParticleSystem'

export const LAYER_SPACING = 3.5
const MAX_LAYER_HEIGHT = 5.0
const MAX_NEURON_SPACING = 1.2

const MAX_DISPLAY_NEURONS = 16

// 層ペアあたりのエッジ上限
const MAX_EDGES_PER_PAIR = 60

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
  onPhaseChange?: (phase: number, numLayers: number) => void
}

interface EdgeData {
  key: string
  layerPair: number
  start: [number, number, number]
  end: [number, number, number]
  weight: number
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

function NeuralNetwork({ config, animRunId, onPhaseChange }: NeuralNetworkProps) {
  const { layers } = config
  const numLayers = layers.length

  const [activeLayerPair, setActiveLayerPair] = useState(-1)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const layerData = useMemo(
    () =>
      layers.map(size => {
        const displayCount = Math.min(size, MAX_DISPLAY_NEURONS)
        const activations = Array.from({ length: displayCount }, () => Math.random())
        return { size, displayCount, activations }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layers],
  )

  // 全ニューロンの位置と activation をフラット配列に集約（InstancedMesh 用）
  const { neuronPositions, neuronActivations } = useMemo(() => {
    const positions: [number, number, number][] = []
    const activations: number[] = []
    for (let i = 0; i < layerData.length; i++) {
      const x = i * LAYER_SPACING
      const ys = calcYPositions(layerData[i].displayCount)
      for (let j = 0; j < layerData[i].displayCount; j++) {
        positions.push([x, ys[j], 0])
        activations.push(layerData[i].activations[j])
      }
    }
    return { neuronPositions: positions, neuronActivations: activations }
  }, [layerData])

  // ラベル用のデータ
  const labels = useMemo(
    () =>
      layerData.map((layer, i) => {
        const spacing =
          layer.displayCount > 1
            ? Math.min(MAX_NEURON_SPACING, MAX_LAYER_HEIGHT / (layer.displayCount - 1))
            : 0
        const totalHeight = (layer.displayCount - 1) * spacing
        return {
          text: layerLabel(i, numLayers, layer.size),
          position: [i * LAYER_SPACING, -(totalHeight / 2) - 0.65, 0] as [number, number, number],
        }
      }),
    [layerData, numLayers],
  )

  // エッジデータ
  const edges = useMemo<EdgeData[]>(() => {
    const result: EdgeData[] = []

    for (let l = 0; l < numLayers - 1; l++) {
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
  }, [layerData, numLayers])

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
        positions={neuronPositions}
        activations={neuronActivations}
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
