import { Text } from '@react-three/drei'
import Neuron from './Neuron'

// App.tsx でネットワーク全体をセンタリングするために export
export const LAYER_SPACING = 3.5

interface NetworkLayerProps {
  layerIndex: number       // X軸位置の計算に使用
  neuronCount: number
  activations: number[]
  label?: string
}

const NEURON_RADIUS = 0.25
const MAX_LAYER_HEIGHT = 5.0  // ニューロン数が多くても縦幅をこの範囲に収める

function NetworkLayer({ layerIndex, neuronCount, activations, label }: NetworkLayerProps) {
  // ニューロン間隔: 数が増えるほど詰める（上限 1.2）
  const spacing =
    neuronCount > 1
      ? Math.min(1.2, MAX_LAYER_HEIGHT / (neuronCount - 1))
      : 0

  const totalHeight = (neuronCount - 1) * spacing

  return (
    // group の x で層の左右位置を決定。子要素はすべて group 相対座標
    <group position={[layerIndex * LAYER_SPACING, 0, 0]}>
      {Array.from({ length: neuronCount }, (_, i) => {
        const y = totalHeight / 2 - i * spacing
        return (
          <Neuron
            key={i}
            position={[0, y, 0]}
            activation={activations[i] ?? 0}
            radius={NEURON_RADIUS}
          />
        )
      })}

      {label !== undefined && (
        <Text
          position={[0, -(totalHeight / 2) - 0.65, 0]}
          fontSize={0.28}
          color="#888888"
          anchorX="center"
          anchorY="top"
        >
          {label}
        </Text>
      )}
    </group>
  )
}

export default NetworkLayer
