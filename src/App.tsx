import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import NeuralNetwork, { type NetworkConfig } from './components/NeuralNetwork'

const config: NetworkConfig = {
  layers: [16, 10, 8, 4],
}

function Scene({ runId }: { runId: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={100} />
      <NeuralNetwork config={config} animRunId={runId} />
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

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0a0a1a']} />
        <Scene runId={runId} />
        <OrbitControls />
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
