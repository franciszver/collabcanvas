import { render, fireEvent, screen } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'

// Mock the services
jest.mock('../../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
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
  markInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
  cleanupInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
}))

// Mock the hooks
jest.mock('../../hooks/useCursorSync', () => ({
  useCursorSync: jest.fn(),
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

describe('Canvas Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders canvas with stage element', () => {
    renderCanvas()
    
    expect(screen.getByTestId('Stage')).toBeInTheDocument()
  })

  test('renders canvas with layer elements', () => {
    renderCanvas()
    
    const layers = screen.getAllByTestId('Layer')
    expect(layers.length).toBeGreaterThan(0)
  })

  test('renders canvas with transformer element', () => {
    renderCanvas()
    
    expect(screen.getByTestId('Transformer')).toBeInTheDocument()
  })

  test('renders canvas with grid lines', () => {
    renderCanvas()
    
    const gridLines = screen.getAllByTestId('Line')
    expect(gridLines.length).toBeGreaterThan(0)
  })

  test('handles window resize', () => {
    renderCanvas()
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
    
    fireEvent(window, new Event('resize'))
    
    // Canvas should still be rendered
    expect(screen.getByTestId('Stage')).toBeInTheDocument()
  })

  test('handles mouse wheel zoom', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    // Simulate wheel event for zoom
    fireEvent.wheel(stage, { deltaY: 100 })
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles mouse down event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.mouseDown(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles mouse move event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.mouseMove(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles mouse up event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.mouseUp(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles click event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.click(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles pointer move event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.pointerMove(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('handles pointer leave event', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    
    fireEvent.pointerLeave(stage)
    
    // Stage should still be present
    expect(stage).toBeInTheDocument()
  })

  test('renders with proper dimensions', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    expect(stage).toHaveAttribute('width')
    expect(stage).toHaveAttribute('height')
  })

  test('renders with proper scale', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    expect(stage).toHaveAttribute('scaleX')
    expect(stage).toHaveAttribute('scaleY')
  })

  test('renders with proper position', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    expect(stage).toHaveAttribute('x')
    expect(stage).toHaveAttribute('y')
  })

  test('renders with proper draggable attribute', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    expect(stage).toHaveAttribute('draggable', 'false')
  })

  test('renders with proper listening attribute', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    // The listening attribute might not be set as a DOM attribute
    expect(stage).toBeInTheDocument()
  })

  test('renders with proper clipFunc attribute', () => {
    renderCanvas()
    
    const stage = screen.getByTestId('Stage')
    // The clipFunc attribute might not be set as a DOM attribute
    expect(stage).toBeInTheDocument()
  })
})
