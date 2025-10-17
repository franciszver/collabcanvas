import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import ShapeSelector from '../../components/Header/ShapeSelector'
import { createShape, updateShape, deleteShape, deleteAllShapes } from '../../services/firestore'

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    // Use setTimeout to ensure the callback is called after component mount
    setTimeout(() => {
      cb({ 
        id: 'u1', 
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: null
      })
    }, 0)
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

// Import and spy on the realtime service to ensure it's properly mocked
import * as realtimeService from '../../services/realtime'

// Override the specific functions to ensure they return Promises
beforeEach(() => {
  jest.spyOn(realtimeService, 'setUserOnlineRtdb').mockResolvedValue(undefined)
  jest.spyOn(realtimeService, 'setUserOfflineRtdb').mockResolvedValue(undefined)
})

// Mock firestore service
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createShape: jest.fn(),
  updateShape: jest.fn(),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(),
  deleteAllShapes: jest.fn(),
  rectangleToShape: jest.fn((rect: any) => rect),
  db: jest.fn(() => ({})),
  rectanglesCollection: jest.fn(() => ({})),
  presenceCollection: jest.fn(() => ({})),
  usersCollection: jest.fn(() => ({})),
}))

// Get references to the mocked functions
const mockCreateShape = jest.mocked(createShape)
const mockUpdateShape = jest.mocked(updateShape)
const mockDeleteShape = jest.mocked(deleteShape)
const mockDeleteAllShapes = jest.mocked(deleteAllShapes)

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

// Mock the useCanvas hook to provide a working addRectangle function
jest.mock('../../contexts/CanvasContext', () => ({
  ...jest.requireActual('../../contexts/CanvasContext'),
  useCanvas: () => ({
    rectangles: [],
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
  }),
}))

function renderShapeSelector() {
  return render(
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          <ShapeSelector />
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

describe('Shape Management Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateShape.mockResolvedValue(undefined)
    mockUpdateShape.mockResolvedValue(undefined)
    mockDeleteShape.mockResolvedValue(undefined)
    mockDeleteAllShapes.mockResolvedValue(undefined)
  })

  test('renders shape selector button', () => {
    renderShapeSelector()
    
    expect(screen.getByRole('button', { name: /create shapes/i })).toBeInTheDocument()
  })

  test('opens dropdown when create shapes button is clicked', () => {
    renderShapeSelector()
    
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    expect(screen.getByText('Circle')).toBeInTheDocument()
    expect(screen.getByText('Triangle')).toBeInTheDocument()
    expect(screen.getByText('Star')).toBeInTheDocument()
  })

  test('creates rectangle when rectangle button is clicked', async () => {
    renderShapeSelector()
    
    // Wait for user to be authenticated and component to be ready
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create shapes/i })).toBeInTheDocument()
    })
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Click rectangle button
    const rectangleButton = screen.getByText('Rectangle')
    fireEvent.click(rectangleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Check that the correct shape data was passed
    const callArgs = mockCreateShape.mock.calls[0][0]
    expect(callArgs).toBeDefined()
    expect(callArgs.type).toBe('rect')
    expect(callArgs.width).toBe(200)
    expect(callArgs.height).toBe(100)
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('creates circle when circle button is clicked', async () => {
    renderShapeSelector()
    
    // Wait for user to be authenticated and component to be ready
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create shapes/i })).toBeInTheDocument()
    })
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Click circle button
    const circleButton = screen.getByText('Circle')
    fireEvent.click(circleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Check that the correct shape data was passed
    const callArgs = mockCreateShape.mock.calls[0][0]
    expect(callArgs).toBeDefined()
    expect(callArgs.type).toBe('circle')
    expect(callArgs.width).toBe(200)
    expect(callArgs.height).toBe(100) // Circle uses height from the shape creation logic
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Circle')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('creates triangle when triangle button is clicked', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Click triangle button
    const triangleButton = screen.getByText('Triangle')
    fireEvent.click(triangleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Check that the correct shape data was passed
    const callArgs = mockCreateShape.mock.calls[0][0]
    expect(callArgs.type).toBe('triangle')
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Triangle')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('creates star when star button is clicked', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Click star button
    const starButton = screen.getByText('Star')
    fireEvent.click(starButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Check that the correct shape data was passed
    const callArgs = mockCreateShape.mock.calls[0][0]
    expect(callArgs.type).toBe('star')
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Star')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('closes dropdown after creating shape', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    
    // Click rectangle button
    const rectangleButton = screen.getByText('Rectangle')
    fireEvent.click(rectangleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    })
  })

  test('handles shape creation errors gracefully', async () => {
    mockCreateShape.mockRejectedValue(new Error('Creation failed'))
    
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Click rectangle button
    const rectangleButton = screen.getByText('Rectangle')
    fireEvent.click(rectangleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Should not throw an error and dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    })
  })

  test('closes dropdown when clicking outside', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    
    // Click outside
    fireEvent.mouseDown(document.body)
    
    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    })
  })

  test('closes dropdown when pressing Escape key', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    
    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    })
  })

  test('generates unique IDs for shapes', async () => {
    renderShapeSelector()
    
    // Open dropdown
    const createButton = screen.getByRole('button', { name: /create shapes/i })
    fireEvent.click(createButton)
    
    // Create first rectangle
    const rectangleButton = screen.getByText('Rectangle')
    fireEvent.click(rectangleButton)
    
    // Wait for first shape creation to complete
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(1)
    })
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument()
    })
    
    // Open dropdown again and create second rectangle
    fireEvent.click(createButton)
    fireEvent.click(screen.getByText('Rectangle'))
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledTimes(2)
    })
    
    // Check that different IDs were generated
    const firstCall = mockCreateShape.mock.calls[0][0]
    const secondCall = mockCreateShape.mock.calls[1][0]
    
    expect(firstCall.id).not.toBe(secondCall.id)
  })
})
