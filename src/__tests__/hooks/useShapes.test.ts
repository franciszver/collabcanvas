import { renderHook, act } from '@testing-library/react'
import { useShapes } from '../../hooks/useShapes'
import { subscribeToShapes, createShape, updateShape, deleteShape, deleteAllShapes, rectangleToShape } from '../../services/firestore'
import { publishDragPositionsRtdbThrottled, subscribeToDragRtdb, clearDragPositionRtdb } from '../../services/realtime'
import { useAuth } from '../../contexts/AuthContext'

// Mock dependencies
jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn(),
  createShape: jest.fn(),
  updateShape: jest.fn(),
  deleteShape: jest.fn(),
  deleteAllShapes: jest.fn(),
  rectangleToShape: jest.fn(),
}))

jest.mock('../../services/realtime', () => ({
  publishDragPositionsRtdbThrottled: jest.fn(),
  subscribeToDragRtdb: jest.fn(),
  clearDragPositionRtdb: jest.fn(),
}))

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockSubscribeToShapes = subscribeToShapes as jest.MockedFunction<typeof subscribeToShapes>
const mockCreateShape = createShape as jest.MockedFunction<typeof createShape>
const mockUpdateShape = updateShape as jest.MockedFunction<typeof updateShape>
const mockDeleteShape = deleteShape as jest.MockedFunction<typeof deleteShape>
const mockDeleteAllShapes = deleteAllShapes as jest.MockedFunction<typeof deleteAllShapes>
const mockRectangleToShape = rectangleToShape as jest.MockedFunction<typeof rectangleToShape>
const mockPublishDragPositionsRtdbThrottled = publishDragPositionsRtdbThrottled as jest.MockedFunction<typeof publishDragPositionsRtdbThrottled>
const mockSubscribeToDragRtdb = subscribeToDragRtdb as jest.MockedFunction<typeof subscribeToDragRtdb>
const mockClearDragPositionRtdb = clearDragPositionRtdb as jest.MockedFunction<typeof clearDragPositionRtdb>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const MOCK_USER = {
  id: 'user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'https://example.com/photo.jpg'
}

const MOCK_SHAPES = [
  {
    id: 'shape-1',
    type: 'rect' as const,
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
    z: 1,
    fill: '#ff0000',
  },
  {
    id: 'shape-2',
    type: 'rect' as const,
    x: 30,
    y: 40,
    width: 80,
    height: 60,
    rotation: 45,
    z: 2,
    fill: '#00ff00',
  },
]

describe('useShapes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: MOCK_USER,
      isLoading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      error: null
    })
    mockSubscribeToShapes.mockReturnValue(jest.fn())
    mockSubscribeToDragRtdb.mockReturnValue(jest.fn())
    mockCreateShape.mockResolvedValue(undefined)
    mockUpdateShape.mockResolvedValue(undefined)
    mockDeleteShape.mockResolvedValue(undefined)
    mockDeleteAllShapes.mockResolvedValue(undefined)
    mockRectangleToShape.mockImplementation((rect, documentId, userId) => ({ 
      id: rect.id,
      type: 'rect' as const,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      rotation: rect.rotation || 0,
      z: rect.z || 0,
      fill: rect.fill,
      createdBy: userId, 
      updatedBy: userId, 
      documentId: documentId 
    }))
    mockPublishDragPositionsRtdbThrottled.mockResolvedValue(undefined)
    mockClearDragPositionRtdb.mockResolvedValue(undefined)
  })

  it('initializes with loading state and empty shapes', () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    expect(result.current.shapes).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.liveDragPositions).toEqual({})
    expect(result.current.isDragging).toBe(false)
  })

  it('subscribes to shapes on mount when user is authenticated', () => {
    renderHook(() => useShapes({ documentId: 'doc-123' }))

    expect(mockSubscribeToShapes).toHaveBeenCalledWith('doc-123', expect.any(Function))
  })

  it('does not subscribe to shapes when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      error: null
    })

    renderHook(() => useShapes({ documentId: 'doc-123' }))

    expect(mockSubscribeToShapes).not.toHaveBeenCalled()
  })

  it('updates shapes when subscription callback is called', async () => {
    let shapesCallback: any
    mockSubscribeToShapes.mockImplementation((_docId, callback) => {
      shapesCallback = callback
      return jest.fn()
    })

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    act(() => {
      shapesCallback(MOCK_SHAPES)
    })

    expect(result.current.shapes).toEqual(MOCK_SHAPES)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('subscribes to drag positions when enableLiveDrag is true', () => {
    renderHook(() => useShapes({ documentId: 'doc-123', enableLiveDrag: true }))

    expect(mockSubscribeToDragRtdb).toHaveBeenCalledWith('user-123', expect.any(Function))
  })

  it('does not subscribe to drag positions when enableLiveDrag is false', () => {
    renderHook(() => useShapes({ documentId: 'doc-123', enableLiveDrag: false }))

    expect(mockSubscribeToDragRtdb).not.toHaveBeenCalled()
  })

  it('updates live drag positions when drag subscription callback is called', async () => {
    let dragCallback: any
    mockSubscribeToDragRtdb.mockImplementation((_userId, callback) => {
      dragCallback = callback
      return jest.fn()
    })

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const dragPositions = {
      'shape-1': { x: 100, y: 200 },
      'shape-2': { x: 300, y: 400 },
    }

    act(() => {
      dragCallback(dragPositions)
    })

    expect(result.current.liveDragPositions).toEqual(dragPositions)
  })

  it('adds shape successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const newShape = {
      id: 'shape-3',
      type: 'rect' as const,
      x: 50,
      y: 60,
      width: 120,
      height: 80,
      rotation: 0,
      z: 3,
      fill: '#0000ff',
    }

    await act(async () => {
      await result.current.addShape(newShape)
    })

    expect(mockRectangleToShape).toHaveBeenCalledWith(newShape, 'doc-123', 'user-123')
    expect(mockCreateShape).toHaveBeenCalled()
  })

  it('updates shape successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const updates = { x: 100, y: 200, fill: '#ffff00' }

    await act(async () => {
      await result.current.updateShape('shape-1', updates)
    })

    expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', updates)
  })

  it('deletes shape successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.deleteShape('shape-1')
    })

    expect(mockDeleteShape).toHaveBeenCalledWith('shape-1')
  })

  it('clears all shapes successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.clearAllShapes()
    })

    expect(mockDeleteAllShapes).toHaveBeenCalledWith('doc-123')
  })

  it('publishes drag update successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.publishDragUpdate('shape-1', { x: 150, y: 250 })
    })

    expect(mockPublishDragPositionsRtdbThrottled).toHaveBeenCalledWith([['shape-1', { x: 150, y: 250 }]], 'user-123')
  })

  it('clears drag update successfully', async () => {
    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.clearDragUpdate('shape-1')
    })

    expect(mockClearDragPositionRtdb).toHaveBeenCalledWith('shape-1', 'user-123')
  })

  it('handles shape operations when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      error: null
    })

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const newShape = {
      id: 'shape-3',
      type: 'rect' as const,
      x: 50,
      y: 60,
      width: 120,
      height: 80,
      rotation: 0,
      z: 3,
      fill: '#0000ff',
    }

    await act(async () => {
      await expect(result.current.addShape(newShape)).rejects.toThrow('User not authenticated')
    })

    expect(mockCreateShape).not.toHaveBeenCalled()
  })

  it('handles errors in addShape operation', async () => {
    const error = new Error('Shape operation failed')
    mockCreateShape.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const newShape = {
      id: 'shape-3',
      type: 'rect' as const,
      x: 50,
      y: 60,
      width: 120,
      height: 80,
      rotation: 0,
      z: 3,
      fill: '#0000ff',
    }

    await act(async () => {
      await expect(result.current.addShape(newShape)).rejects.toThrow('Shape operation failed')
    })

    expect(result.current.error).toEqual(error)
  })

  it('handles errors in updateShape operation', async () => {
    const error = new Error('Update operation failed')
    mockUpdateShape.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    const updates = { x: 100, y: 200, fill: '#ffff00' }

    await act(async () => {
      await expect(result.current.updateShape('shape-1', updates)).rejects.toThrow('Update operation failed')
    })

    expect(result.current.error).toEqual(error)
  })

  it('handles errors in deleteShape operation', async () => {
    const error = new Error('Delete operation failed')
    mockDeleteShape.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await expect(result.current.deleteShape('shape-1')).rejects.toThrow('Delete operation failed')
    })

    expect(result.current.error).toEqual(error)
  })

  it('handles errors in clearAllShapes operation', async () => {
    const error = new Error('Clear all operation failed')
    mockDeleteAllShapes.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await expect(result.current.clearAllShapes()).rejects.toThrow('Clear all operation failed')
    })

    expect(result.current.error).toEqual(error)
  })

  it('handles errors in publishDragUpdate operation', async () => {
    const error = new Error('Drag publish failed')
    mockPublishDragPositionsRtdbThrottled.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.publishDragUpdate('shape-1', { x: 150, y: 250 })
    })

    // Should not throw, but should handle error gracefully
    expect(mockPublishDragPositionsRtdbThrottled).toHaveBeenCalledWith([['shape-1', { x: 150, y: 250 }]], 'user-123')
  })

  it('handles errors in clearDragUpdate operation', async () => {
    const error = new Error('Drag clear failed')
    mockClearDragPositionRtdb.mockRejectedValue(error)

    const { result } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    await act(async () => {
      await result.current.clearDragUpdate('shape-1')
    })

    // Should not throw, but should handle error gracefully
    expect(mockClearDragPositionRtdb).toHaveBeenCalledWith('shape-1', 'user-123')
  })

  it('unsubscribes from shapes on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockSubscribeToShapes.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes from drag positions on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockSubscribeToDragRtdb.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useShapes({ documentId: 'doc-123' }))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
