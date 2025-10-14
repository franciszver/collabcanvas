import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => { cb({ id: 'u1', displayName: 'User' }); return jest.fn() },
  signInWithGoogle: jest.fn(async () => { throw new Error('signin failed') }),
  signOut: jest.fn(async () => { throw new Error('signout failed') }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

test('AuthContext handles sign-in and sign-out errors', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {
    await result.current.signInWithGoogle().catch(() => {})
  })
  expect(result.current.error).toBe('signin failed')
  await act(async () => {
    await result.current.signOut().catch(() => {})
  })
  expect(result.current.error).toBe('signout failed')
})


