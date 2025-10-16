import '@testing-library/jest-dom'
import { mockFirestore, mockRealtimeDB, mockAuth } from '../test-utils/firebaseMock'

// JSDOM lacks certain APIs; mock if needed here.

// Mock Firebase SDK to prevent network usage during tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  ...mockAuth,
}))

jest.mock('firebase/firestore', () => ({
<<<<<<< HEAD
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((_ref, callback) => {
    // Mock snapshot with exists() method
    const mockSnapshot = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({})),
      docs: []
    }
    callback(mockSnapshot)
    return jest.fn()
  }),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
=======
  getFirestore: jest.fn(() => mockFirestore),
  ...mockFirestore,
>>>>>>> Dev
}))

jest.mock('firebase/database', () => ({
<<<<<<< HEAD
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  onValue: jest.fn((_ref, callback) => {
    callback({ val: () => null })
    return jest.fn()
  }),
  off: jest.fn(),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn(() => Promise.resolve()),
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
=======
  getDatabase: jest.fn(() => mockRealtimeDB),
  ...mockRealtimeDB,
>>>>>>> Dev
}))

// Ensure local firebase initializer is not imported during tests
jest.mock('../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => mockFirestore),
  getRealtimeDB: jest.fn(() => mockRealtimeDB),
}))

<<<<<<< HEAD
// Mock services
jest.mock('../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createRectangle: jest.fn(() => Promise.resolve()),
  updateRectangleDoc: jest.fn(() => Promise.resolve()),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteRectangleDoc: jest.fn(() => Promise.resolve()),
  deleteAllShapes: jest.fn(() => Promise.resolve()),
  db: jest.fn(() => ({})),
  rectanglesCollection: jest.fn(() => ({})),
  presenceCollection: jest.fn(() => ({})),
  usersCollection: jest.fn(() => ({})),
}))

jest.mock('../services/realtime', () => ({
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  publishDragPositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToDragRtdb: jest.fn(() => jest.fn()),
  clearDragPositionRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdbThrottled: jest.fn(() => Promise.resolve()),
  publishResizePositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToResizeRtdb: jest.fn(() => jest.fn()),
  clearResizePositionRtdb: jest.fn(() => Promise.resolve()),
  removeUserPresenceRtdb: jest.fn(() => Promise.resolve()),
}))
=======
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
>>>>>>> Dev

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


