import { Line } from '@react-three/drei'

interface EdgeProps {
  start: [number, number, number]
  end: [number, number, number]
  weight: number      // -1 〜 1
  opacity?: number    // 省略時は weight の絶対値から自動計算
}

// 正の重み: 青系、負の重み: 赤系
const COLOR_POSITIVE = '#4a90e2'
const COLOR_NEGATIVE = '#e05252'

function Edge({ start, end, weight, opacity }: EdgeProps) {
  const absWeight = Math.abs(weight)
  const color = weight >= 0 ? COLOR_POSITIVE : COLOR_NEGATIVE

  // |weight| が大きいほど太く (0.3 〜 3.0)
  const lineWidth = absWeight * 2.7 + 0.3

  // opacity 未指定時: |weight| が大きいほど不透明 (0.15 〜 0.85)
  const finalOpacity = opacity ?? absWeight * 0.7 + 0.15

  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={finalOpacity}
    />
  )
}

export default Edge
