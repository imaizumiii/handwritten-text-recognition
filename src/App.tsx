import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import NeuralNetwork, { type NetworkConfig } from './components/NeuralNetwork'

const config: NetworkConfig = {
  layers: [16, 10, 8, 4],
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={100} />
      <NeuralNetwork config={config} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0a0a1a']} />
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default App
