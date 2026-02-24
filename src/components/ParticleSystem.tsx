import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TRAIL_COUNT = 2
const TRAIL_SPACING = 0.12

export interface ParticleData {
  startPos: [number, number, number]
  endPos: [number, number, number]
  color: string
  layerPair: number
}

interface ParticleSystemProps {
  particles: ParticleData[]
  activeLayerPair: number
  animRunId: number
  speed?: number
}

const ZERO_MATRIX = /* @__PURE__ */ new THREE.Matrix4().makeScale(0, 0, 0)

/**
 * 全パーティクル（本体+トレイル）を 1 つの InstancedMesh で描画する。
 * - draw call: 1
 * - useFrame: 1（全パーティクルを 1 ループで更新）
 */
function ParticleSystem({
  particles,
  activeLayerPair,
  animRunId,
  speed = 1.8,
}: ParticleSystemProps) {
  const count = particles.length
  const instancesPerParticle = 1 + TRAIL_COUNT
  const instanceCount = count * instancesPerParticle

  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // パーティクルごとの進捗・アクティブ状態
  const progress = useRef(new Float32Array(count))
  const isActive = useRef(new Uint8Array(count))
  const prevLayerPair = useRef(-1)

  // インスタンスカラーを設定
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const baseIdx = i * instancesPerParticle
      c.set(particles[i].color)
      mesh.setColorAt(baseIdx, c)

      for (let t = 0; t < TRAIL_COUNT; t++) {
        const fade = 1 - (t + 1) / (TRAIL_COUNT + 1)
        const tc = c.clone().multiplyScalar(fade)
        mesh.setColorAt(baseIdx + 1 + t, tc)
      }
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [particles, count, instancesPerParticle])

  // animRunId が変わったら全リセット
  useEffect(() => {
    progress.current = new Float32Array(count)
    isActive.current = new Uint8Array(count)
    prevLayerPair.current = -1

    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < instanceCount; i++) {
      mesh.setMatrixAt(i, ZERO_MATRIX)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [animRunId, count, instanceCount])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    // 層ペアが変わったら該当パーティクルをアクティブ化
    if (activeLayerPair !== prevLayerPair.current) {
      prevLayerPair.current = activeLayerPair
      if (activeLayerPair >= 0) {
        for (let i = 0; i < count; i++) {
          if (particles[i].layerPair === activeLayerPair) {
            progress.current[i] = 0
            isActive.current[i] = 1
          }
        }
      }
    }

    let dirty = false

    for (let i = 0; i < count; i++) {
      if (!isActive.current[i]) continue

      const baseIdx = i * instancesPerParticle
      let prog = progress.current[i]

      if (prog >= 1) {
        isActive.current[i] = 0
        for (let j = 0; j < instancesPerParticle; j++) {
          mesh.setMatrixAt(baseIdx + j, ZERO_MATRIX)
        }
        dirty = true
        continue
      }

      prog = Math.min(prog + delta * speed, 1)
      progress.current[i] = prog

      const p = particles[i]
      const dx = p.endPos[0] - p.startPos[0]
      const dy = p.endPos[1] - p.startPos[1]
      const dz = p.endPos[2] - p.startPos[2]

      // メインパーティクル
      dummy.position.set(
        p.startPos[0] + dx * prog,
        p.startPos[1] + dy * prog,
        p.startPos[2] + dz * prog,
      )
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.setMatrixAt(baseIdx, dummy.matrix)

      // トレイル: メインの後方に固定間隔で配置
      for (let t = 0; t < TRAIL_COUNT; t++) {
        const tp = prog - (t + 1) * TRAIL_SPACING
        if (tp < 0) {
          mesh.setMatrixAt(baseIdx + 1 + t, ZERO_MATRIX)
        } else {
          const fade = 1 - (t + 1) / (TRAIL_COUNT + 1)
          dummy.position.set(
            p.startPos[0] + dx * tp,
            p.startPos[1] + dy * tp,
            p.startPos[2] + dz * tp,
          )
          dummy.scale.setScalar(fade)
          dummy.updateMatrix()
          mesh.setMatrixAt(baseIdx + 1 + t, dummy.matrix)
        }
      }

      dirty = true
    }

    if (dirty) mesh.instanceMatrix.needsUpdate = true
  })

  if (instanceCount === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instanceCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  )
}

export default ParticleSystem
