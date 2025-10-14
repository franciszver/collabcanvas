import { useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'

export default function ClearAllButton() {
  const { clearAllRectangles, rectangles, isLoading } = useCanvas()
  const [busy, setBusy] = useState(false)
  const disabled = busy || isLoading || rectangles.length === 0
  return (
    <button
      onClick={async () => {
        if (disabled) return
        if (!window.confirm('Clear all rectangles for everyone? This cannot be undone.')) return
        setBusy(true)
        try {
          await clearAllRectangles()
        } finally {
          setBusy(false)
        }
      }}
      disabled={disabled}
      title={disabled ? 'No rectangles to clear' : 'Clear all rectangles'}
      style={{
        background: '#7f1d1d',
        color: '#FEE2E2',
        border: '1px solid #991b1b',
        borderRadius: 6,
        padding: '6px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {busy ? 'Clearing…' : 'Clear all'}
    </button>
  )
}


