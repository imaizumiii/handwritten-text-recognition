import { useRef, useCallback } from 'react'
import DrawingCanvas, { type DrawingCanvasHandle } from './DrawingCanvas'
import { imageDataToMNIST } from '../utils/imageProcessing'

interface InputPanelProps {
  onImageReady: (mnistData: number[]) => void
}

const buttonStyle: React.CSSProperties = {
  padding: '0.4rem 1.2rem',
  background: '#12124a',
  color: '#ccd6ff',
  border: '1px solid #4a4aaa',
  borderRadius: 4,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.4,
  cursor: 'default',
}

export default function InputPanel({ onImageReady }: InputPanelProps) {
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
  }, [])

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
        <button style={buttonStyle} onClick={handleClear}>
          Clear
        </button>
        <button style={disabledButtonStyle} disabled>
          Undo
        </button>
      </div>
    </div>
  )
}
