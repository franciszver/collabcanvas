import { renderHook } from '@testing-library/react'
import usePresence from '../../hooks/usePresence'
import { usePresence as usePresenceContext } from '../../contexts/PresenceContext'

// Mock the PresenceContext
jest.mock('../../contexts/PresenceContext', () => ({
  usePresence: jest.fn(),
}))

const mockUsePresenceContext = usePresenceContext as jest.MockedFunction<typeof usePresenceContext>

describe('usePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns online users with correct structure', () => {
    const mockUsers = {
      'user1': {
        userId: 'user1',
        displayName: 'User One',
        isActive: true,
        cursor: null,
        updatedAt: 1234567890,
      },
      'user2': {
        userId: 'user2',
        displayName: 'User Two',
        isActive: false,
        cursor: null,
        updatedAt: 1234567891,
      },
      'user3': {
        userId: 'user3',
        displayName: null,
        isActive: true,
        cursor: null,
        updatedAt: 1234567892,
      },
    }

    mockUsePresenceContext.mockReturnValue({ 
      users: mockUsers,
      setUsers: jest.fn(),
      isOnline: true
    })

    const { result } = renderHook(() => usePresence())

    expect(result.current).toEqual({
      onlineUsers: [
        { id: 'user1', name: 'User One', isActive: true },
        { id: 'user2', name: 'User Two', isActive: false },
        { id: 'user3', name: null, isActive: true },
      ],
      onlineCount: 3,
      activeCount: 2,
    })
  })

  it('handles empty users object', () => {
    mockUsePresenceContext.mockReturnValue({ 
      users: {},
      setUsers: jest.fn(),
      isOnline: true
    })

    const { result } = renderHook(() => usePresence())

    expect(result.current).toEqual({
      onlineUsers: [],
      onlineCount: 0,
      activeCount: 0,
    })
  })

  it('defaults isActive to true when not set', () => {
    const mockUsers = {
      'user1': {
        userId: 'user1',
        displayName: 'User One',
        cursor: null,
        updatedAt: 1234567890,
        // isActive not set
      },
    }

    mockUsePresenceContext.mockReturnValue({ 
      users: mockUsers,
      setUsers: jest.fn(),
      isOnline: true
    })

    const { result } = renderHook(() => usePresence())

    expect(result.current.onlineUsers[0].isActive).toBe(true)
    expect(result.current.activeCount).toBe(1)
  })

  it('handles null displayName', () => {
    const mockUsers = {
      'user1': {
        userId: 'user1',
        displayName: null,
        isActive: true,
        cursor: null,
        updatedAt: 1234567890,
      },
    }

    mockUsePresenceContext.mockReturnValue({ 
      users: mockUsers,
      setUsers: jest.fn(),
      isOnline: true
    })

    const { result } = renderHook(() => usePresence())

    expect(result.current.onlineUsers[0].name).toBe(null)
  })

  it('memoizes result based on users', () => {
    const mockUsers = {
      'user1': {
        userId: 'user1',
        displayName: 'User One',
        isActive: true,
        cursor: null,
        updatedAt: 1234567890,
      },
    }

    mockUsePresenceContext.mockReturnValue({ 
      users: mockUsers,
      setUsers: jest.fn(),
      isOnline: true
    })

    const { result, rerender } = renderHook(() => usePresence())

    const firstResult = result.current

    // Rerender with same users
    rerender()

    expect(result.current).toBe(firstResult) // Same reference due to memoization

    // Rerender with different users
    const newUsers = {
      'user1': {
        userId: 'user1',
        displayName: 'User One Updated',
        isActive: true,
        cursor: null,
        updatedAt: 1234567890,
      },
    }
    mockUsePresenceContext.mockReturnValue({ 
      users: newUsers,
      setUsers: jest.fn(),
      isOnline: true
    })
    rerender()

    expect(result.current).not.toBe(firstResult) // Different reference
    expect(result.current.onlineUsers[0].name).toBe('User One Updated')
  })
})
