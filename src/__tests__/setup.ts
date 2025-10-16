import '@testing-library/jest-dom'

// JSDOM lacks certain APIs; mock if needed here.

// Mock Firebase SDK to prevent network usage during tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}))
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth, cb) => {
    // default: logged out state
    cb(null)
    return jest.fn()
  }),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(function MockProvider() {}),
}))
jest.mock('firebase/firestore', () => ({
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
}))
jest.mock('firebase/database', () => ({
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
}))
// Ensure local firebase initializer is not imported during tests
jest.mock('../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => ({})),
  getRealtimeDB: jest.fn(() => ({})),
}))

// Mock services
jest.mock('../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createRectangle: jest.fn(() => Promise.resolve()),
  updateRectangleDoc: jest.fn(() => Promise.resolve()),
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

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


