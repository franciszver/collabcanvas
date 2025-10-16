import { renderHook, act } from '@testing-library/react'
import { CanvasProvider, useCanvas } from '../../contexts/CanvasContext'
import { AuthProvider } from '../../contexts/AuthContext'

jest.mock('../../services/firestore', () => ({
  createRectangle: jest.fn(async () => { throw new Error('fail') }),
  updateRectangleDoc: jest.fn(async () => { throw new Error('fail') }),
  deleteRectangleDoc: jest.fn(async () => { throw new Error('fail') }),
  deleteAllRectangles: jest.fn(async () => { throw new Error('fail') }),
  subscribeToRectangles: jest.fn((cb: any) => {
    cb([{ rect: { id: 'seed', x: 0, y: 0, width: 10, height: 10, fill: '#000' }, updatedAtMs: 0 }])
    return jest.fn()
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CanvasProvider>{children}</CanvasProvider>
    </AuthProvider>
  )
}

test('rollback behaviors on failures', async () => {
  const { result } = renderHook(() => useCanvas(), { wrapper })

  // addRectangle rolls back on failure
  await act(async () => {
    await result.current.addRectangle({ id: 'r1', x: 0, y: 0, width: 10, height: 10, fill: '#000' })
  })
  expect(result.current.rectangles.find((r) => r.id === 'r1')).toBeUndefined()

  // deleteRectangle rollback
  await act(async () => {
    await result.current.deleteRectangle('seed')
  })
  expect(result.current.rectangles.find((r) => r.id === 'seed')).toBeDefined()

  // clearAllRectangles rollback
  await act(async () => {
    await result.current.clearAllRectangles()
  })
  expect(result.current.rectangles.length).toBeGreaterThan(0)
})


