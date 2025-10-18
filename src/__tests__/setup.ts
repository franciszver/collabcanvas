import '@testing-library/jest-dom'
import { act } from '@testing-library/react'

// JSDOM lacks certain APIs; mock if needed here.

// Mock Firebase SDK to prevent network usage during tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(() => Promise.resolve({ user: { uid: 'test-user-id', displayName: 'Test User', email: 'test@example.com' } })),
  getRedirectResult: jest.fn(() => Promise.resolve(null)),
  signOut: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(function MockProvider() {}),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true, size: 0, forEach: jest.fn() })),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_query: any, callback: any) => {
    setTimeout(() => {
      const snapshot = {
        exists: () => true,
        data: () => ({ title: 'Test Document', documentId: 'test-doc-id', createdBy: 'test-user', createdAt: { '.sv': 'timestamp' }, updatedBy: 'test-user', updatedAt: { '.sv': 'timestamp' } }),
        id: 'mock-doc-id',
        ref: {},
        metadata: { fromCache: false, hasPendingWrites: false }
      }
      callback(snapshot)
    }, 0)
    return jest.fn()
  }),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  startAfter: jest.fn(() => ({})),
  endBefore: jest.fn(() => ({})),
}))

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  onValue: jest.fn((_ref: any, callback: any) => {
    setTimeout(() => {
      const snapshot = { val: () => ({ 'test-user': { displayName: 'Test User', cursor: { x: 100, y: 100 }, updatedAt: Date.now() } }) }
      callback(snapshot)
    }, 0)
    return jest.fn()
  }),
  off: jest.fn(() => jest.fn()),
  onDisconnect: jest.fn(() => ({ remove: jest.fn(() => Promise.resolve()) })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
}))

// Ensure local firebase initializer is not imported during tests
jest.mock('../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))

// Mock auth service
jest.mock('../services/auth', () => ({
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
  signInWithGoogle: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com'
  })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback: any) => {
    // Use setTimeout to ensure the callback is called after component mount
    setTimeout(() => {
      act(() => {
        callback({
          id: 'test-user-id',
          displayName: 'Test User',
          email: 'test@example.com'
        })
      })
    }, 0)
    return jest.fn()
  }),
}))

// Mock realtime service
jest.mock('../services/realtime', () => ({
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
  markInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
  cleanupInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
}))

// Mock firestore service
jest.mock('../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createShape: jest.fn(() => Promise.resolve()),
  updateShape: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  rectangleToShape: jest.fn((rect: any) => rect),
  shapeToRectangle: jest.fn((shape: any) => shape),
  updateDocument: jest.fn(() => Promise.resolve()),
}))

// Global test utilities
declare global {
  var createMockSnapshot: (data?: any, exists?: boolean) => any
  var createMockQuerySnapshot: (docs?: any[]) => any
}

globalThis.createMockSnapshot = (data = null, exists = true) => ({
  exists: () => exists,
  data: () => data,
  id: 'mock-doc-id',
  ref: {},
  metadata: { fromCache: false, hasPendingWrites: false },
})

globalThis.createMockQuerySnapshot = (docs = []) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback: (doc: any) => void) => docs.forEach(callback),
})

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


