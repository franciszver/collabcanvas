import { Stage, Layer, Rect, Transformer, Text } from 'react-konva'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './Canvas.module.css'
import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'
import { defaultRectAt, generateRectId, transformCanvasCoordinates } from '../../utils/helpers'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'
import { usePresence } from '../../contexts/PresenceContext'
import { updateCursorPosition } from '../../services/presence'
import { useAuth } from '../../contexts/AuthContext'
import UserCursor from '../Presence/UserCursor'
import { useCursorSync } from '../../hooks/useCursorSync'

export default function Canvas() {
  const { viewport, setViewport, rectangles, setRectangles, addRectangle, updateRectangle, deleteRectangle, isLoading } = useCanvas()
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const transformerRef = useRef<any>(null)
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
  // Remote cursor smoothing
  const smoothedCursorsRef = useRef<Record<string, { x: number; y: number }>>({})
  const targetsRef = useRef<Record<string, { x: number; y: number }>>({})
  const rafIdRef = useRef<number | null>(null)
  const [, setFrameTick] = useState(0)
  // Remote rectangle movement smoothing
  const smoothedRectsRef = useRef<Record<string, { x: number; y: number }>>({})
  const rectTargetsRef = useRef<Record<string, { x: number; y: number }>>({})
  const rectRafIdRef = useRef<number | null>(null)
  const draggingIdRef = useRef<string | null>(null)

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

  // Deselect locally if the selected rectangle was deleted remotely
  useEffect(() => {
    if (selectedId && !rectangles.some((r) => r.id === selectedId)) {
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
        await updateCursorPosition(user.id, p)
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

  // Smooth remote cursor movement via rAF interpolation
  useEffect(() => {
    // Update targets from presence users (excluding self and users without cursor)
    const nextTargets: Record<string, { x: number; y: number }> = {}
    for (const u of Object.values(users)) {
      if (u.userId === (user?.id ?? '')) continue
      if (u.cursor) nextTargets[u.userId] = { x: u.cursor.x, y: u.cursor.y }
    }
    targetsRef.current = nextTargets

    // Start loop if needed
    if (Object.keys(nextTargets).length > 0 && rafIdRef.current == null) {
      const step = () => {
        const targets = targetsRef.current
        const smoothed = smoothedCursorsRef.current
        const targetIds = Object.keys(targets)
        let anyChanged = false
        // Remove smoothed entries that no longer have targets
        for (const id of Object.keys(smoothed)) {
          if (!targets[id]) delete smoothed[id]
        }
        for (const id of targetIds) {
          const t = targets[id]
          const s = smoothed[id] || { x: t.x, y: t.y }
          const dx = t.x - s.x
          const dy = t.y - s.y
          const nx = s.x + dx * 0.2
          const ny = s.y + dy * 0.2
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) anyChanged = true
          smoothed[id] = { x: nx, y: ny }
        }
        if (anyChanged) setFrameTick((n) => (n + 1) % 1000000)
        if (Object.keys(targetsRef.current).length === 0) {
          if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
          return
        }
        rafIdRef.current = requestAnimationFrame(step)
      }
      rafIdRef.current = requestAnimationFrame(step)
    }

    // Stop loop if no targets
    if (Object.keys(nextTargets).length === 0 && rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    return () => {
      // Cleanup on unmount
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [users, user?.id])

  // Smooth remote rectangle position updates via rAF interpolation
  useEffect(() => {
    const nextTargets: Record<string, { x: number; y: number }> = {}
    for (const r of rectangles) {
      nextTargets[r.id] = { x: r.x, y: r.y }
    }
    rectTargetsRef.current = nextTargets

    if (Object.keys(nextTargets).length > 0 && rectRafIdRef.current == null) {
      const step = () => {
        const targets = rectTargetsRef.current
        const smoothed = smoothedRectsRef.current
        const ids = Object.keys(targets)
        let anyChanged = false
        // drop smoothed entries for removed rects
        for (const id of Object.keys(smoothed)) {
          if (!targets[id]) delete smoothed[id]
        }
        for (const id of ids) {
          const t = targets[id]
          const s = smoothed[id] || { x: t.x, y: t.y }
          const dx = t.x - s.x
          const dy = t.y - s.y
          const nx = s.x + dx * 0.2
          const ny = s.y + dy * 0.2
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) anyChanged = true
          smoothed[id] = { x: nx, y: ny }
        }
        if (anyChanged) setFrameTick((n) => (n + 1) % 1000000)
        if (Object.keys(rectTargetsRef.current).length === 0) {
          if (rectRafIdRef.current != null) cancelAnimationFrame(rectRafIdRef.current)
          rectRafIdRef.current = null
          return
        }
        rectRafIdRef.current = requestAnimationFrame(step)
      }
      rectRafIdRef.current = requestAnimationFrame(step)
    }

    if (Object.keys(nextTargets).length === 0 && rectRafIdRef.current != null) {
      cancelAnimationFrame(rectRafIdRef.current)
      rectRafIdRef.current = null
    }

    return () => {
      if (rectRafIdRef.current != null) {
        cancelAnimationFrame(rectRafIdRef.current)
        rectRafIdRef.current = null
      }
    }
  }, [rectangles])

  return (
    <div className={styles.root}>
    {/* Loading overlay */}
    {isLoading ? (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', zIndex: 20 }}>
        <div style={{ color: '#E5E7EB' }}>Loading canvas…</div>
      </div>
    ) : null}
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
      {/* Shapes Layer */}
      <Layer listening>
        {rectangles.map((r: Rectangle) => (
          <Rect
            key={`rect-${r.id}`}
            name={`rect-${r.id}`}
            x={(() => {
              if (draggingIdRef.current === r.id || selectedId === r.id) return r.x
              const s = smoothedRectsRef.current[r.id]
              return s ? s.x : r.x
            })()}
            y={(() => {
              if (draggingIdRef.current === r.id || selectedId === r.id) return r.y
              const s = smoothedRectsRef.current[r.id]
              return s ? s.y : r.y
            })()}
            width={r.width}
            height={r.height}
            fill={r.fill}
            draggable
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            onDragStart={() => { draggingIdRef.current = r.id; setSelectedId(r.id) }}
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
            onMouseEnter={(evt) => {
              const node = evt.target
              if (node && node.opacity) {
                node.opacity(0.9)
                node.getLayer()?.batchDraw()
              }
            }}
            onMouseLeave={(evt) => {
              const node = evt.target
              if (node && node.opacity) {
                node.opacity(1)
                node.getLayer()?.batchDraw()
              }
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
              draggingIdRef.current = null
            }}
            onTransformEnd={(evt) => {
              const node = evt.target
              const scaleX = node.scaleX ? node.scaleX() : 1
              const scaleY = node.scaleY ? node.scaleY() : 1
              const newWidth = Math.max(5, node.width() * scaleX)
              const newHeight = Math.max(5, node.height() * scaleY)
              if (node.scaleX) node.scaleX(1)
              if (node.scaleY) node.scaleY(1)
              if (node.moveToTop) {
                node.moveToTop()
                node.getLayer()?.batchDraw()
              }
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
    {/* Presence cursors overlay (HTML) */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Object.values(users)
        .filter((u) => u.userId !== (user?.id ?? ''))
        .filter((u) => !!(smoothedCursorsRef.current[u.userId] || u.cursor))
        .map((u) => {
          const pos = smoothedCursorsRef.current[u.userId] || u.cursor!
          const sx = viewport.x + pos.x * viewport.scale
          const sy = viewport.y + pos.y * viewport.scale
          return <UserCursor key={`cursor-${u.userId}`} x={sx} y={sy} name={u.displayName} />
        })}
    </div>
    {/* Reconnection banner */}
    {!isOnline ? (
      <div style={{ position: 'absolute', left: 16, bottom: 16, background: '#111827', color: '#FCD34D', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', zIndex: 25 }}>
        Reconnecting…
      </div>
    ) : null}
    </div>
  )
}


