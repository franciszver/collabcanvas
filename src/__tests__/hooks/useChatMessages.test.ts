import { renderHook, act } from '@testing-library/react'
import { useChatMessages } from '../../hooks/useChatMessages'
import { collection, addDoc, onSnapshot, query, getDocs, writeBatch, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '../../services/firebase'

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  doc: jest.fn(),
  getFirestore: jest.fn(),
}))

jest.mock('../../services/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({ name: 'test-app' })),
}))

const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockLimit = limit as jest.MockedFunction<typeof limit>
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetFirestore = getFirestore as jest.MockedFunction<typeof getFirestore>
const mockGetFirebaseApp = getFirebaseApp as jest.MockedFunction<typeof getFirebaseApp>

describe('useChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any)
    mockOrderBy.mockReturnValue({} as any)
    mockLimit.mockReturnValue({} as any)
  })

  it('initializes with empty messages and loading state', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    const { result } = renderHook(() => useChatMessages())

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(typeof result.current.sendMessage).toBe('function')
    expect(typeof result.current.clearMessages).toBe('function')
  })

  it('subscribes to chat messages on mount', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    renderHook(() => useChatMessages())

    expect(mockCollection).toHaveBeenCalledWith(mockDb, 'chatMessages')
    expect(mockQuery).toHaveBeenCalledWith(mockMessagesRef, expect.any(Object), expect.any(Object))
    expect(mockOnSnapshot).toHaveBeenCalledWith(mockQueryRef, expect.any(Function), expect.any(Function))
  })

  it('unsubscribes on unmount', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useChatMessages())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('updates messages when snapshot changes', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (snapshot: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockImplementation((_queryRef, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useChatMessages())

    // Simulate snapshot with messages
    act(() => {
      snapshotCallback({
        forEach: (callback: (doc: any) => void) => {
          // Messages are processed in order and then reversed
          callback({
            id: 'msg2',
            data: () => ({
              content: 'Hi there',
              role: 'assistant',
              timestamp: { toMillis: () => 1234567891 },
              userId: 'assistant',
              displayName: 'Assistant'
            })
          })
          callback({
            id: 'msg1',
            data: () => ({
              content: 'Hello',
              role: 'user',
              timestamp: { toMillis: () => 1234567890 },
              userId: 'user1',
              displayName: 'User One'
            })
          })
        }
      })
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toEqual({
      id: 'msg1',
      content: 'Hello',
      role: 'user',
      timestamp: 1234567890,
      userId: 'user1',
      displayName: 'User One'
    })
    expect(result.current.messages[1]).toEqual({
      id: 'msg2',
      content: 'Hi there',
      role: 'assistant',
      timestamp: 1234567891,
      userId: 'assistant',
      displayName: 'Assistant'
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('handles snapshot error', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    let errorCallback: (error: any) => void
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockImplementation((_queryRef, _successCallback, errorCallbackParam) => {
      errorCallback = errorCallbackParam
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useChatMessages())

    // Simulate error
    act(() => {
      errorCallback(new Error('Snapshot error'))
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error listening to chat messages:', expect.any(Error))
    expect(result.current.isLoading).toBe(false)

    consoleSpy.mockRestore()
  })

  it('sends message successfully', async () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockAddDoc.mockResolvedValue({ id: 'new-msg' } as any)

    const { result } = renderHook(() => useChatMessages())

    await act(async () => {
      await result.current.sendMessage('Hello', 'user1', 'User One', 'user')
    })

    expect(mockAddDoc).toHaveBeenCalledWith(mockMessagesRef, {
      content: 'Hello',
      role: 'user',
      userId: 'user1',
      displayName: 'User One',
      timestamp: 'mock-timestamp'
    })
  })

  it('sends message with default role', async () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockAddDoc.mockResolvedValue({ id: 'new-msg' } as any)

    const { result } = renderHook(() => useChatMessages())

    await act(async () => {
      await result.current.sendMessage('Hello', 'user1')
    })

    expect(mockAddDoc).toHaveBeenCalledWith(mockMessagesRef, {
      content: 'Hello',
      role: 'user',
      userId: 'user1',
      displayName: undefined,
      timestamp: 'mock-timestamp'
    })
  })

  it('handles sendMessage error', async () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockAddDoc.mockRejectedValue(new Error('Send failed'))

    const { result } = renderHook(() => useChatMessages())

    await act(async () => {
      try {
        await result.current.sendMessage('Hello', 'user1')
      } catch (error) {
        // Expected to throw
      }
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('clears messages successfully', async () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    const mockBatch = { delete: jest.fn(), commit: jest.fn() }

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'msg1' },
        { id: 'msg2' }
      ]
    } as any)
    mockWriteBatch.mockReturnValue(mockBatch as any)
    mockDoc.mockReturnValue({ id: 'doc1' } as any)
    mockBatch.commit.mockResolvedValue(undefined)

    const { result } = renderHook(() => useChatMessages())

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(mockGetDocs).toHaveBeenCalledWith(mockQueryRef)
    expect(mockBatch.delete).toHaveBeenCalledTimes(2)
    expect(mockBatch.commit).toHaveBeenCalled()
  })

  it('handles clearMessages error', async () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockGetDocs.mockRejectedValue(new Error('Clear failed'))

    const { result } = renderHook(() => useChatMessages())

    await act(async () => {
      try {
        await result.current.clearMessages()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error clearing messages:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('handles messages without timestamp', () => {
    const mockDb = { name: 'test-db' }
    const mockMessagesRef = { id: 'chatMessages' }
    const mockQueryRef = { id: 'query' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (snapshot: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockCollection.mockReturnValue(mockMessagesRef as any)
    mockQuery.mockReturnValue(mockQueryRef as any)
    mockOnSnapshot.mockImplementation((_queryRef, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useChatMessages())

    // Simulate snapshot with message without timestamp
    act(() => {
      snapshotCallback({
        forEach: (callback: (doc: any) => void) => {
          callback({
            id: 'msg1',
            data: () => ({
              content: 'Hello',
              role: 'user',
              timestamp: null,
              userId: 'user1',
              displayName: 'User One'
            })
          })
        }
      })
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].timestamp).toBeGreaterThan(0) // Should use Date.now()
  })
})
