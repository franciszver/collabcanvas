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
  onSnapshot: jest.fn(() => jest.fn()),
}))
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  onValue: jest.fn(() => jest.fn()),
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

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


