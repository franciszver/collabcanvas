import { useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { generateRectId, getRandomColor, transformCanvasCoordinates } from '../../utils/helpers'

const SHAPES = [
  { key: 'rect', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'star', label: 'Star' },
  { key: 'arrow', label: 'Arrow' },
] as const

export default function ShapeSelector() {
  const { rectangles, addRectangle, viewport } = useCanvas() as any
  const [busy, setBusy] = useState(false)
  const [color, setColor] = useState<string>('#60A5FA')

  const computePosition = () => {
    const index = rectangles.length % 10
    const baseX = 20
    const baseY = 80
    return { x: baseX + index * 50, y: baseY + index * 50 }
  }

  const randomCanvasPosition = () => {
    const sx = Math.max(0, Math.random() * window.innerWidth)
    const sy = Math.max(0, Math.random() * Math.max(0, window.innerHeight - 120)) + 80
    return transformCanvasCoordinates(sx, sy, viewport)
  }

  const createShape = async (type: string) => {
    if (busy) return
    setBusy(true)
    try {
      const id = generateRectId()
      const pos = computePosition()
      // Store as rectangle shape record; Canvas renderer will respect `type`
      await addRectangle({ id, x: pos.x, y: pos.y, width: 200, height: 100, fill: color || getRandomColor(), type: type as any })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Create shape:</span>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        title="Shape color"
        style={{ width: 28, height: 28, background: 'transparent', border: '1px solid #1f2937', borderRadius: 6, padding: 0 }}
      />
      {SHAPES.map((s) => (
        <button
          key={s.key}
          onClick={() => createShape(s.key)}
          disabled={busy}
          style={{
            background: '#111827',
            color: '#E5E7EB',
            border: '1px solid #1f2937',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {s.label}
        </button>
      ))}
      <button
        onClick={async () => {
          if (busy) return
          setBusy(true)
          try {
            const target = 500
            const need = Math.max(0, target - rectangles.length)
            const types = ['rect', 'circle', 'triangle', 'star', 'arrow'] as const
            for (let i = 0; i < need; i++) {
              const id = generateRectId()
              const pos = randomCanvasPosition()
              const t = types[Math.floor(Math.random() * types.length)]
              const fill = color || getRandomColor()
              // Size defaults by type
              const w = t === 'rect' ? 200 : t === 'arrow' ? 220 : 120
              const h = t === 'rect' ? 100 : t === 'arrow' ? 20 : 120
              await addRectangle({ id, x: pos.x, y: pos.y, width: w, height: h, fill, type: t as any })
            }
          } finally {
            setBusy(false)
          }
        }}
        disabled={busy}
        title="Random 500"
        style={{
          background: '#0B4F1A',
          color: '#D1FAE5',
          border: '1px solid #065F46',
          borderRadius: 6,
          padding: '4px 8px',
          cursor: busy ? 'not-allowed' : 'pointer',
          marginLeft: 8,
        }}
      >
        Random 500
      </button>
    </div>
  )
}


