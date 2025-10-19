import { useEffect, useState, useCallback } from 'react'
import { subscribeToShapes, createShape, updateShape, deleteShape, deleteAllShapes, rectangleToShape } from '../services/firestore'
import { publishDragPositionsRtdbThrottled, subscribeToDragRtdb, clearDragPositionRtdb } from '../services/realtime'
import type { Rectangle } from '../types/canvas.types'
import { useAuth } from '../contexts/AuthContext'
import { createEditEntry, addToHistory } from '../utils/historyTracking'

export interface UseShapesOptions {
  documentId: string
  enableLiveDrag?: boolean
}

export interface UseShapesReturn {
  shapes: Rectangle[]
  isLoading: boolean
  error: Error | null
  
  // Shape operations
  addShape: (shape: Rectangle) => Promise<void>
  updateShape: (id: string, updates: Partial<Rectangle>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  clearAllShapes: () => Promise<void>
  
  // Live collaboration
  liveDragPositions: Record<string, { x: number; y: number }>
  isDragging: boolean
  publishDragUpdate: (shapeId: string, position: { x: number; y: number }) => Promise<void>
  clearDragUpdate: (shapeId: string) => Promise<void>
}

export function useShapes({ documentId, enableLiveDrag = true }: UseShapesOptions): UseShapesReturn {
  const [shapes, setShapes] = useState<Rectangle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [liveDragPositions, setLiveDragPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [isDragging, setIsDragging] = useState(false)
  const { user } = useAuth()

  // Subscribe to Firestore shapes
  useEffect(() => {
    if (!documentId || !user) return

    const unsubscribe = subscribeToShapes(documentId, (newShapes) => {
      setShapes(newShapes)
      setIsLoading(false)
      setError(null)
    })

    return unsubscribe
  }, [documentId, user])

  // Subscribe to live drag positions from RTDB
  useEffect(() => {
    if (!enableLiveDrag || !user || !documentId) return

    const unsubscribe = subscribeToDragRtdb(user.id, (live) => {
      setLiveDragPositions(live)
      setIsDragging(Object.keys(live).length > 0)
    })

    return unsubscribe
  }, [enableLiveDrag, user?.id, documentId])

  // Shape operations
  const addShape = useCallback(async (shape: Rectangle) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      const shapeDoc = rectangleToShape(shape, documentId, user.id)
      await createShape(shapeDoc)
    } catch (err) {
      console.error('Failed to add shape to Firestore:', err)
      setError(err as Error)
      throw err
    }
  }, [user, documentId])

  const updateShapeHandler = useCallback(async (id: string, updates: Partial<Rectangle>) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      // Find the current shape to track changes
      const currentShape = shapes.find(s => s.id === id)
      
      // Convert Rectangle updates to ShapeDocument updates
      const shapeUpdates: any = {}
      if (updates.type !== undefined) shapeUpdates.type = updates.type
      if (updates.x !== undefined) shapeUpdates.x = updates.x
      if (updates.y !== undefined) shapeUpdates.y = updates.y
      if (updates.width !== undefined) shapeUpdates.width = updates.width
      if (updates.height !== undefined) shapeUpdates.height = updates.height
      if (updates.rotation !== undefined) shapeUpdates.rotation = updates.rotation
      if (updates.z !== undefined) shapeUpdates.z = updates.z
      if (updates.fill !== undefined) shapeUpdates.fill = updates.fill
      if (updates.text !== undefined) shapeUpdates.text = updates.text
      if (updates.fontSize !== undefined) shapeUpdates.fontSize = updates.fontSize
      if (updates.stroke !== undefined) shapeUpdates.stroke = updates.stroke
      if (updates.strokeWidth !== undefined) shapeUpdates.strokeWidth = updates.strokeWidth
      if (updates.opacity !== undefined) shapeUpdates.opacity = updates.opacity
      
      // Handle comment and history fields (pass through without tracking)
      if (updates.comment !== undefined) shapeUpdates.comment = updates.comment
      if (updates.commentBy !== undefined) shapeUpdates.commentBy = updates.commentBy
      if (updates.commentByName !== undefined) shapeUpdates.commentByName = updates.commentByName
      if (updates.commentAt !== undefined) shapeUpdates.commentAt = updates.commentAt
      if (updates.history !== undefined) {
        shapeUpdates.history = updates.history
      } else if (currentShape) {
        // Only auto-track if history is not explicitly provided (avoid double-tracking)
        // Create edit entry for automatic tracking
        const editEntry = createEditEntry(
          currentShape,
          updates,
          user.id,
          user.displayName || 'Unknown User'
        )
        
        if (editEntry) {
          // Add to history
          shapeUpdates.history = addToHistory(currentShape.history, editEntry, 10)
        }
      }
      
      await updateShape(id, shapeUpdates)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [user, shapes])

  const deleteShapeHandler = useCallback(async (id: string) => {
    try {
      await deleteShape(id)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const clearAllShapesHandler = useCallback(async () => {
    try {
      await deleteAllShapes(documentId)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [documentId])

  // Live drag operations
  const publishDragUpdate = useCallback(async (shapeId: string, position: { x: number; y: number }) => {
    if (!user || !enableLiveDrag) return
    
    try {
      await publishDragPositionsRtdbThrottled([[shapeId, position]], user.id)
    } catch (err) {
      console.error('Failed to publish drag update:', err)
    }
  }, [user, enableLiveDrag])

  const clearDragUpdate = useCallback(async (shapeId: string) => {
    if (!user || !enableLiveDrag) return
    
    try {
      await clearDragPositionRtdb(shapeId, user.id)
    } catch (err) {
      console.error('Failed to clear drag update:', err)
    }
  }, [user, enableLiveDrag])

  return {
    shapes,
    isLoading,
    error,
    addShape,
    updateShape: updateShapeHandler,
    deleteShape: deleteShapeHandler,
    clearAllShapes: clearAllShapesHandler,
    liveDragPositions,
    isDragging,
    publishDragUpdate,
    clearDragUpdate,
  }
}

export default useShapes
