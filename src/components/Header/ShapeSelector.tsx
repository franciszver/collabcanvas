import { useState, useEffect, useRef } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { generateRectId, getRandomColor } from '../../utils/helpers'

const SHAPES = [
  { key: 'rect', label: 'Rectangle', icon: '■' },
  { key: 'circle', label: 'Circle', icon: '●' },
  { key: 'triangle', label: 'Triangle', icon: '▲' },
  { key: 'star', label: 'Star', icon: '★' },
  { key: 'arrow', label: 'Arrow', icon: '➜' },
  { key: 'text', label: 'Text', icon: 'T' },
] as const

export default function ShapeSelector() {
  const { rectangles, addRectangle } = useCanvas()
  const [busy, setBusy] = useState(false)
  const [color, setColor] = useState<string>('#60A5FA')
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const computePosition = () => {
    const index = rectangles.length % 10
    const baseX = 20
    const baseY = 80
    return { x: baseX + index * 50, y: baseY + index * 50 }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const createShape = async (type: typeof SHAPES[number]['key']) => {
    if (busy) return
    setBusy(true)
    try {
      const id = generateRectId()
      const pos = computePosition()
      
      // Set default size based on shape type
      const isText = type === 'text'
      const width = isText ? 400 : 200
      const height = isText ? 100 : 100
      
      const shapeData = { 
        id, 
        x: pos.x, 
        y: pos.y, 
        width, 
        height, 
        fill: color || getRandomColor(), 
        type: type,
        text: isText ? 'Enter Text' : undefined,
        fontSize: isText ? 64 : undefined
      }
      
      await addRectangle(shapeData)
      setIsOpen(false) // Close menu after creating shape
    } catch (error) {
      // Shape creation failed, but we're not logging to console
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={busy}
        title="Create shapes"
        aria-label="Create shapes"
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          lineHeight: 1,
          cursor: busy ? 'not-allowed' : 'pointer',
          minWidth: 36,
          height: 36,
        }}
      >
        <span>{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#0b1220',
            border: '1px solid #1f2937',
            borderRadius: 8,
            minWidth: 200,
            maxWidth: '90vw',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#E5E7EB' }}>
            Create Shape
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SHAPES.map((s) => (
              <button
                key={s.key}
                onClick={() => createShape(s.key)}
                disabled={busy}
                title={s.label}
                aria-label={s.label}
                style={{
                  background: '#111827',
                  color: '#E5E7EB',
                  border: '1px solid #1f2937',
                  borderRadius: 6,
                  padding: '6px 10px',
                  minWidth: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  lineHeight: 1,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  gap: 6,
                }}
              >
                <span>{s.icon}</span>
                <span style={{ fontSize: 12 }}>{s.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <label style={{ fontSize: 12, color: '#9CA3AF' }}>Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="New shape color"
              style={{ 
                width: 32, 
                height: 32, 
                background: 'transparent', 
                border: '1px solid #1f2937', 
                borderRadius: 6, 
                padding: 0,
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}


