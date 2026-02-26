import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import NeuralNetwork, { type NetworkConfig } from './components/NeuralNetwork'
import InputPanel from './components/InputPanel'

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

function FixedCamera() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(-8, 6, 10)
    camera.lookAt(0, 0, 0)
  }, [camera])
  return null
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

      <FixedCamera />
      <NeuralNetwork config={config} animRunId={runId} onPhaseChange={onPhaseChange} />


      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.7}
          mipmapBlur
          levels={1}
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
  const [mnistData, setMnistData] = useState<number[] | null>(null)

  const handlePhaseChange = useCallback((p: number, n: number) => {
    setPhase(p)
    setNumLayers(n)
  }, [])

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* 左パネル */}
      <div
        style={{
          width: 600,
          minWidth: 600,
          height: '100%',
          background: '#0a0a2a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <InputPanel onImageReady={setMnistData} />
      </div>

      {/* 右パネル */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <Canvas camera={{ position: [-6, 4.5, 10], fov: 60 }}>
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
    </div>
  )
}

export default App
