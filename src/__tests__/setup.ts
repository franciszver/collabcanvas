import '@testing-library/jest-dom'

// JSDOM lacks certain APIs; mock if needed here.

// Mock Firebase SDK to prevent network usage during tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}))
jest.mock('firebase/auth', () => ({}))
jest.mock('firebase/firestore', () => ({}))

// Firebase SDK will be mocked in specific tests; keep global setup minimal.


