import { useEffect, useState, useCallback } from 'react'
import { subscribeToShapes, createShape, updateShape, deleteShape, deleteAllShapes, deleteMultipleShapes, rectangleToShape, updateMultipleShapes } from '../services/firestore'
import { publishDragPositionsRtdbThrottled, subscribeToDragRtdb, clearDragPositionRtdb, publishBulkUpdateRtdb, subscribeToBulkUpdateRtdb, publishMultiDeleteRtdb, subscribeToMultiDeleteRtdb, type BulkShapeUpdate } from '../services/realtime'
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
  updateMultipleShapes: (updates: Array<{ shapeId: string; updates: Partial<Rectangle> }>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  deleteMultipleShapes: (shapeIds: string[]) => Promise<void>
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

  // Subscribe to bulk updates from RTDB
  useEffect(() => {
    if (!user || !documentId) return

    const unsubscribe = subscribeToBulkUpdateRtdb(documentId, user.id, (updates) => {
      // Apply bulk updates immediately to local state
      setShapes((prevShapes) => {
        const updatedShapes = [...prevShapes]
        
        for (const { shapeId, updates: shapeUpdates } of updates) {
          const index = updatedShapes.findIndex(s => s.id === shapeId)
          if (index === -1) continue
          
          const shape = updatedShapes[index]
          
          // Skip shapes locked by other users
          if (shape.lockedBy && shape.lockedBy !== user.id) continue
          
          // Apply updates to the shape
          updatedShapes[index] = {
            ...shape,
            ...shapeUpdates
          }
        }
        
        return updatedShapes
      })
    })

    return unsubscribe
  }, [user?.id, documentId])

  // Subscribe to multi-delete events from RTDB
  useEffect(() => {
    if (!user || !documentId) return

    const unsubscribe = subscribeToMultiDeleteRtdb(documentId, user.id, (shapeIds) => {
      // Immediately remove shapes from local state
      setShapes((prevShapes) => {
        return prevShapes.filter(shape => !shapeIds.includes(shape.id))
      })
    })

    return unsubscribe
  }, [user?.id, documentId])

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

  const updateMultipleShapesHandler = useCallback(async (updates: Array<{ shapeId: string; updates: Partial<Rectangle> }>) => {
    if (!user) throw new Error('User not authenticated')
    if (!updates.length) return
    
    try {
      // Step 1: Optimistically update local state immediately
      setShapes((prevShapes) => {
        const updatedShapes = [...prevShapes]
        
        for (const { shapeId, updates: shapeUpdates } of updates) {
          const index = updatedShapes.findIndex(s => s.id === shapeId)
          if (index === -1) continue
          
          const shape = updatedShapes[index]
          
          // Skip shapes locked by other users
          if (shape.lockedBy && shape.lockedBy !== user.id) continue
          
          // Apply updates to the shape
          updatedShapes[index] = {
            ...shape,
            ...shapeUpdates
          }
        }
        
        return updatedShapes
      })
      
      // Step 2: Broadcast to RTDB for instant remote updates
      const rtdbUpdates: BulkShapeUpdate[] = updates.map(({ shapeId, updates: shapeUpdates }) => ({
        shapeId,
        updates: shapeUpdates as Record<string, any>
      }))
      
      await publishBulkUpdateRtdb(user.id, rtdbUpdates, documentId)
      
      // Step 3: Batch update Firestore in background
      const firestoreUpdates = updates.map(({ shapeId, updates: shapeUpdates }) => {
        const currentShape = shapes.find(s => s.id === shapeId)
        
        // Convert Rectangle updates to ShapeDocument updates
        const shapeDocUpdates: any = {}
        if (shapeUpdates.type !== undefined) shapeDocUpdates.type = shapeUpdates.type
        if (shapeUpdates.x !== undefined) shapeDocUpdates.x = shapeUpdates.x
        if (shapeUpdates.y !== undefined) shapeDocUpdates.y = shapeUpdates.y
        if (shapeUpdates.width !== undefined) shapeDocUpdates.width = shapeUpdates.width
        if (shapeUpdates.height !== undefined) shapeDocUpdates.height = shapeUpdates.height
        if (shapeUpdates.rotation !== undefined) shapeDocUpdates.rotation = shapeUpdates.rotation
        if (shapeUpdates.z !== undefined) shapeDocUpdates.z = shapeUpdates.z
        if (shapeUpdates.fill !== undefined) shapeDocUpdates.fill = shapeUpdates.fill
        if (shapeUpdates.text !== undefined) shapeDocUpdates.text = shapeUpdates.text
        if (shapeUpdates.fontSize !== undefined) shapeDocUpdates.fontSize = shapeUpdates.fontSize
        if (shapeUpdates.stroke !== undefined) shapeDocUpdates.stroke = shapeUpdates.stroke
        if (shapeUpdates.strokeWidth !== undefined) shapeDocUpdates.strokeWidth = shapeUpdates.strokeWidth
        
        // Handle comment fields
        if (shapeUpdates.comment !== undefined) shapeDocUpdates.comment = shapeUpdates.comment
        if (shapeUpdates.commentBy !== undefined) shapeDocUpdates.commentBy = shapeUpdates.commentBy
        if (shapeUpdates.commentByName !== undefined) shapeDocUpdates.commentByName = shapeUpdates.commentByName
        if (shapeUpdates.commentAt !== undefined) shapeDocUpdates.commentAt = shapeUpdates.commentAt
        
        // Handle history tracking
        if (shapeUpdates.history !== undefined) {
          shapeDocUpdates.history = shapeUpdates.history
        } else if (currentShape) {
          // Only auto-track if history is not explicitly provided
          const editEntry = createEditEntry(
            currentShape,
            shapeUpdates,
            user.id,
            user.displayName || 'Unknown User'
          )
          
          if (editEntry) {
            shapeDocUpdates.history = addToHistory(currentShape.history, editEntry, 10)
          }
        }
        
        return { shapeId, updates: shapeDocUpdates }
      })
      
      // Fire and forget - Firestore snapshot will reconcile any issues
      updateMultipleShapes(firestoreUpdates).catch((err) => {
        console.error('Failed to batch update shapes in Firestore:', err)
      })
    } catch (err) {
      console.error('Failed to update multiple shapes:', err)
      setError(err as Error)
      throw err
    }
  }, [user, documentId, shapes])

  const deleteShapeHandler = useCallback(async (id: string) => {
    try {
      await deleteShape(id)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const deleteMultipleShapesHandler = useCallback(async (shapeIds: string[]) => {
    if (!user) throw new Error('User not authenticated')
    if (!shapeIds.length) return
    
    try {
      // Filter out shapes locked by other users
      const deletableShapeIds = shapes
        .filter(shape => shapeIds.includes(shape.id))
        .filter(shape => !shape.lockedBy || shape.lockedBy === user.id)
        .map(shape => shape.id)
      
      if (!deletableShapeIds.length) return
      
      // Step 1: Optimistically update local state immediately
      setShapes((prevShapes) => {
        return prevShapes.filter(shape => !deletableShapeIds.includes(shape.id))
      })
      
      // Step 2: Broadcast to RTDB for instant remote updates
      await publishMultiDeleteRtdb(user.id, deletableShapeIds, documentId)
      
      // Step 3: Batch delete from Firestore in background (fire and forget)
      deleteMultipleShapes(deletableShapeIds).catch((err) => {
        console.error('Failed to batch delete shapes from Firestore:', err)
      })
    } catch (err) {
      console.error('Failed to delete multiple shapes:', err)
      setError(err as Error)
      throw err
    }
  }, [user, documentId, shapes])

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
    updateMultipleShapes: updateMultipleShapesHandler,
    deleteShape: deleteShapeHandler,
    deleteMultipleShapes: deleteMultipleShapesHandler,
    clearAllShapes: clearAllShapesHandler,
    liveDragPositions,
    isDragging,
    publishDragUpdate,
    clearDragUpdate,
  }
}

export default useShapes
