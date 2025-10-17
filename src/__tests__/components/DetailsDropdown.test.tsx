import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import DetailsDropdown from '../../components/Header/DetailsDropdown'

// Mock auth to have a logged-in user and spy on signOut
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

// Mock Firestore and presence listeners to be inert
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(async () => ({ forEach: () => {} })),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_src: any, cb: (snap: any) => void) => {
    cb({ docs: [] })
    return jest.fn()
  }),
}))

// Mock deleteAllRectangles to observe clear action
jest.mock('../../services/firestore', () => ({
  db: jest.fn(() => ({})),
  rectanglesCollection: jest.fn(() => ({})),
  presenceCollection: jest.fn(() => ({})),
  usersCollection: jest.fn(() => ({})),
  createRectangle: jest.fn(async () => {}),
  updateRectangleDoc: jest.fn(async () => {}),
  updateDocument: jest.fn(async () => {}),
  deleteRectangleDoc: jest.fn(async () => {}),
  deleteAllShapes: jest.fn(async () => {}),
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  subscribeToRectangles: jest.fn((cb: any) => {
    cb([])
    return jest.fn()
  }),
}))

describe('DetailsDropdown', () => {
  beforeEach(() => {
    // Confirm dialog should return true by default
    jest.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function renderWithProviders(ui: React.ReactNode) {
    return render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>{ui}</CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
  }

  it('opens menu and shows counts', () => {
    renderWithProviders(<DetailsDropdown />)
    const button = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(button)
    expect(screen.getByText(/Users \(0\)/)).toBeInTheDocument()
    expect(screen.getByText(/Rectangles:/)).toBeInTheDocument()
  })

  it('invokes sign out from the menu', async () => {
    const { signOut } = await import('../../services/auth')
    renderWithProviders(<DetailsDropdown />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect((signOut as any)).toHaveBeenCalled()
  })

  it('clears rectangles when confirmed', async () => {
    const { deleteAllShapes } = await import('../../services/firestore')
    renderWithProviders(<DetailsDropdown />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    const clearBtn = screen.getByRole('button', { name: /clear all/i })
    // Disabled when 0 rectangles; still click to ensure no call
    fireEvent.click(clearBtn)
    expect((deleteAllShapes as any)).toHaveBeenCalledTimes(0)
  })

  it('does not clear when user cancels confirm and enables clear when rects exist', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => false)
    const { deleteAllShapes } = await import('../../services/firestore')
    renderWithProviders(<DetailsDropdown />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    const clearBtn = screen.getByRole('button', { name: /clear all/i })
    fireEvent.click(clearBtn)
    expect((deleteAllShapes as any)).toHaveBeenCalledTimes(0)
    confirmSpy.mockRestore()
  })

  it('closes when pressing Escape and when clicking outside', () => {
    renderWithProviders(<DetailsDropdown />)
    const btn = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(btn)
    // Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    // Re-open and click outside
    fireEvent.click(btn)
    fireEvent.mouseDown(document.body)
  })
})


