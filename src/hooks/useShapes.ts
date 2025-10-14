import { useEffect, useState, useCallback } from 'react'
import { subscribeToShapes, createShape, updateShape, deleteShape, deleteAllShapes, rectangleToShape } from '../services/firestore'
import { publishDragPositionsRtdbThrottled, subscribeToDragRtdb, clearDragPositionRtdb } from '../services/realtime'
import type { Rectangle } from '../types/canvas.types'
import { useAuth } from '../contexts/AuthContext'

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
      setError(err as Error)
      throw err
    }
  }, [user, documentId])

  const updateShapeHandler = useCallback(async (id: string, updates: Partial<Rectangle>) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      await updateShape(id, {
        ...updates,
        updatedBy: user.id,
      })
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [user])

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
