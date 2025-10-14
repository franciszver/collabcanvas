import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createRectangleRtdb, updateRectangleRtdb, deleteRectangleRtdb, deleteAllRectanglesRtdb } from '../services/realtime'
import type { CanvasState, Rectangle, ViewportTransform } from '../types/canvas.types'
import { INITIAL_SCALE } from '../utils/constants'
import { useCanvasRealtime } from '../hooks/useCanvas'

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
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined)

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext)
  if (!ctx) throw new Error('useCanvas must be used within CanvasProvider')
  return ctx
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
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
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const selectedTool: CanvasState['selectedTool'] = 'pan'
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const addRectangle = async (rect: Rectangle) => {
    setRectangles((prev) => [...prev, rect])
    try {
      await createRectangleRtdb(rect)
    } catch (e) {
      // rollback on failure
      setRectangles((prev) => prev.filter((r) => r.id !== rect.id))
      // eslint-disable-next-line no-console
      console.error('Failed to create rectangle', e)
    }
  }
  const updateRectangle = async (id: string, update: Partial<Rectangle>) => {
    setRectangles((prev) => prev.map((r) => (r.id === id ? { ...r, ...update } : r)))
    try {
      await updateRectangleRtdb(id, update)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to update rectangle', e)
    }
  }

  const deleteRectangle = async (id: string) => {
    const prevRects = rectangles
    setRectangles((prev) => prev.filter((r) => r.id !== id))
    try {
      await deleteRectangleRtdb(id)
    } catch (e) {
      // rollback on failure
      setRectangles(prevRects)
      // eslint-disable-next-line no-console
      console.error('Failed to delete rectangle', e)
    }
  }

  const clearAllRectangles = async () => {
    const prevRects = rectangles
    setRectangles([])
    try {
      await deleteAllRectanglesRtdb()
    } catch (e) {
      setRectangles(prevRects)
      // eslint-disable-next-line no-console
      console.error('Failed to clear rectangles', e)
    }
  }

  const value: CanvasContextValue = useMemo(
    () => ({ viewport, rectangles, selectedTool, setViewport, setRectangles, addRectangle, updateRectangle, deleteRectangle, isLoading, clearAllRectangles, selectedId, setSelectedId }),
    [viewport, rectangles, selectedTool, isLoading, selectedId]
  )

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('collabcanvas:viewport', JSON.stringify(viewport))
      }
    } catch {}
  }, [viewport])

  // Subscribe to RTDB rectangles
  const handleRectangles = useCallback((rectangles: Rectangle[]) => {
    setRectangles(rectangles)
    setIsLoading(false)
  }, [])

  useCanvasRealtime(handleRectangles)

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
}


