import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { CanvasState, Rectangle, ViewportTransform } from '../types/canvas.types'
import { INITIAL_SCALE } from '../utils/constants'
import { useShapes } from '../hooks/useShapes'
import { useDocument } from '../hooks/useDocument'

export interface CanvasContextValue extends CanvasState {
  setViewport: (v: ViewportTransform) => void
  setRectangles: (r: Rectangle[]) => void
  addRectangle: (rect: Rectangle) => void
  updateRectangle: (id: string, update: Partial<Rectangle>) => void
  deleteRectangle: (id: string) => void
  isLoading: boolean
  clearAllRectangles: () => Promise<void>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  // Live collaboration
  liveDragPositions: Record<string, { x: number; y: number }>
  isDragging: boolean
  publishDragUpdate: (shapeId: string, position: { x: number; y: number }) => Promise<void>
  clearDragUpdate: (shapeId: string) => Promise<void>
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
  const selectedTool: CanvasState['selectedTool'] = 'pan'

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
    deleteShape,
    clearAllShapes,
    liveDragPositions,
    isDragging,
  } = shapesHook

  const {
    isLoading: documentLoading,
    updateViewport: updateDocumentViewport,
  } = useDocument({ 
    documentId, 
    createIfNotExists: true,
    defaultTitle: 'Untitled Canvas'
  })

  // Sync viewport with Firestore document
  const handleViewportChange = useCallback((newViewport: ViewportTransform) => {
    setViewport(newViewport)
    
    // Update Firestore document viewport
    updateDocumentViewport(newViewport).catch(console.error)
    
    // Update localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('collabcanvas:viewport', JSON.stringify(newViewport))
      }
    } catch {}
  }, [updateDocumentViewport])

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

  const deleteRectangle = useCallback(async (id: string) => {
    try {
      await deleteShape(id)
    } catch (err) {
      console.error('Failed to delete rectangle:', err)
      throw err
    }
  }, [deleteShape])

  const clearAllRectangles = useCallback(async () => {
    try {
      await clearAllShapes()
    } catch (err) {
      console.error('Failed to clear rectangles:', err)
      throw err
    }
  }, [clearAllShapes])

  // Computed state
  const isLoading = shapesLoading || documentLoading

  const value: CanvasContextValue = useMemo(
    () => ({
      viewport,
      rectangles,
      selectedTool,
      setViewport: handleViewportChange,
      setRectangles: () => {}, // Not used in hybrid approach
      addRectangle,
      updateRectangle,
      deleteRectangle,
      isLoading,
      clearAllRectangles,
      selectedId,
      setSelectedId,
      liveDragPositions,
      isDragging,
      publishDragUpdate: shapesHook.publishDragUpdate,
      clearDragUpdate: shapesHook.clearDragUpdate,
    }),
    [
      viewport,
      rectangles,
      selectedTool,
      handleViewportChange,
      addRectangle,
      updateRectangle,
      deleteRectangle,
      isLoading,
      clearAllRectangles,
      selectedId,
      setSelectedId,
      liveDragPositions,
      isDragging,
      shapesHook.publishDragUpdate,
      shapesHook.clearDragUpdate,
    ]
  )

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
}