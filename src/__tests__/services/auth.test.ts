// Mock firebase/auth with controllable fakes for each test
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => ({})),
    GoogleAuthProvider: jest.fn(function MockProvider() {}),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  }
})

import { signInWithGoogle, signOut, onAuthStateChanged } from '../../services/auth'

const authModule = jest.requireMock('firebase/auth') as unknown as {
  signInWithPopup: jest.Mock
  signOut: jest.Mock
  onAuthStateChanged: jest.Mock
}

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signInWithGoogle returns mapped user profile', async () => {
    authModule.signInWithPopup.mockResolvedValue({
      user: {
        uid: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/avatar.png',
      },
    })

    const profile = await signInWithGoogle()
    expect(profile).toEqual({
      id: 'user-123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.png',
    })
    expect(authModule.signInWithPopup).toHaveBeenCalled()
  })

  it('signOut calls firebase signOut', async () => {
    authModule.signOut.mockResolvedValue(undefined)
    await expect(signOut()).resolves.toBeUndefined()
    expect(authModule.signOut).toHaveBeenCalled()
  })

  it('onAuthStateChanged maps user and returns unsubscribe', () => {
    const fakeUser = {
      uid: 'abc',
      displayName: 'Alice',
      email: 'a@example.com',
      photoURL: 'url',
    }
    const unsubscribe = jest.fn()
    authModule.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      cb(fakeUser as unknown)
      return unsubscribe
    })

    const callback = jest.fn()
    const returned = onAuthStateChanged(callback)

    expect(callback).toHaveBeenCalledWith({
      id: 'abc',
      displayName: 'Alice',
      email: 'a@example.com',
      photoURL: 'url',
    })
    expect(typeof returned).toBe('function')
    // ensure returned unsubscribe is callable
    returned()
    expect(unsubscribe).toHaveBeenCalled()
  })
})


