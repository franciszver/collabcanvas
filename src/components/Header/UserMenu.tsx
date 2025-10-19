import { useEffect, useRef, useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { useAuth } from '../../contexts/AuthContext'

export default function UserMenu() {
  const { clearAllRectangles, isLoading, rectangles } = useCanvas()
  const { signOut, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!open) return
      if (menuRef.current && menuRef.current.contains(t)) return
      if (btnRef.current && btnRef.current.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const canClear = !busy && !isLoading && rectangles.length > 0

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User Menu"
        title="User Menu"
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 16,
        }}
      >
        <span aria-hidden>👤</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 6,
            background: '#0b1220',
            border: '1px solid #1f2937',
            borderRadius: 8,
            minWidth: 220,
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 10,
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ 
            fontWeight: 600, 
            fontSize: 13, 
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {user?.email || 'User'}
          </div>

          <div style={{ height: 1, background: '#1f2937', margin: '2px 0' }} />
          
          <button
            onClick={async () => {
              if (!canClear) return
              if (!window.confirm('Clear all shapes for everyone? This cannot be undone.')) return
              setBusy(true)
              try {
                await clearAllRectangles()
                setOpen(false)
              } finally {
                setBusy(false)
              }
            }}
            disabled={!canClear}
            style={{
              background: '#7f1d1d',
              color: '#FEE2E2',
              border: '1px solid #991b1b',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: canClear ? 'pointer' : 'not-allowed',
              opacity: canClear ? 1 : 0.6,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🗑️</span>
            <span>{busy ? 'Clearing…' : 'Clear All Canvas'}</span>
          </button>
          
          <button
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            style={{
              background: '#111827',
              color: '#E5E7EB',
              border: '1px solid #374151',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

