import { subscribeToRectangles } from '../../services/firestore'

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn((...args: any[]) => {
    const cb = args[args.length - 1]
    cb({ docs: [] })
    return jest.fn()
  }),
  // No query/orderBy/limit to force fallback path
}))

test('subscribeToRectangles uses fallback collection listener', () => {
  const cb = jest.fn()
  const unsub = subscribeToRectangles(cb)
  expect(cb).toHaveBeenCalled()
  unsub()
})


