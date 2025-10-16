import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    cb({ id: 'u1', displayName: 'Test User' })
    return jest.fn()
  },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
}))

// Mock firestore service to provide proper data
let emitShapes: ((shapes: any[]) => void) | null = null

jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, cb: any) => {
    // Call the callback with empty array initially
    cb([])
    // Store the callback so we can call it later
    emitShapes = cb
    return jest.fn()
  }),
  createRectangle: jest.fn(() => Promise.resolve()),
  updateRectangleDoc: jest.fn(() => Promise.resolve()),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteRectangleDoc: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
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

function renderCanvas() {
  return render(
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          <Canvas />
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

describe('Canvas Core Functionality', () => {
  beforeEach(() => {
    // Reset the emitShapes function
    emitShapes = null
  })

  test('renders canvas with grid lines', () => {
    renderCanvas()
    
    // Check that the canvas stage is rendered
    expect(screen.getByTestId('Stage')).toBeInTheDocument()
    
    // Check that grid lines are rendered
    const gridLines = screen.getAllByTestId('Line')
    expect(gridLines.length).toBeGreaterThan(0)
  })

  test('renders shapes when provided via subscription', async () => {
    renderCanvas()
    
    // Initially no shapes should be visible
    expect(screen.queryByTestId('Rect')).not.toBeInTheDocument()
    
    // Emit shapes data
    emitShapes?.([
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
      { id: 'rect2', x: 150, y: 50, width: 120, height: 90, fill: '#10B981', type: 'rect' },
    ])
    
    // Wait for shapes to be rendered
    await waitFor(() => {
      const rects = screen.getAllByTestId('Rect')
      expect(rects).toHaveLength(2)
    })
  })

  test('updates shapes when subscription data changes', async () => {
    renderCanvas()
    
    // Emit initial shapes
    emitShapes?.([
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
    ])
    
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })
    
    // Update the shape
    emitShapes?.([
      { id: 'rect1', x: 50, y: 60, width: 150, height: 100, fill: '#3B82F6', type: 'rect' },
    ])
    
    // The shape should still be there (same ID)
    await waitFor(() => {
      const rects = screen.getAllByTestId('Rect')
      expect(rects).toHaveLength(1)
    })
  })

  test('handles empty shapes array', async () => {
    renderCanvas()
    
    // Emit empty array
    emitShapes?.([])
    
    await waitFor(() => {
      expect(screen.queryByTestId('Rect')).not.toBeInTheDocument()
    })
  })

  test('renders different shape types', async () => {
    renderCanvas()
    
    // Emit different shape types
    emitShapes?.([
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
      { id: 'circle1', x: 150, y: 50, width: 80, height: 80, fill: '#10B981', type: 'circle' },
      { id: 'triangle1', x: 250, y: 30, width: 100, height: 100, fill: '#F59E0B', type: 'triangle' },
    ])
    
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
      expect(screen.getByTestId('Circle')).toBeInTheDocument()
      expect(screen.getByTestId('RegularPolygon')).toBeInTheDocument()
    })
  })

  test('canvas responds to mouse events', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    // Test mouse down event
    fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 })
    
    // Test mouse move event
    fireEvent.mouseMove(stage, { clientX: 150, clientY: 150 })
    
    // Test mouse up event
    fireEvent.mouseUp(stage, { clientX: 150, clientY: 150 })
    
    // Test wheel event
    fireEvent.wheel(stage, { deltaY: 100 })
    
    // If we get here without errors, the events are handled
    expect(stage).toBeInTheDocument()
  })

  test('renders transformer for shape selection', async () => {
    renderCanvas()
    
    // Emit a shape
    emitShapes?.([
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
    ])
    
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })
    
    // Check that transformer is rendered
    expect(screen.getByTestId('Transformer')).toBeInTheDocument()
  })
})
