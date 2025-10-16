import { renderHook, act } from '@testing-library/react'
import { CanvasProvider, useCanvas } from '../../contexts/CanvasContext'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock auth service
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    // Simulate authenticated user
    callback({ id: 'test-user', displayName: 'Test User' })
    return jest.fn()
  }),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}))

// Mock firestore service
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, cb: any) => {
    // Call the callback with seed data
    cb([{ id: 'seed', x: 0, y: 0, width: 10, height: 10, fill: '#000', type: 'rect' }])
    return jest.fn()
  }),
  createShape: jest.fn(async () => { throw new Error('fail') }),
  updateShape: jest.fn(async () => { throw new Error('fail') }),
  deleteShape: jest.fn(async () => { throw new Error('fail') }),
  deleteAllShapes: jest.fn(async () => { throw new Error('fail') }),
  rectangleToShape: jest.fn((rect: any) => rect), // Add missing function
  updateDocument: jest.fn(() => Promise.resolve()),
  db: jest.fn(() => ({})),
  rectanglesCollection: jest.fn(() => ({})),
  presenceCollection: jest.fn(() => ({})),
  usersCollection: jest.fn(() => ({})),
}))

// Mock realtime service
jest.mock('../../services/realtime', () => ({
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  publishDragPositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToDragRtdb: jest.fn(() => jest.fn()),
  clearDragPositionRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdbThrottled: jest.fn(() => Promise.resolve()),
  publishResizePositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToResizeRtdb: jest.fn(() => jest.fn()),
  clearResizePositionRtdb: jest.fn(() => Promise.resolve()),
  removeUserPresenceRtdb: jest.fn(() => Promise.resolve()),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CanvasProvider>{children}</CanvasProvider>
    </AuthProvider>
  )
}

test('rollback behaviors on failures', async () => {
  const { result } = renderHook(() => useCanvas(), { wrapper })

  // Wait for initial data to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  // addRectangle rolls back on failure
  await act(async () => {
    try {
      await result.current.addRectangle({ id: 'r1', x: 0, y: 0, width: 10, height: 10, fill: '#000', type: 'rect' })
    } catch (error) {
      // Expected to fail due to mock
    }
  })
  expect(result.current.rectangles.find((r) => r.id === 'r1')).toBeUndefined()

  // deleteRectangle rollback
  await act(async () => {
    try {
      await result.current.deleteRectangle('seed')
    } catch (error) {
      // Expected to fail due to mock
    }
  })
  expect(result.current.rectangles.find((r) => r.id === 'seed')).toBeDefined()

  // clearAllRectangles rollback
  await act(async () => {
    try {
      await result.current.clearAllRectangles()
    } catch (error) {
      // Expected to fail due to mock
    }
  })
  expect(result.current.rectangles.length).toBeGreaterThan(0)
})


