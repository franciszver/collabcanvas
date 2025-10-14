import { useEffect } from 'react'
import { subscribeToRectangles } from '../services/firestore'

export interface RectangleRow {
  rect: {
    id: string
    x: number
    y: number
    width: number
    height: number
    fill: string
  }
  updatedAtMs: number
}

// Subscribes to Firestore rectangles and forwards rows to the provided callback.
// Returns nothing; manages lifecycle internally via React useEffect.
export function useCanvasRealtime(onRows: (rows: RectangleRow[]) => void): void {
  useEffect(() => {
    const unsubscribe = subscribeToRectangles((rows) => {
      onRows(rows as RectangleRow[])
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [onRows])
}

export default undefined


