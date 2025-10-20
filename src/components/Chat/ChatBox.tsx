import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCanvas } from '../../contexts/CanvasContext'
import { aiCanvasCommand, type CanvasAction } from '../../services/ai'
import { useChatMessages } from '../../hooks/useChatMessages'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'
import { createTemplateShapes, isTemplateRequest, extractTemplateId, extractTemplateParams } from '../../utils/templateHelpers'
import CommandsWindow from './CommandsWindow'
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
  const [isWaitingForNavbarButtons, setIsWaitingForNavbarButtons] = useState(false)
  const [isWaitingForNavbarConfirmation, setIsWaitingForNavbarConfirmation] = useState(false)
  const [pendingNavbarParams, setPendingNavbarParams] = useState<{ buttonCount: number; labels: string[] } | null>(null)
  const [isWaitingForLoginRememberMe, setIsWaitingForLoginRememberMe] = useState(false)
  const [isWaitingForLoginForgotPassword, setIsWaitingForLoginForgotPassword] = useState(false)
  const [isWaitingForLoginOAuth, setIsWaitingForLoginOAuth] = useState(false)
  const [pendingLoginParams, setPendingLoginParams] = useState<{ includeRememberMe?: boolean; includeForgotPassword?: boolean; oauthProviders?: string[] } | null>(null)
  const [isCommandsOpen, setIsCommandsOpen] = useState(false)
  const [hasDeselectedForCurrentInput, setHasDeselectedForCurrentInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { messages, sendMessage, clearMessages } = useChatMessages(user?.id)
  const { selectedId, clearSelection, setViewport, viewport } = useCanvas()
  const documentId = selectedId || 'default-document'
  const { applyCanvasCommand } = useCanvasCommands({ documentId })

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Calculate viewport center for template positioning
  const getViewportCenter = () => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    // Convert screen center to canvas coordinates: (screenCoord - pan) / scale
    const centerX = (windowWidth / 2 - viewport.x) / viewport.scale
    const centerY = (windowHeight / 2 - viewport.y) / viewport.scale
    return { centerX, centerY }
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

  // Helper function to parse button count from user input
  const parseButtonCount = (message: string): number | null => {
    const messageTrimmed = message.trim()
    
    // Look for numbers in the message
    const numberMatch = messageTrimmed.match(/\d+/)
    if (numberMatch) {
      const count = parseInt(numberMatch[0], 10)
      if (count >= 1 && count <= 10) {
        return count
      }
    }
    
    return null
  }

  // Helper function to parse custom labels from user input
  const parseCustomLabels = (message: string, expectedCount: number): string[] | null => {
    const messageTrimmed = message.trim().toLowerCase()
    
    // Check if user is confirming with "yes" or "confirm"
    if (messageTrimmed === 'yes' || messageTrimmed === 'confirm' || messageTrimmed === 'y') {
      return null // Use current labels
    }
    
    // Parse comma-separated labels
    const labels = messageTrimmed.split(',').map(label => label.trim()).filter(label => label.length > 0)
    
    if (labels.length === expectedCount) {
      return labels
    }
    
    return null // Invalid count - return null instead of undefined
  }

  // Helper function to generate default labels
  const generateDefaultLabels = (count: number): string[] => {
    if (count === 3) {
      return ['Home', 'About', 'Services']
    }
    
    return Array.from({ length: count }, (_, i) => `Button ${i + 1}`)
  }

  // Helper function to parse yes/no response
  const parseYesNo = (message: string): boolean | null => {
    const messageTrimmed = message.trim().toLowerCase()
    
    if (messageTrimmed === 'yes' || messageTrimmed === 'y' || messageTrimmed === 'true') {
      return true
    }
    
    if (messageTrimmed === 'no' || messageTrimmed === 'n' || messageTrimmed === 'false') {
      return false
    }
    
    return null
  }

  // Helper function to detect position-based create commands
  const isPositionBasedCreateCommand = (command: any): boolean => {
    return command.action === 'create' && 
           command.parameters && 
           typeof command.parameters.x === 'number' && 
           typeof command.parameters.y === 'number'
  }

  // Helper function to move viewport to show a specific position
  const moveViewportToPosition = (x: number, y: number, shapeWidth: number = 100, shapeHeight: number = 100) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Calculate the center of the screen
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2
    
    // Calculate the center of the shape
    const shapeCenterX = x + shapeWidth / 2
    const shapeCenterY = y + shapeHeight / 2
    
    // Calculate the new viewport position to center the object
    const newViewportX = centerX - shapeCenterX * viewport.scale
    const newViewportY = centerY - shapeCenterY * viewport.scale
    
    // Update the viewport
    setViewport({
      ...viewport,
      x: newViewportX,
      y: newViewportY
    })
  }

  // Helper function to parse OAuth providers
  const parseOAuthProviders = (message: string): string[] | null => {
    const messageTrimmed = message.trim().toLowerCase()
    
    // Check for "all" response
    if (messageTrimmed === 'all') {
      return ['google', 'github', 'facebook']
    }
    
    // Parse comma-separated providers
    const providers = messageTrimmed.split(',').map(p => p.trim()).filter(p => p.length > 0)
    const validProviders = ['google', 'github', 'facebook']
    const invalidProviders = providers.filter(p => !validProviders.includes(p))
    
    if (invalidProviders.length > 0) {
      return null // Invalid providers
    }
    
    return providers.length > 0 ? providers : null
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return

    const messageContent = inputValue.trim()
    setInputValue('')
    setIsAITyping(true)
    
    // Reset the deselection flag for the next input
    setHasDeselectedForCurrentInput(false)

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
            await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
          } else {
            await sendMessage(`❌ Failed to create shape: ${commandResult.error}`, user.id, 'AI Assistant', 'assistant')
          }
          
          // Reset state
          setPendingCommand(null)
          setIsWaitingForColor(false)
        } else {
          // Invalid color, ask again with examples
          const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
          await sendMessage(`I didn't understand that color. Please choose from: ${rainbowColors.join(', ')}`, user.id, 'AI Assistant', 'assistant')
        }
      } else if (isWaitingForNavbarButtons) {
        // Handle button count response
        const buttonCount = parseButtonCount(messageContent)
        if (buttonCount) {
          const defaultLabels = generateDefaultLabels(buttonCount)
          setPendingNavbarParams({ buttonCount, labels: defaultLabels })
          setIsWaitingForNavbarButtons(false)
          setIsWaitingForNavbarConfirmation(true)
          
          const labelsText = defaultLabels.join(', ')
          await sendMessage(`Great! I'll create ${buttonCount} buttons: [${labelsText}]. Reply 'yes' to confirm or type custom labels separated by commas.`, user.id, 'AI Assistant', 'assistant')
        } else {
          // Invalid count, ask again
          await sendMessage(`Please enter a number between 1 and 10 for the number of buttons.`, user.id, 'AI Assistant', 'assistant')
        }
      } else if (isWaitingForNavbarConfirmation && pendingNavbarParams) {
        // Handle label confirmation/customization
        const customLabels = parseCustomLabels(messageContent, pendingNavbarParams.buttonCount)
        
        if (customLabels === null) {
          // User confirmed with "yes" - use current labels
          const { centerX, centerY } = getViewportCenter()
          const result = await createTemplateShapes('navbar', { 
            templateId: 'navbar', 
            buttonLabels: pendingNavbarParams.labels,
            viewportCenterX: centerX,
            viewportCenterY: centerY
          }, applyCanvasCommand)
          
          if (result.success) {
            const createdCount = result.createdShapes?.length || 0
            await sendMessage(`✅ Created navigation bar with ${createdCount} elements`, user.id, 'AI Assistant', 'assistant')
          } else {
            await sendMessage(`❌ Failed to create navbar: ${result.error}`, user.id, 'AI Assistant', 'assistant')
          }
          
          // Reset navbar state
          setPendingNavbarParams(null)
          setIsWaitingForNavbarConfirmation(false)
        } else if (customLabels && customLabels.length > 0) {
          // User provided custom labels
          const { centerX, centerY } = getViewportCenter()
          const result = await createTemplateShapes('navbar', { 
            templateId: 'navbar', 
            buttonLabels: customLabels,
            viewportCenterX: centerX,
            viewportCenterY: centerY
          }, applyCanvasCommand)
          
          if (result.success) {
            const createdCount = result.createdShapes?.length || 0
            await sendMessage(`✅ Created navigation bar with ${createdCount} elements`, user.id, 'AI Assistant', 'assistant')
          } else {
            await sendMessage(`❌ Failed to create navbar: ${result.error}`, user.id, 'AI Assistant', 'assistant')
          }
          
          // Reset navbar state
          setPendingNavbarParams(null)
          setIsWaitingForNavbarConfirmation(false)
        } else {
          // Invalid label count
          await sendMessage(`Please provide exactly ${pendingNavbarParams.buttonCount} labels separated by commas, or reply 'yes' to use the default labels.`, user.id, 'AI Assistant', 'assistant')
        }
      } else if (isWaitingForLoginRememberMe) {
        // Handle Remember Me response
        const rememberMe = parseYesNo(messageContent)
        if (rememberMe !== null) {
          setPendingLoginParams({ includeRememberMe: rememberMe })
          setIsWaitingForLoginRememberMe(false)
          setIsWaitingForLoginForgotPassword(true)
          
          await sendMessage(`Got it! Include 'Forgot Password' link? (yes/no)`, user.id, 'AI Assistant', 'assistant')
        } else {
          await sendMessage(`Please answer with 'yes' or 'no' for the Remember Me checkbox.`, user.id, 'AI Assistant', 'assistant')
        }
      } else if (isWaitingForLoginForgotPassword && pendingLoginParams) {
        // Handle Forgot Password response
        const forgotPassword = parseYesNo(messageContent)
        if (forgotPassword !== null) {
          setPendingLoginParams({ ...pendingLoginParams, includeForgotPassword: forgotPassword })
          setIsWaitingForLoginForgotPassword(false)
          setIsWaitingForLoginOAuth(true)
          
          await sendMessage(`Perfect! Which OAuth providers: Google, GitHub, Facebook, or all?`, user.id, 'AI Assistant', 'assistant')
        } else {
          await sendMessage(`Please answer with 'yes' or 'no' for the Forgot Password link.`, user.id, 'AI Assistant', 'assistant')
        }
      } else if (isWaitingForLoginOAuth && pendingLoginParams) {
        // Handle OAuth provider response
        const oauthProviders = parseOAuthProviders(messageContent)
        if (oauthProviders) {
          const finalParams = { ...pendingLoginParams, oauthProviders: oauthProviders as ('google' | 'github' | 'facebook')[] }
          
          const { centerX, centerY } = getViewportCenter()
          const result = await createTemplateShapes('login-oauth', { 
            templateId: 'login-oauth', 
            ...finalParams,
            viewportCenterX: centerX,
            viewportCenterY: centerY
          }, applyCanvasCommand)
          
          if (result.success) {
            const createdCount = result.createdShapes?.length || 0
            await sendMessage(`✅ Created login form with ${createdCount} elements`, user.id, 'AI Assistant', 'assistant')
          } else {
            await sendMessage(`❌ Failed to create login form: ${result.error}`, user.id, 'AI Assistant', 'assistant')
          }
          
          // Reset login form state
          setPendingLoginParams(null)
          setIsWaitingForLoginOAuth(false)
        } else {
          await sendMessage(`Please specify OAuth providers: Google, GitHub, Facebook, or all.`, user.id, 'AI Assistant', 'assistant')
        }
      } else {
        // Normal AI command processing
        const response = await aiCanvasCommand(messageContent)
        console.log('[ChatBox] AI Response:', JSON.stringify(response, null, 2))
        
        if (response.success && response.data) {
          const { action, target, parameters } = response.data
          console.log('[ChatBox] Parsed command:', { action, target, parameters })
          
          // Check if this is a template request
          if (isTemplateRequest(action, target)) {
            const templateId = extractTemplateId(target)
            
            // Special handling for navbar - start interactive flow
            if (templateId === 'navbar') {
              setIsWaitingForNavbarButtons(true)
              await sendMessage(`I'll create a navbar with Home, About, Services. How many buttons do you need? [1-10]`, user.id, 'AI Assistant', 'assistant')
            } else if (templateId === 'login-oauth') {
              // Special handling for login form - start interactive flow
              setIsWaitingForLoginRememberMe(true)
              await sendMessage(`I'll create a login form. Include 'Remember Me' checkbox? (yes/no)`, user.id, 'AI Assistant', 'assistant')
            } else {
              // Use shared template logic for other templates
              const templateParams = extractTemplateParams(target, parameters)
              
              const { centerX, centerY } = getViewportCenter()
              const result = await createTemplateShapes(templateId, {
                ...templateParams,
                viewportCenterX: centerX,
                viewportCenterY: centerY
              }, applyCanvasCommand)
              
              if (result.success) {
                // Show success in chat
                const templateName = templateId === 'login-oauth' ? 'login form' : 'template'
                const createdCount = result.createdShapes?.length || 0
                let aiResponse = `✅ Created ${templateName} with ${createdCount} elements`
                
                if (result.details) {
                  aiResponse += `\n\nDetails: ${result.details}`
                }
                await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
              } else {
                // Show error in chat
                await sendMessage(`❌ Failed to create template: ${result.error}`, user.id, 'AI Assistant', 'assistant')
              }
            }
          } else {
            // Handle non-template commands (existing logic)
            // Check if this is a create command without color (skip for complex actions like forms)
            const skipColorCheck = action === 'complex' || 
                                    action === 'layout' ||
                                    target === 'form' ||
                                    target === 'navbar' ||
                                    target === 'card'
            
            if (action === 'create' && !parameters.color && !skipColorCheck) {
              // Ask for color clarification
              const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
              await sendMessage(`You didn't specify a color. What color would you like it to be? Choose from: ${rainbowColors.join(', ')}`, user.id, 'AI Assistant', 'assistant')
              
              // Store the pending command and wait for color response
              setPendingCommand(response.data)
              setIsWaitingForColor(true)
            } else {
              // Check if this is a position-based create command
              if (isPositionBasedCreateCommand(response.data)) {
                // Apply the canvas command
                const commandResult = await applyCanvasCommand(response.data)
                
                if (commandResult.success) {
                  const createdCount = commandResult.createdShapes?.length || 0
                  const hasLayout = parameters.layout
                  
                  // Move viewport to show the newly created object(s)
                  if (createdCount > 0) {
                    // Calculate shape dimensions based on type
                    let shapeWidth = 100
                    let shapeHeight = 60
                    
                    if (target === 'circle') {
                      const radius = parameters.radius || 50
                      shapeWidth = radius * 2
                      shapeHeight = radius * 2
                    } else if (target === 'rectangle') {
                      shapeWidth = parameters.width || 100
                      shapeHeight = parameters.height || 60
                    } else if (target === 'text') {
                      shapeWidth = parameters.width || 200
                      shapeHeight = parameters.height || 40
                    } else if (target === 'triangle') {
                      shapeWidth = parameters.width || 100
                      shapeHeight = parameters.height || 100
                    } else if (target === 'star') {
                      shapeWidth = parameters.width || 100
                      shapeHeight = parameters.height || 100
                    } else if (target === 'arrow') {
                      shapeWidth = parameters.width || 100
                      shapeHeight = parameters.height || 60
                    }
                    
                    // Move viewport to show the object
                    if (parameters.x !== undefined && parameters.y !== undefined) {
                      moveViewportToPosition(parameters.x, parameters.y, shapeWidth, shapeHeight)
                    }
                  }
                  
                  let aiResponse = ''
                  if (hasLayout) {
                    aiResponse = `✅ Created ${createdCount} ${target}(s) in ${hasLayout} layout at position (${parameters.x}, ${parameters.y})`
                  } else {
                    aiResponse = `✅ Created ${createdCount} ${target}(s) at position (${parameters.x}, ${parameters.y})`
                  }
                  
                  await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
                } else {
                  await sendMessage(`❌ Failed to create shape: ${commandResult.error}`, user.id, 'AI Assistant', 'assistant')
                }
              } else {
                // Apply the canvas command normally
                console.log('[ChatBox] Applying canvas command:', JSON.stringify(response.data, null, 2))
                const commandResult = await applyCanvasCommand(response.data)
                console.log('[ChatBox] Command result:', JSON.stringify(commandResult, null, 2))
                
                if (commandResult.success) {
                  let aiResponse = ''
                  
                  if (action === 'create') {
                    const createdCount = commandResult.createdShapes?.length || 0
                    const hasLayout = parameters.layout
                    if (hasLayout) {
                      aiResponse = `✅ Created ${createdCount} ${target}(s) in ${hasLayout} layout`
                    } else {
                      aiResponse = `✅ Created ${createdCount} ${target}(s)`
                    }
                } else if (action === 'manipulate') {
                  // Parse manipulation details
                  const params = parameters
                  const actions: string[] = []
                  if (params.x !== undefined || params.y !== undefined) actions.push('moved')
                  if (params.width !== undefined || params.height !== undefined || params.radius !== undefined) actions.push('resized')
                  if (params.rotation !== undefined || params.rotationDegrees !== undefined || params.rotationDirection !== undefined) actions.push('rotated')
                  if (params.color !== undefined) actions.push('recolored')
                  
                  const actionText = actions.join(', ')
                  aiResponse = `✅ ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${target}`
                } else if (action === 'layout') {
                  const count = commandResult.details?.match(/\d+/)?.[0] || 'shapes'
                  const layoutType = parameters.layout || 'row'
                  aiResponse = `✅ Arranged ${count} shapes in ${layoutType} layout`
                } else if (action === 'complex') {
                  // Handle complex actions (forms, etc.)
                  if (target === 'form') {
                    const createdCount = commandResult.createdShapes?.length || 0
                    const formType = parameters.formType || 'form'
                    aiResponse = `✅ Created ${formType} form with ${createdCount} elements`
                  } else {
                    aiResponse = `✅ Created ${target}`
                  }
                }
                
                if (commandResult.details) {
                  aiResponse += `\n\nDetails: ${commandResult.details}`
                }
                await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
              } else {
                console.error('[ChatBox] Command failed:', commandResult.error, commandResult.details)
                let actionText = 'create'
                if (action === 'manipulate') actionText = 'manipulate'
                else if (action === 'layout') actionText = 'layout'
                else if (action === 'complex') actionText = 'create'
                let aiResponse = `❌ Failed to ${actionText} ${target || 'shape'}: ${commandResult.error}`
                if (commandResult.details) {
                  aiResponse += `\n\nDetails: ${commandResult.details}`
                }
                await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
              }
            }
          }
        }
      } else {
          // Send AI error response
          const aiResponse = `❌ ${response.error}`
          await sendMessage(aiResponse, user.id, 'AI Assistant', 'assistant')
        }
      }
      
      setIsAITyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
      await sendMessage('❌ Failed to process your request. Please try again.', user.id, 'AI Assistant', 'assistant')
      setIsAITyping(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Clear selection when user starts typing (only once per input session)
    if (newValue.trim() && !hasDeselectedForCurrentInput) {
      clearSelection()
      setHasDeselectedForCurrentInput(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    if (!user) return
    
    try {
      await clearMessages(user.id)
    } catch (error) {
      console.error('Error clearing chat:', error)
      // Show error message to user
      await sendMessage('❌ Failed to clear chat. Please try again.', user.id, 'AI Assistant', 'assistant')
    }
  }

  const handleCommandSelect = (command: string) => {
    setInputValue(command)
    setIsCommandsOpen(false)
    // Focus the input field
    setTimeout(() => {
      const inputField = document.querySelector(`.${styles.inputField}`) as HTMLInputElement
      if (inputField) {
        inputField.focus()
      }
    }, 100)
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

  // Check if we're in an interactive flow (navbar or login form creation)
  const isInteractiveFlow = isWaitingForNavbarButtons || 
                            isWaitingForNavbarConfirmation || 
                            isWaitingForLoginRememberMe || 
                            isWaitingForLoginForgotPassword || 
                            isWaitingForLoginOAuth

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.statusIndicator}></div>
          <h3 className={styles.headerTitle}>AI Assistant</h3>
        </div>
        <div className={styles.headerRight}>
          <button
            onClick={() => setIsCommandsOpen(true)}
            className={styles.commandsButton}
            aria-label="Show commands"
            title="Show available commands"
          >
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Commands
          </button>
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
      <div className={`${styles.messagesArea} ${isInteractiveFlow ? styles.messagesAreaCompact : ''}`}>
        {messages.map((message) => (
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
        ))}
        
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
      <div className={`${styles.inputArea} ${isInteractiveFlow ? styles.inputAreaExpanded : ''}`}>
        <div className={`${styles.inputContainer} ${isInteractiveFlow ? styles.inputContainerExpanded : ''}`}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isWaitingForColor 
                ? "Choose a color: red, orange, yellow, green, blue, indigo, violet" 
                : isWaitingForNavbarButtons 
                ? "Enter number of buttons (1-10)..." 
                : isWaitingForNavbarConfirmation 
                ? "Type 'yes' to confirm or enter custom labels..." 
                : isWaitingForLoginRememberMe
                ? "Answer yes/no for Remember Me checkbox..."
                : isWaitingForLoginForgotPassword
                ? "Answer yes/no for Forgot Password link..."
                : isWaitingForLoginOAuth
                ? "Specify OAuth providers: Google, GitHub, Facebook, or all..."
                : "Ask me to create shapes..."
            }
            className={`${styles.inputField} ${isInteractiveFlow ? styles.inputFieldExpanded : ''}`}
            disabled={isAITyping}
            style={isInteractiveFlow ? {} : { resize: 'none', height: 'auto' }}
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

      {/* Commands Window */}
      <CommandsWindow
        isOpen={isCommandsOpen}
        onClose={() => setIsCommandsOpen(false)}
        onCommandSelect={handleCommandSelect}
      />
    </div>
  )
}
