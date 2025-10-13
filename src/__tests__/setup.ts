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
jest.mock('firebase/firestore', () => ({}))
// Ensure local firebase initializer is not imported during tests
jest.mock('../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


