import { useState, useEffect, useRef } from 'react'
import { aiCanvasCommand } from '../../services/ai'

interface Template {
  id: string
  name: string
  description: string
  icon: string
}

const TEMPLATES: Template[] = [
  {
    id: 'login-oauth',
    name: 'Login Form',
    description: 'User ID, password, Google OAuth',
    icon: '🔐'
  },
  {
    id: 'navbar',
    name: 'Navigation Bar',
    description: 'Customizable menu buttons',
    icon: '📋'
  }
]

export default function TemplatesDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
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
  }, [isOpen])

  const createTemplate = async (templateId: string) => {
    if (busy) return
    setBusy(true)
    
    try {
      if (templateId === 'login-oauth') {
        // Create login form with OAuth
        const response = await aiCanvasCommand('create a login form with userid, password, and OAuth button for google login')
        if (!response.success) {
          console.error('Failed to create login form:', response.error)
          alert('Failed to create login form. Please try again.')
        }
      } else if (templateId === 'navbar') {
        // Prompt for navbar button labels
        const labels = prompt('Enter button labels (comma-separated):', 'Home, About, Services, Contact')
        if (labels === null) {
          // User cancelled
          setBusy(false)
          return
        }
        
        const trimmedLabels = labels.trim()
        if (trimmedLabels === '') {
          // Empty input, use defaults
          const response = await aiCanvasCommand('create a navbar')
          if (!response.success) {
            console.error('Failed to create navbar:', response.error)
            alert('Failed to create navbar. Please try again.')
          }
        } else {
          // Use custom labels
          const response = await aiCanvasCommand(`create a navbar with buttons labeled ${trimmedLabels}`)
          if (!response.success) {
            console.error('Failed to create navbar:', response.error)
            alert('Failed to create navbar. Please try again.')
          }
        }
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
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#E5E7EB', padding: '4px 8px' }}>
            Quick Templates
          </div>
          
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => createTemplate(template.id)}
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
        </div>
      )}
    </div>
  )
}

