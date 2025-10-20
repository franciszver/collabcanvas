import { useEffect, useRef, useState } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { exportViewportAsPNG, hasVisibleShapes } from '../../utils/canvasExport'

export default function ExportDropdown() {
  const { getStageRef, viewport, rectangles } = useCanvas()
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Check if there are visible shapes in the viewport
  const canExport = hasVisibleShapes(viewport, rectangles)

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

  const handleExport = async () => {
    if (!canExport || isExporting) return

    setIsExporting(true)
    try {
      const stageRef = getStageRef()
      await exportViewportAsPNG(stageRef, viewport, rectangles)
      setOpen(false) // Close dropdown after successful export
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export Canvas"
        title={canExport ? "Export Canvas" : "No shapes visible in viewport"}
        disabled={!canExport}
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '8px 10px',
          cursor: canExport ? 'pointer' : 'not-allowed',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 16,
          opacity: canExport ? 1 : 0.5,
        }}
      >
        <span aria-hidden>📸</span>
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
            minWidth: 200,
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 10,
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Export Viewport</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            Export current viewport as a high-quality PNG image
          </div>
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            style={{
              background: canExport ? '#0369a1' : '#374151',
              color: canExport ? '#E0F2FE' : '#9CA3AF',
              border: `1px solid ${canExport ? '#0284c7' : '#4B5563'}`,
              borderRadius: 6,
              padding: '8px 12px',
              cursor: canExport && !isExporting ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
              opacity: canExport && !isExporting ? 1 : 0.6,
            }}
          >
            {isExporting ? 'Exporting...' : 'Export as PNG'}
          </button>
          {!canExport && (
            <div style={{ 
              fontSize: 11, 
              color: '#F59E0B', 
              marginTop: 4,
              padding: '6px 8px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: 4,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              ⚠ No shapes visible in current viewport
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

