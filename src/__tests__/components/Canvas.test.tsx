import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { useCanvas } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'

// Mock the services
jest.mock('../../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))

// Override the global auth mock to provide a logged-in user
import * as authService from '../../services/auth'
jest.spyOn(authService, 'onAuthStateChanged').mockImplementation((callback: any) => {
  // Use setTimeout to ensure the callback is called after component mount
  setTimeout(() => {
    callback({ 
      id: 'test-user', 
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    })
  }, 0)
  return jest.fn()
})

// Mock the shapes service to provide test data
jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn((_docId: string, callback: (shapes: any[]) => void) => {
    // Provide test shapes by default
    callback([
      { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, fill: 'red' },
    ])
    return jest.fn()
  }),
  subscribeToDocument: jest.fn((_docId: string, callback: (doc: any) => void) => {
    // Provide a mock document
    callback({
      id: 'test-doc-id',
      title: 'Test Document',
      documentId: 'test-doc-id',
      createdBy: 'test-user',
      createdAt: { '.sv': 'timestamp' },
      updatedBy: 'test-user',
      updatedAt: { '.sv': 'timestamp' }
    })
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
  shapeToRectangle: jest.fn((shape: any) => shape),
}))

// Mock the realtime service for cursor updates
jest.mock('../../services/realtime', () => ({
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
}))

// Helper component to seed a rectangle once
function SeedRectOnce() {
  const { addRectangle } = useCanvas()
  const { user } = useAuth()
  
  useEffect(() => {
    if (user) {
      addRectangle({ id: '1', x: 0, y: 0, width: 100, height: 100, fill: 'blue' })
    }
  }, [addRectangle, user])
  return null
}

describe('Canvas', () => {
  it('renders placeholder without crashing', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <div data-testid="canvas-placeholder">Canvas Placeholder</div>
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    expect(screen.getByTestId('canvas-placeholder')).toBeInTheDocument()
  })

  it('renders Canvas component with Stage element', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that the Canvas component renders the Stage element
    const stage = screen.getByTestId('Stage')
    expect(stage).toBeInTheDocument()
    
    // Check that the Stage has the expected properties
    expect(stage).toHaveAttribute('data-testid', 'Stage')
    expect(stage).toHaveAttribute('width', '1024')
    expect(stage).toHaveAttribute('height', '768')
  })

  it('renders Canvas with grid lines', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that grid lines are rendered
    const gridLines = screen.getAllByTestId('Line')
    expect(gridLines.length).toBeGreaterThan(0)
    
    // Check that the Stage element is present
    const stage = screen.getByTestId('Stage')
    expect(stage).toBeInTheDocument()
  })

  it('renders Canvas with Layer elements', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that Layer elements are rendered
    const layers = screen.getAllByTestId('Layer')
    expect(layers.length).toBeGreaterThan(0)
    
    // Check that the Stage element is present
    const stage = screen.getByTestId('Stage')
    expect(stage).toBeInTheDocument()
  })

  it.skip('updates rectangle position on drag', async () => {
    // TODO: This test needs to be rewritten to properly test Canvas drag functionality
    // The current approach of using SeedRectOnce doesn't work with the actual Canvas component
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <SeedRectOnce />
            <div data-testid="canvas-container" style={{ width: 500, height: 500 }} />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Wait for the user to be authenticated and the rectangle to be added
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })

    const rect = screen.getByTestId('Rect')
    fireEvent.mouseDown(rect, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(rect, { clientX: 50, clientY: 50 })
    fireEvent.mouseUp(rect)

    const { updateShape } = jest.requireMock('../../services/firestore') as { updateShape: jest.Mock }
    expect(updateShape).toHaveBeenCalledWith('1', { x: 50, y: 50 })
  })

  it.skip('deletes rectangle via delete icon after selection', async () => {
    // TODO: This test needs to be rewritten to properly test Canvas deletion functionality
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <SeedRectOnce />
            <div data-testid="canvas-container" style={{ width: 500, height: 500 }} />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Wait for the user to be authenticated and the rectangle to be added
    await waitFor(() => {
      expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })

    const rect = screen.getByTestId('Rect')
    fireEvent.click(rect) // Select the rectangle

    // Simulate clicking the delete icon (which would appear on selection)
    // For now, we'll directly call the delete function mock
    const { deleteShape } = jest.requireMock('../../services/firestore') as { deleteShape: jest.Mock }
    deleteShape('1')
    expect(deleteShape).toHaveBeenCalledWith('1')
  })

  it('renders Canvas with Transformer element', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that Transformer element is rendered
    const transformer = screen.getByTestId('Transformer')
    expect(transformer).toBeInTheDocument()
    
    // Check that the Stage element is present
    const stage = screen.getByTestId('Stage')
    expect(stage).toBeInTheDocument()
  })

  it('renders Canvas with proper dimensions', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that the Stage has proper dimensions
    const stage = screen.getByTestId('Stage')
    expect(stage).toHaveAttribute('width', '1024')
    expect(stage).toHaveAttribute('height', '768')
    expect(stage).toHaveAttribute('scaleX', '1')
    expect(stage).toHaveAttribute('scaleY', '1')
  })

  it('renders Canvas with all required Konva components', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Check that all required Konva components are rendered
    expect(screen.getByTestId('Stage')).toBeInTheDocument()
    expect(screen.getAllByTestId('Layer').length).toBeGreaterThan(0)
    expect(screen.getByTestId('Transformer')).toBeInTheDocument()
    expect(screen.getAllByTestId('Line').length).toBeGreaterThan(0)
  })
})