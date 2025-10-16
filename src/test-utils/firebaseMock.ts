// Comprehensive Firebase mock for testing
const mockFirestoreObj = {
  collection: jest.fn(),
  doc: jest.fn(),
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
  onSnapshot: jest.fn((_query: any, callback: any) => {
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
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  // Add missing functions that some tests might need
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn(),
}

// Set up circular references
mockFirestoreObj.collection.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.doc.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.query.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.where.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.orderBy.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.limit.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.startAfter.mockReturnValue(mockFirestoreObj)
mockFirestoreObj.endBefore.mockReturnValue(mockFirestoreObj)

export const mockFirestore = mockFirestoreObj

const mockRealtimeDBObj = {
  ref: jest.fn(),
  onValue: jest.fn((_ref: any, callback: any) => {
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
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),
}

// Set up circular references
mockRealtimeDBObj.ref.mockReturnValue(mockRealtimeDBObj)

export const mockRealtimeDB = mockRealtimeDBObj

export const mockAuth = {
  onAuthStateChanged: jest.fn((_auth: any, callback: any) => {
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
  getRedirectResult: jest.fn(() => Promise.resolve(null)),
  signOut: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(function MockProvider() {}),
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
}
