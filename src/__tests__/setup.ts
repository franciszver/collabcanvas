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
  getFirestore: jest.fn(() => mockFirestore),
  ...mockFirestore,
}))

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => mockRealtimeDB),
  ...mockRealtimeDB,
}))

// Ensure local firebase initializer is not imported during tests
jest.mock('../services/firebase', () => ({ 
  getFirebaseApp: jest.fn(() => ({})),
  getFirestoreDB: jest.fn(() => mockFirestore),
  getRealtimeDB: jest.fn(() => mockRealtimeDB),
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


