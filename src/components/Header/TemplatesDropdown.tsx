import { useState, useEffect, useRef } from 'react'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'
import { useCanvas } from '../../contexts/CanvasContext'
import { createTemplateShapes, TEMPLATE_INFO } from '../../utils/templateHelpers'

interface Template {
  id: string
  name: string
  description: string
  icon: string
}

const TEMPLATES: Template[] = [
  {
    id: 'login-oauth',
    name: TEMPLATE_INFO['login-oauth'].name,
    description: TEMPLATE_INFO['login-oauth'].description,
    icon: '🔐'
  },
  {
    id: 'navbar',
    name: TEMPLATE_INFO['navbar'].name,
    description: TEMPLATE_INFO['navbar'].description,
    icon: '📋'
  }
]

interface TemplatesDropdownProps {
  documentId: string
}

export default function TemplatesDropdown({ documentId }: TemplatesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showNavbarForm, setShowNavbarForm] = useState(false)
  const [navbarButtonCount, setNavbarButtonCount] = useState(3)
  const [navbarLabels, setNavbarLabels] = useState(['Home', 'About', 'Services'])
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginIncludeRememberMe, setLoginIncludeRememberMe] = useState(true)
  const [loginIncludeForgotPassword, setLoginIncludeForgotPassword] = useState(true)
  const [loginOAuthProviders, setLoginOAuthProviders] = useState<('google' | 'github' | 'facebook')[]>(['google'])
  const menuRef = useRef<HTMLDivElement>(null)
  const { applyCanvasCommand } = useCanvasCommands({ documentId })
  const { viewport } = useCanvas()
  
  // Calculate viewport center for template positioning
  const getViewportCenter = () => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    // Convert screen center to canvas coordinates: (screenCoord - pan) / scale
    const centerX = (windowWidth / 2 - viewport.x) / viewport.scale
    const centerY = (windowHeight / 2 - viewport.y) / viewport.scale
    return { centerX, centerY }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (showNavbarForm || showLoginForm) {
          // Don't close when forms are open - require explicit action
          return
        }
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showNavbarForm) {
          setShowNavbarForm(false)
        } else if (showLoginForm) {
          setShowLoginForm(false)
        } else {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showNavbarForm, showLoginForm])

  // Helper function to manage button count changes
  const handleButtonCountChange = (count: number) => {
    setNavbarButtonCount(count)
    // Extend or trim labels array
    const newLabels = [...navbarLabels]
    while (newLabels.length < count) {
      newLabels.push(`Button ${newLabels.length + 1}`)
    }
    setNavbarLabels(newLabels.slice(0, count))
  }

  // Handle template click - show form for navbar/login, create others directly
  const handleTemplateClick = (templateId: string) => {
    if (templateId === 'navbar') {
      setShowNavbarForm(true)
    } else if (templateId === 'login-oauth') {
      setShowLoginForm(true)
    } else {
      createTemplate(templateId, {})
    }
  }

  // Reset navbar form to defaults
  const resetNavbarForm = () => {
    setNavbarButtonCount(3)
    setNavbarLabels(['Home', 'About', 'Services'])
  }

  // Reset login form to defaults
  const resetLoginForm = () => {
    setLoginIncludeRememberMe(true)
    setLoginIncludeForgotPassword(true)
    setLoginOAuthProviders(['google'])
  }

  // Handle OAuth provider toggle
  const toggleOAuthProvider = (provider: 'google' | 'github' | 'facebook') => {
    setLoginOAuthProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    )
  }

  // Create navbar with custom parameters
  const handleNavbarCreate = async () => {
    if (busy) return
    
    // Validate labels
    const validLabels = navbarLabels.slice(0, navbarButtonCount).filter(l => l.trim())
    if (validLabels.length !== navbarButtonCount) {
      alert('Please fill in all button labels')
      return
    }
    
    setBusy(true)
    try {
      const { centerX, centerY } = getViewportCenter()
      const result = await createTemplateShapes('navbar', { 
        templateId: 'navbar', 
        buttonLabels: validLabels,
        viewportCenterX: centerX,
        viewportCenterY: centerY
      }, applyCanvasCommand)
      
      if (!result.success) {
        console.error('Failed to create navbar:', result.error)
        alert(`Failed to create navbar: ${result.error || 'Unknown error'}`)
      } else {
        setShowNavbarForm(false)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error creating navbar:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Create login form with custom parameters
  const handleLoginCreate = async () => {
    if (busy) return
    
    // Validate OAuth providers
    if (loginOAuthProviders.length === 0) {
      alert('Please select at least one OAuth provider')
      return
    }
    
    setBusy(true)
    try {
      const { centerX, centerY } = getViewportCenter()
      const result = await createTemplateShapes('login-oauth', { 
        templateId: 'login-oauth', 
        includeRememberMe: loginIncludeRememberMe,
        includeForgotPassword: loginIncludeForgotPassword,
        oauthProviders: loginOAuthProviders,
        viewportCenterX: centerX,
        viewportCenterY: centerY
      }, applyCanvasCommand)
      
      if (!result.success) {
        console.error('Failed to create login form:', result.error)
        alert(`Failed to create login form: ${result.error || 'Unknown error'}`)
      } else {
        setShowLoginForm(false)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error creating login form:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const createTemplate = async (templateId: string, params: any = {}) => {
    if (busy) return
    setBusy(true)
    
    try {
      // Use shared template creation logic
      const { centerX, centerY } = getViewportCenter()
      const result = await createTemplateShapes(templateId, {
        ...params,
        viewportCenterX: centerX,
        viewportCenterY: centerY
      }, applyCanvasCommand)
      
      if (!result.success) {
        console.error(`Failed to create ${templateId}:`, result.error)
        alert(`Failed to create template: ${result.error || 'Unknown error'}`)
      }
      
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={busy}
        title="Templates"
        aria-label="Templates"
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontWeight: 500,
        }}
      >
        <span>📋</span>
        <span>Templates</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#0b1220',
            border: '1px solid #1f2937',
            borderRadius: 8,
            minWidth: 280,
            maxWidth: '90vw',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {showNavbarForm ? (
            // Navbar Customization Form
            <>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#E5E7EB', padding: '4px 8px' }}>
                Customize Navigation Bar
              </div>
              
              {/* Button Count Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#9CA3AF' }}>Number of buttons:</label>
                <select
                  value={navbarButtonCount}
                  onChange={(e) => handleButtonCountChange(parseInt(e.target.value))}
                  disabled={busy}
                  style={{
                    background: '#111827',
                    color: '#E5E7EB',
                    border: '1px solid #374151',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 14,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              {/* Button Labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#9CA3AF' }}>Button Labels:</label>
                {Array.from({ length: navbarButtonCount }, (_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 20 }}>{i + 1}.</span>
                    <input
                      type="text"
                      value={navbarLabels[i] || ''}
                      onChange={(e) => {
                        const newLabels = [...navbarLabels]
                        newLabels[i] = e.target.value
                        setNavbarLabels(newLabels)
                      }}
                      placeholder={`Button ${i + 1}`}
                      disabled={busy}
                      style={{
                        background: '#111827',
                        color: '#E5E7EB',
                        border: '1px solid #374151',
                        borderRadius: 6,
                        padding: '6px 8px',
                        fontSize: 14,
                        flex: 1,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                <button
                  onClick={resetNavbarForm}
                  disabled={busy}
                  style={{
                    background: '#374151',
                    color: '#E5E7EB',
                    border: '1px solid #4B5563',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                  }}
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => setShowNavbarForm(false)}
                  disabled={busy}
                  style={{
                    background: '#374151',
                    color: '#E5E7EB',
                    border: '1px solid #4B5563',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNavbarCreate}
                  disabled={busy}
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: '1px solid #2563EB',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                    fontWeight: 500,
                  }}
                >
                  Create Navbar
                </button>
              </div>
            </>
          ) : showLoginForm ? (
            // Login Form Customization Form
            <>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#E5E7EB', padding: '4px 8px' }}>
                Customize Login Form
              </div>
              
              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={loginIncludeRememberMe}
                  onChange={(e) => setLoginIncludeRememberMe(e.target.checked)}
                  disabled={busy}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                  Include Remember Me checkbox
                </label>
              </div>

              {/* Forgot Password Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="forgotPassword"
                  checked={loginIncludeForgotPassword}
                  onChange={(e) => setLoginIncludeForgotPassword(e.target.checked)}
                  disabled={busy}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                />
                <label htmlFor="forgotPassword" style={{ fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                  Include Forgot Password link
                </label>
              </div>

              {/* OAuth Providers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#9CA3AF' }}>OAuth Providers:</label>
                {(['google', 'github', 'facebook'] as const).map(provider => (
                  <div key={provider} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id={`oauth-${provider}`}
                      checked={loginOAuthProviders.includes(provider)}
                      onChange={() => toggleOAuthProvider(provider)}
                      disabled={busy}
                      style={{
                        width: 16,
                        height: 16,
                        cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <label htmlFor={`oauth-${provider}`} style={{ fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </label>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                <button
                  onClick={resetLoginForm}
                  disabled={busy}
                  style={{
                    background: '#374151',
                    color: '#E5E7EB',
                    border: '1px solid #4B5563',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                  }}
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => setShowLoginForm(false)}
                  disabled={busy}
                  style={{
                    background: '#374151',
                    color: '#E5E7EB',
                    border: '1px solid #4B5563',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoginCreate}
                  disabled={busy}
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: '1px solid #2563EB',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    flex: 1,
                    fontWeight: 500,
                  }}
                >
                  Create Login Form
                </button>
              </div>
            </>
          ) : (
            // Template List
            <>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#E5E7EB', padding: '4px 8px' }}>
                Quick Templates
              </div>
              
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  disabled={busy}
                  style={{
                    background: '#111827',
                    color: '#E5E7EB',
                    border: '1px solid #1f2937',
                    borderRadius: 6,
                    padding: '10px 12px',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) e.currentTarget.style.background = '#1f2937'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#111827'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{template.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{template.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', paddingLeft: 26 }}>
                    {template.description}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

