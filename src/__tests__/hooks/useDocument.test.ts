import { renderHook, act } from '@testing-library/react'
import { useDocument } from '../../hooks/useDocument'
import { subscribeToDocument, createDocument, updateDocument, deleteDocument } from '../../services/firestore'
import { useAuth } from '../../contexts/AuthContext'

// Mock the services
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
}))

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockSubscribeToDocument = subscribeToDocument as jest.MockedFunction<typeof subscribeToDocument>
const mockCreateDocument = createDocument as jest.MockedFunction<typeof createDocument>
const mockUpdateDocument = updateDocument as jest.MockedFunction<typeof updateDocument>
const mockDeleteDocument = deleteDocument as jest.MockedFunction<typeof deleteDocument>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('useDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('document subscription', () => {
    it('subscribes to document on mount', () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      renderHook(() => useDocument({ documentId: 'test-doc' }))

      expect(mockSubscribeToDocument).toHaveBeenCalledWith('test-doc', expect.any(Function))
    })

    it('unsubscribes on unmount', () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      const { unmount } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('updates document state when subscription callback is called', () => {
      const mockUnsubscribe = jest.fn()
      let subscriptionCallback: (doc: any) => void
      mockSubscribeToDocument.mockImplementation((_docIdParam, callback) => {
        subscriptionCallback = callback
        return mockUnsubscribe
      })
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.document).toBe(null)

      act(() => {
        subscriptionCallback({
          id: 'test-doc',
          title: 'Test Document',
          ownerId: 'user1',
          collaborators: [],
          isPublic: false,
          viewport: { x: 0, y: 0, scale: 1 },
          shapeCount: 0,
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
          lastAccessedAt: 'timestamp',
        })
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.document).toEqual({
        id: 'test-doc',
        title: 'Test Document',
        ownerId: 'user1',
        collaborators: [],
        isPublic: false,
        viewport: { x: 0, y: 0, scale: 1 },
        shapeCount: 0,
        createdAt: 'timestamp',
        updatedAt: 'timestamp',
        lastAccessedAt: 'timestamp',
      })
      expect(result.current.error).toBe(null)
    })

    it('handles null document from subscription', () => {
      const mockUnsubscribe = jest.fn()
      let subscriptionCallback: (doc: any) => void
      mockSubscribeToDocument.mockImplementation((_docIdParam, callback) => {
        subscriptionCallback = callback
        return mockUnsubscribe
      })
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      act(() => {
        subscriptionCallback(null)
      })

      expect(result.current.document).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('document creation', () => {
    it('creates document when createIfNotExists is true and document is null', async () => {
      const mockUnsubscribe = jest.fn()
      let subscriptionCallback: (doc: any) => void
      mockSubscribeToDocument.mockImplementation((_docIdParam, callback) => {
        subscriptionCallback = callback
        return mockUnsubscribe
      })
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockCreateDocument.mockResolvedValue(undefined)

      const { result } = renderHook(() => 
        useDocument({ 
          documentId: 'test-doc', 
          createIfNotExists: true,
          defaultTitle: 'My Document'
        })
      )

      // Simulate document not existing initially
      act(() => {
        subscriptionCallback(null)
      })

      expect(result.current.document).toBe(null)
      expect(result.current.isLoading).toBe(false)

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockCreateDocument).toHaveBeenCalledWith('test-doc', 'My Document', 'user1', {
        x: 0,
        y: 0,
        scale: 1,
      })
    })

    it('does not create document when user is not authenticated', async () => {
      const mockUnsubscribe = jest.fn()
      let subscriptionCallback: (doc: any) => void
      mockSubscribeToDocument.mockImplementation((_docIdParam, callback) => {
        subscriptionCallback = callback
        return mockUnsubscribe
      })
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      renderHook(() => 
        useDocument({ 
          documentId: 'test-doc', 
          createIfNotExists: true 
        })
      )

      act(() => {
        subscriptionCallback(null)
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('handles document creation error', async () => {
      const mockUnsubscribe = jest.fn()
      let subscriptionCallback: (doc: any) => void
      mockSubscribeToDocument.mockImplementation((_docIdParam, callback) => {
        subscriptionCallback = callback
        return mockUnsubscribe
      })
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockCreateDocument.mockRejectedValue(new Error('Creation failed'))

      const { result } = renderHook(() => 
        useDocument({ 
          documentId: 'test-doc', 
          createIfNotExists: true 
        })
      )

      act(() => {
        subscriptionCallback(null)
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toEqual(new Error('Creation failed'))
    })
  })

  describe('document operations', () => {
    it('updates document successfully', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockUpdateDocument.mockResolvedValue(undefined)

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        await result.current.updateDocument({ title: 'Updated Title' })
      })

      expect(mockUpdateDocument).toHaveBeenCalledWith('test-doc', { title: 'Updated Title' })
    })

    it('handles update error', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockUpdateDocument.mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        try {
          await result.current.updateDocument({ title: 'Updated Title' })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toEqual(new Error('Update failed'))
    })

    it('skips update when user is not authenticated', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: null, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        await result.current.updateDocument({ title: 'Updated Title' })
      })

      expect(mockUpdateDocument).not.toHaveBeenCalled()
    })

    it('deletes document successfully', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockDeleteDocument.mockResolvedValue(undefined)

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        await result.current.deleteDocument()
      })

      expect(mockDeleteDocument).toHaveBeenCalledWith('test-doc')
    })

    it('handles delete error', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockDeleteDocument.mockRejectedValue(new Error('Delete failed'))

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        try {
          await result.current.deleteDocument()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toEqual(new Error('Delete failed'))
    })

    it('updates viewport', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribeToDocument.mockReturnValue(mockUnsubscribe)
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: 'user1',
          displayName: 'User One',
          email: 'user1@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }, 
        isLoading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        error: null
      })
      mockUpdateDocument.mockResolvedValue(undefined)

      const { result } = renderHook(() => useDocument({ documentId: 'test-doc' }))

      await act(async () => {
        await result.current.updateViewport({ x: 100, y: 200, scale: 1.5 })
      })

      expect(mockUpdateDocument).toHaveBeenCalledWith('test-doc', { 
        viewport: { x: 100, y: 200, scale: 1.5 } 
      })
    })
  })
})
