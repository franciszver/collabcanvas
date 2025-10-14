import { setUserOnline, setUserOffline, updateCursorPosition, subscribeToCursors } from '../../services/presence'

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_col: any, cb: (snap: any) => void) => {
    // Provide immediate empty snapshot
    cb({ docs: [] })
    return jest.fn()
  }),
}))

describe('presence service', () => {
  it('setUserOnline and updateCursorPosition resolve', async () => {
    await expect(setUserOnline('u1', 'Alice')).resolves.toBeUndefined()
    await expect(updateCursorPosition('u1', { x: 10, y: 20 })).resolves.toBeUndefined()
  })

  it('setUserOffline resolves', async () => {
    await expect(setUserOffline('u1')).resolves.toBeUndefined()
  })

  it('subscribeToCursors invokes callback', () => {
    const cb = jest.fn()
    const unsub = subscribeToCursors(cb)
    expect(cb).toHaveBeenCalled()
    unsub()
  })
})


