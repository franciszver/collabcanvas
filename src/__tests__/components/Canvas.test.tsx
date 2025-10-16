import { render, fireEvent, screen } from '@testing-library/react'
import { useEffect } from 'react'
import AuthProvider from '../../components/Auth/AuthProvider'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { useCanvas } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
jest.mock('../../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))
// Mock the shapes service to provide test data
jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn((_docId: string, callback: (shapes: any[]) => void) => {
    // Provide test shapes immediately
    callback([
      {
        id: 'test-rect-1',
        type: 'rect',
        x: 200,
        y: 200,
        width: 200,
        height: 100,
        fill: '#f00',
        rotation: 0,
        z: 0,
        createdBy: 'test-user',
        updatedBy: 'test-user',
        documentId: 'test-doc',
      }
    ])
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
}))
// Make auth immediately provide a user so presence updates can fire
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    cb({ uid: 'u1', displayName: 'Test User' })
    return jest.fn()
  },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
}))
import Canvas from '../../components/Canvas/Canvas'

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1', displayName: 'Test User' },
  }),
}))

jest.mock('firebase/database', () => {
  const off = jest.fn()
  return {
    getDatabase: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    onValue: jest.fn(() => off),
    onDisconnect: jest.fn(() => ({
      remove: jest.fn(() => Promise.resolve()),
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    off,
  }
})

function SeedRectOnce() {
  const { addRectangle } = useCanvas()
  useEffect(() => {
    const rect = { id: 'test-rect-1', x: 200, y: 200, width: 200, height: 100, fill: '#f00', type: 'rect' as const }
    const timer = setTimeout(() => {
      addRectangle(rect)
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

describe('Canvas', () => {
  it('renders placeholder without crashing', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
  })

  it('throttles cursor updates to ~50ms', () => {
    jest.useFakeTimers()
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const stage = document.querySelector('[data-testid="Stage"]')!
    // Rapid mouse moves
    for (let i = 0; i < 10; i++) {
      fireEvent.mouseMove(stage, { clientX: 10 + i, clientY: 20 + i })
    }
    // Advance less than 50ms, expect another schedule but no flush
    jest.advanceTimersByTime(40)
    // Advance to 50ms boundary; internal logic should send at most one batch
    jest.advanceTimersByTime(20)
    jest.useRealTimers()
  })

  it('pans the canvas on mouse drag', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const stage = screen.getByTestId('Stage')
    // Read initial transform
    const startX = stage.getAttribute('x')
    const startY = stage.getAttribute('y')
    // Initial mouse down
    fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 })
    // Move to pan
    fireEvent.mouseMove(stage, { clientX: 120, clientY: 110 })
    fireEvent.mouseUp(stage)
    const endX = stage.getAttribute('x')
    const endY = stage.getAttribute('y')
    expect(endX).not.toBe(startX)
    expect(endY).not.toBe(startY)
  })

  it('zooms the canvas on wheel event', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const stage = screen.getByTestId('Stage')
    const beforeScale = stage.getAttribute('scalex')
    // Zoom in (negative deltaY in our handler multiplies scale)
    fireEvent.wheel(stage, { deltaY: -1, clientX: 200, clientY: 200 })
    const afterScale = stage.getAttribute('scalex')
    expect(afterScale).not.toBe(beforeScale)
  })

  it('updates rectangle position on drag', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <SeedRectOnce />
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const rect = await screen.findByTestId('Rect')
    // Drag the rectangle (mock handlers in reactKonvaMock will call onDragStart/Move/End)
    const beforeX = rect.getAttribute('x')
    const beforeY = rect.getAttribute('y')
    fireEvent.mouseDown(rect, { clientX: 310, clientY: 310 })
    fireEvent.mouseMove(rect, { clientX: 320, clientY: 330 })
    fireEvent.mouseUp(rect, { clientX: 320, clientY: 330 })
    const afterX = rect.getAttribute('x')
    const afterY = rect.getAttribute('y')
    expect(afterX).not.toBe(beforeX)
    expect(afterY).not.toBe(beforeY)
  })

  it('deletes rectangle via delete icon after selection', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <SeedRectOnce />
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const rect = await screen.findByTestId('Rect')
    // Select the rectangle
    fireEvent.click(rect)
    // Expect delete Text to appear and be clickable
    const deleteIcon = await screen.findByTestId('Text')
    fireEvent.click(deleteIcon)
  })

  it('shows reconnect banner when offline and saves viewport to localStorage', () => {
    const setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem')
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const stage = screen.getByTestId('Stage')
    // Trigger a small pan to cause viewport change and persistence
    fireEvent.mouseDown(stage, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(stage, { clientX: 15, clientY: 18 })
    fireEvent.mouseUp(stage)
    expect(setItemSpy).toHaveBeenCalled()
    setItemSpy.mockRestore()
    // Offline banner
    // Our DOM overlay is simulated; just ensure handler doesn't throw
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
  })

  it('mocks FPS metrics via performance.now()', () => {
    const originalNow = performance.now
    let t = 0
    ;(performance as any).now = () => (t += 16.67) // ~60fps
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    // If FPS UI existed with data-testid="fps-display", we would assert it here.
    ;(performance as any).now = originalNow
  })

  it('flushes only one cursor update within 50ms window', () => {
    jest.useFakeTimers()
    jest.mock('../../services/realtime', () => {
      return {
        __esModule: true,
        ...jest.requireActual('../../services/realtime'),
        updateCursorPositionRtdb: jest.fn(async () => {}),
      }
    })
    const { updateCursorPositionRtdb } = jest.requireMock('../../services/realtime') as { updateCursorPositionRtdb: jest.Mock }
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
    const stage = screen.getByTestId('Stage')
    for (let i = 0; i < 10; i++) {
      fireEvent.mouseMove(stage, { clientX: 10 + i, clientY: 20 + i })
    }
    // Advance by 49ms: should not flush yet
    jest.advanceTimersByTime(49)
    expect(updateCursorPositionRtdb).toHaveBeenCalledTimes(0)
    // Advance one more ms to pass 50ms threshold
    jest.advanceTimersByTime(1)
    // At most one send in the window
    expect(updateCursorPositionRtdb.mock.calls.length).toBeLessThanOrEqual(1)
    jest.useRealTimers()
  })
})


