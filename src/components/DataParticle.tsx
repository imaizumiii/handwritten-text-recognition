import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Mesh } from 'three'

interface DataParticleProps {
  startPos: [number, number, number]
  endPos: [number, number, number]
  speed?: number   // 移動速度（1.0 = 1秒で1単位移動）
  active: boolean  // true の間だけ表示・移動
  color: string
}

const TRAIL_COUNT = 4      // 残像の数
const TRAIL_SPACING = 0.07 // progress がこの値進むたびに座標を記録

function DataParticle({
  startPos,
  endPos,
  speed = 1.5,
  active,
  color,
}: DataParticleProps) {
  const meshRef = useRef<Mesh>(null)
  const trailRefs = useRef<(Mesh | null)[]>(
    Array.from({ length: TRAIL_COUNT }, () => null),
  )

  const progress = useRef(0)
  const lastSampledProgress = useRef(0)
  const trailPositions = useRef<[number, number, number][]>([])

  const hideAll = () => {
    if (meshRef.current) meshRef.current.visible = false
    trailRefs.current.forEach(ref => { if (ref) ref.visible = false })
  }

  // active が切り替わるたびにリセット
  useEffect(() => {
    if (!meshRef.current) return
    if (active) {
      progress.current = 0
      lastSampledProgress.current = 0
      trailPositions.current = []
      meshRef.current.position.set(...startPos)
      meshRef.current.visible = true
      trailRefs.current.forEach(ref => { if (ref) ref.visible = false })
    } else {
      hideAll()
    }
  }, [active, startPos]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!meshRef.current || !active || progress.current >= 1) return

    progress.current = Math.min(progress.current + delta * speed, 1)
    const p = progress.current

    // メインパーティクルの位置
    const x = startPos[0] + (endPos[0] - startPos[0]) * p
    const y = startPos[1] + (endPos[1] - startPos[1]) * p
    const z = startPos[2] + (endPos[2] - startPos[2]) * p
    meshRef.current.position.set(x, y, z)

    // 一定 progress ごとに現在座標をトレイル履歴の先頭へ追加
    if (p - lastSampledProgress.current >= TRAIL_SPACING) {
      lastSampledProgress.current = p
      trailPositions.current = [[x, y, z] as [number, number, number], ...trailPositions.current].slice(
        0,
        TRAIL_COUNT,
      )
    }

    // トレイル球体をそれぞれ更新（i=0 が最新、i=TRAIL_COUNT-1 が最古）
    trailRefs.current.forEach((ref, i) => {
      if (!ref) return
      const pos = trailPositions.current[i]
      if (!pos) {
        ref.visible = false
        return
      }
      // fade: 1.0（最新）→ 0.0（最古）方向に線形減衰
      const fade = 1 - (i + 1) / (TRAIL_COUNT + 1) // 0.8, 0.6, 0.4, 0.2
      ref.visible = true
      ref.position.set(...pos)
      ref.scale.setScalar(fade)
      ;(ref.material as THREE.MeshBasicMaterial).opacity = fade * 0.75
    })

    if (progress.current >= 1) hideAll()
  })

  return (
    <>
      {/* メインパーティクル */}
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* トレイル球体（古いほど小さく・透明） */}
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => { trailRefs.current[i] = el }}
          visible={false}
        >
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  )
}

export default DataParticle
