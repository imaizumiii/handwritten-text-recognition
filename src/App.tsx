import { useState, useCallback, useRef, useEffect } from 'react'
import type { LayersModel } from '@tensorflow/tfjs'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import NeuralNetwork, { type NetworkConfig } from './components/NeuralNetwork'
import InputPanel from './components/InputPanel'
import PredictionDisplay from './components/PredictionDisplay'
import { loadMNISTModel, type ModelStatus } from './utils/modelLoader'
import { runInference, type InferenceResult } from './utils/inference'

const config: NetworkConfig = {
  layers: [784, 128, 64, 10],
}

// -----------------------------------------------------------------------
// Three.js helpers（Canvas 内でのみ使用）
// -----------------------------------------------------------------------

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
    camera.position.set(-8, 6, 12)
    camera.lookAt(0, 0, 0)
  }, [camera])
  return null
}

interface SceneProps {
  runId: number
  phase: number
  numLayers: number
  inferenceResult: InferenceResult | null
  onPhaseChange: (phase: number, numLayers: number) => void
}

function Scene({ runId, phase, numLayers: _numLayers, inferenceResult, onPhaseChange }: SceneProps) {
  const isActive = phase >= 0
  return (
    <>
      <DynamicLight active={isActive} />
      <pointLight position={[10, 10, 10]} intensity={80} />
      <pointLight position={[-10, -5, 8]} intensity={30} color="#4466ff" />
      <FixedCamera />
      <NeuralNetwork
        config={config}
        animRunId={runId}
        activations={inferenceResult?.activations}
        onPhaseChange={onPhaseChange}
      />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.3} luminanceSmoothing={0.7} mipmapBlur levels={1} />
      </EffectComposer>
    </>
  )
}

// -----------------------------------------------------------------------
// ModelStatusIndicator
// -----------------------------------------------------------------------

const retryBtnStyle: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 12,
  background: 'transparent',
  color: '#e05252',
  border: '1px solid #e05252',
  borderRadius: 4,
  cursor: 'pointer',
}

function ModelStatusIndicator({
  status,
  onRetry,
}: {
  status: ModelStatus
  onRetry: () => void
}) {
  // 'ready' になったら 3 秒後に非表示にする
  const [readyVisible, setReadyVisible] = useState(false)

  useEffect(() => {
    if (status !== 'ready') return
    setReadyVisible(true)
    const t = setTimeout(() => setReadyVisible(false), 3000)
    return () => clearTimeout(t)
  }, [status])

  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <div style={{ marginTop: 10, fontSize: 13, color: '#8888cc' }}>
        モデルを読み込み中...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ marginTop: 10, fontSize: 13, color: '#e05252', display: 'flex', alignItems: 'center', gap: 8 }}>
        モデルの読み込みに失敗しました
        <button style={retryBtnStyle} onClick={onRetry}>再試行</button>
      </div>
    )
  }

  // status === 'ready'
  if (!readyVisible) return null
  return (
    <div style={{ marginTop: 10, fontSize: 13, color: '#44cc66' }}>
      ● モデル準備完了
    </div>
  )
}

// -----------------------------------------------------------------------
// App
// -----------------------------------------------------------------------

function App() {
  const [runId, setRunId]         = useState(0)
  const [phase, setPhase]         = useState(-1)
  const [numLayers, setNumLayers] = useState(config.layers.length)
  const [mnistData, setMnistData] = useState<number[] | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const [modelStatus, setModelStatus]         = useState<ModelStatus>('idle')
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null)

  const modelRef = useRef<LayersModel | null>(null)

  // モデルロード処理（起動時 + retry 時に呼ぶ）
  const startModelLoad = useCallback(() => {
    setModelStatus('loading')
    loadMNISTModel()
      .then(model => {
        modelRef.current = model
        setModelStatus('ready')
      })
      .catch(() => {
        setModelStatus('error')
      })
  }, [])

  // アプリ起動時にバックグラウンドロード開始
  useEffect(() => {
    startModelLoad()
  }, [startModelLoad])

  const handlePhaseChange = useCallback((p: number, n: number) => {
    setPhase(p)
    setNumLayers(n)
  }, [])

  // キャンバスをクリアしたら mnistData も null に戻す
  const handleClear = useCallback(() => {
    setMnistData(null)
    setInferenceResult(null)
  }, [])

  const handleRun = useCallback(() => {
    if (!mnistData || !modelRef.current || modelStatus !== 'ready' || isRunning) return

    setIsRunning(true)
    try {
      const t0 = performance.now()
      const result = runInference(modelRef.current, mnistData)
      const ms = (performance.now() - t0).toFixed(1)
      console.debug(`[App] 推論完了: ${ms}ms  予測=${result.prediction}  確信度=${(result.probabilities[result.prediction] * 100).toFixed(1)}%`)

      setInferenceResult(result)
      setRunId(id => id + 1)
    } catch (err) {
      console.error('[App] 推論エラー:', err)
    } finally {
      setIsRunning(false)
    }
  }, [mnistData, modelStatus, isRunning])

  // Run ボタンを有効にする条件
  const canRun = modelStatus === 'ready' && mnistData !== null && !isRunning

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
          overflowY: 'auto',
        }}
      >
        <InputPanel
          onImageReady={setMnistData}
          onRun={handleRun}
          onClear={handleClear}
          canRun={canRun}
        />
        <ModelStatusIndicator status={modelStatus} onRetry={startModelLoad} />
        <PredictionDisplay result={inferenceResult} />
      </div>

      {/* 右パネル */}
      <div style={{ flex: 1, height: '100%' }}>
        <Canvas camera={{ position: [-8, 6, 12], fov: 60 }}>
          <color attach="background" args={['#050510']} />
          <fog attach="fog" args={['#050510', 25, 55]} />
          <Scene
            runId={runId}
            phase={phase}
            numLayers={numLayers}
            inferenceResult={inferenceResult}
            onPhaseChange={handlePhaseChange}
          />
        </Canvas>
      </div>
    </div>
  )
}

export default App
