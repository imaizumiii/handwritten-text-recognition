import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Mesh } from 'three'

interface NeuronProps {
  position: [number, number, number]
  activation: number
  radius?: number
}

const COLOR_LOW = new THREE.Color('#0d1b6b')   // 暗い青（低アクティベーション）
const COLOR_HIGH = new THREE.Color('#ff9500')  // 明るいオレンジ（高アクティベーション）

function Neuron({ position, activation, radius = 0.3 }: NeuronProps) {
  const meshRef = useRef<Mesh>(null)
  const isHovered = useRef(false)

  const color = useMemo(
    () => COLOR_LOW.clone().lerp(COLOR_HIGH, activation),
    [activation]
  )

  useFrame(() => {
    if (!meshRef.current) return
    const target = isHovered.current ? 1.3 : 1.0
    const s = meshRef.current.scale.x
    meshRef.current.scale.setScalar(s + (target - s) * 0.12)
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => { isHovered.current = true }}
      onPointerOut={() => { isHovered.current = false }}
    >
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={activation * 1.8}
        roughness={0.3}
        metalness={0.15}
      />
    </mesh>
  )
}

export default Neuron
