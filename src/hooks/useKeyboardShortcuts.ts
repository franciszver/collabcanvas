import { useEffect, useCallback, useState } from 'react'
import { useCanvas } from '../contexts/CanvasContext'
import { generateRectId } from '../utils/helpers'

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts({ enabled = true }: UseKeyboardShortcutsOptions = {}) {
  const [showHelp, setShowHelp] = useState(false)
  
  const {
    selectedIds,
    selectAll,
    clearSelection,
    getSelectedShapes,
    deleteRectangle,
    addRectangle,
    rectangles,
    bringToFront,
    sendToBack,
    nudgeShapes,
    lockSelectedShapes,
    unlockSelectedShapes,
    groupShapes,
    ungroupShapes,
    selectSimilar,
    selectByType,
    selectByColor
  } = useCanvas()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // Don't trigger if disabled
    if (!enabled) return

    const isCtrlOrCmd = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey

    switch (e.key) {
      case 'a':
      case 'A':
        if (isCtrlOrCmd) {
          e.preventDefault()
          selectAll()
        }
        break

      case 'Escape':
        e.preventDefault()
        clearSelection()
        break

      case 'Delete':
      case 'Backspace':
        if (selectedIds.size > 0) {
          e.preventDefault()
          // Delete all selected shapes
          const selectedShapes = getSelectedShapes()
          if (selectedShapes.length > 5) {
            // Show confirmation for large selections
            if (confirm(`Delete ${selectedShapes.length} shapes?`)) {
              selectedShapes.forEach(shape => deleteRectangle(shape.id))
            }
          } else {
            selectedShapes.forEach(shape => deleteRectangle(shape.id))
          }
        }
        break

      case 'd':
      case 'D':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Duplicate selected shapes
          const selectedShapes = getSelectedShapes()
          if (selectedShapes.length > 0) {
            const cascadeOffset = 30
            const maxZ = Math.max(...rectangles.map(r => r.z ?? 0))
            
            selectedShapes.forEach((shape, index) => {
              const newId = generateRectId()
              const duplicatedShape = {
                ...shape,
                id: newId,
                x: shape.x + (index + 1) * cascadeOffset,
                y: shape.y + (index + 1) * cascadeOffset,
                z: maxZ + index + 1
              }
              addRectangle(duplicatedShape)
            })
          }
        }
        break

      case 'g':
      case 'G':
        if (isCtrlOrCmd) {
          e.preventDefault()
          if (isShift) {
            // Ctrl+Shift+G: Ungroup
            if (selectedIds.size > 0) {
              ungroupShapes(Array.from(selectedIds)).catch(console.error)
            }
          } else {
            // Ctrl+G: Group
            if (selectedIds.size >= 2) {
              groupShapes(Array.from(selectedIds)).catch(console.error)
            }
          }
        }
        break

      case ']':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Bring to front
          if (selectedIds.size > 0) {
            bringToFront(Array.from(selectedIds)).catch(console.error)
          }
        }
        break

      case '[':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Send to back
          if (selectedIds.size > 0) {
            sendToBack(Array.from(selectedIds)).catch(console.error)
          }
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (selectedIds.size > 0) {
          e.preventDefault()
          // Nudge selected shapes
          const nudgeAmount = isShift ? 10 : 1
          let deltaX = 0
          let deltaY = 0
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -nudgeAmount
              break
            case 'ArrowDown':
              deltaY = nudgeAmount
              break
            case 'ArrowLeft':
              deltaX = -nudgeAmount
              break
            case 'ArrowRight':
              deltaX = nudgeAmount
              break
          }
          
          nudgeShapes(Array.from(selectedIds), deltaX, deltaY).catch(console.error)
        }
        break

      case 'l':
      case 'L':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Lock/unlock selected shapes
          if (selectedIds.size > 0) {
            // For now, just lock (we could add logic to check if already locked)
            lockSelectedShapes().catch(console.error)
          }
        }
        break

      case 'u':
      case 'U':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Unlock selected shapes
          if (selectedIds.size > 0) {
            unlockSelectedShapes().catch(console.error)
          }
        }
        break

      case 's':
      case 'S':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Select similar shapes
          if (selectedIds.size > 0) {
            const selectedShapes = getSelectedShapes()
            if (selectedShapes.length > 0) {
              selectSimilar(selectedShapes[0].id)
            }
          }
        }
        break

      case 't':
      case 'T':
        if (isCtrlOrCmd) {
          e.preventDefault()
          // Select by type
          if (selectedIds.size > 0) {
            const selectedShapes = getSelectedShapes()
            if (selectedShapes.length > 0) {
              selectByType(selectedShapes[0].type || 'rect')
            }
          }
        }
        break

      case 'c':
      case 'C':
        if (isCtrlOrCmd && isShift) {
          e.preventDefault()
          // Select by color (Ctrl+Shift+C to avoid conflict with copy)
          if (selectedIds.size > 0) {
            const selectedShapes = getSelectedShapes()
            if (selectedShapes.length > 0) {
              selectByColor(selectedShapes[0].fill)
            }
          }
        }
        break

      case '?':
        // Show keyboard shortcuts help
        e.preventDefault()
        setShowHelp(true)
        break

      default:
        // No action for other keys
        break
    }
  }, [
    enabled,
    selectedIds,
    selectAll,
    clearSelection,
    getSelectedShapes,
    deleteRectangle,
    addRectangle,
    rectangles,
    bringToFront,
    sendToBack,
    nudgeShapes,
    lockSelectedShapes,
    unlockSelectedShapes,
    groupShapes,
    ungroupShapes,
    selectSimilar,
    selectByType,
    selectByColor
  ])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return {
    // Expose any methods that might be useful
    handleKeyDown,
    showHelp,
    setShowHelp
  }
}

export default useKeyboardShortcuts
