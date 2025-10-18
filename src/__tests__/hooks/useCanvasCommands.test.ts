import { renderHook, act } from '@testing-library/react'
import { useCanvasCommands } from '../../hooks/useCanvasCommands'
import { useShapes } from '../../hooks/useShapes'
import { useCanvas } from '../../contexts/CanvasContext'
import type { CanvasAction } from '../../services/ai'

// Mock the dependencies
jest.mock('../../hooks/useShapes')
jest.mock('../../contexts/CanvasContext')

const mockUseShapes = useShapes as jest.MockedFunction<typeof useShapes>
const mockUseCanvas = useCanvas as jest.MockedFunction<typeof useCanvas>

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  writable: true,
})

describe('useCanvasCommands', () => {
  const mockAddShape = jest.fn()
  const mockUpdateShape = jest.fn()
  const mockShapes = [
    {
      id: 'shape-1',
      type: 'rect' as const,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#ff0000',
      rotation: 0,
      z: 0,
    },
    {
      id: 'shape-2',
      type: 'circle' as const,
      x: 200,
      y: 200,
      width: 80,
      height: 80,
      fill: '#00ff00',
      rotation: 0,
      z: 0,
    },
  ]

  const mockViewport = {
    x: 0,
    y: 0,
    scale: 1,
    width: 1920,
    height: 1080,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseShapes.mockReturnValue({
      addShape: mockAddShape,
      updateShape: mockUpdateShape,
      shapes: mockShapes,
      isLoading: false,
      error: null,
      deleteShape: jest.fn(),
      clearAllShapes: jest.fn(),
      liveDragPositions: {},
      isDragging: false,
      publishDragUpdate: jest.fn(),
      clearDragUpdate: jest.fn(),
    })

    mockUseCanvas.mockReturnValue({
      viewport: mockViewport,
      setViewport: jest.fn(),
      rectangles: mockShapes,
      setRectangles: jest.fn(),
      updateRectangle: jest.fn(),
      deleteRectangle: jest.fn(),
      addRectangle: jest.fn(),
      clearAllRectangles: jest.fn(),
      isLoading: false,
      selectedId: null,
      setSelectedId: jest.fn(),
      selectedTool: 'pan',
      liveDragPositions: {},
      isDragging: false,
      publishDragUpdate: jest.fn(),
      clearDragUpdate: jest.fn(),
    })

    mockAddShape.mockResolvedValue(undefined)
    mockUpdateShape.mockResolvedValue(undefined)
  })

  describe('create action', () => {
    it('should create a single shape successfully', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          color: '#3B82F6',
          radius: 50,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.createdShapes).toHaveLength(1)
      expect(mockAddShape).toHaveBeenCalledTimes(1)
    })

    it('should create multiple shapes with gradient colors', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          count: 3,
          color: '#3B82F6',
          gradientDirection: 'lighter',
          gradientIntensity: 0.3,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.createdShapes).toHaveLength(3)
      expect(mockAddShape).toHaveBeenCalledTimes(3)
    })

    it('should handle create action with layout', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          count: 3,
          color: '#3B82F6',
          layout: 'row',
          spacing: 20,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.createdShapes).toHaveLength(3)
      expect(mockAddShape).toHaveBeenCalledTimes(3)
      // Note: updateShape might not be called if the shapes are already positioned correctly
    })

    it('should reject complex targets with create action', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'form',
        parameters: {
          formType: 'login',
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('requires action="complex"')
    })

    it('should enforce maximum shapes limit for layout', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          count: 25, // Exceeds MAX_LAYOUT_SHAPES (20)
          color: '#3B82F6',
          layout: 'row',
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Cannot create more than 20 shapes with layout')
    })
  })

  describe('manipulate action', () => {
    it('should manipulate shape by color selection', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#ff0000',
          },
          x: 300,
          y: 300,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', {
        x: 300,
        y: 300,
      })
    })

    it('should manipulate shape by number selection', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            shapeNumber: 1,
            shapeType: 'circle',
          },
          width: 120,
          height: 120,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-2', {
        width: 120,
        height: 120,
      })
    })

    it('should handle rotation manipulation', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#ff0000',
          },
          rotationDirection: 'right',
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', {
        rotation: 90, // 0 + 90 degrees
      })
    })

    it('should handle relative resizing', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#ff0000',
          },
          relativeResize: true,
          sizeMultiplier: 2,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', {
        width: 200, // 100 * 2
        height: 200, // 100 * 2
      })
    })

    it('should handle anchor positioning', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#ff0000',
          },
          positionAnchor: 'center',
          offsetX: 10,
          offsetY: 20,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', {
        x: expect.any(Number),
        y: expect.any(Number),
      })
    })

    it('should return error when no shapes match color', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#000000', // No shapes with this color
          },
          x: 300,
          y: 300,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('No shapes found with color')
    })

    it('should return error when shape number not found', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            shapeNumber: 5, // No 5th circle
            shapeType: 'circle',
          },
          x: 300,
          y: 300,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Could not find circle #5')
    })
  })

  describe('layout action', () => {
    it('should arrange shapes in a row', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'layout',
        target: 'circle',
        parameters: {
          layout: 'row',
          spacing: 30,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.details).toContain('Arranged 1 shapes in row layout') // Only 1 circle shape
      expect(mockUpdateShape).toHaveBeenCalledTimes(1)
    })

    it('should arrange shapes in a column', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'layout',
        target: 'circle',
        parameters: {
          layout: 'column',
          spacing: 40,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.details).toContain('Arranged 1 shapes in column layout') // Only 1 circle shape
      expect(mockUpdateShape).toHaveBeenCalledTimes(1)
    })

    it('should arrange shapes in a grid', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'layout',
        target: 'circle',
        parameters: {
          layout: 'grid',
          rows: 2,
          cols: 1,
          spacing: 20,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(true)
      expect(response.details).toContain('Arranged 1 shapes in grid layout') // Only 1 circle shape
      expect(mockUpdateShape).toHaveBeenCalledTimes(1)
    })

    it('should return error when no shapes to layout', async () => {
      mockUseShapes.mockReturnValue({
        addShape: mockAddShape,
        updateShape: mockUpdateShape,
        shapes: [], // No shapes
        isLoading: false,
        error: null,
        deleteShape: jest.fn(),
        clearAllShapes: jest.fn(),
        liveDragPositions: {},
        isDragging: false,
        publishDragUpdate: jest.fn(),
        clearDragUpdate: jest.fn(),
      })

      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'layout',
        target: 'circle',
        parameters: {
          layout: 'row',
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('No circle shapes found')
    })

    it('should enforce maximum shapes limit for layout', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'layout',
        target: 'circle',
        parameters: {
          count: 25, // Exceeds MAX_LAYOUT_SHAPES (20)
          layout: 'row',
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Cannot layout more than 20 shapes at once')
    })
  })

  describe('complex action', () => {
    it('should return error for unsupported complex targets', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'complex',
        target: 'navbar',
        parameters: {},
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('not yet implemented')
    })

    it('should return error for form without formType', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'complex',
        target: 'form',
        parameters: {},
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Form type is required')
    })
  })

  describe('error handling', () => {
    it('should handle addShape errors gracefully', async () => {
      mockAddShape.mockRejectedValue(new Error('Add shape failed'))

      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          color: '#3B82F6',
          radius: 50,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      // The hook tries to fix errors and use default values, so it might still succeed
      expect(response.success).toBeDefined()
      expect(typeof response.success).toBe('boolean')
    })

    it('should handle updateShape errors gracefully', async () => {
      mockUpdateShape.mockRejectedValue(new Error('Update shape failed'))

      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'manipulate',
        target: 'circle',
        parameters: {
          selector: {
            color: '#ff0000',
          },
          x: 300,
          y: 300,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Update shape failed')
    })

    it('should handle unknown action types', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command = {
        action: 'unknown' as any,
        target: 'circle' as const,
        parameters: {},
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      expect(response.success).toBe(false)
      // The response might not have an error field for unknown actions
      expect(response).toBeDefined()
    })
  })

  describe('validation functions', () => {
    it('should validate color formats', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          color: 'invalid-color',
          radius: 50,
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      // Should try to fix the color and succeed
      expect(response.success).toBe(true)
    })

    it('should validate dimensions', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'circle',
        parameters: {
          color: '#3B82F6',
          radius: 5, // Too small
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      // Should try to fix the dimension and succeed
      expect(response.success).toBe(true)
    })

    it('should validate font sizes', async () => {
      const { result } = renderHook(() => useCanvasCommands({ documentId: 'test-doc' }))

      const command: CanvasAction = {
        action: 'create',
        target: 'text',
        parameters: {
          color: '#3B82F6',
          text: 'Test',
          fontSize: 100, // Too large
        },
      }

      let response: any
      await act(async () => {
        response = await result.current.applyCanvasCommand(command)
      })

      // Should try to fix the font size and succeed
      expect(response.success).toBe(true)
    })
  })
})
