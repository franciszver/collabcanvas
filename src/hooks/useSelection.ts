import { useState, useCallback, useRef, useEffect } from 'react'
import type { Rectangle, SelectionState, SelectionBoxCoords } from '../types/canvas.types'
import { lockShapes, unlockShapes, canLockShapes, hasLockedShapes } from '../services/locking'
import { useAuth } from '../contexts/AuthContext'

export interface UseSelectionOptions {
  shapes: Rectangle[]
  onSelectionChange?: (selectedIds: Set<string>) => void
  maxSelection?: number
}

export interface UseSelectionReturn {
  // Selection state
  selectedIds: Set<string>
  isBoxSelecting: boolean
  selectionBox: SelectionBoxCoords | null
  isSpacePressed: boolean
  
  // Selection methods
  selectShape: (shapeId: string) => void
  deselectShape: (shapeId: string) => void
  toggleShape: (shapeId: string) => void
  selectAll: () => void
  clearSelection: () => void
  selectInBox: (box: SelectionBoxCoords) => void
  
  // Box selection methods
  startBoxSelection: (x: number, y: number) => void
  updateBoxSelection: (x: number, y: number) => void
  endBoxSelection: () => void
  
  // Locking methods
  lockSelectedShapes: () => Promise<void>
  unlockSelectedShapes: () => Promise<void>
  
  // Utility methods
  isSelected: (shapeId: string) => boolean
  getSelectedShapes: () => Rectangle[]
  canSelect: (shapeId: string) => boolean
  hasSelection: boolean
  selectionCount: number
}

export function useSelection({ 
  shapes, 
  onSelectionChange, 
  maxSelection = 100 
}: UseSelectionOptions): UseSelectionReturn {
  const { user } = useAuth()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBoxSelecting, setIsBoxSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<SelectionBoxCoords | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  
  const boxStartRef = useRef<{ x: number; y: number } | null>(null)
  const lastSelectionRef = useRef<Set<string>>(new Set())

  // Track space key for box selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture space if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't capture space if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        // End box selection if space is released
        if (isBoxSelecting) {
          endBoxSelection()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isBoxSelecting])

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds)
    }
    lastSelectionRef.current = new Set(selectedIds)
  }, [selectedIds, onSelectionChange])

  // Selection methods
  const selectShape = useCallback((shapeId: string) => {
    if (selectedIds.size >= maxSelection) {
      console.warn(`Maximum selection limit of ${maxSelection} reached`)
      return
    }

    const shape = shapes.find(s => s.id === shapeId)
    if (!shape || !canSelect(shapeId)) return

    setSelectedIds(prev => new Set([...prev, shapeId]))
  }, [selectedIds.size, maxSelection, shapes])

  const deselectShape = useCallback((shapeId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(shapeId)
      return next
    })
  }, [])

  const toggleShape = useCallback((shapeId: string) => {
    if (selectedIds.has(shapeId)) {
      deselectShape(shapeId)
    } else {
      selectShape(shapeId)
    }
  }, [selectedIds, selectShape, deselectShape])

  const selectAll = useCallback(() => {
    const selectableShapes = shapes.filter(shape => canSelect(shape.id))
    const limitedShapes = selectableShapes.slice(0, maxSelection)
    
    if (limitedShapes.length < selectableShapes.length) {
      console.warn(`Limited selection to ${maxSelection} shapes out of ${selectableShapes.length} available`)
    }

    setSelectedIds(new Set(limitedShapes.map(s => s.id)))
  }, [shapes, maxSelection])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionBox(null)
  }, [])

  const selectInBox = useCallback((box: SelectionBoxCoords) => {
    const shapesInBox = shapes.filter(shape => {
      if (!canSelect(shape.id)) return false
      
      // Check if shape intersects with selection box
      const shapeRight = shape.x + shape.width
      const shapeBottom = shape.y + shape.height
      const boxRight = box.x + box.width
      const boxBottom = box.y + box.height

      return !(shapeRight < box.x || 
               shape.x > boxRight || 
               shapeBottom < box.y || 
               shape.y > boxBottom)
    })

    // Limit to maxSelection
    const limitedShapes = shapesInBox.slice(0, maxSelection)
    if (limitedShapes.length < shapesInBox.length) {
      console.warn(`Limited box selection to ${maxSelection} shapes out of ${shapesInBox.length} found`)
    }

    setSelectedIds(new Set(limitedShapes.map(s => s.id)))
  }, [shapes, maxSelection])

  // Box selection methods
  const startBoxSelection = useCallback((x: number, y: number) => {
    if (!isSpacePressed) return
    
    setIsBoxSelecting(true)
    boxStartRef.current = { x, y }
    setSelectionBox({ x, y, width: 0, height: 0 })
  }, [isSpacePressed])

  const updateBoxSelection = useCallback((x: number, y: number) => {
    if (!isBoxSelecting || !boxStartRef.current) return

    const start = boxStartRef.current
    const box = {
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y)
    }

    setSelectionBox(box)
  }, [isBoxSelecting])

  const endBoxSelection = useCallback(() => {
    if (!isBoxSelecting || !selectionBox) return

    // Only select if box is large enough (avoid accidental clicks)
    if (selectionBox.width > 5 && selectionBox.height > 5) {
      selectInBox(selectionBox)
    }

    setIsBoxSelecting(false)
    setSelectionBox(null)
    boxStartRef.current = null
  }, [isBoxSelecting, selectionBox, selectInBox])

  // Locking methods
  const lockSelectedShapes = useCallback(async () => {
    if (!user || selectedIds.size === 0) return

    const selectedShapes = shapes.filter(shape => selectedIds.has(shape.id))
    if (!canLockShapes(selectedShapes, user.id)) {
      console.warn('Cannot lock shapes: some are locked by other users')
      return
    }

    try {
      await lockShapes(Array.from(selectedIds), user.id, user.displayName || 'Unknown User')
    } catch (error) {
      console.error('Failed to lock shapes:', error)
    }
  }, [user, selectedIds, shapes])

  const unlockSelectedShapes = useCallback(async () => {
    if (selectedIds.size === 0) return

    try {
      await unlockShapes(Array.from(selectedIds))
    } catch (error) {
      console.error('Failed to unlock shapes:', error)
    }
  }, [selectedIds])

  // Utility methods
  const isSelected = useCallback((shapeId: string) => {
    return selectedIds.has(shapeId)
  }, [selectedIds])

  const getSelectedShapes = useCallback((): Rectangle[] => {
    return shapes.filter(shape => selectedIds.has(shape.id))
  }, [shapes, selectedIds])

  const canSelect = useCallback((shapeId: string): boolean => {
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape || !user) return false
    
    // Don't allow selecting shapes locked by others
    return !(shape.lockedBy && shape.lockedBy !== user.id)
  }, [shapes, user])

  const hasSelection = selectedIds.size > 0
  const selectionCount = selectedIds.size

  return {
    // State
    selectedIds,
    isBoxSelecting,
    selectionBox,
    isSpacePressed,
    
    // Selection methods
    selectShape,
    deselectShape,
    toggleShape,
    selectAll,
    clearSelection,
    selectInBox,
    
    // Box selection methods
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    
    // Locking methods
    lockSelectedShapes,
    unlockSelectedShapes,
    
    // Utility methods
    isSelected,
    getSelectedShapes,
    canSelect,
    hasSelection,
    selectionCount
  }
}

export default useSelection
