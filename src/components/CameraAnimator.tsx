import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { LAYER_SPACING } from './NetworkLayer'

interface CameraAnimatorProps {
  phase: number      // -1 = idle, 0..numLayers-2 = active layer pair
  numLayers: number
}

const IDLE_POS = { x: 0, y: 0, z: 14 }
const ZOOM_IN_Z = 11
const LERP_SPEED = 2.5

function CameraAnimator({ phase, numLayers }: CameraAnimatorProps) {
  const { camera } = useThree()
  const targetRef = useRef({ x: IDLE_POS.x, y: IDLE_POS.y, z: IDLE_POS.z })

  useFrame((_, delta) => {
    const t = targetRef.current

    if (phase === -1) {
      // アイドル: 全体が見える位置にズームアウト
      t.x = IDLE_POS.x
      t.y = IDLE_POS.y
      t.z = IDLE_POS.z
    } else {
      // 各層ペアの中間X座標に向かってパン + ズームイン
      const centerOffset = -((numLayers - 1) * LAYER_SPACING) / 2
      const layerX = centerOffset + (phase + 0.5) * LAYER_SPACING
      t.x = layerX * 0.3  // 控えめにパン
      t.y = 0
      t.z = ZOOM_IN_Z
    }

    const speed = LERP_SPEED * delta
    camera.position.x += (t.x - camera.position.x) * speed
    camera.position.y += (t.y - camera.position.y) * speed
    camera.position.z += (t.z - camera.position.z) * speed
  })

  return null
}

export default CameraAnimator
