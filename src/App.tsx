import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import NetworkLayer, { LAYER_SPACING } from './components/NetworkLayer'

const LAYERS = [
  {
    label: 'Input',
    activations: [0.9, 0.3, 0.7, 0.5],
  },
  {
    label: 'Hidden 1',
    activations: [0.2, 0.8, 0.6, 0.4, 0.95, 0.1],
  },
  {
    label: 'Output',
    activations: [0.7, 0.15, 0.85],
  },
]

// ネットワーク全体を X 軸方向にセンタリング
const centerOffset = -((LAYERS.length - 1) * LAYER_SPACING) / 2

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={100} />

      <group position={[centerOffset, 0, 0]}>
        {LAYERS.map((layer, i) => (
          <NetworkLayer
            key={i}
            layerIndex={i}
            neuronCount={layer.activations.length}
            activations={layer.activations}
            label={layer.label}
          />
        ))}
      </group>
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 60 }}>
        <color attach="background" args={['#0a0a1a']} />
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default App
