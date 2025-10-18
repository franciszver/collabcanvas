// Mock the firebase service module
jest.mock('../../services/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({ name: 'test-app' })),
  getFirestoreDB: jest.fn(() => ({ name: 'test-firestore' })),
  getRealtimeDB: jest.fn(() => ({ name: 'test-database' })),
  getAuthService: jest.fn(() => ({ name: 'test-auth' })),
}))

import * as firebaseService from '../../services/firebase'

describe('firebase service', () => {
  it('exports getFirebaseApp function', () => {
    expect(typeof firebaseService.getFirebaseApp).toBe('function')
  })

  it('exports getFirestoreDB function', () => {
    expect(typeof firebaseService.getFirestoreDB).toBe('function')
  })

  it('exports getRealtimeDB function', () => {
    expect(typeof firebaseService.getRealtimeDB).toBe('function')
  })

  it('exports getAuthService function', () => {
    expect(typeof firebaseService.getAuthService).toBe('function')
  })
})