import { renderHook } from '@testing-library/react'
import { useCanvasRealtime } from '../../hooks/useCanvas'
import { subscribeToShapes } from '../../services/firestore'

// Mock the firestore service
jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn(),
}))

const mockSubscribeToShapes = subscribeToShapes as jest.MockedFunction<typeof subscribeToShapes>

describe('useCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useCanvasRealtime', () => {
    it('subscribes to shapes on mount and unsubscribes on unmount', () => {
      const mockUnsubscribe = jest.fn()
      const mockCallback = jest.fn()
      
      mockSubscribeToShapes.mockReturnValue(mockUnsubscribe)

      const { unmount } = renderHook(() => useCanvasRealtime(mockCallback))

      expect(mockSubscribeToShapes).toHaveBeenCalledWith('default-document', mockCallback)

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('resubscribes when callback changes', () => {
      const mockUnsubscribe1 = jest.fn()
      const mockUnsubscribe2 = jest.fn()
      const mockCallback1 = jest.fn()
      const mockCallback2 = jest.fn()
      
      mockSubscribeToShapes
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)

      const { rerender } = renderHook(
        ({ callback }) => useCanvasRealtime(callback),
        { initialProps: { callback: mockCallback1 } }
      )

      expect(mockSubscribeToShapes).toHaveBeenCalledWith('default-document', mockCallback1)
      expect(mockSubscribeToShapes).toHaveBeenCalledTimes(1)

      rerender({ callback: mockCallback2 })

      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockSubscribeToShapes).toHaveBeenCalledWith('default-document', mockCallback2)
      expect(mockSubscribeToShapes).toHaveBeenCalledTimes(2)
    })

    it('handles unsubscribe function safely', () => {
      const mockCallback = jest.fn()
      
      // Test with undefined unsubscribe
      mockSubscribeToShapes.mockReturnValue(undefined as any)

      const { unmount } = renderHook(() => useCanvasRealtime(mockCallback))

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow()
    })
  })
})
