import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

const COLOR_LOW = new THREE.Color('#0d1b6b')
const COLOR_HIGH = new THREE.Color('#ff9500')

interface NeuronInstancesProps {
  positions: [number, number, number][]
  activations: number[]
  radius?: number
}

/**
 * 全ニューロンを 1 つの InstancedMesh で描画する。
 * - draw call: 1
 * - useFrame: 0（静的配置）
 * - raycaster: なし
 * - meshBasicMaterial + toneMapped=false で Bloom が拾う明るさを出す
 */
function NeuronInstances({ positions, activations, radius = 0.25 }: NeuronInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = positions.length
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const c = new THREE.Color()

    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i][0], positions[i][1], positions[i][2])
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const a = activations[i] ?? 0
      c.copy(COLOR_LOW).lerp(COLOR_HIGH, a)
      // 明るさをブーストして Bloom に拾わせる（emissive 相当）
      c.multiplyScalar(1 + a * 1.8)
      mesh.setColorAt(i, c)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [positions, activations, count, dummy])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[radius, 16, 12]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export default NeuronInstances
