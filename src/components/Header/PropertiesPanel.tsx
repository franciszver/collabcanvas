import { useCanvas } from '../../contexts/CanvasContext'
import type { Rectangle } from '../../types/canvas.types'

export default function PropertiesPanel() {
  const { selectedId, rectangles, updateRectangle, deleteRectangle } = useCanvas() as any
  if (!selectedId) return null
  const sel: Rectangle | undefined = rectangles.find((r: Rectangle) => r.id === selectedId)
  if (!sel) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Properties:</span>
      <input
        type="color"
        value={sel.fill}
        onChange={(e) => updateRectangle(sel.id, { fill: e.target.value })}
        title="Color"
        style={{ width: 28, height: 28, background: 'transparent', border: '1px solid #1f2937', borderRadius: 6, padding: 0 }}
      />
      <button
        onClick={() => updateRectangle(sel.id, { z: (sel.z ?? 0) + 1 })}
        title="Layer up"
        style={{ background: '#0b3a1a', color: '#D1FAE5', border: '1px solid #065F46', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
      >
        Layer ↑
      </button>
      <button
        onClick={() => updateRectangle(sel.id, { z: Math.max(0, (sel.z ?? 0) - 1) })}
        title="Layer down"
        style={{ background: '#3a0b0b', color: '#FECACA', border: '1px solid #7F1D1D', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
      >
        Layer ↓
      </button>
      <button
        onClick={() => deleteRectangle(sel.id)}
        title="Delete"
        style={{ background: '#7f1d1d', color: '#FEE2E2', border: '1px solid #b91c1c', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
      >
        Delete
      </button>
    </div>
  )
}


