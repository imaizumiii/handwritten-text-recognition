import { useMemo } from 'react'
import NetworkLayer, {
  LAYER_SPACING,
  MAX_LAYER_HEIGHT,
  MAX_NEURON_SPACING,
} from './NetworkLayer'
import Edge from './Edge'

// 1層に表示するニューロンの上限（784個全部は描画しない）
const MAX_DISPLAY_NEURONS = 16

// |weight| がこの値を超えるエッジだけ描画（全結合だと線が多すぎるため）
const EDGE_THRESHOLD = 0.5

export interface NetworkConfig {
  layers: number[]  // 例: [784, 128, 64, 10]
}

interface NeuralNetworkProps {
  config: NetworkConfig
}

// NetworkLayer 内部と同じ式で各ニューロンの Y 座標を計算
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

function NeuralNetwork({ config }: NeuralNetworkProps) {
  const { layers } = config
  const numLayers = layers.length

  // 各層のダミー activation 値（マウント時に1回だけ生成）
  const layerData = useMemo(
    () =>
      layers.map(size => {
        const displayCount = Math.min(size, MAX_DISPLAY_NEURONS)
        const activations = Array.from({ length: displayCount }, () => Math.random())
        return { size, displayCount, activations }
      }),
    // layers が同じ配列参照である限り再計算しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layers]
  )

  // 隣接層間のエッジ（|weight| > EDGE_THRESHOLD のみ表示）
  const edges = useMemo(() => {
    const result: Array<{
      key: string
      start: [number, number, number]
      end: [number, number, number]
      weight: number
    }> = []

    for (let l = 0; l < numLayers - 1; l++) {
      const xA = l * LAYER_SPACING
      const xB = (l + 1) * LAYER_SPACING
      const yA = calcYPositions(layerData[l].displayCount)
      const yB = calcYPositions(layerData[l + 1].displayCount)

      for (let i = 0; i < layerData[l].displayCount; i++) {
        for (let j = 0; j < layerData[l + 1].displayCount; j++) {
          const weight = Math.random() * 2 - 1  // -1 〜 1
          if (Math.abs(weight) > EDGE_THRESHOLD) {
            result.push({
              key: `${l}-${i}-${j}`,
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

  // ネットワーク全体を X 軸中央に揃える
  const centerOffset = -((numLayers - 1) * LAYER_SPACING) / 2

  return (
    <group position={[centerOffset, 0, 0]}>
      {/* エッジはニューロンの後ろに描画されるよう先に配置 */}
      {edges.map(e => (
        <Edge
          key={e.key}
          start={e.start}
          end={e.end}
          weight={e.weight}
          // 大量のエッジが重なるので opacity を抑えめに
          opacity={Math.abs(e.weight) * 0.35 + 0.1}
        />
      ))}

      {layerData.map((layer, i) => (
        <NetworkLayer
          key={i}
          layerIndex={i}
          neuronCount={layer.displayCount}
          activations={layer.activations}
          label={layerLabel(i, numLayers, layer.size)}
        />
      ))}
    </group>
  )
}

export default NeuralNetwork
