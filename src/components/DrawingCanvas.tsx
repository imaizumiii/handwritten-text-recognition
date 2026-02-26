import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface DrawingCanvasHandle {
  clear: () => void
  undo: () => void
  canUndo: boolean
  getImageData: () => ImageData | null
}

interface DrawingCanvasProps {
  displaySize?: number
  onDraw: (imageData: ImageData, historyLength: number) => void
}

const INTERNAL_SIZE = 28
const BG_COLOR = '#0d0d30'
const STROKE_COLOR = '#ffffff'
const LINE_WIDTH = 1.5
const MAX_HISTORY = 20

function initCtx(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
  ctx.strokeStyle = STROKE_COLOR
  ctx.lineWidth = LINE_WIDTH
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ displaySize = 280, onDraw }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const isDrawing = useRef(false)
    const historyRef = useRef<ImageData[]>([])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx
      initCtx(ctx)
    }, [])

    const pushHistory = useCallback(() => {
      const ctx = ctxRef.current
      if (!ctx) return
      const snapshot = ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
      const history = historyRef.current
      if (history.length >= MAX_HISTORY) {
        history.shift()
      }
      history.push(snapshot)
    }, [])

    useImperativeHandle(ref, () => ({
      clear: () => {
        const ctx = ctxRef.current
        if (!ctx) return
        initCtx(ctx)
        historyRef.current = []
      },
      undo: () => {
        const ctx = ctxRef.current
        if (!ctx) return
        const history = historyRef.current
        if (history.length === 0) return
        const snapshot = history.pop()!
        ctx.putImageData(snapshot, 0, 0)
        onDraw(
          ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE),
          history.length,
        )
      },
      get canUndo() {
        return historyRef.current.length > 0
      },
      getImageData: () => {
        const ctx = ctxRef.current
        if (!ctx) return null
        return ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
      },
    }), [onDraw])

    const getPos = (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      return {
        x: (clientX - rect.left) * (INTERNAL_SIZE / rect.width),
        y: (clientY - rect.top) * (INTERNAL_SIZE / rect.height),
      }
    }

    const startDrawing = useCallback((clientX: number, clientY: number) => {
      const ctx = ctxRef.current
      if (!ctx) return
      pushHistory()
      isDrawing.current = true
      const { x, y } = getPos(clientX, clientY)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }, [pushHistory])

    const draw = useCallback((clientX: number, clientY: number) => {
      if (!isDrawing.current) return
      const ctx = ctxRef.current
      if (!ctx) return
      const { x, y } = getPos(clientX, clientY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }, [])

    const endDrawing = useCallback(() => {
      if (!isDrawing.current) return
      isDrawing.current = false
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.closePath()
      onDraw(
        ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE),
        historyRef.current.length,
      )
    }, [onDraw])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      startDrawing(e.clientX, e.clientY)
    }, [startDrawing])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      draw(e.clientX, e.clientY)
    }, [draw])

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const touch = e.touches[0]
      startDrawing(touch.clientX, touch.clientY)
    }, [startDrawing])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const touch = e.touches[0]
      draw(touch.clientX, touch.clientY)
    }, [draw])

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      endDrawing()
    }, [endDrawing])

    return (
      <canvas
        ref={canvasRef}
        width={INTERNAL_SIZE}
        height={INTERNAL_SIZE}
        style={{
          width: displaySize,
          height: displaySize,
          borderRadius: 8,
          border: '1px solid #2a2a6a',
          cursor: 'crosshair',
          touchAction: 'none',
          imageRendering: 'pixelated',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    )
  },
)

export default DrawingCanvas
