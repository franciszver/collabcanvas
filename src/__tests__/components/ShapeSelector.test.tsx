import { render, screen, fireEvent } from '@testing-library/react'
import AuthProvider from '../../components/Auth/AuthProvider'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import ShapeSelector from '../../components/Header/ShapeSelector'
import Canvas from '../../components/Canvas/Canvas'

// Mock auth immediate user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => { cb({ id: 'u1', displayName: 'User' }); return jest.fn() },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
}))

// Mock firestore subscription to start with no rectangles
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(async () => {}),
  updateDoc: jest.fn(async () => {}),
  deleteDoc: jest.fn(async () => {}),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_src: any, cb: (snap: any) => void) => { cb({ docs: [] }); return jest.fn() }),
}))

function renderAll() {
  return render(
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          <div>
            <ShapeSelector />
            <Canvas />
          </div>
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

test('ShapeSelector creates shapes and Canvas renders them', async () => {
  renderAll()
  const rectBtn = screen.getByRole('button', { name: /rectangle/i })
  const circleBtn = screen.getByRole('button', { name: /circle/i })
  const triangleBtn = screen.getByRole('button', { name: /triangle/i })
  const starBtn = screen.getByRole('button', { name: /star/i })

  fireEvent.click(rectBtn)
  await Promise.resolve()
  fireEvent.click(circleBtn)
  await Promise.resolve()
  fireEvent.click(triangleBtn)
  await Promise.resolve()
  fireEvent.click(starBtn)
  await Promise.resolve()

  const count =
    (screen.queryAllByTestId('Rect').length || 0) +
    (screen.queryAllByTestId('Circle').length || 0) +
    (screen.queryAllByTestId('RegularPolygon').length || 0) +
    (screen.queryAllByTestId('Star').length || 0)
  expect(count).toBeGreaterThanOrEqual(1)
})


