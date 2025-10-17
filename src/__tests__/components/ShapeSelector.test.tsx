// Clear module cache to ensure fresh imports
jest.clearAllMocks()

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import ShapeSelector from '../../components/Header/ShapeSelector'
import Canvas from '../../components/Canvas/Canvas'

// Mock auth immediate user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => { cb({ id: 'u1', displayName: 'User' }); return jest.fn() },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
}))

// Mock realtime service
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

// Override the specific function to ensure it returns a Promise
const realtimeService = jest.requireMock('../../services/realtime')
realtimeService.setUserOnlineRtdb.mockResolvedValue(undefined)
realtimeService.setUserOfflineRtdb.mockResolvedValue(undefined)

// Mock firestore service to provide proper data
let mockShapes: any[] = []
let shapesCallback: ((shapes: any[]) => void) | null = null

jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, callback: (shapes: any[]) => void) => {
    shapesCallback = callback
    // Call callback with current shapes
    callback(mockShapes)
    return jest.fn()
  }),
  createRectangle: jest.fn(() => Promise.resolve()),
  createShape: jest.fn((shapeData: any) => {
    // Add shape to mock data and trigger callback
    mockShapes.push(shapeData)
    if (shapesCallback) {
      shapesCallback([...mockShapes])
    }
    return Promise.resolve()
  }),
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

function renderAll() {
  return render(
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          <div>
            <ShapeSelector />
            <Canvas />
          </div>
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

test.skip('ShapeSelector creates shapes and Canvas renders them', async () => {
  // TODO: Fix this test - PresenceContext is not getting the mocked realtime service properly
  // Reset mock data
  mockShapes = []
  
  renderAll()
  
  // First click the "Create shapes" button to open the dropdown
  const createShapesBtn = screen.getByRole('button', { name: /create shapes/i })
  fireEvent.click(createShapesBtn)
  
  // Now look for the shape buttons in the dropdown
  const rectBtn = screen.getByRole('button', { name: /rectangle/i })

  // Create shapes one by one and wait for them to appear
  fireEvent.click(rectBtn)
  await screen.findByTestId('Rect')
  
  // Wait for dropdown to close
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /rectangle/i })).not.toBeInTheDocument()
  })
  
  // Re-open dropdown and create circle
  fireEvent.click(createShapesBtn)
  const circleBtn2 = screen.getByRole('button', { name: /circle/i })
  fireEvent.click(circleBtn2)
  await screen.findByTestId('Circle')
  
  // Wait for dropdown to close
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /circle/i })).not.toBeInTheDocument()
  })
  
  // Re-open dropdown and create triangle
  fireEvent.click(createShapesBtn)
  const triangleBtn2 = screen.getByRole('button', { name: /triangle/i })
  fireEvent.click(triangleBtn2)
  await screen.findByTestId('RegularPolygon')
  
  // Wait for dropdown to close
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /triangle/i })).not.toBeInTheDocument()
  })
  
  // Re-open dropdown and create star
  fireEvent.click(createShapesBtn)
  const starBtn2 = screen.getByRole('button', { name: /star/i })
  fireEvent.click(starBtn2)
  await screen.findByTestId('Star')

  // Verify all shapes are rendered
  const count =
    (screen.queryAllByTestId('Rect').length || 0) +
    (screen.queryAllByTestId('Circle').length || 0) +
    (screen.queryAllByTestId('RegularPolygon').length || 0) +
    (screen.queryAllByTestId('Star').length || 0)
  expect(count).toBe(4)
})


