import { renderHook, act } from '@testing-library/react'
import { useSelection } from '../../hooks/useSelection'
import { useAuth } from '../../contexts/AuthContext'
import { lockShapes, unlockShapes, canLockShapes } from '../../services/locking'
import type { Rectangle } from '../../types/canvas.types'

// Mock the auth context
jest.mock('../../contexts/AuthContext')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock the locking service
jest.mock('../../services/locking', () => ({
  lockShapes: jest.fn(),
  unlockShapes: jest.fn(),
  canLockShapes: jest.fn(),
}))

const mockLockShapes = lockShapes as jest.MockedFunction<typeof lockShapes>
const mockUnlockShapes = unlockShapes as jest.MockedFunction<typeof unlockShapes>
const mockCanLockShapes = canLockShapes as jest.MockedFunction<typeof canLockShapes>

describe('useSelection', () => {
  const mockUser = {
    id: 'user1',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: null
  }

  const mockShapes: Rectangle[] = [
    { id: 'shape1', x: 100, y: 100, width: 50, height: 50, fill: 'red', type: 'rect', rotation: 0 },
    { id: 'shape2', x: 200, y: 200, width: 60, height: 60, fill: 'blue', type: 'circle', rotation: 0 },
    { id: 'shape3', x: 300, y: 300, width: 70, height: 70, fill: 'green', type: 'rect', rotation: 0 },
  ]

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      error: null,
    })
    
    mockCanLockShapes.mockReturnValue(true)
    mockLockShapes.mockResolvedValue(undefined)
    mockUnlockShapes.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      expect(result.current.selectedIds).toEqual(new Set())
      expect(result.current.isBoxSelecting).toBe(false)
      expect(result.current.selectionBox).toBeNull()
      expect(result.current.isSpacePressed).toBe(false)
    })
  })

  describe('shape selection', () => {
    it('should select a shape', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('shape1')
      })
      
      expect(result.current.selectedIds).toEqual(new Set(['shape1']))
    })

    it('should deselect a shape', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('shape1')
        result.current.deselectShape('shape1')
      })
      
      expect(result.current.selectedIds).toEqual(new Set())
    })

    it('should toggle shape selection', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.toggleShape('shape1')
      })
      expect(result.current.selectedIds).toEqual(new Set(['shape1']))
      
      act(() => {
        result.current.toggleShape('shape1')
      })
      expect(result.current.selectedIds).toEqual(new Set())
    })

    it('should select all shapes', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectAll()
      })
      
      expect(result.current.selectedIds).toEqual(new Set(['shape1', 'shape2', 'shape3']))
    })

    it('should clear selection', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectAll()
        result.current.clearSelection()
      })
      
      expect(result.current.selectedIds).toEqual(new Set())
    })

    it('should respect maxSelection limit', () => {
      const { result } = renderHook(() => useSelection({ 
        shapes: mockShapes, 
        maxSelection: 2 
      }))
      
      act(() => {
        result.current.selectShape('shape1')
        result.current.selectShape('shape2')
      })
      
      // Try to select a third shape - should be ignored
      act(() => {
        result.current.selectShape('shape3')
      })
      
      expect(result.current.selectedIds).toEqual(new Set(['shape1', 'shape2']))
    })
  })

  describe('box selection', () => {
    it('should start box selection when space is pressed', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      // Simulate space key press first
      act(() => {
        result.current.startBoxSelection(100, 100)
      })
      
      // Should not start box selection without space pressed
      expect(result.current.isBoxSelecting).toBe(false)
    })

    it('should update box selection', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.startBoxSelection(100, 100)
        result.current.updateBoxSelection(200, 200)
      })
      
      // Should not work without space pressed
      expect(result.current.selectionBox).toBeNull()
    })

    it('should end box selection', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.startBoxSelection(100, 100)
        result.current.endBoxSelection()
      })
      
      expect(result.current.isBoxSelecting).toBe(false)
    })

    it('should select shapes in box', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectInBox({
          x: 50,
          y: 50,
          width: 100,
          height: 100
        })
      })
      
      // shape1 should be selected as it's within the box
      expect(result.current.selectedIds).toEqual(new Set(['shape1']))
    })
  })

  // Note: Keyboard interactions are handled at the component level, not in the hook

  describe('locking integration', () => {
    it('should lock selected shapes manually', async () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('shape1')
      })
      
      await act(async () => {
        await result.current.lockSelectedShapes()
      })
      
      expect(mockCanLockShapes).toHaveBeenCalledWith([mockShapes[0]], 'user1')
      expect(mockLockShapes).toHaveBeenCalledWith(['shape1'], 'user1', 'Test User')
    })

    it('should unlock selected shapes manually', async () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('shape1')
      })
      
      await act(async () => {
        await result.current.unlockSelectedShapes()
      })
      
      expect(mockUnlockShapes).toHaveBeenCalledWith(['shape1'])
    })

    it('should not lock if cannot lock', async () => {
      mockCanLockShapes.mockReturnValue(false)
      
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('shape1')
      })
      
      await act(async () => {
        await result.current.lockSelectedShapes()
      })
      
      expect(mockLockShapes).not.toHaveBeenCalled()
    })
  })

  describe('selection change callback', () => {
    it('should call onSelectionChange when selection changes', () => {
      const onSelectionChange = jest.fn()
      const { result } = renderHook(() => useSelection({ 
        shapes: mockShapes, 
        onSelectionChange 
      }))
      
      act(() => {
        result.current.selectShape('shape1')
      })
      
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['shape1']))
    })
  })

  describe('shape filtering', () => {
    it('should only select shapes that exist', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectShape('nonexistent')
      })
      
      expect(result.current.selectedIds).toEqual(new Set())
    })

    it('should filter out non-existent shapes from selectAll', () => {
      const { result } = renderHook(() => useSelection({ shapes: [] }))
      
      act(() => {
        result.current.selectAll()
      })
      
      expect(result.current.selectedIds).toEqual(new Set())
    })
  })

  describe('box selection with shapes', () => {
    it('should select multiple shapes in box', () => {
      const { result } = renderHook(() => useSelection({ shapes: mockShapes }))
      
      act(() => {
        result.current.selectInBox({
          x: 50,
          y: 50,
          width: 200,
          height: 200
        })
      })
      
      // Both shape1 and shape2 should be selected
      expect(result.current.selectedIds).toEqual(new Set(['shape1', 'shape2']))
    })

    it('should handle box selection with no shapes', () => {
      const { result } = renderHook(() => useSelection({ shapes: [] }))
      
      act(() => {
        result.current.selectInBox({
          x: 50,
          y: 50,
          width: 100,
          height: 100
        })
      })
      
      expect(result.current.selectedIds).toEqual(new Set())
    })
  })
})
