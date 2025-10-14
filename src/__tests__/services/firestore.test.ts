jest.mock('firebase/firestore', () => {
  const setDoc = jest.fn()
  const updateDoc = jest.fn()
  const deleteDoc = jest.fn()
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp: jest.fn(() => new Date()),
  }
})

jest.mock('../../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))

import { createRectangle, updateRectangleDoc, deleteRectangleDoc } from '../../services/firestore'
import { setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

describe('firestore service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('createRectangle calls setDoc with rectangle data', async () => {
    await createRectangle({ id: 'r1', x: 1, y: 2, width: 10, height: 20, fill: '#000' })
    expect(setDoc).toHaveBeenCalled()
  })

  it('updateRectangleDoc calls updateDoc with partial data', async () => {
    await updateRectangleDoc('r1', { x: 5 })
    expect(updateDoc).toHaveBeenCalled()
  })

  it('deleteRectangleDoc calls deleteDoc', async () => {
    await deleteRectangleDoc('r1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})


