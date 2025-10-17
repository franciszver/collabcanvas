import { renderHook, act } from '@testing-library/react'
import { PresenceProvider, usePresence } from '../../contexts/PresenceContext'
import { AuthProvider } from '../../contexts/AuthContext'

jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => { cb({ id: 'u1', displayName: 'Test' }); return jest.fn() },
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


