import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCanvas } from '../../contexts/CanvasContext'
import { aiCanvasCommand } from '../../services/ai'
import { useChatMessages } from '../../hooks/useChatMessages'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'

interface ChatBoxProps {
  isOpen: boolean
  onToggle: () => void
}

export default function ChatBox({ isOpen, onToggle }: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { messages, sendMessage } = useChatMessages()
  const { typingUsers, setUserTyping } = useTypingIndicator(
    user?.id || '', 
    user?.displayName || 'User'
  )
  const { selectedId } = useCanvas()
  const documentId = selectedId || 'default-document'
  const { applyCanvasCommand } = useCanvasCommands({ documentId })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return

    const messageContent = inputValue.trim()
    setInputValue('')
    setIsAITyping(true)

    try {
      // Send user message to Firestore
      await sendMessage(messageContent, user.id, user.displayName || 'User', 'user')

      // Call AI function
      const response = await aiCanvasCommand(messageContent)
      
      if (response.success && response.data) {
        // Apply the canvas command
        const commandResult = await applyCanvasCommand(response.data)
        
        if (commandResult.success) {
          const createdCount = commandResult.createdShapes?.length || 0
          let aiResponse = `✅ Created ${createdCount} shape(s): ${response.data.target}`
          if (commandResult.details) {
            aiResponse += `\n\nDetails: ${commandResult.details}`
          }
          await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
        } else {
          let aiResponse = `❌ Failed to create shape: ${commandResult.error}`
          if (commandResult.details) {
            aiResponse += `\n\nDetails: ${commandResult.details}`
          }
          await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
        }
      } else {
        // Send AI error response
        const aiResponse = `❌ ${response.error}`
        await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
      }
      
      setIsAITyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
      await sendMessage('❌ Failed to process your request. Please try again.', 'ai', 'AI Assistant', 'assistant')
      setIsAITyping(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    
    // Update typing indicator
    if (e.target.value.trim()) {
      setUserTyping(true)
    } else {
      setUserTyping(false)
    }
  }

  const handleInputBlur = () => {
    setUserTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-800">AI Assistant</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Hi! I'm your AI assistant.</p>
            <p className="text-sm mt-1">Ask me to create or modify shapes on the canvas.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.displayName}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}
        
        {/* Other users typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
              <div className="text-sm text-gray-600">
                {typingUsers.map(user => user.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          </div>
        )}
        
        {/* AI typing indicator */}
        {isAITyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2 text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create shapes..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAITyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isAITyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
