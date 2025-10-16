import { render, screen, waitFor } from '@testing-library/react'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
import Canvas from '../../components/Canvas/Canvas'
import AuthProvider from '../../components/Auth/AuthProvider'

// Capture the subscribeToShapes callback so tests can emit snapshots
let emitShapes: ((shapes: any[]) => void) | null = null

jest.mock('../../services/firestore', () => ({
  subscribeToShapes: jest.fn((_docId: string, callback: (shapes: any[]) => void) => {
    emitShapes = callback
    return jest.fn()
  }),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
}))

function fakeShape(id: string, data: any) {
  return {
    id,
    type: 'rect',
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fill: data.fill,
    rotation: 0,
    z: 0,
    createdBy: 'test-user',
    updatedBy: 'test-user',
    documentId: 'test-doc',
    ...data,
  }
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

    // Emit initial shapes with two rectangles
    emitShapes?.([
      fakeShape('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444' }),
      fakeShape('b', { x: 50, y: 60, width: 200, height: 100, fill: '#10B981' }),
    ])

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

    emitShapes?.([
      fakeShape('a', { x: 10, y: 20, width: 200, height: 100, fill: '#EF4444' }),
    ])

    await screen.findByTestId('Rect')

    // Emit update for same id with new position
    emitShapes?.([
      fakeShape('a', { x: 100, y: 200, width: 200, height: 100, fill: '#EF4444' }),
    ])

    await waitFor(async () => {
      const rects = await screen.findAllByTestId('Rect')
      expect(rects.length).toBe(1)
    })
  })
})


