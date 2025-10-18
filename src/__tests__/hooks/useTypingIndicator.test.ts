import { renderHook, act } from '@testing-library/react'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '../../services/firebase'

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  getFirestore: jest.fn(),
}))

jest.mock('../../services/firebase', () => ({
  getFirebaseApp: jest.fn(() => ({ name: 'test-app' })),
}))

const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>
const mockGetFirestore = getFirestore as jest.MockedFunction<typeof getFirestore>
const mockGetFirebaseApp = getFirebaseApp as jest.MockedFunction<typeof getFirebaseApp>

describe('useTypingIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue({} as any) // Mock Firestore instance
    mockDoc.mockReturnValue({} as any) // Mock doc reference
    mockSetDoc.mockResolvedValue(undefined)
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('initializes with empty typing users and not typing', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    expect(result.current.typingUsers).toEqual([])
    expect(result.current.isTyping).toBe(false)
    expect(typeof result.current.setUserTyping).toBe('function')
  })

  it('subscribes to typing updates on mount', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    renderHook(() => useTypingIndicator('user1', 'User One'))

    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'typing', 'users')
    expect(mockOnSnapshot).toHaveBeenCalledWith(mockTypingRef, expect.any(Function))
  })

  it('unsubscribes on unmount', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useTypingIndicator('user1', 'User One'))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('updates typing users when snapshot changes', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (doc: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockImplementation((_ref, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    // Simulate snapshot with typing users
    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          user2: {
            displayName: 'User Two',
            isTyping: true,
            lastSeen: { toMillis: () => Date.now() - 1000 } // 1 second ago
          },
          user3: {
            displayName: 'User Three',
            isTyping: true,
            lastSeen: { toMillis: () => Date.now() - 5000 } // 5 seconds ago (should be filtered out)
          }
        })
      })
    })

    expect(result.current.typingUsers).toHaveLength(1)
    expect(result.current.typingUsers[0]).toEqual({
      userId: 'user2',
      displayName: 'User Two',
      isTyping: true,
      lastSeen: expect.any(Number)
    })
  })

  it('filters out current user from typing users', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (doc: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockImplementation((_ref, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    // Simulate snapshot with current user typing
    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          user1: {
            displayName: 'User One',
            isTyping: true,
            lastSeen: { toMillis: () => Date.now() - 1000 }
          },
          user2: {
            displayName: 'User Two',
            isTyping: true,
            lastSeen: { toMillis: () => Date.now() - 1000 }
          }
        })
      })
    })

    expect(result.current.typingUsers).toHaveLength(1)
    expect(result.current.typingUsers[0].userId).toBe('user2')
  })

  it('filters out users who stopped typing more than 3 seconds ago', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (doc: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockImplementation((_ref, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    // Simulate snapshot with old typing data
    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          user2: {
            displayName: 'User Two',
            isTyping: true,
            lastSeen: { toMillis: () => Date.now() - 4000 } // 4 seconds ago
          }
        })
      })
    })

    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('handles non-existent document', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()
    let snapshotCallback: (doc: any) => void

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockImplementation((_ref, callback) => {
      snapshotCallback = callback as any
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    // Simulate non-existent document
    act(() => {
      snapshotCallback({
        exists: () => false
      })
    })

    expect(result.current.typingUsers).toEqual([])
  })

  it('sets user typing status', async () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockSetDoc.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    await act(async () => {
      await result.current.setUserTyping(true)
    })

    expect(mockSetDoc).toHaveBeenCalledWith(mockTypingRef, {
      user1: {
        displayName: 'User One',
        isTyping: true,
        lastSeen: 'mock-timestamp'
      }
    }, { merge: true })
    expect(result.current.isTyping).toBe(true)
  })

  it('handles setUserTyping error', async () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)
    mockSetDoc.mockRejectedValue(new Error('Set failed'))

    const { result } = renderHook(() => useTypingIndicator('user1', 'User One'))

    await act(async () => {
      await result.current.setUserTyping(true)
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error updating typing status:', expect.any(Error))
    expect(result.current.isTyping).toBe(false)

    consoleSpy.mockRestore()
  })

  it('resubscribes when userId changes', () => {
    const mockDb = { name: 'test-db' }
    const mockTypingRef = { id: 'typing/users' }
    const mockUnsubscribe = jest.fn()

    mockGetFirebaseApp.mockReturnValue({ name: 'test-app' } as any)
    mockGetFirestore.mockReturnValue(mockDb as any)
    mockDoc.mockReturnValue(mockTypingRef as any)
    mockOnSnapshot.mockReturnValue(mockUnsubscribe)

    const { rerender } = renderHook(
      ({ userId, displayName }) => useTypingIndicator(userId, displayName),
      { initialProps: { userId: 'user1', displayName: 'User One' } }
    )

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1)

    rerender({ userId: 'user2', displayName: 'User Two' })

    expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
