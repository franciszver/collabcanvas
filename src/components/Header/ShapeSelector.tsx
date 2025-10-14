import { useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { generateRectId, getRandomColor } from '../../utils/helpers'

const SHAPES = [
  { key: 'rect', label: 'Rectangle', icon: '▭' },
  { key: 'circle', label: 'Circle', icon: '●' },
  { key: 'triangle', label: 'Triangle', icon: '▲' },
  { key: 'star', label: 'Star', icon: '★' },
  { key: 'arrow', label: 'Arrow', icon: '➜' },
] as const

export default function ShapeSelector() {
  const { rectangles, addRectangle } = useCanvas() as any
  const [busy, setBusy] = useState(false)
  const [color, setColor] = useState<string>('#60A5FA')

  const computePosition = () => {
    const index = rectangles.length % 10
    const baseX = 20
    const baseY = 80
    return { x: baseX + index * 50, y: baseY + index * 50 }
  }

  // Deterministic placement only; random generation moved to DetailsDropdown

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
            padding: '4px 8px',
            minWidth: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            lineHeight: 1,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {s.icon}
        </button>
      ))}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        title="New shape color"
        style={{ width: 28, height: 28, background: 'transparent', border: '1px solid #1f2937', borderRadius: 6, padding: 0, marginLeft: 6 }}
      />
      {/* Random 500 moved into header DetailsDropdown */}
    </div>
  )
}


