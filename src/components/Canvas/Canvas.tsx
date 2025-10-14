import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'
import { defaultRectAt, generateRectId, transformCanvasCoordinates } from '../../utils/helpers'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'

export default function Canvas() {
  const { viewport, setViewport, rectangles, addRectangle, updateRectangle } = useCanvas()
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const [containerSize] = useState({ width: window.innerWidth, height: window.innerHeight })
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
    lastPosRef.current = e.target.getStage().getPointerPosition()
  }, [])

  const onMouseMove = useCallback(
    (e: any) => {
      if (!isPanningRef.current || !lastPosRef.current) return
      const pos = e.target.getStage().getPointerPosition()
      const dx = pos.x - lastPosRef.current.x
      const dy = pos.y - lastPosRef.current.y
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

  const onClick = useCallback(
    (e: any) => {
      // Only create when clicking on empty stage background
      const stage = e.target.getStage()
      if (e.target !== stage) return
      const pos = stage.getPointerPosition()
      const { x, y } = transformCanvasCoordinates(pos.x, pos.y, viewport)
      const base = defaultRectAt(x, y)
      addRectangle({ id: generateRectId(), ...base })
    },
    [viewport, addRectangle]
  )

  return (
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
      <Layer>
        {rectangles.map((r: Rectangle) => (
          <Rect
            key={r.id}
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
        <Transformer ref={transformerRef} rotateEnabled={false} ignoreStroke />
      </Layer>
    </Stage>
  )
}


