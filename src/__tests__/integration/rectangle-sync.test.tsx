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

// Capture the subscribeToShapes callback so tests can emit snapshots
let emitShapes: ((shapes: any[]) => void) | null = null

<<<<<<< HEAD
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


=======
jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn((_docId: string, callback: (shapes: any[]) => void) => {
    emitShapes = callback
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
}))

function fakeShape(id: string, data: any) {
  return {
    id,
    type: 'rect',
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fill: data.fill,
    rotation: 0,
    z: 0,
    createdBy: 'test-user',
    updatedBy: 'test-user',
    documentId: 'test-doc',
    ...data,
  }
}

>>>>>>> Dev
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

<<<<<<< HEAD
    // Emit initial shapes data with two rectangles
    emitSnapshot?.([
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
      { id: 'b', x: 50, y: 60, width: 200, height: 100, fill: '#10B981', type: 'rect' },
=======
    // Emit initial shapes with two rectangles
    emitShapes?.([
      fakeShape('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444' }),
      fakeShape('b', { x: 50, y: 60, width: 200, height: 100, fill: '#10B981' }),
>>>>>>> Dev
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

<<<<<<< HEAD
    emitSnapshot?.([
      { id: 'a', x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
=======
    emitShapes?.([
      fakeShape('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444' }),
>>>>>>> Dev
    ])

    await screen.findByTestId('Rect')

    // Emit update for same id with new position
<<<<<<< HEAD
    emitSnapshot?.([
      { id: 'a', x: 100, y: 200, width: 200, height: 100, fill: '#EF4444', type: 'rect' },
=======
    emitShapes?.([
      fakeShape('a', { x: 100, y: 200, width: 200, height: 100, fill: '#EF4444' }),
>>>>>>> Dev
    ])

    await waitFor(async () => {
      const rects = await screen.findAllByTestId('Rect')
      expect(rects.length).toBe(1)
    })
  })
})


