import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import SignInButton from '../../components/Auth/SignInButton'

// Mock the AuthContext to provide a controlled state
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    isLoading: false,
    error: null,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  }),
}))

// Mock auth service
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    // Use setTimeout to ensure the callback is called after component mount
    setTimeout(() => {
      callback(null)
    }, 0)
    return jest.fn()
  }),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
}))

// Mock realtime service (not used in Auth tests but needed for global consistency)
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

describe('Authentication Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders sign in button when not authenticated', async () => {
    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    )

    // Wait for auth state to be processed
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    await waitFor(() => {
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
    })
  })

  test('handles sign in button click', async () => {
    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    )

    // Wait for auth state to be processed
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await waitFor(() => {
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
    })

    const signInButton = screen.getByText('Sign in with Google')
    fireEvent.click(signInButton)

    // The button should still be there after click
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  test('renders without crashing', () => {
    expect(() => {
      render(
        <AuthProvider>
          <SignInButton />
        </AuthProvider>
      )
    }).not.toThrow()
  })
})