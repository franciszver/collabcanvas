import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatBox from '../../components/Chat/ChatBox'
import { AuthProvider } from '../../contexts/AuthContext'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'

// Mock the hooks and services
jest.mock('../../hooks/useChatMessages', () => ({
  useChatMessages: () => ({
    messages: [],
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
  }),
}))

jest.mock('../../hooks/useTypingIndicator', () => ({
  useTypingIndicator: () => ({
    typingUsers: [],
    setUserTyping: jest.fn(),
  }),
}))

jest.mock('../../hooks/useCanvasCommands', () => ({
  useCanvasCommands: () => ({
    applyCanvasCommand: jest.fn(),
  }),
}))

jest.mock('../../services/ai', () => ({
  aiCanvasCommand: jest.fn(),
}))

// Mock auth to have a logged-in user
jest.mock('../../services/auth', () => ({
  onAuthStateChanged: (cb: (u: any) => void) => {
    setTimeout(() => {
      cb({ 
        id: 'u1', 
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: null
      })
    }, 0)
    return jest.fn()
  },
  signInWithGoogle: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
  handleRedirectResult: jest.fn(() => Promise.resolve(null)),
}))

// Mock realtime service
jest.mock('../../services/realtime', () => ({
  setUserOnlineRtdb: jest.fn(() => Promise.resolve()),
  setUserOfflineRtdb: jest.fn(() => Promise.resolve()),
  updateCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  subscribeToPresenceRtdb: jest.fn(() => jest.fn()),
  clearCursorPositionRtdb: jest.fn(() => Promise.resolve()),
  removeUserPresenceRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToDragRtdb: jest.fn(() => jest.fn()),
  clearDragPositionRtdb: jest.fn(() => Promise.resolve()),
  publishDragPositionsRtdbThrottled: jest.fn(() => Promise.resolve()),
  publishResizePositionsRtdb: jest.fn(() => Promise.resolve()),
  subscribeToResizeRtdb: jest.fn(() => jest.fn()),
  clearResizePositionRtdb: jest.fn(() => Promise.resolve()),
  cleanupStaleCursorsRtdb: jest.fn(() => Promise.resolve()),
  markInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
  cleanupInactiveUsersRtdb: jest.fn(() => Promise.resolve(0)),
}))

// Mock firestore service
jest.mock('../../services/firestore', () => ({
  subscribeToDocument: jest.fn(() => jest.fn()),
  subscribeToShapes: jest.fn(() => jest.fn()),
  createShape: jest.fn(),
  updateShape: jest.fn(),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteShape: jest.fn(),
  deleteAllShapes: jest.fn(),
  rectangleToShape: jest.fn((rect: any) => rect),
  db: jest.fn(() => ({})),
  rectanglesCollection: jest.fn(() => ({})),
  presenceCollection: jest.fn(() => ({})),
  usersCollection: jest.fn(() => ({})),
}))

function renderChatBox(isOpen = true, onToggle = jest.fn()) {
  return render(
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          <ChatBox isOpen={isOpen} onToggle={onToggle} />
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

describe('ChatBox Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders when open', () => {
    renderChatBox(true)
    
    expect(screen.getByPlaceholderText(/ask me to create shapes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    renderChatBox(false)
    
    expect(screen.queryByPlaceholderText(/ask me to create shapes/i)).not.toBeInTheDocument()
  })

  test('handles input change', () => {
    renderChatBox()
    
    const input = screen.getByPlaceholderText(/ask me to create shapes/i)
    fireEvent.change(input, { target: { value: 'test message' } })
    
    expect(input).toHaveValue('test message')
  })

  test('send button is disabled when input is empty', () => {
    renderChatBox()
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  test('send button is enabled when input has content', () => {
    renderChatBox()
    
    const input = screen.getByPlaceholderText(/ask me to create shapes/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'test message' } })
    
    expect(sendButton).toBeEnabled()
  })

  test('handles send message on button click', async () => {
    const mockSendMessage = jest.fn()
    const mockAiCanvasCommand = jest.fn()
    
    // Mock the hooks
    jest.doMock('../../hooks/useChatMessages', () => ({
      useChatMessages: () => ({
        messages: [],
        sendMessage: mockSendMessage,
        clearMessages: jest.fn(),
      }),
    }))
    
    jest.doMock('../../services/ai', () => ({
      aiCanvasCommand: mockAiCanvasCommand,
    }))
    
    mockAiCanvasCommand.mockResolvedValue({
      success: true,
      data: {
        action: 'create',
        target: 'rectangle',
        parameters: { color: 'red' }
      }
    })
    
    mockSendMessage.mockResolvedValue(undefined)
    
    renderChatBox()
    
    const input = screen.getByPlaceholderText(/ask me to create shapes/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'create a red rectangle' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalled()
    })
  })

  test('handles send message on Enter key press', async () => {
    const mockSendMessage = jest.fn()
    const mockAiCanvasCommand = jest.fn()
    
    // Mock the hooks
    jest.doMock('../../hooks/useChatMessages', () => ({
      useChatMessages: () => ({
        messages: [],
        sendMessage: mockSendMessage,
        clearMessages: jest.fn(),
      }),
    }))
    
    jest.doMock('../../services/ai', () => ({
      aiCanvasCommand: mockAiCanvasCommand,
    }))
    
    mockAiCanvasCommand.mockResolvedValue({
      success: true,
      data: {
        action: 'create',
        target: 'rectangle',
        parameters: { color: 'red' }
      }
    })
    
    mockSendMessage.mockResolvedValue(undefined)
    
    renderChatBox()
    
    const input = screen.getByPlaceholderText(/ask me to create shapes/i)
    
    fireEvent.change(input, { target: { value: 'create a red rectangle' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalled()
    })
  })

  test('shows commands window when commands button is clicked', () => {
    renderChatBox()
    
    const commandsButton = screen.getByTitle(/show commands/i)
    fireEvent.click(commandsButton)
    
    expect(screen.getByText(/create shapes/i)).toBeInTheDocument()
  })

  test('closes commands window when close button is clicked', () => {
    renderChatBox()
    
    const commandsButton = screen.getByTitle(/show commands/i)
    fireEvent.click(commandsButton)
    
    const closeButton = screen.getByTitle(/close commands/i)
    fireEvent.click(closeButton)
    
    expect(screen.queryByText(/create shapes/i)).not.toBeInTheDocument()
  })

  test('handles input blur', () => {
    renderChatBox()
    
    const input = screen.getByPlaceholderText(/ask me to create shapes/i)
    fireEvent.blur(input)
    
    // Should not throw any errors
    expect(input).toBeInTheDocument()
  })

  test('shows AI typing indicator when AI is typing', () => {
    // Mock the typing indicator hook
    jest.doMock('../../hooks/useTypingIndicator', () => ({
      useTypingIndicator: () => ({
        typingUsers: [{ id: 'ai', name: 'AI Assistant' }],
        setUserTyping: jest.fn(),
      }),
    }))
    
    renderChatBox()
    
    expect(screen.getByText(/ai is thinking/i)).toBeInTheDocument()
  })

  test('shows typing users', () => {
    // Mock the typing indicator hook
    jest.doMock('../../hooks/useTypingIndicator', () => ({
      useTypingIndicator: () => ({
        typingUsers: [{ id: 'user1', name: 'User 1' }],
        setUserTyping: jest.fn(),
      }),
    }))
    
    renderChatBox()
    
    expect(screen.getByText(/user 1 is typing/i)).toBeInTheDocument()
  })
})
