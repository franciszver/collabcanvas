import { renderHook, act } from '@testing-library/react'
import { PresenceProvider, usePresence } from '../../contexts/PresenceContext'
import { AuthProvider } from '../../contexts/AuthContext'

jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => { cb({ id: 'u1', displayName: 'Test' }); return jest.fn() },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
}))

jest.mock('../../services/presence', () => ({
  setUserOnline: jest.fn(async () => {}),
  setUserOffline: jest.fn(async () => {}),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PresenceProvider>{children}</PresenceProvider>
    </AuthProvider>
  )
}

test('isOnline toggles with window events', () => {
  const { result } = renderHook(() => usePresence(), { wrapper })
  // default to true in JSDOM
  expect(result.current.isOnline).toBe(true)
  Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('offline'))
  })
  expect(result.current.isOnline).toBe(false)
  Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('online'))
  })
  expect(result.current.isOnline).toBe(true)
})


