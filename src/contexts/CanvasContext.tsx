import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CanvasState, Rectangle, ViewportTransform } from '../types/canvas.types'
import { INITIAL_SCALE } from '../utils/constants'

export interface CanvasContextValue extends CanvasState {
  setViewport: (v: ViewportTransform) => void
  setRectangles: (r: Rectangle[]) => void
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
  const selectedTool: CanvasState['selectedTool'] = 'pan'

  const value: CanvasContextValue = useMemo(
    () => ({ viewport, rectangles, selectedTool, setViewport, setRectangles }),
    [viewport, rectangles, selectedTool]
  )

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('collabcanvas:viewport', JSON.stringify(viewport))
      }
    } catch {}
  }, [viewport])

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
}


