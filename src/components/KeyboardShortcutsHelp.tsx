
interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Selection',
      items: [
        { keys: 'Ctrl+A', description: 'Select all shapes' },
        { keys: 'Shift+Click', description: 'Toggle shape selection' },
        { keys: 'Space+Drag', description: 'Box selection' },
        { keys: 'Escape', description: 'Clear selection and unlock' },
        { keys: '?', description: 'Show this help' },
      ]
    },
    {
      category: 'Editing',
      items: [
        { keys: 'Delete/Backspace', description: 'Delete selected shapes' },
        { keys: 'Ctrl+D', description: 'Duplicate selected shapes' },
        { keys: 'Ctrl+L', description: 'Lock selected shapes' },
        { keys: 'Ctrl+U', description: 'Unlock selected shapes' },
      ]
    },
    {
      category: 'Smart Selection',
      items: [
        { keys: 'Ctrl+S', description: 'Select similar shapes' },
        { keys: 'Ctrl+T', description: 'Select by type' },
        { keys: 'Ctrl+Shift+C', description: 'Select by color' },
      ]
    },
    {
      category: 'Layer Management',
      items: [
        { keys: 'Ctrl+]', description: 'Bring to front' },
        { keys: 'Ctrl+[', description: 'Send to back' },
      ]
    },
    {
      category: 'Movement',
      items: [
        { keys: 'Arrow Keys', description: 'Nudge shapes (1px)' },
        { keys: 'Shift+Arrow', description: 'Nudge shapes (10px)' },
      ]
    },
    {
      category: 'Grouping',
      items: [
        { keys: 'Ctrl+G', description: 'Group selected shapes' },
        { keys: 'Ctrl+Shift+G', description: 'Ungroup selected shapes' },
      ]
    },
    {
      category: 'Canvas Navigation',
      items: [
        { keys: 'Mouse Wheel', description: 'Zoom in/out' },
        { keys: 'Drag (empty space)', description: 'Pan canvas' },
        { keys: 'Ctrl+0', description: 'Reset zoom to fit' },
      ]
    }
  ]

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ 
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '42rem',
          width: '100%',
          margin: '0 1rem',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1001
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              style={{ 
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {shortcuts.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                  {category.category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {category.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '0.25rem'
                      }}
                    >
                      <span style={{ color: '#374151' }}>{item.description}</span>
                      <kbd style={{ 
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#E5E7EB',
                        color: '#1F2937',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center' }}>
              Press <kbd style={{ 
                padding: '0.125rem 0.25rem',
                backgroundColor: '#E5E7EB',
                borderRadius: '0.125rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}>?</kbd> to toggle this help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
