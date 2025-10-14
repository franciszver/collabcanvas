import { useEffect } from 'react'
import { subscribeToShapes } from '../services/firestore'
import type { Rectangle } from '../types/canvas.types'

// Subscribes to Firestore shapes and forwards rectangles to the provided callback.
// Returns nothing; manages lifecycle internally via React useEffect.
export function useCanvasRealtime(onRectangles: (rectangles: Rectangle[]) => void): void {
  useEffect(() => {
    const unsubscribe = subscribeToShapes('default-document', onRectangles)
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [onRectangles])
}

export default undefined