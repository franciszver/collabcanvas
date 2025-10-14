import { render, screen, waitFor } from '@testing-library/react'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'
import AuthProvider from '../../components/Auth/AuthProvider'

// Capture the onSnapshot callback so tests can emit snapshots
let emitSnapshot: ((snap: any) => void) | null = null

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_col: any, cb: (snap: any) => void) => {
    emitSnapshot = cb
    return jest.fn()
  }),
}))

function fakeDoc(id: string, data: any) {
  return {
    id,
    data: () => data,
  }
}

function updatedAt(ms: number) {
  return { toMillis: () => ms }
}

describe('rectangle sync', () => {
  it('renders rectangles from realtime snapshots', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    // Emit initial snapshot with two rectangles
    emitSnapshot?.({
      docs: [
        fakeDoc('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', updatedAt: updatedAt(10) }),
        fakeDoc('b', { x: 50, y: 60, width: 200, height: 100, fill: '#10B981', updatedAt: updatedAt(12) }),
      ],
    })

    const rects = await screen.findAllByTestId('Rect')
    expect(rects.length).toBe(2)
  })

  it('updates existing rectangle on new snapshot (no duplicates)', async () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )

    emitSnapshot?.({
      docs: [
        fakeDoc('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444', updatedAt: updatedAt(10) }),
      ],
    })

    await screen.findByTestId('Rect')

    // Emit update for same id with new position
    emitSnapshot?.({
      docs: [
        fakeDoc('a', { x: 100, y: 200, width: 200, height: 100, fill: '#EF4444', updatedAt: updatedAt(20) }),
      ],
    })

    await waitFor(async () => {
      const rects = await screen.findAllByTestId('Rect')
      expect(rects.length).toBe(1)
    })
  })
})


