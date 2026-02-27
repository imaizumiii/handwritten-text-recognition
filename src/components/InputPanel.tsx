import { useRef, useCallback } from 'react'
import DrawingCanvas, { type DrawingCanvasHandle } from './DrawingCanvas'
import { imageDataToMNIST } from '../utils/imageProcessing'

interface InputPanelProps {
  onImageReady: (mnistData: number[]) => void
  onRun: () => void
  onClear: () => void
  canRun: boolean
}

const clearButtonStyle: React.CSSProperties = {
  padding: '0.4rem 1.2rem',
  background: '#12124a',
  color: '#ccd6ff',
  border: '1px solid #4a4aaa',
  borderRadius: 4,
  cursor: 'pointer',
}

export default function InputPanel({ onImageReady, onRun, onClear, canRun }: InputPanelProps) {
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  const handleDraw = useCallback(
    (imageData: ImageData) => {
      const mnistData = imageDataToMNIST(imageData)
      onImageReady(mnistData)
    },
    [onImageReady],
  )

  const handleClear = useCallback(() => {
    canvasRef.current?.clear()
    onClear()
  }, [onClear])

  const runBg = canRun ? '#1a1a6a' : '#0f0f38'
  const runButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 1.2rem',
    fontSize: '1rem',
    background: runBg,
    color: canRun ? '#ccd6ff' : '#445070',
    border: `1px solid ${canRun ? '#4a4aaa' : '#2a2a55'}`,
    borderRadius: 6,
    cursor: canRun ? 'pointer' : 'not-allowed',
    letterSpacing: '0.05em',
    transition: 'background 0.2s, color 0.2s',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <div style={{ fontSize: 16, color: '#ccd6ff', marginBottom: 16 }}>
        Draw a digit
      </div>

      <DrawingCanvas ref={canvasRef} displaySize={280} onDraw={handleDraw} />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button style={clearButtonStyle} onClick={handleClear}>
          Clear
        </button>
      </div>

      <div style={{ width: 280, marginTop: 24 }}>
        <button
          style={runButtonStyle}
          disabled={!canRun}
          onClick={canRun ? onRun : undefined}
          onMouseEnter={e => { if (canRun) e.currentTarget.style.background = '#2a2a8a' }}
          onMouseLeave={e => { e.currentTarget.style.background = runBg }}
        >
          Run
        </button>
      </div>
    </div>
  )
}
