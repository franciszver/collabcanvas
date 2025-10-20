import { Stage, Layer, Rect, Transformer, Circle, RegularPolygon, Star, Line, Arrow, Text, Group } from 'react-konva'
import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './Canvas.module.css'
import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'
import { MAX_SCALE, MIN_SCALE } from '../../utils/constants'
import { usePresence } from '../../contexts/PresenceContext'
import { updateCursorPositionRtdb, publishViewportRtdbThrottled, clearViewportRtdb } from '../../services/realtime'
import { useAuth } from '../../contexts/AuthContext'
import UserCursor from '../Presence/UserCursor'
import { useCursorSync } from '../../hooks/useCursorSync'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { calculateShapeNumbers, getShapeTypeName, generateRectId } from '../../utils/helpers'
import { throttle } from '../../utils/performance'
import { createEditEntry, addToHistory } from '../../utils/historyTracking'
import { SimpleLockIndicator } from './LockIndicator'
import LockTooltip from './LockTooltip'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp'
import MultiShapeProperties from './MultiShapeProperties'
import GroupsPanel from './GroupsPanel'
import ActivityPanel from './ActivityPanel'
import ZoomControls from './ZoomControls'
import canvasBackground from '../../assets/user_images/background_2.jpg'
import { trackShapeEdit } from '../../services/activityService'
import { getVisibleShapes } from '../../utils/viewportCulling'

// Helper to calculate text dimensions for auto-resize
function measureTextDimensions(text: string, fontSize: number): { width: number; height: number } {
  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return { width: 200, height: 40 }
  
  context.font = `${fontSize}px Arial`
  const metrics = context.measureText(text)
  
  // Add padding (16px total: 8px per side)
  const width = Math.max(100, Math.ceil(metrics.width) + 32)
  const height = Math.max(40, Math.ceil(fontSize * 1.2) + 32)
  
  return { width, height }
}

export default function Canvas() {
  const { 
    documentId,
    viewport, 
    setViewport, 
    rectangles, 
    updateRectangle, 
    updateMultipleRectangles,
    deleteRectangle, 
    addRectangle,
    isLoading, 
    selectedId, 
    setSelectedId,
    liveDragPositions,
    publishDragUpdate,
    clearDragUpdate,
    // Multi-selection
    selectedIds,
    isBoxSelecting,
    selectionBox,
    isSpacePressed,
    selectShape,
    toggleShape,
    clearSelection,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    isSelected,
    getSelectedShapes,
    hasSelection,
    selectionCount,
    selectSimilar,
    selectByType,
    selectByColor,
    bringToFront,
    sendToBack
  } = useCanvas()
  const { users, isOnline } = usePresence()
  const { user } = useAuth()
  useCursorSync()
  const { showHelp, setShowHelp } = useKeyboardShortcuts({ enabled: true })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const prevSizeRef = useRef(containerSize)
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [hoveredLockedShape, setHoveredLockedShape] = useState<{ id: string; x: number; y: number; lockedByName: string } | null>(null)
  const [showMultiShapeProperties, setShowMultiShapeProperties] = useState(false)
  const [showGroupsPanel, setShowGroupsPanel] = useState(false)
  const [showActivityPanel, setShowActivityPanel] = useState(false)
  
  // Dynamically resize canvas when window size changes
  useEffect(() => {
    const handleResize = () => {
      setContainerSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle mouse/touch release outside canvas to prevent stuck panning/dragging
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      // Only cleanup if we're actually panning/dragging
      if (!isPanningRef.current && !draggingIdRef.current && !isBoxSelecting) {
        return
      }

      // Handle box selection end
      if (isBoxSelecting) {
        endBoxSelection()
      }

      // Clear RTDB viewport when panning ends
      if (isPanningRef.current && user) {
        clearViewportRtdb(user.id).catch(() => {
          // Silent failure
        })
      }

      // Clear dragging state and RTDB drag data
      if (draggingIdRef.current && user) {
        clearDragUpdate(draggingIdRef.current).catch(() => {})
        draggingIdRef.current = null
      }

      // Reset panning state
      isPanningRef.current = false
      lastPosRef.current = null
    }

    // Listen for both mouse and touch events
    window.addEventListener('mouseup', handleGlobalPointerUp)
    window.addEventListener('touchend', handleGlobalPointerUp)
    window.addEventListener('touchcancel', handleGlobalPointerUp)

    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp)
      window.removeEventListener('touchend', handleGlobalPointerUp)
      window.removeEventListener('touchcancel', handleGlobalPointerUp)
    }
  }, [isBoxSelecting, endBoxSelection, user])
  const selectedIdsRef = useRef<Set<string>>(new Set())
  const transformerRef = useRef<Konva.Transformer>(null)
  
  // Sync selectedIdsRef with selectedIds state for stable reference in callbacks
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])
  
  // Calculate shape numbers by type
  const shapeNumbers = useMemo(() => calculateShapeNumbers(rectangles), [rectangles])
  
  // Calculate visible shapes using viewport culling
  const visibleShapes = useMemo(() => {
    return getVisibleShapes(
      rectangles,
      viewport,
      containerSize.width,
      containerSize.height
    )
  }, [rectangles, viewport, containerSize])
  
  // Clamp viewport - no clamping needed since canvas fills entire window
  const clampViewport = useCallback(
    (x: number, y: number) => {
      return { x, y }
    },
    []
  )

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
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const scaleBy = 1.05
      const stage = e.target.getStage()
      if (!stage) return
      const oldScale = viewport.scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      }
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      }
      const clamped = clampViewport(newPos.x, newPos.y)
      setViewport({ scale: newScale, x: clamped.x, y: clamped.y })
    },
    [viewport, setViewport, clampViewport]
  )

  const onMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return
    
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointer.x - viewport.x) / viewport.scale
    const canvasY = (pointer.y - viewport.y) / viewport.scale
    
    // Check if Space is pressed for box selection
    if (isSpacePressed) {
      startBoxSelection(canvasX, canvasY)
      return
    }
    
    // Normal panning behavior
    isPanningRef.current = true
    movedRef.current = false
    lastPosRef.current = pointer
  }, [isSpacePressed, startBoxSelection, viewport])

  // Throttled mouse move handler for better performance
  const onMouseMoveThrottled = useMemo(
    () => throttle((e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) return
      
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pos.x - viewport.x) / viewport.scale
      const canvasY = (pos.y - viewport.y) / viewport.scale
      
      // Handle box selection
      if (isBoxSelecting) {
        updateBoxSelection(canvasX, canvasY)
        return
      }
      
      // Handle normal panning
      if (!isPanningRef.current || !lastPosRef.current) return
      
      const dx = pos.x - lastPosRef.current.x
      const dy = pos.y - lastPosRef.current.y
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true
      lastPosRef.current = pos
      const clamped = clampViewport(viewport.x + dx, viewport.y + dy)
      const newViewport = { ...viewport, x: clamped.x, y: clamped.y }
      
      // Update local state immediately for smooth UI
      setViewport(newViewport)
      
      // Publish to RTDB for cross-tab sync (throttled at 60fps)
      if (user) {
        publishViewportRtdbThrottled(user.id, newViewport, documentId).catch(() => {
          // Silent failure - panning continues smoothly
        })
      }
    }, 16), // 60fps throttling
    [viewport, setViewport, clampViewport, isBoxSelecting, updateBoxSelection, user, documentId]
  )

  const onMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      onMouseMoveThrottled(e)
    },
    [onMouseMoveThrottled]
  )

  const onMouseUp = useCallback(() => {
    // Handle box selection end
    if (isBoxSelecting) {
      endBoxSelection()
    }
    
    // Clear RTDB viewport when panning ends
    if (isPanningRef.current && user) {
      clearViewportRtdb(user.id).catch(() => {
        // Silent failure
      })
    }
    
    // Reset panning
    isPanningRef.current = false
    lastPosRef.current = null
  }, [isBoxSelecting, endBoxSelection, user])

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const stage = tr.getStage && tr.getStage()
    if (!stage) return
    
    // Safety check: ensure selectedIds is defined
    if (!selectedIds) return
    
    if (selectedIds.size > 0) {
      // Get all selected shape nodes
      const nodes = Array.from(selectedIds).map(id => stage.findOne(`.rect-${id}`)).filter(Boolean) as Konva.Node[]
      if (nodes.length > 0) {
        tr.nodes(nodes)
        tr.getLayer()?.batchDraw()
      }
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedIds, rectangles])

  // Handle multi-shape transform end (rotation/resize)
  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    
    const handleTransformEnd = () => {
      const selected = selectedIdsRef.current
      if (selected.size <= 1) return // Single shape transforms are handled by individual onTransformEnd
      
      // Get all nodes being transformed
      const nodes = tr.nodes()
      if (nodes.length === 0) return
      
      // Collect all updates for bulk operation
      const allUpdates: Array<{ id: string; updates: Partial<Rectangle> }> = []
      
      // Calculate updates for all transformed shapes
      nodes.forEach(node => {
        const id = (node.attrs as any).id
        if (!id) return
        
        const shape = rectangles.find((r: Rectangle) => r.id === id)
        if (!shape) return
        
        // Skip locked shapes
        if (shape.lockedBy && shape.lockedBy !== user?.id) return
        
        // Calculate new properties based on shape type
        const updates: Partial<Rectangle> = {}
        
        // Position (center-based shapes need offset adjustment)
        if (shape.type === 'circle' || shape.type === 'triangle' || shape.type === 'star') {
          updates.x = node.x() - node.width() / 2
          updates.y = node.y() - node.height() / 2
        } else {
          updates.x = node.x()
          updates.y = node.y()
        }
        
        // Size
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        updates.width = Math.max(5, shape.width * scaleX)
        updates.height = Math.max(5, shape.height * scaleY)
        
        // Rotation
        updates.rotation = node.rotation()
        
        // Reset scale
        node.scaleX(1)
        node.scaleY(1)
        
        // Track activity history for this shape
        if (user) {
          const editEntry = createEditEntry(
            shape,
            updates,
            user.id,
            user.displayName || 'Unknown User'
          )
          if (editEntry) {
            updates.history = addToHistory(shape.history, editEntry, 10)
          }
        }
        
        allUpdates.push({ id, updates })
      })
      
      // Batch update all shapes with a single network call
      if (allUpdates.length > 0) {
        updateMultipleRectangles(allUpdates).catch(console.error)
      }
    }
    
    tr.on('transformend', handleTransformEnd)
    
    return () => {
      tr.off('transformend', handleTransformEnd)
    }
  }, [selectedIds, rectangles, user, updateMultipleRectangles])

  // Deselect locally if the selected rectangle was deleted remotely
  useEffect(() => {
    if (selectedId && !rectangles.some((r: Rectangle) => r.id === selectedId)) {
      setSelectedId(null)
    }
  }, [rectangles, selectedId, setSelectedId])

  // Update viewport when container size changes to maintain canvas center point
  useEffect(() => {
    const prev = prevSizeRef.current
    if (prev.width !== containerSize.width || prev.height !== containerSize.height) {
      // Keep the same canvas center point in view after resize
      const centerCanvasX = (prev.width / 2 - viewport.x) / viewport.scale
      const centerCanvasY = (prev.height / 2 - viewport.y) / viewport.scale
      const nx = containerSize.width / 2 - centerCanvasX * viewport.scale
      const ny = containerSize.height / 2 - centerCanvasY * viewport.scale
      setViewport({ ...viewport, x: nx, y: ny })
      prevSizeRef.current = containerSize
    }
  }, [containerSize, viewport, setViewport])

  const onClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Disable shape creation by clicking on canvas background; just clear selection
    const stage = e.target.getStage()
    if (e.target !== stage) return
    
    // Clear selection when clicking on empty canvas
    clearSelection()
    movedRef.current = false
  }, [clearSelection])

  // Track pointer for presence updates (optimized throttling)
  const pendingCursor = useRef<{ x: number; y: number } | null>(null)
  const lastSentPosition = useRef<{ x: number; y: number } | null>(null)
  const stageRef = useRef<any>(null)

  // Throttled cursor update for smooth continuous updates
  const scheduleCursorSend = useMemo(
    () => throttle(async () => {
      const p = pendingCursor.current
      if (!p || !user) return
      
      // Only send if position has changed (reduced threshold for smoother movement)
      const lastPos = lastSentPosition.current
      if (lastPos && Math.abs(p.x - lastPos.x) < 1 && Math.abs(p.y - lastPos.y) < 1) {
        return
      }
      
      lastSentPosition.current = { ...p }
      try {
        await updateCursorPositionRtdb(user.id, p)
      } catch (error) {
        console.warn('Failed to update cursor position:', error)
      }
    }, 50),
    [user]
  )

  const onStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't broadcast cursor if user has shapes selected
    if (hasSelection) {
      return
    }
    
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    // Stage already accounts for scale and position, just send the canvas coordinates
    const canvasX = (pos.x - viewport.x) / viewport.scale
    const canvasY = (pos.y - viewport.y) / viewport.scale
    pendingCursor.current = { x: canvasX, y: canvasY }
    scheduleCursorSend()
  }, [viewport, scheduleCursorSend, hasSelection])

  // Clear cursor position when shapes are selected
  useEffect(() => {
    if (hasSelection && user) {
      // Clear cursor position when shapes are selected
      updateCursorPositionRtdb(user.id, { x: -1, y: -1 }).catch(console.warn)
    }
  }, [hasSelection, user])

  // Online/offline lifecycle is handled by PresenceProvider


  return (
    <div className={styles.root} style={{
      backgroundImage: `url(${canvasBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
    {/* Loading overlay */}
    {isLoading ? (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250, 248, 243, 0.9)', zIndex: 20 }}>
        <div style={{ color: '#3E3832' }}>Loading canvas…</div>
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
          <Line key={`gx-${x}`} points={[x, gridLines.minY, x, gridLines.maxY]} stroke="#E0D8C8" strokeWidth={1} opacity={0.6} />
        ))}
        {gridLines.ys.map((y) => (
          <Line key={`gy-${y}`} points={[gridLines.minX, y, gridLines.maxX, y]} stroke="#E0D8C8" strokeWidth={1} opacity={0.6} />
        ))}
      </Layer>
      {/* Shapes Layer */}
      <Layer listening>
        {([...visibleShapes].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))).map((r: Rectangle) => {
          const isShapeSelected = isSelected(r.id)
          const isLocked = r.lockedBy && r.lockedBy !== user?.id
          const isLockedByUser = r.lockedBy === user?.id
          const livePos = liveDragPositions[r.id]
          const baseX = draggingIdRef.current === r.id || isShapeSelected ? r.x : livePos ? livePos.x : r.x
          const baseY = draggingIdRef.current === r.id || isShapeSelected ? r.y : livePos ? livePos.y : r.y
          const { key, ...commonProps } = {
            key: `shape-${r.id}`,
            name: `rect-${r.id}`,
            fill: r.fill,
            draggable: !isLocked, // Disable dragging for locked shapes
            perfectDrawEnabled: false,
            shadowForStrokeEnabled: false,
            // Add selection visual feedback
            stroke: isShapeSelected ? '#5B8FA3' : (isLocked ? '#B07768' : r.stroke),
            strokeWidth: isShapeSelected ? 2 : (isLocked ? 2 : (r.strokeWidth || 0)),
            // Add opacity for locked shapes
            opacity: isLocked ? 0.7 : 1,
            onDragStart: (evt: Konva.KonvaEventObject<DragEvent>) => { 
              if (isLocked) return // Prevent dragging locked shapes
              draggingIdRef.current = r.id
              if (!evt.evt.shiftKey && !isSelected(r.id)) { 
                selectShape(r.id)
              }
            },
            onClick: (evt: Konva.KonvaEventObject<MouseEvent>) => { 
              evt.cancelBubble = true
              if (isLocked) {
                // Show tooltip or message for locked shapes
                // Shape is locked by another user
                return
              }
              if (evt.evt.shiftKey) { 
                toggleShape(r.id) 
              } else { 
                // If clicking a shape not in current selection, clear first
                if (!isSelected(r.id)) {
                  clearSelection()
                }
                selectShape(r.id) 
              }
            },
            onTap: (evt: Konva.KonvaEventObject<MouseEvent>) => { 
              evt.cancelBubble = true
              if (isLocked) return
              selectShape(r.id) 
            },
            onMouseEnter: (evt: Konva.KonvaEventObject<MouseEvent>) => { 
              const node = evt.target
              if (node && node.opacity) { 
                node.opacity(0.9)
                node.getLayer()?.batchDraw() 
              }
              // Show lock tooltip for locked shapes
              if (isLocked && r.lockedByName) {
                const stage = node.getStage()
                if (stage) {
                  const pointer = stage.getPointerPosition()
                  if (pointer) {
                    setHoveredLockedShape({
                      id: r.id,
                      x: pointer.x,
                      y: pointer.y,
                      lockedByName: r.lockedByName
                    })
                  }
                }
              }
            },
            onMouseLeave: (evt: Konva.KonvaEventObject<MouseEvent>) => { 
              const node = evt.target
              if (node && node.opacity) { 
                node.opacity(1)
                node.getLayer()?.batchDraw() 
              }
              // Hide lock tooltip
              if (hoveredLockedShape?.id === r.id) {
                setHoveredLockedShape(null)
              }
            },
          }
          const handleDragMove = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
            const cx = node.x()
            const cy = node.y()
            const { x, y } = toTopLeft(cx, cy)
            lastDragPosRef.current[r.id] = { x, y }
            
            // Only publish live RTDB updates for single shape selection
            // Multi-select will update all shapes at drag end to reduce network traffic
            const selected = selectedIdsRef.current
            if (user && selected.size <= 1) {
              publishDragUpdate(r.id, { x, y }).catch(console.error)
            }
          }
          const handleDragEnd = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
            const cx = node.x()
            const cy = node.y()
            const { x, y } = toTopLeft(cx, cy)
            const selected = selectedIdsRef.current
            
            if (selected.size > 1) {
              // Batch update all selected shapes with bulk update
              const prev = lastDragPosRef.current[r.id] || { x, y }
              const dx = x - prev.x
              const dy = y - prev.y
              
              const allUpdates: Array<{ id: string; updates: Partial<Rectangle> }> = []
              
              for (const id of selected) {
                const cur = rectangles.find((rc: Rectangle) => rc.id === id)
                if (!cur) continue
                
                // Skip locked shapes
                if (cur.lockedBy && cur.lockedBy !== user?.id) continue
                
                let newX: number, newY: number
                if (id === r.id) {
                  newX = x
                  newY = y
                } else {
                  newX = cur.x + dx
                  newY = cur.y + dy
                }
                
                const updates: Partial<Rectangle> = { x: newX, y: newY }
                
                // Track activity history
                if (user) {
                  const editEntry = createEditEntry(
                    cur,
                    updates,
                    user.id,
                    user.displayName || 'Unknown User'
                  )
                  if (editEntry) {
                    updates.history = addToHistory(cur.history, editEntry, 10)
                  }
                }
                
                allUpdates.push({ id, updates })
              }
              
              // Single bulk update call
              if (allUpdates.length > 0) {
                updateMultipleRectangles(allUpdates).catch(console.error)
              }
            } else {
              // Single shape update
              const updates: Partial<Rectangle> = { x, y }
              
              // Track activity history
              if (user) {
                const editEntry = createEditEntry(
                  r,
                  updates,
                  user.id,
                  user.displayName || 'Unknown User'
                )
                if (editEntry) {
                  updates.history = addToHistory(r.history, editEntry, 10)
                }
              }
              
              updateRectangle(r.id, updates)
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
              <Group key={key}>
                <Circle
                  {...commonProps}
                  x={cx}
                  y={cy}
                  radius={radius}
                  stroke={r.stroke}
                  strokeWidth={r.strokeWidth}
                  rotation={r.rotation || 0}
                  onDragMove={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onDragEnd={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                    const node = evt.target as Konva.Circle
                    const scaleX = node.scaleX()
                    const newRadius = Math.max(5, node.radius() * scaleX)
                    node.scaleX(1)
                    node.scaleY(1)
                    const newWidth = newRadius * 2
                    const newHeight = newRadius * 2
                    const newX = node.x() - newWidth / 2
                    const newY = node.y() - newHeight / 2
                    const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                    
                    // Track transform for activity history
                    const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                    const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                    
                    updateRectangle(r.id, newProps)
                    
                    // Track activity
                    if (user) {
                      trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                    }
                  }}
                />
              {/* Lock Indicator */}
              {(isLocked || isLockedByUser) && (
                <SimpleLockIndicator
                  x={baseX}
                  y={baseY}
                  width={r.width}
                  height={r.height}
                  isCurrentUser={isLockedByUser}
                  scale={viewport.scale}
                />
              )}
            </Group>
          )
        }
        if (r.type === 'triangle') {
            const radius = Math.min(r.width, r.height) / 2
            const cx = baseX + r.width / 2
            const cy = baseY + r.height / 2
            return (
              <Group key={key}>
                <RegularPolygon
                  {...commonProps}
                  x={cx}
                  y={cy}
                  sides={3}
                  radius={radius}
                  stroke={r.stroke}
                  strokeWidth={r.strokeWidth}
                  rotation={r.rotation || 0}
                  onDragMove={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onDragEnd={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                    const node = evt.target
                    const scaleX = node.scaleX ? node.scaleX() : 1
                    const scaleY = node.scaleY ? node.scaleY() : 1
                    const newWidth = Math.max(5, r.width * scaleX)
                    const newHeight = Math.max(5, r.height * scaleY)
                    if (node.scaleX) node.scaleX(1)
                    if (node.scaleY) node.scaleY(1)
                    const newX = node.x() - newWidth / 2
                    const newY = node.y() - newHeight / 2
                    const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                    
                    // Track transform for activity history
                    const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                    const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                    
                    updateRectangle(r.id, newProps)
                    
                    // Track activity
                    if (user) {
                      trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                    }
                  }}
                />
              </Group>
            )
          }
        if (r.type === 'star') {
            const outer = Math.min(r.width, r.height) / 2
            const inner = outer / 2
            const cx = baseX + r.width / 2
            const cy = baseY + r.height / 2
            return (
              <Group key={key}>
                <Star
                  {...commonProps}
                  x={cx}
                  y={cy}
                  numPoints={5}
                  innerRadius={inner}
                  outerRadius={outer}
                  stroke={r.stroke}
                  strokeWidth={r.strokeWidth}
                  rotation={r.rotation || 0}
                  onDragMove={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragMove(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onDragEnd={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(evt.target, (x, y) => ({ x: x - r.width / 2, y: y - r.height / 2 }))}
                  onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                    const node = evt.target
                    const scaleX = node.scaleX ? node.scaleX() : 1
                    const scaleY = node.scaleY ? node.scaleY() : 1
                    const newWidth = Math.max(5, r.width * scaleX)
                    const newHeight = Math.max(5, r.height * scaleY)
                    if (node.scaleX) node.scaleX(1)
                    if (node.scaleY) node.scaleY(1)
                    const newX = node.x() - newWidth / 2
                    const newY = node.y() - newHeight / 2
                    const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                    
                    // Track transform for activity history
                    const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                    const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                    
                    updateRectangle(r.id, newProps)
                    
                    // Track activity
                    if (user) {
                      trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                    }
                  }}
                />
              </Group>
            )
          }
        if (r.type === 'arrow') {
            const points = [0, r.height / 2, r.width, r.height / 2]
            return (
              <Group key={key}>
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
                  onDragMove={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragMove(evt.target, (x, y) => ({ x, y }))}
                  onDragEnd={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(evt.target, (x, y) => ({ x, y }))}
                  onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                    const node = evt.target
                    const scaleX = node.scaleX ? node.scaleX() : 1
                    const scaleY = node.scaleY ? node.scaleY() : 1
                    const newWidth = Math.max(5, r.width * scaleX)
                    const newHeight = Math.max(5, r.height * scaleY)
                    if (node.scaleX) node.scaleX(1)
                    if (node.scaleY) node.scaleY(1)
                    const newX = node.x()
                    const newY = node.y()
                    const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                    
                    // Track transform for activity history
                    const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                    const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                    
                    updateRectangle(r.id, newProps)
                    
                    // Track activity
                    if (user) {
                      trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                    }
                  }}
                />
              </Group>
            )
          }
        if (r.type === 'text') {
            return (
              <Group key={key}>
                <Text
                  {...commonProps}
                  x={baseX}
                  y={baseY}
                  width={r.width}
                  height={r.height}
                  text={r.text ?? ''}
                  fontSize={r.fontSize || 64}
                  fill={r.fill}
                  rotation={r.rotation || 0}
                  align="left"
                  verticalAlign="top"
                  padding={8}
                  wrap="none"
                  onDragMove={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragMove(evt.target, (x, y) => ({ x, y }))}
                  onDragEnd={(evt: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(evt.target, (x, y) => ({ x, y }))}
                  onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                    const node = evt.target
                    const scaleX = node.scaleX ? node.scaleX() : 1
                    const scaleY = node.scaleY ? node.scaleY() : 1
                    const newWidth = Math.max(50, r.width * scaleX)
                    const newHeight = Math.max(30, r.height * scaleY)
                    if (node.scaleX) node.scaleX(1)
                    if (node.scaleY) node.scaleY(1)
                    const newX = node.x()
                    const newY = node.y()
                    const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                    
                    // Track transform for activity history
                    const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                    const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                    
                    updateRectangle(r.id, newProps)
                    
                    // Track activity
                    if (user) {
                      trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                    }
                  }}
                />
              </Group>
            )
          }
          // default rectangle
          return (
            <Group key={key}>
              <Rect
                {...commonProps}
                x={baseX}
                y={baseY}
                width={r.width}
                height={r.height}
                stroke={r.stroke}
                strokeWidth={r.strokeWidth}
                rotation={r.rotation || 0}
                onDragMove={(evt: any) => handleDragMove(evt.target, (x, y) => ({ x, y }))}
                onDragEnd={(evt: any) => handleDragEnd(evt.target, (x, y) => ({ x, y }))}
                onTransformEnd={(evt: Konva.KonvaEventObject<Event>) => {
                  const node = evt.target
                  const scaleX = node.scaleX ? node.scaleX() : 1
                  const scaleY = node.scaleY ? node.scaleY() : 1
                  const newWidth = Math.max(5, r.width * scaleX)
                  const newHeight = Math.max(5, r.height * scaleY)
                  if (node.scaleX) node.scaleX(1)
                  if (node.scaleY) node.scaleY(1)
                  const newX = node.x()
                  const newY = node.y()
                  const newRotation = node.rotation ? node.rotation() : (r.rotation || 0)
                  
                  // Track transform for activity history
                  const oldProps = { x: r.x, y: r.y, width: r.width, height: r.height, rotation: r.rotation }
                  const newProps = { x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRotation }
                  
                  updateRectangle(r.id, newProps)
                  
                  // Track activity
                  if (user) {
                    trackShapeEdit(r.id, oldProps, newProps, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
                  }
                }}
              />
              {/* Lock Indicator */}
              {(isLocked || isLockedByUser) && (
                <SimpleLockIndicator
                  x={baseX}
                  y={baseY}
                  width={r.width}
                  height={r.height}
                  isCurrentUser={isLockedByUser}
                  scale={viewport.scale}
                />
              )}
            </Group>
          )
        })}
      </Layer>
      {/* Selection Box Layer */}
      {isBoxSelecting && selectionBox && (
        <Layer listening={false}>
          <Rect
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
            fill="rgba(91, 143, 163, 0.1)"
            stroke="#5B8FA3"
            strokeWidth={1}
            dash={[5, 5]}
            listening={false}
          />
        </Layer>
      )}
      
      {/* Lock Tooltip Layer */}
      {hoveredLockedShape && (
        <Layer listening={false}>
          <LockTooltip
            x={hoveredLockedShape.x}
            y={hoveredLockedShape.y}
            text={`Locked by ${hoveredLockedShape.lockedByName}`}
            scale={viewport.scale}
            visible={true}
          />
        </Layer>
      )}
      
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
        .filter((u) => {
          // Only show cursors that have been updated recently (within 5 seconds)
          const now = Date.now()
          return now - u.updatedAt < 5000
        })
        .filter((u) => {
          // Hide cursors with negative coordinates (user has shapes selected)
          const pos = u.cursor!
          return pos.x >= 0 && pos.y >= 0
        })
        .map((u) => {
          const pos = u.cursor!
          const sx = offsetX + viewport.x + pos.x * viewport.scale
          const sy = offsetY + viewport.y + pos.y * viewport.scale
          return (
            <UserCursor 
              key={`cursor-${u.userId}`} 
              x={sx} 
              y={sy} 
              name={u.displayName} 
              isActive={true}
            />
          )
        })}
          </>
        )
      })()}
    </div>
    {/* Vertical Properties Panel on left side */}
    {selectedIds.size > 1 ? (() => {
      // Multi-select panel
      const handleMultiColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value
        Array.from(selectedIds).forEach(id => {
          const shape = rectangles.find(r => r.id === id);
          if (shape) {
            const oldColor = shape.fill;
            updateRectangle(id, { fill: newColor });
            // Track color change
            if (user) {
              trackShapeEdit(id, { fill: oldColor }, { fill: newColor }, user.id, user.displayName || 'Unknown User', shape.history).catch(console.error);
            }
          }
        })
        // Update color history (keep last 2 unique colors)
        setColorHistory(prev => {
          const filtered = prev.filter(c => c !== newColor);
          return [newColor, ...filtered].slice(0, 2);
        });
      }

      const handleMultiCopy = async () => {
        const selectedShapes = getSelectedShapes()
        const maxZ = Math.max(...rectangles.map(r => r.z ?? 0))
        
        for (let i = 0; i < selectedShapes.length; i++) {
          const shape = selectedShapes[i]
          const newId = generateRectId()
          const copiedShape = {
            ...shape,
            id: newId,
            x: shape.x + 30,
            y: shape.y + 30,
            z: maxZ + i + 1
          }
          await addRectangle(copiedShape)
        }
      }

      const handleMultiDelete = () => {
        const selectedShapes = getSelectedShapes()
        
        if (selectedShapes.length > 5) {
          if (!confirm(`Delete ${selectedShapes.length} shapes?`)) return
        }
        
        selectedShapes.forEach(shape => deleteRectangle(shape.id))
        clearSelection()
      }

      const handleMultiBringToFront = async () => {
        await bringToFront(Array.from(selectedIds))
      }

      const handleMultiSendToBack = async () => {
        await sendToBack(Array.from(selectedIds))
      }

      return (
        <div
          style={{
            position: 'fixed',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            zIndex: 26,
            background: '#FFFFFF',
            border: '1px solid #D4C5A9',
            borderRadius: 8,
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 220,
            maxWidth: 260,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(62, 56, 50, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Multi-select Title */}
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#3E3832',
            paddingBottom: 8,
            borderBottom: '1px solid #D4C5A9',
            textAlign: 'center'
          }}>
            {selectedIds.size} Shapes Selected
          </div>

          {/* Color Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#6B5F54', minWidth: 50 }}>Color:</label>
              <input
                type="color"
                value="#FFFFFF"
                onChange={handleMultiColorChange}
                style={{ width: 40, height: 40, padding: 0, background: '#FFFFFF', border: '1px solid #D4C5A9', borderRadius: 4, cursor: 'pointer', flexGrow: 1 }}
                aria-label="Change shape color"
              />
            </div>
            {/* Color History */}
            {colorHistory.length > 0 && (
              <div style={{ display: 'flex', gap: 6, paddingLeft: 58 }}>
                {colorHistory.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      Array.from(selectedIds).forEach(id => {
                        const shape = rectangles.find(r => r.id === id);
                        if (shape) {
                          const oldColor = shape.fill;
                          updateRectangle(id, { fill: color });
                          // Track color change
                          if (user) {
                            trackShapeEdit(id, { fill: oldColor }, { fill: color }, user.id, user.displayName || 'Unknown User', shape.history).catch(console.error);
                          }
                        }
                      });
                    }}
                    title={`Use ${color}`}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      background: color,
                      border: '2px solid #D4C5A9',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    aria-label={`Use color ${color}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                handleMultiBringToFront();
              }}
              title="Move to top layer"
              aria-label="Move to top layer"
              style={{ background: '#E8F4E7', color: '#3D5A39', border: '1px solid #7A9B76', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', flex: 1, fontSize: 12 }}
            >
              Top ↑
            </button>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                handleMultiSendToBack();
              }}
              title="Move to bottom layer"
              aria-label="Move to bottom layer"
              style={{ background: '#F8E8E5', color: '#5A3D39', border: '1px solid #B07768', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', flex: 1, fontSize: 12 }}
            >
              Bottom ↓
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={async (e) => { 
              e.stopPropagation();
              await handleMultiCopy();
            }}
            title="Copy shapes"
            aria-label="Copy selected shapes"
            style={{ background: '#7A9B76', color: '#FFFFFF', border: '1px solid #7A9B76', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 14, marginTop: 4 }}
          >
            Copy
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              handleMultiDelete();
            }}
            title="Delete shapes"
            aria-label="Delete selected shapes"
            style={{ background: '#B07768', color: '#FFFFFF', border: '1px solid #B07768', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}
          >
            Delete
          </button>
        </div>
      )
    })() : selectedId && selectedIds.size <= 1 ? (() => {
      // Single-shape panel
      const sel = rectangles.find((rr: Rectangle) => rr.id === selectedId)
      if (!sel) return null
      const shapeNumber = shapeNumbers.get(sel.id) || 0
      const shapeTypeName = getShapeTypeName(sel.type)
      return (
        <div
          style={{
            position: 'fixed',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            zIndex: 26,
            background: '#FFFFFF',
            border: '1px solid #D4C5A9',
            borderRadius: 8,
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 220,
            maxWidth: 260,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(62, 56, 50, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Shape Title */}
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#3E3832',
            paddingBottom: 8,
            borderBottom: '1px solid #D4C5A9',
            textAlign: 'center'
          }}>
            {shapeTypeName} #{shapeNumber}
          </div>

          {/* Color Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#6B5F54', minWidth: 50 }}>Color:</label>
              <input
                type="color"
                value={sel.fill}
                onChange={(e) => {
                  const newColor = e.target.value;
                  const oldColor = sel.fill;
                  updateRectangle(sel.id, { fill: newColor });
                  // Track color change
                  if (user) {
                    trackShapeEdit(sel.id, { fill: oldColor }, { fill: newColor }, user.id, user.displayName || 'Unknown User', sel.history).catch(console.error);
                  }
                  // Update color history (keep last 2 unique colors)
                  setColorHistory(prev => {
                    const filtered = prev.filter(c => c !== newColor);
                    return [newColor, ...filtered].slice(0, 2);
                  });
                }}
                style={{ width: 40, height: 40, padding: 0, background: '#FFFFFF', border: '1px solid #D4C5A9', borderRadius: 4, cursor: 'pointer', flexGrow: 1 }}
                aria-label="Change shape color"
              />
            </div>
            {/* Color History */}
            {colorHistory.length > 0 && (
              <div style={{ display: 'flex', gap: 6, paddingLeft: 58 }}>
                {colorHistory.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const oldColor = sel.fill;
                      updateRectangle(sel.id, { fill: color });
                      // Track color change
                      if (user) {
                        trackShapeEdit(sel.id, { fill: oldColor }, { fill: color }, user.id, user.displayName || 'Unknown User', sel.history).catch(console.error);
                      }
                    }}
                    title={`Use ${color}`}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      background: color,
                      border: '2px solid #D4C5A9',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    aria-label={`Use color ${color}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                const maxZ = Math.max(...rectangles.map(r => r.z ?? 0));
                updateRectangle(sel.id, { z: maxZ + 1 });
              }}
              title="Move to top layer"
              aria-label="Move to top layer"
              style={{ background: '#E8F4E7', color: '#3D5A39', border: '1px solid #7A9B76', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', flex: 1, fontSize: 12 }}
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
              style={{ background: '#F8E8E5', color: '#5A3D39', border: '1px solid #B07768', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', flex: 1, fontSize: 12 }}
            >
              Bottom ↓
            </button>
          </div>

          {/* Text Controls */}
          {sel.type === 'text' && (
            <>
              {/* Text Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#6B5F54' }}>Text:</label>
                <input
                  type="text"
                  value={sel.text ?? ''}
                  onChange={(e) => {
                    const newText = e.target.value
                    const dimensions = measureTextDimensions(newText || ' ', sel.fontSize || 64)
                    updateRectangle(sel.id, { text: newText, width: dimensions.width, height: dimensions.height })
                  }}
                  placeholder="Enter text..."
                  style={{
                    background: '#FFFFFF',
                    color: '#3E3832',
                    border: '1px solid #D4C5A9',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 14,
                    width: '100%',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Font Size Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#6B5F54' }}>Font Size:</label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="8"
                    max="144"
                    value={sel.fontSize || 64}
                    onChange={(e) => {
                      const size = Math.max(8, Math.min(144, parseInt(e.target.value) || 64));
                      const dimensions = measureTextDimensions(sel.text || ' ', size);
                      updateRectangle(sel.id, { fontSize: size, width: dimensions.width, height: dimensions.height });
                    }}
                    style={{
                      background: '#FFFFFF',
                      color: '#3E3832',
                      border: '1px solid #D4C5A9',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 14,
                      width: '70px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        const newSize = Math.min(144, (sel.fontSize || 64) + 2);
                        const dimensions = measureTextDimensions(sel.text || ' ', newSize);
                        updateRectangle(sel.id, { fontSize: newSize, width: dimensions.width, height: dimensions.height });
                      }}
                      title="Increase font size"
                      aria-label="Increase font size"
                      style={{
                        background: '#E8F4E7',
                        color: '#3D5A39',
                        border: '1px solid #7A9B76',
                        borderRadius: 4,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                        lineHeight: 1,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        const newSize = Math.max(8, (sel.fontSize || 64) - 2);
                        const dimensions = measureTextDimensions(sel.text || ' ', newSize);
                        updateRectangle(sel.id, { fontSize: newSize, width: dimensions.width, height: dimensions.height });
                      }}
                      title="Decrease font size"
                      aria-label="Decrease font size"
                      style={{
                        background: '#F8E8E5',
                        color: '#5A3D39',
                        border: '1px solid #B07768',
                        borderRadius: 4,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                        lineHeight: 1,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Copy Button */}
          <button
            onClick={async (e) => { 
              e.stopPropagation();
              const newId = generateRectId();
              const cascadeOffset = 30;
              const copiedShape: Rectangle = {
                ...sel,
                id: newId,
                x: sel.x + cascadeOffset,
                y: sel.y + cascadeOffset,
                z: Math.max(...rectangles.map(r => r.z ?? 0)) + 1
              };
              await addRectangle(copiedShape);
              setSelectedId(newId);
            }}
            title="Copy shape"
            aria-label="Copy shape"
            style={{ background: '#7A9B76', color: '#FFFFFF', border: '1px solid #7A9B76', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 14, marginTop: 4 }}
          >
            Copy
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => { e.stopPropagation(); deleteRectangle(sel.id); setSelectedId(null) }}
            title="Delete shape"
            aria-label="Delete selected shape"
            style={{ background: '#B07768', color: '#FFFFFF', border: '1px solid #B07768', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}
          >
            Delete
          </button>
        </div>
      )
    })() : null}
    {/* Status Bar */}
    <div style={{ 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: '32px', 
      background: '#FFFFFF', 
      borderTop: '1px solid #D4C5A9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      fontSize: '12px',
      color: '#6B5F54',
      zIndex: 25
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isSpacePressed ? (
          <span>Drag to select multiple shapes</span>
        ) : hasSelection ? (
          <>
            <span>
              {selectionCount} shape{selectionCount !== 1 ? 's' : ''} selected
            </span>
            {selectionCount > 1 && (
              <>
                <span>•</span>
                <button
                  onClick={() => {
                    const selectedShapes = getSelectedShapes()
                    if (selectedShapes.length > 0) {
                      selectSimilar(selectedShapes[0].id)
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #D4C5A9',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: '#6B5F54',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                  title="Select similar shapes"
                >
                  Select Similar
                </button>
                <button
                  onClick={() => {
                    const selectedShapes = getSelectedShapes()
                    if (selectedShapes.length > 0) {
                      selectByType(selectedShapes[0].type || 'rect')
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #D4C5A9',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: '#6B5F54',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                  title="Select all shapes of same type"
                >
                  Select Type
                </button>
                <button
                  onClick={() => {
                    const selectedShapes = getSelectedShapes()
                    if (selectedShapes.length > 0) {
                      selectByColor(selectedShapes[0].fill)
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #D4C5A9',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: '#6B5F54',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                  title="Select all shapes of same color"
                >
                  Select Color
                </button>
              </>
            )}
          </>
        ) : (
          <span>Press ? for shortcuts</span>
        )}
        {/* Groups button - always visible */}
        <span>•</span>
        <button
          onClick={() => setShowGroupsPanel(true)}
          style={{
            background: 'transparent',
            border: '1px solid #374151',
            borderRadius: '4px',
            padding: '4px 12px',
            color: '#9CA3AF',
            cursor: 'pointer',
            fontSize: '11px'
          }}
          title="View and manage groups"
        >
          Groups
        </button>
        {/* Activity button - visible when shape selected */}
        {hasSelection && selectionCount === 1 && (
          <>
            <span>•</span>
            <button
              onClick={() => setShowActivityPanel(!showActivityPanel)}
              style={{
                background: showActivityPanel ? '#5B8FA3' : 'transparent',
                border: '1px solid #5B8FA3',
                borderRadius: '4px',
                padding: '4px 12px',
                color: showActivityPanel ? '#FFFFFF' : '#5B8FA3',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: showActivityPanel ? '500' : 'normal'
              }}
              title="View shape activity and comments"
            >
              Activity
            </button>
          </>
        )}
        {/* Zoom Controls */}
        <span>•</span>
        <ZoomControls 
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      </div>
      
      {/* Right side info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Total: {rectangles.length} shapes ({visibleShapes.length} visible)</span>
        {hasSelection && (
          <span>•</span>
        )}
        {hasSelection && (
          <span>
            {(() => {
              const selectedShapes = getSelectedShapes()
              const types = [...new Set(selectedShapes.map(s => s.type || 'rect'))]
              return types.length === 1 ? types[0] : `${types.length} types`
            })()}
          </span>
        )}
      </div>
    </div>

    {/* Reconnection banner */}
    {!isOnline ? (
      <div style={{ position: 'absolute', left: 16, bottom: 32, background: '#FFFFFF', color: '#C9A66B', border: '1px solid #D4C5A9', borderRadius: 8, padding: '8px 10px', zIndex: 25, boxShadow: '0 4px 12px rgba(62, 56, 50, 0.1)' }}>
        Reconnecting…
      </div>
    ) : null}

    {/* Keyboard Shortcuts Help Modal */}
    <KeyboardShortcutsHelp 
      isOpen={showHelp} 
      onClose={() => setShowHelp(false)} 
    />
    
    {/* Multi-Shape Properties Modal */}
    {showMultiShapeProperties && hasSelection && (
      <MultiShapeProperties 
        onClose={() => setShowMultiShapeProperties(false)} 
      />
    )}
    
    {/* Groups Panel Modal */}
    <GroupsPanel 
      isOpen={showGroupsPanel}
      onClose={() => setShowGroupsPanel(false)} 
    />
    
    {/* Activity Panel */}
    {showActivityPanel && (
      <ActivityPanel 
        shape={selectedId ? rectangles.find(r => r.id === selectedId) || null : null}
        onClose={() => setShowActivityPanel(false)} 
      />
    )}
    </div>
  )
}


