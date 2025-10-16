import { render, screen, waitFor } from '@testing-library/react'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    cb({ id: 'u1', displayName: 'Test User' })
    return jest.fn()
  },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
}))

// Capture the onSnapshot callback so tests can emit snapshots
let emitSnapshot: ((snap: any) => void) | null = null

// Mock firestore service to provide proper data
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, cb: any) => {
    // Call the callback with empty array initially
    cb([])
    // Store the callback so we can call it later
    emitSnapshot = cb
    return jest.fn()
  }),
  createRectangle: jest.fn(() => Promise.resolve()),
  updateRectangleDoc: jest.fn(() => Promise.resolve()),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteRectangleDoc: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect), // Simple pass-through function
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


describe('rectangle sync', () => {
  it('renders rectangles from realtime snapshots', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Emit initial shapes data with two rectangles
    emitSnapshot?.([
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
      { id: 'b', x: 50, y: 60, width: 200, height: 100, fill: '#10B981', type: 'rect' },
    ])

    // Wait for rectangles to be rendered
    await waitFor(async () => {
      const rects = await screen.findAllByTestId('Rect')
      expect(rects.length).toBe(2)
    })
  })

  it('updates existing rectangle on new snapshot (no duplicates)', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    emitSnapshot?.([
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
    ])

    await screen.findByTestId('Rect')

    // Emit update for same id with new position
    emitSnapshot?.([
      { id: 'a', x: 100, y: 200, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
    ])

    await waitFor(async () => {
      const rects = await screen.findAllByTestId('Rect')
      expect(rects.length).toBe(1)
    })
  })
})


