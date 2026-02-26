import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface DrawingCanvasHandle {
  clear: () => void
  getImageData: () => ImageData | null
}

interface DrawingCanvasProps {
  displaySize?: number
  onDraw: (imageData: ImageData) => void
  onDrawStart?: () => void
}

const INTERNAL_SIZE = 28
const BG_COLOR = '#0d0d30'
const STROKE_COLOR = '#ffffff'
const LINE_WIDTH = 1.5

function initCtx(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
  ctx.strokeStyle = STROKE_COLOR
  ctx.lineWidth = LINE_WIDTH
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ displaySize = 280, onDraw, onDrawStart }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const isDrawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx
      initCtx(ctx)
    }, [])

    useImperativeHandle(ref, () => ({
      clear: () => {
        const ctx = ctxRef.current
        if (!ctx) return
        initCtx(ctx)
        setIsEmpty(true)
      },
      getImageData: () => {
        const ctx = ctxRef.current
        if (!ctx) return null
        return ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
      },
    }), [])

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
      isDrawing.current = true
      const pos = getPos(clientX, clientY)
      lastPos.current = pos
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      if (isEmpty) {
        setIsEmpty(false)
        onDrawStart?.()
      }
    }, [isEmpty, onDrawStart])

    const draw = useCallback((clientX: number, clientY: number) => {
      if (!isDrawing.current) return
      const ctx = ctxRef.current
      if (!ctx) return
      const pos = getPos(clientX, clientY)
      const prev = lastPos.current!
      const midX = (prev.x + pos.x) / 2
      const midY = (prev.y + pos.y) / 2
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY)
      ctx.stroke()
      lastPos.current = pos
    }, [])

    const endDrawing = useCallback(() => {
      if (!isDrawing.current) return
      isDrawing.current = false
      lastPos.current = null
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.closePath()
      onDraw(ctx.getImageData(0, 0, INTERNAL_SIZE, INTERNAL_SIZE))
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
      <div style={{ position: 'relative', width: displaySize, height: displaySize }}>
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
        {isEmpty && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4a4a8a',
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            0〜9 を描いてください
          </div>
        )}
      </div>
    )
  },
)

export default DrawingCanvas
