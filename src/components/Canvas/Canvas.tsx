import { Stage, Layer, Rect, Transformer, Circle, RegularPolygon, Star, Line, Arrow, Text } from 'react-konva'
import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './Canvas.module.css'
import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'
import { transformCanvasCoordinates } from '../../utils/helpers'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'
import { usePresence } from '../../contexts/PresenceContext'
import { updateCursorPositionRtdb } from '../../services/realtime'
import { useAuth } from '../../contexts/AuthContext'
import UserCursor from '../Presence/UserCursor'
import { useCursorSync } from '../../hooks/useCursorSync'

export default function Canvas() {
  const { 
    viewport, 
    setViewport, 
    rectangles, 
    updateRectangle, 
    deleteRectangle, 
    isLoading, 
    selectedId, 
    setSelectedId,
    liveDragPositions,
    publishDragUpdate,
    clearDragUpdate
  } = useCanvas()
  const { users, isOnline } = usePresence()
  const { user } = useAuth()
  useCursorSync()
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const widthPct = 0.8
  const heightPct = 0.7
  const sizePct = (n: number, pct: number) => Math.round(n * pct)
  const [containerSize, setContainerSize] = useState({ width: sizePct(window.innerWidth, widthPct), height: sizePct(window.innerHeight, heightPct) })
  const prevSizeRef = useRef(containerSize)
  const selectedIdsRef = useRef<Set<string>>(new Set())
  const setSingleSelection = useCallback((id: string) => {
    selectedIdsRef.current = new Set([id])
    setSelectedId(id)
  }, [])
  const toggleSelection = useCallback((id: string) => {
    const next = new Set(selectedIdsRef.current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIdsRef.current = next
    // keep a primary selected id for UI; choose the most recently toggled
    setSelectedId(id)
  }, [])
  const transformerRef = useRef<Konva.Transformer>(null)
  // Clamp viewport so Stage stays within browser viewport
  const clampViewport = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, window.innerWidth - containerSize.width)
      const maxY = Math.max(0, window.innerHeight - containerSize.height)
      const clampedX = Math.max(0, Math.min(x, maxX))
      const clampedY = Math.max(0, Math.min(y, maxY))
      return { x: clampedX, y: clampedY }
    },
    [containerSize]
  )

  // Center stage initially if not persisted
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('collabcanvas:viewport') : null
      if (!raw && viewport.x === 0 && viewport.y === 0) {
        const centered = clampViewport(
          Math.round((window.innerWidth - containerSize.width) / 2),
          Math.round((window.innerHeight - containerSize.height) / 2)
        )
        setViewport({ ...viewport, ...centered })
      }
    } catch {}
  }, [viewport, containerSize, setViewport, clampViewport])

  // Compute grid lines based on visible canvas area (wider spacing)
  const gridLines = useMemo(() => {
    const spacing = 80
    const minX = -viewport.x / viewport.scale
    const maxX = (containerSize.width - viewport.x) / viewport.scale
    const minY = -viewport.y / viewport.scale
    const maxY = (containerSize.height - viewport.y) / viewport.scale
    const xs: number[] = []
    const ys: number[] = []
    const startX = Math.floor(minX / spacing) * spacing
    const endX = Math.ceil(maxX / spacing) * spacing
    const startY = Math.floor(minY / spacing) * spacing
    const endY = Math.ceil(maxY / spacing) * spacing
    for (let x = startX; x <= endX; x += spacing) xs.push(x)
    for (let y = startY; y <= endY; y += spacing) ys.push(y)
    return { xs, ys, minY, maxY, minX, maxX }
  }, [viewport, containerSize])
  const draggingIdRef = useRef<string | null>(null)
  const lastDragPosRef = useRef<Record<string, { x: number; y: number }>>({})

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
      const clamped = clampViewport(newPos.x, newPos.y)
      setViewport({ scale: newScale, x: clamped.x, y: clamped.y })
    },
    [viewport, setViewport, clampViewport]
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
      const clamped = clampViewport(viewport.x + dx, viewport.y + dy)
      setViewport({ ...viewport, x: clamped.x, y: clamped.y })
    },
    [viewport, setViewport, clampViewport]
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
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
      }
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId, rectangles])

  // Deselect locally if the selected rectangle was deleted remotely
  useEffect(() => {
    if (selectedId && !rectangles.some((r: Rectangle) => r.id === selectedId)) {
      setSelectedId(null)
    }
  }, [rectangles, selectedId])

  useEffect(() => {
    const onResize = () => {
      const newWidth = sizePct(window.innerWidth, widthPct)
      const newHeight = sizePct(window.innerHeight, heightPct)
      const prev = prevSizeRef.current
      // Keep the same canvas center point in view after resize
      const centerCanvasX = (prev.width / 2 - viewport.x) / viewport.scale
      const centerCanvasY = (prev.height / 2 - viewport.y) / viewport.scale
      setContainerSize({ width: newWidth, height: newHeight })
      const nx = newWidth / 2 - centerCanvasX * viewport.scale
      const ny = newHeight / 2 - centerCanvasY * viewport.scale
      const clamped = clampViewport(nx, ny)
      setViewport({ ...viewport, x: clamped.x, y: clamped.y })
      prevSizeRef.current = { width: newWidth, height: newHeight }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [viewport, setViewport, clampViewport])

  const onClick = useCallback((e: any) => {
    // Disable shape creation by clicking on canvas background; just clear selection
    const stage = e.target.getStage()
    if (e.target !== stage) return
    setSelectedId(null)
    selectedIdsRef.current = new Set()
    movedRef.current = false
  }, [])

  // Track pointer for presence updates (throttled via RAF)
  const timeoutId = useRef<any>(null)
  const pendingCursor = useRef<{ x: number; y: number } | null>(null)
  const lastSentAt = useRef<number>(0)
  const stageRef = useRef<any>(null)

  const scheduleCursorSend = useCallback(() => {
    if (timeoutId.current != null) return
    timeoutId.current = setTimeout(async () => {
      timeoutId.current = null
      const now = Date.now()
      if (now - lastSentAt.current < 50) {
        scheduleCursorSend()
        return
      }
      const p = pendingCursor.current
      if (!p || !user) return
      pendingCursor.current = null
      lastSentAt.current = now
      try {
        await updateCursorPositionRtdb(user.id, p)
      } catch {}
    }, 50)
  }, [user])

  const onStageMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return
    const { x, y } = transformCanvasCoordinates(pos.x, pos.y, viewport)
    pendingCursor.current = { x, y }
    scheduleCursorSend()
  }, [viewport, scheduleCursorSend])

  // Online/offline lifecycle is handled by PresenceProvider


  return (
    <div className={styles.root}>
    {/* Loading overlay */}
    {isLoading ? (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', zIndex: 20 }}>
        <div style={{ color: '#E5E7EB' }}>Loading canvas…</div>
      </div>
    ) : null}
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
    <div className={styles.stageFrame} style={{ width: containerSize.width, height: containerSize.height, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }}>
    <Stage
      ref={stageRef}
      width={containerSize.width}
      height={containerSize.height}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      onClick={onClick}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={(e) => { onMouseMove(e); onStageMouseMove(e) }}
      onMouseUp={onMouseUp}
      draggable={false}
    >
      {/* Grid Layer */}
      <Layer listening={false}>
        {gridLines.xs.map((x) => (
          <Line key={`gx-${x}`} points={[x, gridLines.minY, x, gridLines.maxY]} stroke="#374151" strokeWidth={1.5} opacity={0.4} />
        ))}
        {gridLines.ys.map((y) => (
          <Line key={`gy-${y}`} points={[gridLines.minX, y, gridLines.maxX, y]} stroke="#374151" strokeWidth={1.5} opacity={0.4} />
        ))}
      </Layer>
      {/* Shapes Layer */}
      <Layer listening>
        {([...rectangles].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))).map((r: Rectangle) => {
          const isSelected = selectedId === r.id
          const livePos = liveDragPositions[r.id]
          const baseX = draggingIdRef.current === r.id || isSelected ? r.x : livePos ? livePos.x : r.x
          const baseY = draggingIdRef.current === r.id || isSelected ? r.y : livePos ? livePos.y : r.y
          const commonProps = {
            key: `shape-${r.id}`,
            name: `rect-${r.id}`,
            fill: r.fill,
            draggable: true,
            perfectDrawEnabled: false,
            shadowForStrokeEnabled: false,
            onDragStart: (evt: any) => { draggingIdRef.current = r.id; if (!evt.evt.shiftKey && !selectedIdsRef.current.has(r.id)) { setSingleSelection(r.id) } },
            onClick: (evt: any) => { evt.cancelBubble = true; const node = evt.target; if (node && node.moveToTop) { node.moveToTop(); node.getLayer()?.batchDraw() } if (evt.evt.shiftKey) { toggleSelection(r.id) } else { setSingleSelection(r.id) } },
            onTap: (evt: any) => { evt.cancelBubble = true; const node = evt.target; if (node && node.moveToTop) { node.moveToTop(); node.getLayer()?.batchDraw() } setSingleSelection(r.id) },
            onMouseEnter: (evt: Konva.KonvaEventObject<MouseEvent>) => { const node = evt.target; if (node && node.opacity) { node.opacity(0.9); node.getLayer()?.batchDraw() } },
            onMouseLeave: (evt: Konva.KonvaEventObject<MouseEvent>) => { const node = evt.target; if (node && node.opacity) { node.opacity(1); node.getLayer()?.batchDraw() } },
          }
          const handleDragMove = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
            const cx = node.x()
            const cy = node.y()
            const { x, y } = toTopLeft(cx, cy)
            lastDragPosRef.current[r.id] = { x, y }
            // Update local state immediately for responsive UI
            // Note: In hybrid approach, this is handled by the context
            // Publish live drag update via RTDB for other users
            if (user) {
              publishDragUpdate(r.id, { x, y }).catch(console.error)
            }
          }
          const handleDragEnd = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
            const cx = node.x()
            const cy = node.y()
            const { x, y } = toTopLeft(cx, cy)
            const selected = selectedIdsRef.current
            if (selected.size > 1) {
              // persist all selected
              const prev = lastDragPosRef.current[r.id] || { x, y }
              const dx = x - prev.x
              const dy = y - prev.y
              for (const id of selected) {
                if (id === r.id) {
                  updateRectangle(id, { x, y })
                } else {
                  const cur = rectangles.find((rc: Rectangle) => rc.id === id)
                  if (cur) updateRectangle(id, { x: cur.x + dx, y: cur.y + dy })
                }
              }
            } else {
              updateRectangle(r.id, { x, y })
            }
            draggingIdRef.current = null
            
            // Clear RTDB drag data for this shape
            if (user) {
              clearDragUpdate(r.id).catch(() => {})
            }
          }
          if (r.type === 'circle') {
            const radius = r.radius ?? Math.min(r.width, r.height) / 2
            const cx = baseX + r.width / 2
            const cy = baseY + r.height / 2
            return (
              <Circle
                {...commonProps}
                x={cx}
                y={cy}
                radius={radius}
                rotation={r.rotation || 0}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onTransformEnd={(evt: any) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const newRadius = Math.max(5, (node.radius ? node.radius() : radius) * scaleX)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  const newWidth = newRadius * 2
                  const newHeight = newRadius * 2
                  const newX = node.x() - newWidth / 2
                  const newY = node.y() - newHeight / 2
                  updateRectangle(r.id, { x: newX, y: newY, width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                }}
              />
            )
          }
          if (r.type === 'triangle') {
            const radius = Math.min(r.width, r.height) / 2
            const cx = baseX + r.width / 2
            const cy = baseY + r.height / 2
            return (
              <RegularPolygon
                {...commonProps}
                x={cx}
                y={cy}
                sides={3}
                radius={radius}
                rotation={r.rotation || 0}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onTransformEnd={(evt: any) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const scaleY = node.scaleY ? node.scaleY() : 1
                  const newWidth = Math.max(5, r.width * scaleX)
                  const newHeight = Math.max(5, r.height * scaleY)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  const newX = node.x() - newWidth / 2
                  const newY = node.y() - newHeight / 2
                  updateRectangle(r.id, { x: newX, y: newY, width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                }}
              />
            )
          }
          if (r.type === 'star') {
            const outer = Math.min(r.width, r.height) / 2
            const inner = outer / 2
            const cx = baseX + r.width / 2
            const cy = baseY + r.height / 2
            return (
              <Star
                {...commonProps}
                x={cx}
                y={cy}
                numPoints={5}
                innerRadius={inner}
                outerRadius={outer}
                rotation={r.rotation || 0}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                onTransformEnd={(evt: any) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const scaleY = node.scaleY ? node.scaleY() : 1
                  const newWidth = Math.max(5, r.width * scaleX)
                  const newHeight = Math.max(5, r.height * scaleY)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  const newX = node.x() - newWidth / 2
                  const newY = node.y() - newHeight / 2
                  updateRectangle(r.id, { x: newX, y: newY, width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                }}
              />
            )
          }
          if (r.type === 'arrow') {
            const points = [0, r.height / 2, r.width, r.height / 2]
            return (
              <Arrow
                {...commonProps}
                x={baseX}
                y={baseY}
                points={points}
                stroke={r.fill}
                fill={r.fill}
                strokeWidth={Math.max(2, Math.min(10, r.height / 4))}
                pointerLength={Math.max(8, Math.min(24, r.height))}
                pointerWidth={Math.max(8, Math.min(24, r.height / 1.5))}
                rotation={r.rotation || 0}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x, y }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x, y }))}
                onTransformEnd={(evt: any) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const scaleY = node.scaleY ? node.scaleY() : 1
                  const newWidth = Math.max(5, r.width * scaleX)
                  const newHeight = Math.max(5, r.height * scaleY)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  updateRectangle(r.id, { x: node.x(), y: node.y(), width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                }}
              />
            )
          }
          if (r.type === 'text') {
            return (
              <Text
                {...commonProps}
                x={baseX}
                y={baseY}
                width={r.width}
                height={r.height}
                text={r.text || 'Enter Text'}
                fontSize={r.fontSize || 16}
                fill={r.fill}
                rotation={r.rotation || 0}
                align="left"
                verticalAlign="top"
                padding={8}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x, y }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x, y }))}
                onTransformEnd={(evt: any) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const scaleY = node.scaleY ? node.scaleY() : 1
                  const newWidth = Math.max(50, r.width * scaleX)
                  const newHeight = Math.max(30, r.height * scaleY)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  updateRectangle(r.id, { x: node.x(), y: node.y(), width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                }}
              />
            )
          }
          // default rectangle
          return (
            <Rect
              {...commonProps}
              x={baseX}
              y={baseY}
              width={r.width}
              height={r.height}
              rotation={r.rotation || 0}
              onDragMove={() => {
                // Update handled by context in hybrid approach
              }}
              onDragEnd={(evt: any) => {
                const node = evt.target
                updateRectangle(r.id, { x: node.x(), y: node.y(), rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
                draggingIdRef.current = null
                
                // Clear RTDB drag data for this shape
                if (user) {
                  clearDragUpdate(r.id).catch(() => {})
                }
              }}
              onTransformEnd={(evt: any) => {
                const node = evt.target
                const scaleX = node.scaleX ? node.scaleX() : 1
                const scaleY = node.scaleY ? node.scaleY() : 1
                const newWidth = Math.max(5, r.width * scaleX)
                const newHeight = Math.max(5, r.height * scaleY)
                if (node.scaleX) node.scaleX(1)
                if (node.scaleY) node.scaleY(1)
                updateRectangle(r.id, { x: node.x(), y: node.y(), width: newWidth, height: newHeight, rotation: node.rotation ? node.rotation() : (r.rotation || 0) })
              }}
            />
          )
        })}
      </Layer>
      {/* Overlay Layer for Transformer only */}
      <Layer listening>
        <Transformer ref={transformerRef} rotateEnabled ignoreStroke />
      </Layer>
    </Stage>
    </div>
    </div>
    {/* Presence cursors overlay (HTML) */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {(() => {
        const offsetX = Math.round((window.innerWidth - containerSize.width) / 2)
        const offsetY = Math.round((window.innerHeight - containerSize.height) / 2)
        return (
          <>
      {Object.values(users)
        .filter((u) => u.userId !== (user?.id ?? ''))
        .filter((u) => !!u.cursor)
        .map((u) => {
          const pos = u.cursor!
              const sx = offsetX + viewport.x + pos.x * viewport.scale
              const sy = offsetY + viewport.y + pos.y * viewport.scale
              return <UserCursor key={`cursor-${u.userId}`} x={sx} y={sy} name={u.displayName} />
        })}
          </>
        )
      })()}
    </div>
    {/* Floating Properties bar at top of canvas */}
    {selectedId ? (() => {
      const sel = rectangles.find((rr: Rectangle) => rr.id === selectedId)
      if (!sel) return null
      const offsetX = Math.round((window.innerWidth - containerSize.width) / 2)
      const offsetY = Math.round((window.innerHeight - containerSize.height) / 2)
      return (
        <div
          style={{
            position: 'absolute',
            left: offsetX + 12,
            top: offsetY + 12,
            pointerEvents: 'auto',
            zIndex: 26,
            background: '#0b1220',
            border: '1px solid #374151',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="color"
            value={sel.fill}
            onChange={(e) => updateRectangle(sel.id, { fill: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, background: '#0b1220', border: '1px solid #1f2937', borderRadius: 4, cursor: 'pointer' }}
            aria-label="Change shape color"
          />
          {/* TODO: Fix layer buttons - currently commented out due to z-index update issues
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              const maxZ = Math.max(...rectangles.map(r => r.z ?? 0));
              updateRectangle(sel.id, { z: maxZ + 1 });
            }}
            title="Move to top layer"
            aria-label="Move to top layer"
            style={{ background: '#0b3a1a', color: '#D1FAE5', border: '1px solid #065F46', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
          >
            Top ↑
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              const minZ = Math.min(...rectangles.map(r => r.z ?? 0));
              updateRectangle(sel.id, { z: minZ - 1 });
            }}
            title="Move to bottom layer"
            aria-label="Move to bottom layer"
            style={{ background: '#3a0b0b', color: '#FECACA', border: '1px solid #7F1D1D', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
          >
            Bottom ↓
          </button>
          */}
          {sel.type === 'text' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="text"
                value={sel.text || 'Enter Text'}
                onChange={(e) => updateRectangle(sel.id, { text: e.target.value })}
                placeholder="Enter text..."
                style={{
                  background: '#111827',
                  color: '#E5E7EB',
                  border: '1px solid #374151',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 14,
                  minWidth: 120,
                  maxWidth: 200,
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    updateRectangle(sel.id, { fontSize: Math.min(72, (sel.fontSize || 16) + 2) }) 
                  }}
                  title="Increase font size"
                  aria-label="Increase font size"
                  style={{
                    background: '#0b3a1a',
                    color: '#D1FAE5',
                    border: '1px solid #065F46',
                    borderRadius: 4,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: 1,
                    minWidth: 24,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    updateRectangle(sel.id, { fontSize: Math.max(8, (sel.fontSize || 16) - 2) }) 
                  }}
                  title="Decrease font size"
                  aria-label="Decrease font size"
                  style={{
                    background: '#3a0b0b',
                    color: '#FECACA',
                    border: '1px solid #7F1D1D',
                    borderRadius: 4,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: 1,
                    minWidth: 24,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteRectangle(sel.id); setSelectedId(null) }}
            title="Delete shape"
            aria-label="Delete selected shape"
            style={{ background: '#7f1d1d', color: '#FEE2E2', border: '1px solid #b91c1c', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      )
    })() : null}
    {/* Reconnection banner */}
    {!isOnline ? (
      <div style={{ position: 'absolute', left: 16, bottom: 16, background: '#111827', color: '#FCD34D', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', zIndex: 25 }}>
        Reconnecting…
      </div>
    ) : null}
    </div>
  )
}


