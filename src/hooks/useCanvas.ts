import { useEffect } from 'react'
import { subscribeToRectanglesRtdb } from '../services/realtime'
import type { Rectangle } from '../types/canvas.types'

// Subscribes to RTDB rectangles and forwards rectangles to the provided callback.
// Returns nothing; manages lifecycle internally via React useEffect.
export function useCanvasRealtime(onRectangles: (rectangles: Rectangle[]) => void): void {
  useEffect(() => {
    const unsubscribe = subscribeToRectanglesRtdb(onRectangles)
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [onRectangles])
}

export default undefined