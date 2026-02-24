import { useMemo } from 'react'
import * as THREE from 'three'

interface EdgeProps {
  start: [number, number, number]
  end: [number, number, number]
  weight: number
  opacity?: number
}

const COLOR_POSITIVE = '#4a90e2'
const COLOR_NEGATIVE = '#e05252'

function Edge({ start, end, weight, opacity }: EdgeProps) {
  const absWeight = Math.abs(weight)
  const color = weight >= 0 ? COLOR_POSITIVE : COLOR_NEGATIVE
  const finalOpacity = opacity ?? absWeight * 0.7 + 0.15

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([...start, ...end]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={finalOpacity}
        depthWrite={false}
      />
    </line>
  )
}

export default Edge

// --- バッチ描画版: 同じ色のエッジをまとめて 1 draw call にする ---

interface EdgeData {
  start: [number, number, number]
  end: [number, number, number]
  weight: number
  opacity?: number
}

export function EdgeBatch({ edges }: { edges: EdgeData[] }) {
  const { posGeo, negGeo } = useMemo(() => {
    const pos: number[] = []
    const neg: number[] = []
    const posColors: number[] = []
    const negColors: number[] = []

    const cPos = new THREE.Color(COLOR_POSITIVE)
    const cNeg = new THREE.Color(COLOR_NEGATIVE)

    for (const e of edges) {
      const absW = Math.abs(e.weight)
      const alpha = e.opacity ?? absW * 0.7 + 0.15
      const arr = e.weight >= 0 ? pos : neg
      const colors = e.weight >= 0 ? posColors : negColors
      const c = e.weight >= 0 ? cPos : cNeg

      arr.push(...e.start, ...e.end)
      // 各頂点に色+アルファを格納
      colors.push(c.r, c.g, c.b, alpha, c.r, c.g, c.b, alpha)
    }

    const build = (verts: number[], colors: number[]) => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
      return geo
    }

    return {
      posGeo: pos.length > 0 ? build(pos, posColors) : null,
      negGeo: neg.length > 0 ? build(neg, negColors) : null,
    }
  }, [edges])

  return (
    <>
      {posGeo && (
        <lineSegments geometry={posGeo}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {negGeo && (
        <lineSegments geometry={negGeo}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  )
}
