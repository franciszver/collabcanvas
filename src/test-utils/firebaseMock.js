// Comprehensive Firebase mock for testing
export const mockFirestore = {
  collection: jest.fn(() => mockFirestore),
  doc: jest.fn(() => mockFirestore),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(() => Promise.resolve({ 
    docs: [], 
    empty: true, 
    size: 0,
    forEach: jest.fn()
  })),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
  onSnapshot: jest.fn((query, callback) => {
    // Simulate async behavior with proper snapshot
    setTimeout(() => {
      const snapshot = {
        exists: () => true,
        data: () => ({ 
          title: 'Test Document',
          documentId: 'test-doc-id',
          createdBy: 'test-user',
          createdAt: { '.sv': 'timestamp' },
          updatedBy: 'test-user',
          updatedAt: { '.sv': 'timestamp' }
        }),
        id: 'mock-doc-id',
        ref: {},
        metadata: { fromCache: false, hasPendingWrites: false }
      }
      callback(snapshot)
    }, 0)
    return jest.fn() // unsubscribe function
  }),
  query: jest.fn(() => mockFirestore),
  where: jest.fn(() => mockFirestore),
  orderBy: jest.fn(() => mockFirestore),
}

export const mockRealtimeDB = {
  ref: jest.fn(() => mockRealtimeDB),
  onValue: jest.fn((ref, callback) => {
    // Simulate async behavior
    setTimeout(() => {
      const snapshot = {
        val: () => ({ 'test-user': { displayName: 'Test User', cursor: { x: 100, y: 100 }, updatedAt: Date.now() } })
      }
      callback(snapshot)
    }, 0)
    return jest.fn() // unsubscribe function
  }),
  off: jest.fn(() => jest.fn()),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn(() => Promise.resolve()),
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
}

export const mockAuth = {
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Default: logged out state
    callback(null)
    return jest.fn()
  }),
  signInWithPopup: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  })),
  signOut: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(function MockProvider() {}),
}
