import React from 'react'

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {shortcuts.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{item.description}</span>
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">?</kbd> to toggle this help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
