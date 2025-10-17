import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCanvas } from '../../contexts/CanvasContext'
import { aiCanvasCommand, type CanvasAction } from '../../services/ai'
import { useChatMessages } from '../../hooks/useChatMessages'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'
import styles from './ChatBox.module.css'

interface ChatBoxProps {
  isOpen: boolean
  onToggle: () => void
}

export default function ChatBox({ isOpen, onToggle }: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<CanvasAction | null>(null)
  const [isWaitingForColor, setIsWaitingForColor] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { messages, sendMessage, clearMessages } = useChatMessages()
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

  // Function to extract color from user message
  const extractColorFromMessage = (message: string): string | null => {
    const messageLower = message.toLowerCase().trim()
    
    // Map of color names to CSS colors
    const colorMap: Record<string, string> = {
      'red': '#EF4444',
      'orange': '#F97316', 
      'yellow': '#EAB308',
      'green': '#22C55E',
      'blue': '#3B82F6',
      'indigo': '#6366F1',
      'violet': '#8B5CF6',
      'purple': '#8B5CF6', // alias for violet
      'pink': '#EC4899',
      'brown': '#A3A3A3',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#6B7280',
      'grey': '#6B7280' // alias for gray
    }
    
    // Check for exact color name matches
    for (const [colorName, cssColor] of Object.entries(colorMap)) {
      if (messageLower === colorName) {
        return cssColor
      }
    }
    
    // Check for color names within the message
    for (const [colorName, cssColor] of Object.entries(colorMap)) {
      if (messageLower.includes(colorName)) {
        return cssColor
      }
    }
    
    // Check for hex color codes
    const hexMatch = message.match(/#[0-9A-Fa-f]{6}/)
    if (hexMatch) {
      return hexMatch[0]
    }
    
    return null
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

      // If we're waiting for a color response, handle it
      if (isWaitingForColor && pendingCommand) {
        const color = extractColorFromMessage(messageContent)
        if (color) {
          // Update the pending command with the color
          const updatedCommand = {
            ...pendingCommand,
            parameters: {
              ...pendingCommand.parameters,
              color: color
            }
          }
          
          // Apply the canvas command with the color
          const commandResult = await applyCanvasCommand(updatedCommand)
          
          if (commandResult.success) {
            const createdCount = commandResult.createdShapes?.length || 0
            const hasLayout = updatedCommand.parameters.layout
            let aiResponse = ''
            if (hasLayout) {
              aiResponse = `✅ Created ${createdCount} ${updatedCommand.target}(s) in ${hasLayout} layout with ${color} color`
            } else {
              aiResponse = `✅ Created ${createdCount} ${updatedCommand.target}(s) with ${color} color`
            }
            await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
          } else {
            await sendMessage(`❌ Failed to create shape: ${commandResult.error}`, 'ai', 'AI Assistant', 'assistant')
          }
          
          // Reset state
          setPendingCommand(null)
          setIsWaitingForColor(false)
        } else {
          // Invalid color, ask again with examples
          const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
          await sendMessage(`I didn't understand that color. Please choose from: ${rainbowColors.join(', ')}`, 'ai', 'AI Assistant', 'assistant')
        }
      } else {
        // Normal AI command processing
        const response = await aiCanvasCommand(messageContent)
        
        if (response.success && response.data) {
          // Check if this is a create command without color
          if (response.data.action === 'create' && !response.data.parameters.color) {
            // Ask for color clarification
            const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
            await sendMessage(`You didn't specify a color. What color would you like it to be? Choose from: ${rainbowColors.join(', ')}`, 'ai', 'AI Assistant', 'assistant')
            
            // Store the pending command and wait for color response
            setPendingCommand(response.data)
            setIsWaitingForColor(true)
          } else {
            // Apply the canvas command normally
            const commandResult = await applyCanvasCommand(response.data)
            
            if (commandResult.success) {
              let aiResponse = ''
              
              if (response.data.action === 'create') {
                const createdCount = commandResult.createdShapes?.length || 0
                const hasLayout = response.data.parameters.layout
                if (hasLayout) {
                  aiResponse = `✅ Created ${createdCount} ${response.data.target}(s) in ${hasLayout} layout`
                } else {
                  aiResponse = `✅ Created ${createdCount} ${response.data.target}(s)`
                }
              } else if (response.data.action === 'manipulate') {
                // Parse manipulation details
                const params = response.data.parameters
                const actions: string[] = []
                if (params.x !== undefined || params.y !== undefined) actions.push('moved')
                if (params.width !== undefined || params.height !== undefined || params.radius !== undefined) actions.push('resized')
                if (params.rotation !== undefined) actions.push('rotated')
                if (params.color !== undefined) actions.push('recolored')
                
                const actionText = actions.join(', ')
                aiResponse = `✅ ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${response.data.target}`
              } else if (response.data.action === 'layout') {
                const count = commandResult.details?.match(/\d+/)?.[0] || 'shapes'
                const layoutType = response.data.parameters.layout || 'row'
                aiResponse = `✅ Arranged ${count} shapes in ${layoutType} layout`
              }
              
              if (commandResult.details) {
                aiResponse += `\n\nDetails: ${commandResult.details}`
              }
              await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
            } else {
              let actionText = 'create'
              if (response.data.action === 'manipulate') actionText = 'manipulate'
              else if (response.data.action === 'layout') actionText = 'layout'
              let aiResponse = `❌ Failed to ${actionText} shape: ${commandResult.error}`
              if (commandResult.details) {
                aiResponse += `\n\nDetails: ${commandResult.details}`
              }
              await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
            }
          }
        } else {
          // Send AI error response
          const aiResponse = `❌ ${response.error}`
          await sendMessage(aiResponse, 'ai', 'AI Assistant', 'assistant')
        }
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

  const handleClearChat = async () => {
    if (!user) return
    
    try {
      await clearMessages()
    } catch (error) {
      console.error('Error clearing chat:', error)
      // Show error message to user
      await sendMessage('❌ Failed to clear chat. Please try again.', 'ai', 'AI Assistant', 'assistant')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={styles.floatingButton}
        aria-label="Open chat"
      >
        <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    )
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.statusIndicator}></div>
          <h3 className={styles.headerTitle}>AI Assistant</h3>
        </div>
        <div className={styles.headerRight}>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className={styles.clearButton}
              aria-label="Clear chat"
              title="Clear chat history"
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onToggle}
            className={styles.closeButton}
            aria-label="Close chat"
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Hi! I'm your AI assistant.</p>
            <p>Ask me to create or modify shapes on the canvas.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageContainer} ${
                message.role === 'user' ? styles.messageContainerUser : styles.messageContainerAssistant
              }`}
            >
              <div
                className={`${styles.messageBubble} ${
                  message.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleAssistant
                }`}
              >
                <div className={styles.messageSender}>
                  {message.displayName}
                </div>
                <div className={styles.messageContent}>{message.content}</div>
              </div>
            </div>
          ))
        )}
        
        {/* Other users typing indicator */}
        {typingUsers.length > 0 && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
              <div className={styles.typingText}>
                {typingUsers.map(user => user.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          </div>
        )}
        
        {/* AI typing indicator */}
        {isAITyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
              <div className={styles.typingDots}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <span className={styles.typingLabel}>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder={isWaitingForColor ? "Choose a color: red, orange, yellow, green, blue, indigo, violet" : "Ask me to create shapes..."}
            className={styles.inputField}
            disabled={isAITyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isAITyping}
            className={styles.sendButton}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
