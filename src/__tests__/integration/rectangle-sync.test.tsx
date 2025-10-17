// Mock realtime service first - this must be before any imports
jest.mock('../../services/realtime', () => ({
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  clearCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  removeUserPresenceRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToDragRtdb: jest.fn(() => jest.fn()),
  clearDragPositionRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdbThrottled: jest.fn(() => Promise.resolve()),
  publishResizePositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToResizeRtdb: jest.fn(() => jest.fn()),
  clearResizePositionRtdb: jest.fn(() => Promise.resolve()),
  cleanupStaleCursorsRtdb: jest.fn(() => Promise.resolve()),
}))

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    cb({ id: 'u1', displayName: 'Test User' })
    return jest.fn()
  },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
}))

import { render, screen } from '@testing-library/react'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock firestore service to provide proper data
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, cb: any) => {
    // Call the callback with empty array initially
    cb([])
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
  shapeToRectangle: jest.fn((shape: any) => shape),
}))

// Mock presence service
jest.mock('../../services/realtime', () => ({
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  clearCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  removeUserPresenceRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToDragRtdb: jest.fn(() => jest.fn()),
  clearDragPositionRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdbThrottled: jest.fn(() => Promise.resolve()),
  publishResizePositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToResizeRtdb: jest.fn(() => jest.fn()),
  clearResizePositionRtdb: jest.fn(() => Promise.resolve()),
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

// Mock the useShapes hook
let mockShapes: any[] = []
jest.mock('../../hooks/useShapes', () => ({
  useShapes: () => ({
    shapes: mockShapes,
    isLoading: false,
    error: null,
    createShape: jest.fn(),
    updateShape: jest.fn(),
    deleteShape: jest.fn(),
    deleteAllShapes: jest.fn(),
  }),
}))

// Mock the CanvasContext to provide rectangles directly
jest.mock('../../contexts/CanvasContext', () => ({
  ...jest.requireActual('../../contexts/CanvasContext'),
  CanvasProvider: ({ children }: { children: React.ReactNode }) => children,
  useCanvas: () => ({
    rectangles: mockShapes,
    viewport: { scale: 1, x: 0, y: 0 },
    selectedTool: 'pan',
    isLoading: false,
    selectedId: null,
    addRectangle: jest.fn(),
    updateRectangle: jest.fn(),
    deleteRectangle: jest.fn(),
    clearAllRectangles: jest.fn(),
    setViewport: jest.fn(),
    setRectangles: jest.fn(),
    setSelectedId: jest.fn(),
    liveDragPositions: {},
    isDragging: false,
    publishDragUpdate: jest.fn(),
    clearDragUpdate: jest.fn(),
  }),
}))

// Mock firebase services
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_query: any, callback: any) => {
    // Simulate async behavior with proper snapshot
    setTimeout(() => {
      const snapshot = {
        exists: () => true,
        data: () => ({
          title: 'Test Document',
          documentId: 'test-doc-id',
          createdBy: 'test-user',
          createdAt: { '.sv': 'timestamp' },
          updatedBy: 'test-user',
          updatedAt: { '.sv': 'timestamp' }
        }),
        id: 'mock-doc-id',
        ref: {},
        metadata: { fromCache: false, hasPendingWrites: false }
      }
      callback(snapshot)
    }, 0)
    return jest.fn() // unsubscribe function
  }),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
}))

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  onValue: jest.fn((_ref: any, callback: any) => {
    callback({ val: () => null })
    return jest.fn()
  }),
  off: jest.fn(),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn(() => Promise.resolve()),
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth: any, callback: any) => {
    callback({ id: 'u1', displayName: 'Test User' })
    return jest.fn()
  }),
  signInWithPopup: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  })),
  getRedirectResult: jest.fn(() => Promise.resolve(null)),
  signOut: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(function MockProvider() {}),
}))

jest.mock('../../services/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))

// Helper functions for creating test data

describe('rectangle sync', () => {
  it('renders rectangles from realtime snapshots', async () => {
    // Set up initial mock data
    mockShapes = [
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
      { id: 'b', x: 50, y: 60, width: 200, height: 100, fill: '#10B981', type: 'rect' },
    ]

    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    const rects = await screen.findAllByTestId('Rect')
    expect(rects.length).toBe(2)
  })

  it('updates rectangles when new data arrives', async () => {
    // Start with one rectangle
    mockShapes = [
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
    ]

    const { rerender } = render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    let rects = await screen.findAllByTestId('Rect')
    expect(rects.length).toBe(1)

    // Update to two rectangles
    mockShapes = [
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
      { id: 'b', x: 50, y: 60, width: 200, height: 100, fill: '#10B981', type: 'rect' },
    ]

    rerender(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    rects = await screen.findAllByTestId('Rect')
    expect(rects.length).toBe(2)
  })

  it('handles empty snapshots', async () => {
    // Start with empty array
    mockShapes = []

    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    const rects = screen.queryAllByTestId('Rect')
    expect(rects.length).toBe(0)
  })
})
