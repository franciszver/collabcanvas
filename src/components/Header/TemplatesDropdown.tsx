import { useState, useEffect, useRef } from 'react'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'
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
  const menuRef = useRef<HTMLDivElement>(null)
  const { applyCanvasCommand } = useCanvasCommands({ documentId })

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
      // Use default parameters for templates
      let params: any = {}
      
      if (templateId === 'navbar') {
        // Use default navbar labels (no prompting)
        params.buttonLabels = ['Home', 'About', 'Services']
      }
      
      // Use shared template creation logic
      const result = await createTemplateShapes(templateId, params, applyCanvasCommand)
      
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

