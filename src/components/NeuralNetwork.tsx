import { useState, useEffect, useRef, useMemo } from 'react'
import NetworkLayer, {
  LAYER_SPACING,
  MAX_LAYER_HEIGHT,
  MAX_NEURON_SPACING,
} from './NetworkLayer'
import Edge from './Edge'
import DataParticle from './DataParticle'

const MAX_DISPLAY_NEURONS = 16
const EDGE_THRESHOLD = 0.5

// 1層遷移あたりに表示するパーティクルの上限
const MAX_PARTICLES_PER_PAIR = 20

// 層間アニメーションの間隔 (ms)
// particles は speed=1.8 で ~0.55s で完走 → 0.9s 以内に収まる
const PHASE_DURATION_MS = 900

export interface NetworkConfig {
  layers: number[]
}

interface NeuralNetworkProps {
  config: NetworkConfig
  animRunId: number  // インクリメントするたびにアニメーション再生
}

interface EdgeData {
  key: string
  layerPair: number                  // どの層間か (0, 1, 2, ...)
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

function NeuralNetwork({ config, animRunId }: NeuralNetworkProps) {
  const { layers } = config
  const numLayers = layers.length

  // -1 = アイドル、0〜numLayers-2 = アクティブな層間インデックス
  const [activeLayerPair, setActiveLayerPair] = useState(-1)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // 各層のダミー activation 値（layers 参照が変わらない限り再生成しない）
  const layerData = useMemo(
    () =>
      layers.map(size => {
        const displayCount = Math.min(size, MAX_DISPLAY_NEURONS)
        const activations = Array.from({ length: displayCount }, () => Math.random())
        return { size, displayCount, activations }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layers]
  )

  // エッジデータ（layerPair フィールドをパーティクル選別に利用）
  const edges = useMemo<EdgeData[]>(() => {
    const result: EdgeData[] = []
    for (let l = 0; l < numLayers - 1; l++) {
      const xA = l * LAYER_SPACING
      const xB = (l + 1) * LAYER_SPACING
      const yA = calcYPositions(layerData[l].displayCount)
      const yB = calcYPositions(layerData[l + 1].displayCount)

      for (let i = 0; i < layerData[l].displayCount; i++) {
        for (let j = 0; j < layerData[l + 1].displayCount; j++) {
          const weight = Math.random() * 2 - 1
          if (Math.abs(weight) > EDGE_THRESHOLD) {
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
    }
    return result
  }, [layerData, numLayers])

  // 各層間について |weight| 上位 MAX_PARTICLES_PER_PAIR 本をパーティクルに使用
  const particlesByPair = useMemo<EdgeData[][]>(
    () =>
      Array.from({ length: numLayers - 1 }, (_, l) =>
        edges
          .filter(e => e.layerPair === l)
          .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
          .slice(0, MAX_PARTICLES_PER_PAIR),
      ),
    [edges, numLayers],
  )

  // animRunId が変わるたびに層ごとの遅延アニメーションを起動
  useEffect(() => {
    if (animRunId === 0) return

    // 直前のタイマーをキャンセル
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // フェーズ 0 は即時開始（入力層 → 隠れ層1）
    setActiveLayerPair(0)

    for (let i = 1; i < numLayers - 1; i++) {
      const t = setTimeout(() => setActiveLayerPair(i), i * PHASE_DURATION_MS)
      timeoutsRef.current.push(t)
    }

    // 最後フェーズのパーティクルが完走し終わる時間を待ってからアイドルへ
    const endT = setTimeout(
      () => setActiveLayerPair(-1),
      (numLayers - 1) * PHASE_DURATION_MS,
    )
    timeoutsRef.current.push(endT)

    return () => { timeoutsRef.current.forEach(clearTimeout) }
  }, [animRunId, numLayers])

  const centerOffset = -((numLayers - 1) * LAYER_SPACING) / 2

  return (
    <group position={[centerOffset, 0, 0]}>
      {/* エッジ（ニューロンの後ろに描画） */}
      {edges.map(e => (
        <Edge
          key={e.key}
          start={e.start}
          end={e.end}
          weight={e.weight}
          opacity={Math.abs(e.weight) * 0.35 + 0.1}
        />
      ))}

      {/* ニューロン層 */}
      {layerData.map((layer, i) => (
        <NetworkLayer
          key={i}
          layerIndex={i}
          neuronCount={layer.displayCount}
          activations={layer.activations}
          label={layerLabel(i, numLayers, layer.size)}
        />
      ))}

      {/* パーティクル: 各層間の上位エッジに沿って伝播 */}
      {particlesByPair.map((particles, pairIdx) =>
        particles.map((p, particleIdx) => (
          <DataParticle
            // animRunId が変わるとキーが変わり全パーティクルがリマウント（状態リセット）
            key={`${animRunId}-${pairIdx}-${particleIdx}`}
            startPos={p.start}
            endPos={p.end}
            speed={1.8}
            active={activeLayerPair === pairIdx}
            color={p.weight >= 0 ? '#4a90e2' : '#e05252'}
          />
        )),
      )}
    </group>
  )
}

export default NeuralNetwork
