import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Neuron from './components/Neuron'
import Edge from './components/Edge'

const N0: [number, number, number] = [-2.5, 0, 0]
const N1: [number, number, number] = [0, 0, 0]
const N2: [number, number, number] = [2.5, 0, 0]

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={100} />

      {/* ニューロン */}
      <Neuron position={N0} activation={0.1} />
      <Neuron position={N1} activation={0.5} />
      <Neuron position={N2} activation={0.9} />

      {/* エッジ: weight 正=青、負=赤、|weight| で太さ・透明度が変化 */}
      <Edge start={N0} end={N1} weight={0.8} />
      <Edge start={N1} end={N2} weight={-0.5} />
      <Edge start={N0} end={N2} weight={0.2} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#0a0a1a']} />
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default App
