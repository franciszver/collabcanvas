import { useEffect, useMemo, useRef, useState } from 'react'
import usePresence from '../../hooks/usePresence'
import { useCanvas } from '../../contexts/CanvasContext'
import { useAuth } from '../../contexts/AuthContext'
import { generateRectId, getRandomColor, transformCanvasCoordinates } from '../../utils/helpers'

export default function DetailsDropdown() {
  const { onlineUsers, onlineCount } = usePresence()
  const { rectangles, clearAllRectangles, isLoading, addRectangle, viewport } = useCanvas()
  const { signOut } = useAuth()
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

  const label = useMemo(() => '☰', [])
  const rectCount = rectangles.length
  const shapeCounts = useMemo(() => {
    let rect = 0, circ = 0, tri = 0, star = 0, text = 0, arrow = 0
    for (const r of rectangles) {
      if (r.type === 'circle') circ++
      else if (r.type === 'triangle') tri++
      else if (r.type === 'star') star++
      else if (r.type === 'text') text++
      else if (r.type === 'arrow') arrow++
      else rect++
    }
    return { rect, circ, tri, star, text, arrow, total: rectangles.length }
  }, [rectangles])
  const canClear = !busy && !isLoading && rectCount > 0
  const canGenerate = !busy && !isLoading

  const randomCanvasPosition = () => {
    const sx = Math.max(0, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200))
    const sy = Math.max(0, Math.random() * Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - 120)) + 80
    return transformCanvasCoordinates(sx, sy, viewport)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menu"
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
        }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>{label}</span>
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
            minWidth: 260,
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 10,
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Users ({onlineCount})</div>
          {onlineUsers.length === 0 ? (
            <div style={{ padding: '6px 4px', color: '#9CA3AF' }}>No one online</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {onlineUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ width: 8, height: 8, background: '#10B981', borderRadius: 9999, display: 'inline-block' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name ?? 'Unknown'}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: '#1f2937', margin: '6px 0' }} />
          <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: 'auto auto', rowGap: 4, columnGap: 12 }}>
            <div>Rectangles:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.rect}</div>
            <div>Circles:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.circ}</div>
            <div>Triangles:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.tri}</div>
            <div>Stars:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.star}</div>
            <div>Text:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.text}</div>
            <div>Arrows:</div><div style={{ color: '#93C5FD' }}>{shapeCounts.arrow}</div>
            <div style={{ fontWeight: 600 }}>Total:</div><div style={{ color: '#60A5FA', fontWeight: 600 }}>{shapeCounts.total}</div>
          </div>

          <div style={{ height: 1, background: '#1f2937', margin: '6px 0' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={async () => {
                if (!canGenerate) return
                setBusy(true)
                try {
                  const target = 500
                  const need = Math.max(0, target - rectangles.length)
                  const types = ['rect', 'circle', 'triangle', 'star', 'arrow'] as const
                  for (let i = 0; i < need; i++) {
                    const id = generateRectId()
                    const pos = randomCanvasPosition()
                    const t = types[Math.floor(Math.random() * types.length)]
                    const fill = getRandomColor()
                    const w = t === 'rect' ? 200 : t === 'arrow' ? 220 : 120
                    const h = t === 'rect' ? 100 : t === 'arrow' ? 20 : 120
                    await addRectangle({ id, x: pos.x, y: pos.y, width: w, height: h, fill, type: t })
                  }
                } finally {
                  setBusy(false)
                }
              }}
              disabled={!canGenerate}
              title="Random 500"
              style={{
                background: '#0B4F1A',
                color: '#D1FAE5',
                border: '1px solid #065F46',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                opacity: canGenerate ? 1 : 0.6,
                marginRight: 'auto',
              }}
            >
              {busy ? 'Generating…' : 'Random 500'}
            </button>
            <button
              onClick={async () => {
                if (!canClear) return
                if (!window.confirm('Clear all shapes for everyone? This cannot be undone.')) return
                setBusy(true)
                try {
                  await clearAllRectangles()
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
                padding: '6px 10px',
                cursor: canClear ? 'pointer' : 'not-allowed',
                opacity: canClear ? 1 : 0.6,
              }}
            >
              {busy ? 'Clearing…' : 'Clear all'}
            </button>
            <button
              onClick={() => signOut()}
              style={{
                background: '#111827',
                color: '#E5E7EB',
                border: '1px solid #374151',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}


