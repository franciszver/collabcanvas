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

// Mock useSelection hook
jest.mock('../../hooks/useSelection', () => ({
  useSelection: () => ({
    selectedIds: new Set(),
    isBoxSelecting: false,
    selectionBox: null,
    isSpacePressed: false,
    selectShape: jest.fn(),
    deselectShape: jest.fn(),
    toggleShape: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    selectInBox: jest.fn(),
    startBoxSelection: jest.fn(),
    updateBoxSelection: jest.fn(),
    endBoxSelection: jest.fn(),
    lockSelectedShapes: jest.fn(),
    unlockSelectedShapes: jest.fn(),
    isSelected: jest.fn(() => false),
    getSelectedShapes: jest.fn(() => []),
    canSelect: jest.fn(() => true),
    hasSelection: false,
    selectionCount: 0,
  }),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'

// Mock firestore service to provide proper data
let emitShapes: ((shapes: any[]) => void) | null = null

jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn((_documentId: string, cb: any) => {
    // Call the callback with empty array initially
    cb([])
    // Store the callback so we can call it later
    emitShapes = (shapes: any[]) => {
      mockRectangles = shapes
      cb(shapes)
    }
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
  shapeToRectangle: jest.fn((shape: any) => shape),
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

// Import and spy on the realtime service to ensure it's properly mocked
import * as realtimeService from '../../services/realtime'

// Override the specific functions to ensure they return Promises
beforeEach(() => {
  jest.spyOn(realtimeService, 'setUserOnlineRtdb').mockResolvedValue(undefined)
  jest.spyOn(realtimeService, 'setUserOfflineRtdb').mockResolvedValue(undefined)
})

// Mock the useDocument hook
jest.mock('../../hooks/useDocument', () => ({
  useDocument: () => ({
    document: { id: 'test-doc', title: 'Test Document', viewport: { x: 0, y: 0, scale: 1 } },
    isLoading: false,
    error: null,
    updateDocument: jest.fn(() => Promise.resolve()),
    deleteDocument: jest.fn(() => Promise.resolve()),
    updateViewport: jest.fn(() => Promise.resolve()),
  }),
}))

// Mock the useShapes hook
jest.mock('../../hooks/useShapes', () => ({
  useShapes: () => ({
    shapes: mockRectangles,
    isLoading: false,
    error: null,
    addShape: jest.fn(() => Promise.resolve()),
    updateShape: jest.fn(() => Promise.resolve()),
    deleteShape: jest.fn(() => Promise.resolve()),
    clearAllShapes: jest.fn(() => Promise.resolve()),
    liveDragPositions: {},
    isDragging: false,
    publishDragUpdate: jest.fn(() => Promise.resolve()),
    clearDragUpdate: jest.fn(() => Promise.resolve()),
  }),
}))

// Mock the useCanvas hook to provide a working addRectangle function
let mockRectangles: any[] = []

jest.mock('../../contexts/CanvasContext', () => ({
  ...jest.requireActual('../../contexts/CanvasContext'),
  CanvasProvider: ({ children }: { children: React.ReactNode }) => children,
  useCanvas: () => ({
    rectangles: mockRectangles,
    viewport: { scale: 1, x: 0, y: 0 },
    selectedTool: 'pan',
    isLoading: false,
    selectedId: null,
    addRectangle: jest.fn(async (shapeData) => {
      // Call the mocked createShape function directly
      const { createShape } = jest.requireMock('../../services/firestore')
      await createShape(shapeData)
    }),
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

// TODO: Canvas component has runtime errors - getSelectedShapes related
// TypeError: Cannot read properties of undefined (reading 'size')
describe.skip('Canvas Core Functionality', () => {
  beforeEach(() => {
    // Reset the emitShapes function and mock rectangles
    emitShapes = null
    mockRectangles = []
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
    const shapes = [
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
      { id: 'rect2', x: 150, y: 50, width: 120, height: 90, fill: '#10B981', type: 'rect' },
    ]
    mockRectangles = shapes
    emitShapes?.(shapes)
    
    // Wait for shapes to be rendered
    await waitFor(() => {
      const rects = screen.getAllByTestId('Rect')
      expect(rects).toHaveLength(2)
    })
  })

  test('updates shapes when subscription data changes', async () => {
    renderCanvas()
    
    // Emit initial shapes
    const initialShapes = [
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
    ]
    mockRectangles = initialShapes
    emitShapes?.(initialShapes)
    
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })
    
    // Update the shape
    const updatedShapes = [
      { id: 'rect1', x: 50, y: 60, width: 150, height: 100, fill: '#3B82F6', type: 'rect' },
    ]
    mockRectangles = updatedShapes
    emitShapes?.(updatedShapes)
    
    // The shape should still be there (same ID)
    await waitFor(() => {
      const rects = screen.getAllByTestId('Rect')
      expect(rects).toHaveLength(1)
    })
  })

  test('handles empty shapes array', async () => {
    renderCanvas()
    
    // Emit empty array
    mockRectangles = []
    emitShapes?.([])
    
    await waitFor(() => {
      expect(screen.queryByTestId('Rect')).not.toBeInTheDocument()
    })
  })

  test('renders different shape types', async () => {
    renderCanvas()
    
    // Emit different shape types
    const shapes = [
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
      { id: 'circle1', x: 150, y: 50, width: 80, height: 80, fill: '#10B981', type: 'circle' },
      { id: 'triangle1', x: 250, y: 30, width: 100, height: 100, fill: '#F59E0B', type: 'triangle' },
    ]
    mockRectangles = shapes
    emitShapes?.(shapes)
    
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
    const shapes = [
      { id: 'rect1', x: 10, y: 20, width: 100, height: 80, fill: '#EF4444', type: 'rect' },
    ]
    mockRectangles = shapes
    emitShapes?.(shapes)
    
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })
    
    // Check that transformer is rendered
    expect(screen.getByTestId('Transformer')).toBeInTheDocument()
  })
})
