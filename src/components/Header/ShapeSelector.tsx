import { useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { generateRectId, getRandomColor } from '../../utils/helpers'

const SHAPES = [
  { key: 'rect', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'star', label: 'Star' },
] as const

export default function ShapeSelector() {
  const { rectangles, addRectangle } = useCanvas()
  const [busy, setBusy] = useState(false)

  const computePosition = () => {
    const index = rectangles.length % 10
    const baseX = 20
    const baseY = 80
    return { x: baseX + index * 50, y: baseY + index * 50 }
  }

  const createShape = async (type: string) => {
    if (busy) return
    setBusy(true)
    try {
      const id = generateRectId()
      const pos = computePosition()
      // Store as rectangle shape record; Canvas renderer will respect `type`
      await addRectangle({ id, x: pos.x, y: pos.y, width: 200, height: 100, fill: getRandomColor(), type: type as any })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Create shape:</span>
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
    </div>
  )
}


