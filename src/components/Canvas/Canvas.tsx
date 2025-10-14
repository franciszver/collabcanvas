import { Stage, Layer, Rect, Transformer, Text } from 'react-konva'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './Canvas.module.css'
import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'
import { defaultRectAt, generateRectId, transformCanvasCoordinates } from '../../utils/helpers'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'

export default function Canvas() {
  const { viewport, setViewport, rectangles, setRectangles, addRectangle, updateRectangle, deleteRectangle } = useCanvas()
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const widthPct = 0.8
  const heightPct = 0.7
  const sizePct = (n: number, pct: number) => Math.round(n * pct)
  const [containerSize, setContainerSize] = useState({ width: sizePct(window.innerWidth, widthPct), height: sizePct(window.innerHeight, heightPct) })
  const prevSizeRef = useRef(containerSize)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const transformerRef = useRef<any>(null)

  const onWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault()
      const scaleBy = 1.05
      const stage = e.target.getStage()
      const oldScale = viewport.scale
      const mousePointTo = {
        x: (stage.getPointerPosition().x - viewport.x) / oldScale,
        y: (stage.getPointerPosition().y - viewport.y) / oldScale,
      }
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
      const newPos = {
        x: stage.getPointerPosition().x - mousePointTo.x * newScale,
        y: stage.getPointerPosition().y - mousePointTo.y * newScale,
      }
      setViewport({ scale: newScale, x: newPos.x, y: newPos.y })
    },
    [viewport, setViewport]
  )

  const onMouseDown = useCallback((e: any) => {
    isPanningRef.current = true
    movedRef.current = false
    lastPosRef.current = e.target.getStage().getPointerPosition()
  }, [])

  const onMouseMove = useCallback(
    (e: any) => {
      if (!isPanningRef.current || !lastPosRef.current) return
      const pos = e.target.getStage().getPointerPosition()
      const dx = pos.x - lastPosRef.current.x
      const dy = pos.y - lastPosRef.current.y
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true
      lastPosRef.current = pos
      setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy })
    },
    [viewport, setViewport]
  )

  const onMouseUp = useCallback(() => {
    isPanningRef.current = false
    lastPosRef.current = null
  }, [])

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const stage = tr.getStage && tr.getStage()
    if (!stage) return
    if (selectedId) {
      const node = stage.findOne(`.rect-${selectedId}`)
      if (node) {
        // Bring selected node to front before attaching transformer
        if (node.moveToTop) {
          node.moveToTop()
        }
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
      }
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId, rectangles])

  useEffect(() => {
    const onResize = () => {
      const newWidth = sizePct(window.innerWidth, widthPct)
      const newHeight = sizePct(window.innerHeight, heightPct)
      const prev = prevSizeRef.current
      // Keep the same canvas center point in view after resize
      const centerCanvasX = (prev.width / 2 - viewport.x) / viewport.scale
      const centerCanvasY = (prev.height / 2 - viewport.y) / viewport.scale
      setContainerSize({ width: newWidth, height: newHeight })
      setViewport({
        ...viewport,
        x: newWidth / 2 - centerCanvasX * viewport.scale,
        y: newHeight / 2 - centerCanvasY * viewport.scale,
      })
      prevSizeRef.current = { width: newWidth, height: newHeight }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [viewport, setViewport])

  const onClick = useCallback(
    (e: any) => {
      // Only create when clicking on empty stage background
      const stage = e.target.getStage()
      if (e.target !== stage) return
      // Suppress create if a drag occurred before mouseup/click
      if (movedRef.current) {
        movedRef.current = false
        return
      }
      const pos = stage.getPointerPosition()
      const { x, y } = transformCanvasCoordinates(pos.x, pos.y, viewport)
      const base = defaultRectAt(x, y)
      const id = generateRectId()
      addRectangle({ id, ...base })
      setSelectedId(id)
    },
    [viewport, addRectangle]
  )

  return (
    <div className={styles.root}>
    <Stage
      width={containerSize.width}
      height={containerSize.height}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      onClick={onClick}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      draggable={false}
    >
      {/* Shapes Layer */}
      <Layer>
        {rectangles.map((r: Rectangle) => (
          <Rect
            key={`rect-${r.id}`}
            name={`rect-${r.id}`}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill={r.fill}
            draggable
            onClick={(evt) => {
              evt.cancelBubble = true
              const node = evt.target
              if (node && node.moveToTop) {
                node.moveToTop()
                node.getLayer()?.batchDraw()
              }
              setSelectedId(r.id)
            }}
            onTap={(evt) => {
              evt.cancelBubble = true
              const node = evt.target
              if (node && node.moveToTop) {
                node.moveToTop()
                node.getLayer()?.batchDraw()
              }
              setSelectedId(r.id)
            }}
            onDragMove={(evt) => {
              const node = evt.target
              const nx = node.x()
              const ny = node.y()
              setRectangles(rectangles.map((rc) => (rc.id === r.id ? { ...rc, x: nx, y: ny } : rc)))
            }}
            onDragEnd={(evt) => {
              const node = evt.target
              updateRectangle(r.id, { x: node.x(), y: node.y() })
            }}
            onTransformEnd={(evt) => {
              const node = evt.target
              const scaleX = node.scaleX ? node.scaleX() : 1
              const scaleY = node.scaleY ? node.scaleY() : 1
              const newWidth = Math.max(5, node.width() * scaleX)
              const newHeight = Math.max(5, node.height() * scaleY)
              if (node.scaleX) node.scaleX(1)
              if (node.scaleY) node.scaleY(1)
              updateRectangle(r.id, { x: node.x(), y: node.y(), width: newWidth, height: newHeight })
            }}
          />
        ))}
      </Layer>
      {/* Overlay Layer for selection & delete icon */}
      <Layer listening>
        {selectedId ? (() => {
          const sel = rectangles.find((rr) => rr.id === selectedId)
          if (!sel) return null
          return (
            <Text
              key={`x-${sel.id}`}
              x={sel.x + sel.width / 2 - 14}
              y={sel.y - 28 - 15}
              text="✕"
              fontSize={28}
              fontStyle="bold"
              fill="#ef4444"
              shadowColor="#ffffff"
              shadowBlur={4}
              shadowOpacity={0.9}
              listening
              onClick={(evt) => {
                evt.cancelBubble = true
                deleteRectangle(sel.id)
                setSelectedId(null)
              }}
              onTap={(evt) => {
                evt.cancelBubble = true
                deleteRectangle(sel.id)
                setSelectedId(null)
              }}
            />
          )
        })() : null}
        <Transformer ref={transformerRef} rotateEnabled={false} ignoreStroke />
      </Layer>
    </Stage>
    </div>
  )
}


