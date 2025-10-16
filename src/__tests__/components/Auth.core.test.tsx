import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import SignInButton from '../../components/Auth/SignInButton'

// Mock auth service
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    // Simulate no user initially (not authenticated)
    callback(null)
    return jest.fn()
  }),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}))

describe('Authentication Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders sign in button when not authenticated', () => {
    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    )

    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  test('handles sign in button click', async () => {
    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    )

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