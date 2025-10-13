import { Stage, Layer } from 'react-konva'
import { useCallback, useRef, useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'

export default function Canvas() {
  const { viewport, setViewport } = useCanvas()
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const [containerSize] = useState({ width: window.innerWidth, height: window.innerHeight })

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

  return (
    <Stage
      width={containerSize.width}
      height={containerSize.height}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      draggable={false}
    >
      <Layer />
    </Stage>
  )
}


