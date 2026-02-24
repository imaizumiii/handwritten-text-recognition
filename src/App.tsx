import { useState, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import NeuralNetwork, { type NetworkConfig } from './components/NeuralNetwork'
import CameraAnimator from './components/CameraAnimator'

const config: NetworkConfig = {
  layers: [16, 10, 8, 4],
}

/** アニメーション中にシーン全体を少し明るくする動的アンビエントライト */
function DynamicLight({ active }: { active: boolean }) {
  const ref = useRef<THREE.AmbientLight>(null!)
  useFrame((_, delta) => {
    if (!ref.current) return
    const target = active ? 0.9 : 0.35
    ref.current.intensity += (target - ref.current.intensity) * delta * 3
  })
  return <ambientLight ref={ref} intensity={0.35} />
}

interface SceneProps {
  runId: number
  phase: number
  numLayers: number
  onPhaseChange: (phase: number, numLayers: number) => void
}

function Scene({ runId, phase, numLayers, onPhaseChange }: SceneProps) {
  const isActive = phase >= 0

  return (
    <>
      <DynamicLight active={isActive} />
      <pointLight position={[10, 10, 10]} intensity={80} />
      <pointLight position={[-10, -5, 8]} intensity={30} color="#4466ff" />

      <NeuralNetwork config={config} animRunId={runId} onPhaseChange={onPhaseChange} />

      <CameraAnimator phase={phase} numLayers={numLayers} />
      <OrbitControls enableDamping dampingFactor={0.08} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.7}
          mipmapBlur
          levels={3}
        />
      </EffectComposer>
    </>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 2.4rem',
  fontSize: '1rem',
  background: '#12124a',
  color: '#ccd6ff',
  border: '1px solid #4a4aaa',
  borderRadius: '6px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
}

function App() {
  const [runId, setRunId] = useState(0)
  const [phase, setPhase] = useState(-1)
  const [numLayers, setNumLayers] = useState(config.layers.length)

  const handlePhaseChange = useCallback((p: number, n: number) => {
    setPhase(p)
    setNumLayers(n)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 14], fov: 60 }}>
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 25, 55]} />
        <Scene
          runId={runId}
          phase={phase}
          numLayers={numLayers}
          onPhaseChange={handlePhaseChange}
        />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <button style={buttonStyle} onClick={() => setRunId(id => id + 1)}>
          Run
        </button>
      </div>
    </div>
  )
}

export default App
