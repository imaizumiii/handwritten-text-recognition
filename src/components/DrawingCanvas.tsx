import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface DrawingCanvasHandle {
  clear: () => void
  getImageData: () => ImageData | null
}

interface DrawingCanvasProps {
  width?: number
  height?: number
  onDraw: (imageData: ImageData) => void
}

const BG_COLOR = '#0d0d30'
const STROKE_COLOR = '#ffffff'
const LINE_WIDTH = 12

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ width = 280, height = 280, onDraw }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const isDrawing = useRef(false)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx

      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = STROKE_COLOR
      ctx.lineWidth = LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, [width, height])

    useImperativeHandle(ref, () => ({
      clear: () => {
        const ctx = ctxRef.current
        if (!ctx) return
        ctx.fillStyle = BG_COLOR
        ctx.fillRect(0, 0, width, height)
        ctx.strokeStyle = STROKE_COLOR
        ctx.lineWidth = LINE_WIDTH
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      },
      getImageData: () => {
        const ctx = ctxRef.current
        if (!ctx) return null
        return ctx.getImageData(0, 0, width, height)
      },
    }), [width, height])

    const getPos = (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const startDrawing = useCallback((clientX: number, clientY: number) => {
      const ctx = ctxRef.current
      if (!ctx) return
      isDrawing.current = true
      const { x, y } = getPos(clientX, clientY)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }, [])

    const draw = useCallback((clientX: number, clientY: number) => {
      if (!isDrawing.current) return
      const ctx = ctxRef.current
      if (!ctx) return
      const { x, y } = getPos(clientX, clientY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }, [])

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

    const endDrawing = useCallback(() => {
      if (!isDrawing.current) return
      isDrawing.current = false
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.closePath()
      onDraw(ctx.getImageData(0, 0, width, height))
    }, [onDraw, width, height])

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      endDrawing()
    }, [endDrawing])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height,
          borderRadius: 8,
          border: '1px solid #2a2a6a',
          cursor: 'crosshair',
          touchAction: 'none',
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
