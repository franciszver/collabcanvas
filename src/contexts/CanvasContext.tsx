import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasState, Rectangle, ViewportTransform, ShapeLock } from '../types/canvas.types'
import { INITIAL_SCALE } from '../utils/constants'
import { useShapes } from '../hooks/useShapes'
import { useDocument } from '../hooks/useDocument'
import { useSelection } from '../hooks/useSelection'
import { useAuth } from './AuthContext'
import { lockShapes, unlockShapes } from '../services/locking'
import { debounce } from '../utils/performance'
import { subscribeToViewportRtdb, setupViewportDisconnectCleanup } from '../services/realtime'
// import { publishSelectionRtdb, clearSelectionRtdb } from '../services/realtime'

export interface CanvasContextValue extends CanvasState {
  documentId: string
  setViewport: (v: ViewportTransform) => void
  setRectangles: (r: Rectangle[]) => void
  addRectangle: (rect: Rectangle) => void
  updateRectangle: (id: string, update: Partial<Rectangle>) => void
  updateMultipleRectangles: (updates: Array<{ id: string; updates: Partial<Rectangle> }>) => Promise<void>
  deleteRectangle: (id: string) => void
  deleteMultipleRectangles: (ids: string[]) => Promise<void>
  isLoading: boolean
  clearAllRectangles: () => Promise<void>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  // Live collaboration
  liveDragPositions: Record<string, { x: number; y: number }>
  isDragging: boolean
  publishDragUpdate: (shapeId: string, position: { x: number; y: number }) => Promise<void>
  clearDragUpdate: (shapeId: string) => Promise<void>
  // Multi-selection
  selectedIds: Set<string>
  isBoxSelecting: boolean
  selectionBox: { x: number; y: number; width: number; height: number } | null
  isSpacePressed: boolean
  selectShape: (shapeId: string) => void
  deselectShape: (shapeId: string) => void
  toggleShape: (shapeId: string) => void
  selectAll: () => void
  clearSelection: () => void
  selectInBox: (box: { x: number; y: number; width: number; height: number }) => void
  startBoxSelection: (x: number, y: number) => void
  updateBoxSelection: (x: number, y: number) => void
  endBoxSelection: () => void
  lockSelectedShapes: () => Promise<void>
  unlockSelectedShapes: () => Promise<void>
  isSelected: (shapeId: string) => boolean
  getSelectedShapes: () => Rectangle[]
  canSelect: (shapeId: string) => boolean
  hasSelection: boolean
  selectionCount: number
  // Locking
  shapeLocks: Record<string, ShapeLock>
  lockShapes: (shapeIds: string[]) => Promise<void>
  unlockShapes: (shapeIds: string[]) => Promise<void>
  // Layer management
  bringToFront: (shapeIds: string[]) => Promise<void>
  sendToBack: (shapeIds: string[]) => Promise<void>
  nudgeShapes: (shapeIds: string[], deltaX: number, deltaY: number) => Promise<void>
  // Grouping
  groupShapes: (shapeIds: string[]) => Promise<void>
  ungroupShapes: (shapeIds: string[]) => Promise<void>
  // Smart selection
  selectSimilar: (shapeId: string) => void
  selectByType: (type: string) => void
  selectByColor: (color: string) => void
  // Navigation
  panToPosition: (x: number, y: number, targetScale?: number) => void
  panToShapePosition: (shape: Rectangle) => void
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined)

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext)
  if (!ctx) {
    throw new Error('useCanvas must be used within a CanvasProvider')
  }
  return ctx
}

export function CanvasProvider({ 
  children, 
  documentId = 'default-document' 
}: { 
  children: React.ReactNode
  documentId?: string 
}) {
  // Local viewport state (synced with Firestore)
  const [viewport, setViewport] = useState<ViewportTransform>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('collabcanvas:viewport') : null
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ViewportTransform>
        if (
          parsed &&
          typeof parsed.scale === 'number' &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number'
        ) {
          return { scale: parsed.scale, x: parsed.x, y: parsed.y }
        }
      }
    } catch {}
    return { scale: INITIAL_SCALE, x: 0, y: 0 }
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shapeLocks, setShapeLocks] = useState<Record<string, ShapeLock>>({})
  const selectedTool: CanvasState['selectedTool'] = 'pan'
  const { user } = useAuth()

  // Use hybrid hooks
  const shapesHook = useShapes({ 
    documentId, 
    enableLiveDrag: true 
  })
  
  const {
    shapes: rectangles,
    isLoading: shapesLoading,
    addShape,
    updateShape,
    updateMultipleShapes,
    deleteShape,
    deleteMultipleShapes,
    clearAllShapes,
    liveDragPositions,
    isDragging,
  } = shapesHook

  // Selection system
  const selectionHook = useSelection({
    shapes: rectangles,
    onSelectionChange: (selectedIds) => {
      // Update primary selectedId to the first selected shape for backward compatibility
      const firstSelected = Array.from(selectedIds)[0] || null
      setSelectedId(firstSelected)
    }
  })

  const {
    isLoading: documentLoading,
    updateViewport: updateDocumentViewport,
  } = useDocument({ 
    documentId, 
    createIfNotExists: true,
    defaultTitle: 'Untitled Canvas'
  })

  // Debounced Firestore viewport update (500ms delay after panning stops)
  const debouncedFirestoreUpdate = useRef(
    debounce((viewport: ViewportTransform) => {
      updateDocumentViewport(viewport).catch(console.error)
    }, 500)
  ).current

  // Sync viewport with Firestore document
  const handleViewportChange = useCallback((newViewport: ViewportTransform) => {
    setViewport(newViewport)
    
    // Update Firestore document viewport (debounced to reduce writes during panning)
    debouncedFirestoreUpdate(newViewport)
    
    // Update localStorage immediately for fast restore
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('collabcanvas:viewport', JSON.stringify(newViewport))
      }
    } catch {}
  }, [debouncedFirestoreUpdate])

  // Subscribe to RTDB viewport updates for cross-tab sync
  useEffect(() => {
    if (!user) return

    // Setup disconnect cleanup
    setupViewportDisconnectCleanup(user.id).catch(console.error)

    // Subscribe to viewport updates from RTDB (for cross-tab sync)
    const unsubscribe = subscribeToViewportRtdb(user.id, (rtdbViewport) => {
      if (!rtdbViewport) return
      
      // Only apply viewport updates for the current document
      if (rtdbViewport.documentId !== documentId) return
      
      // Update local viewport state from RTDB (skip Firestore to avoid circular updates)
      setViewport({
        x: rtdbViewport.x,
        y: rtdbViewport.y,
        scale: rtdbViewport.scale
      })
      
      // Update localStorage for fast restore
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('collabcanvas:viewport', JSON.stringify({
            x: rtdbViewport.x,
            y: rtdbViewport.y,
            scale: rtdbViewport.scale
          }))
        }
      } catch {}
    })

    return () => {
      unsubscribe()
    }
  }, [user, documentId])

  // Shape operations
  const addRectangle = useCallback(async (rect: Rectangle) => {
    try {
      await addShape(rect)
    } catch (err) {
      console.error('Failed to add rectangle:', err)
      throw err
    }
  }, [addShape])

  const updateRectangle = useCallback(async (id: string, update: Partial<Rectangle>) => {
    try {
      await updateShape(id, update)
    } catch (err) {
      console.error('Failed to update rectangle:', err)
      throw err
    }
  }, [updateShape])

  const updateMultipleRectangles = useCallback(async (updates: Array<{ id: string; updates: Partial<Rectangle> }>) => {
    try {
      // Map to the format expected by updateMultipleShapes
      const shapesUpdates = updates.map(({ id, updates: updateData }) => ({
        shapeId: id,
        updates: updateData
      }))
      await updateMultipleShapes(shapesUpdates)
    } catch (err) {
      console.error('Failed to update multiple rectangles:', err)
      throw err
    }
  }, [updateMultipleShapes])

  const deleteRectangle = useCallback(async (id: string) => {
    try {
      await deleteShape(id)
    } catch (err) {
      console.error('Failed to delete rectangle:', err)
      throw err
    }
  }, [deleteShape])

  const deleteMultipleRectangles = useCallback(async (ids: string[]) => {
    try {
      await deleteMultipleShapes(ids)
    } catch (err) {
      console.error('Failed to delete multiple rectangles:', err)
      throw err
    }
  }, [deleteMultipleShapes])

  const clearAllRectangles = useCallback(async () => {
    try {
      await clearAllShapes()
    } catch (err) {
      console.error('Failed to clear rectangles:', err)
      throw err
    }
  }, [clearAllShapes])

  // Extract lock information from shapes and update lock state
  useEffect(() => {
    const locks: Record<string, ShapeLock> = {}
    rectangles.forEach(shape => {
      if (shape.lockedBy && shape.lockedAt) {
        locks[shape.id] = {
          lockedBy: shape.lockedBy,
          lockedByName: shape.lockedByName || 'Unknown User',
          lockedAt: shape.lockedAt
        }
      }
    })
    setShapeLocks(locks)
  }, [rectangles])

  // Locking methods
  const lockShapesHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length === 0 || !user) return
    
    try {
      await lockShapes(shapeIds, user.id, user.displayName || 'Unknown User')
    } catch (err) {
      console.error('Failed to lock shapes:', err)
      throw err
    }
  }, [user])

  const unlockShapesHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length === 0) return
    
    try {
      await unlockShapes(shapeIds)
    } catch (err) {
      console.error('Failed to unlock shapes:', err)
      throw err
    }
  }, [])

  // Layer management methods
  const bringToFrontHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length === 0) return
    
    try {
      const maxZ = Math.max(...rectangles.map(r => r.z ?? 0))
      const updatePromises = shapeIds.map((shapeId, index) => 
        updateShape(shapeId, { z: maxZ + index + 1 })
      )
      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Failed to bring shapes to front:', err)
      throw err
    }
  }, [rectangles, updateShape])

  const sendToBackHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length === 0) return
    
    try {
      const minZ = Math.min(...rectangles.map(r => r.z ?? 0))
      const updatePromises = shapeIds.map((shapeId, index) => 
        updateShape(shapeId, { z: minZ - index - 1 })
      )
      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Failed to send shapes to back:', err)
      throw err
    }
  }, [rectangles, updateShape])

  const nudgeShapesHandler = useCallback(async (shapeIds: string[], deltaX: number, deltaY: number) => {
    if (shapeIds.length === 0) return
    
    try {
      const updatePromises = shapeIds.map(async (shapeId) => {
        const shape = rectangles.find(r => r.id === shapeId)
        if (shape) {
          await updateShape(shapeId, { 
            x: shape.x + deltaX, 
            y: shape.y + deltaY 
          })
        }
      })
      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Failed to nudge shapes:', err)
      throw err
    }
  }, [rectangles, updateShape])

  // Grouping methods
  const groupShapesHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length < 2) return
    
    try {
      // Generate a unique group ID
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Update all selected shapes to have the same group ID
      const updatePromises = shapeIds.map(shapeId => 
        updateShape(shapeId, { groupId })
      )
      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Failed to group shapes:', err)
      throw err
    }
  }, [updateShape])

  const ungroupShapesHandler = useCallback(async (shapeIds: string[]) => {
    if (shapeIds.length === 0) return
    
    try {
      // Remove group ID from all selected shapes
      const updatePromises = shapeIds.map(shapeId => 
        updateShape(shapeId, { groupId: undefined })
      )
      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Failed to ungroup shapes:', err)
      throw err
    }
  }, [updateShape])

  // Smart selection methods
  const selectSimilarHandler = useCallback((shapeId: string) => {
    try {
      const targetShape = rectangles.find(r => r.id === shapeId)
      if (!targetShape) {
        console.warn('Target shape not found for similar selection')
        return
      }

      // Find shapes with similar properties
      const similarShapes = rectangles.filter(shape => {
        if (shape.id === shapeId) return false // Don't include the target shape
        
        // Match by type, color, and similar size
        const typeMatch = shape.type === targetShape.type
        const colorMatch = shape.fill === targetShape.fill
        const sizeMatch = Math.abs(shape.width - targetShape.width) < 50 && 
                         Math.abs(shape.height - targetShape.height) < 50
        
        return typeMatch && colorMatch && sizeMatch
      })

      // Select all similar shapes using the selection hook
      const similarIds = similarShapes.map(s => s.id)
      if (similarIds.length > 0) {
        // Clear current selection and select similar shapes
        selectionHook.clearSelection()
        similarIds.forEach(id => {
          selectionHook.selectShape(id)
        })
        console.log(`Selected ${similarIds.length} similar shapes`)
      } else {
        console.log('No similar shapes found')
      }
    } catch (error) {
      console.error('Failed to select similar shapes:', error)
    }
  }, [rectangles, selectionHook])

  const selectByTypeHandler = useCallback((type: string) => {
    try {
      const shapesOfType = rectangles.filter(shape => shape.type === type)
      const typeIds = shapesOfType.map(s => s.id)
      
      if (typeIds.length > 0) {
        // Clear current selection and select all shapes of this type
        selectionHook.clearSelection()
        typeIds.forEach(id => {
          selectionHook.selectShape(id)
        })
        console.log(`Selected ${typeIds.length} shapes of type: ${type}`)
      } else {
        console.log(`No shapes of type '${type}' found`)
      }
    } catch (error) {
      console.error('Failed to select by type:', error)
    }
  }, [rectangles, selectionHook])

  const selectByColorHandler = useCallback((color: string) => {
    try {
      const shapesOfColor = rectangles.filter(shape => shape.fill === color)
      const colorIds = shapesOfColor.map(s => s.id)
      
      if (colorIds.length > 0) {
        // Clear current selection and select all shapes of this color
        selectionHook.clearSelection()
        colorIds.forEach(id => {
          selectionHook.selectShape(id)
        })
        console.log(`Selected ${colorIds.length} shapes of color: ${color}`)
      } else {
        console.log(`No shapes of color '${color}' found`)
      }
    } catch (error) {
      console.error('Failed to select by color:', error)
    }
  }, [rectangles, selectionHook])

  // Navigation methods
  const panToPosition = useCallback((x: number, y: number, targetScale?: number) => {
    const scale = targetScale ?? viewport.scale
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2
    
    // Calculate viewport offset to center workspace position
    const newX = screenCenterX - (x * scale)
    const newY = screenCenterY - (y * scale)
    
    handleViewportChange({ scale, x: newX, y: newY })
  }, [viewport.scale, handleViewportChange])

  const panToShapePosition = useCallback((shape: Rectangle) => {
    // Calculate shape center
    const centerX = shape.x + shape.width / 2
    const centerY = shape.y + shape.height / 2
    
    // Calculate scale to fit shape with 40% padding
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const scaleX = screenWidth / (shape.width * 1.4)
    const scaleY = screenHeight / (shape.height * 1.4)
    const scale = Math.min(scaleX, scaleY, 2) // Cap at 200% zoom
    
    panToPosition(centerX, centerY, scale)
  }, [panToPosition])

  // Computed state
  const isLoading = shapesLoading || documentLoading

  const value: CanvasContextValue = useMemo(
    () => ({
      documentId,
      viewport,
      rectangles,
      selectedTool,
      setViewport: handleViewportChange,
      setRectangles: () => {}, // Not used in hybrid approach
      addRectangle,
      updateRectangle,
      updateMultipleRectangles,
      deleteRectangle,
      deleteMultipleRectangles,
      isLoading,
      clearAllRectangles,
      selectedId,
      setSelectedId,
      liveDragPositions,
      isDragging,
      publishDragUpdate: shapesHook.publishDragUpdate,
      clearDragUpdate: shapesHook.clearDragUpdate,
      // Multi-selection
      selectedIds: selectionHook.selectedIds,
      isBoxSelecting: selectionHook.isBoxSelecting,
      selectionBox: selectionHook.selectionBox,
      isSpacePressed: selectionHook.isSpacePressed,
      selectShape: selectionHook.selectShape,
      deselectShape: selectionHook.deselectShape,
      toggleShape: selectionHook.toggleShape,
      selectAll: selectionHook.selectAll,
      clearSelection: selectionHook.clearSelection,
      selectInBox: selectionHook.selectInBox,
      startBoxSelection: selectionHook.startBoxSelection,
      updateBoxSelection: selectionHook.updateBoxSelection,
      endBoxSelection: selectionHook.endBoxSelection,
      lockSelectedShapes: selectionHook.lockSelectedShapes,
      unlockSelectedShapes: selectionHook.unlockSelectedShapes,
      isSelected: selectionHook.isSelected,
      getSelectedShapes: selectionHook.getSelectedShapes,
      canSelect: selectionHook.canSelect,
      hasSelection: selectionHook.hasSelection,
      selectionCount: selectionHook.selectionCount,
      // Locking
      shapeLocks,
      lockShapes: lockShapesHandler,
      unlockShapes: unlockShapesHandler,
      // Layer management
      bringToFront: bringToFrontHandler,
      sendToBack: sendToBackHandler,
      nudgeShapes: nudgeShapesHandler,
      // Grouping
      groupShapes: groupShapesHandler,
      ungroupShapes: ungroupShapesHandler,
      // Smart selection
      selectSimilar: selectSimilarHandler,
      selectByType: selectByTypeHandler,
      selectByColor: selectByColorHandler,
      // Navigation
      panToPosition,
      panToShapePosition,
    }),
    [
      documentId,
      viewport,
      rectangles,
      selectedTool,
      handleViewportChange,
      addRectangle,
      updateRectangle,
      updateMultipleRectangles,
      deleteRectangle,
      deleteMultipleRectangles,
      isLoading,
      clearAllRectangles,
      selectedId,
      setSelectedId,
      liveDragPositions,
      isDragging,
      shapesHook.publishDragUpdate,
      shapesHook.clearDragUpdate,
      // Selection dependencies
      selectionHook.selectedIds,
      selectionHook.isBoxSelecting,
      selectionHook.selectionBox,
      selectionHook.isSpacePressed,
      selectionHook.selectShape,
      selectionHook.deselectShape,
      selectionHook.toggleShape,
      selectionHook.selectAll,
      selectionHook.clearSelection,
      selectionHook.selectInBox,
      selectionHook.startBoxSelection,
      selectionHook.updateBoxSelection,
      selectionHook.endBoxSelection,
      selectionHook.lockSelectedShapes,
      selectionHook.unlockSelectedShapes,
      selectionHook.isSelected,
      selectionHook.getSelectedShapes,
      selectionHook.canSelect,
      selectionHook.hasSelection,
      selectionHook.selectionCount,
      // Locking dependencies
      shapeLocks,
      lockShapesHandler,
      unlockShapesHandler,
      // Layer management dependencies
      bringToFrontHandler,
      sendToBackHandler,
      nudgeShapesHandler,
      // Grouping dependencies
      groupShapesHandler,
      ungroupShapesHandler,
      // Smart selection dependencies
      selectSimilarHandler,
      selectByTypeHandler,
      selectByColorHandler,
      // Navigation dependencies
      panToPosition,
      panToShapePosition,
    ]
  )

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
}