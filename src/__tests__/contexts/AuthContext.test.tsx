import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import * as authService from '../../services/auth'

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

test('AuthContext handles sign-in and sign-out errors', async () => {
  // Spy on the mocked functions to make them throw errors
  const signInSpy = jest.spyOn(authService, 'signInWithGoogle').mockRejectedValue(new Error('signin failed'))
  const signOutSpy = jest.spyOn(authService, 'signOut').mockRejectedValue(new Error('signout failed'))
  
  const { result } = renderHook(() => useAuth(), { wrapper })
  
  await act(async () => {
    await result.current.signInWithGoogle()
  })
  expect(result.current.error).toBe('signin failed')
  
  await act(async () => {
    await result.current.signOut()
  })
  expect(result.current.error).toBe('signout failed')
  
  // Clean up spies
  signInSpy.mockRestore()
  signOutSpy.mockRestore()
})


