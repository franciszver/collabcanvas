import { 
  defaultRectAt, 
  generateRectId, 
  getRandomColor, 
  transformCanvasCoordinates,
  calculateShapeNumbers,
  getShapeTypeName,
  generateGradientColors,
  selectShapesByColor,
  selectShapeByTypeAndNumber,
  calculateRelativeSize,
  parseSizeModifier,
  calculateAnchorPosition,
  parseRotationDirection,
  getApproximatePosition
} from '../../utils/helpers'
import type { Rectangle, CanvasShapeType, ViewportTransform } from '../../types/canvas.types'

describe('helpers', () => {
  it('generateRectId returns unique values', () => {
    const a = generateRectId()
    const b = generateRectId()
    expect(a).not.toEqual(b)
  })

  it('getRandomColor returns a valid hex color from palette', () => {
    const color = getRandomColor()
    expect(color).toMatch(/^#([0-9A-Fa-f]{6})$/)
  })

  it('transformCanvasCoordinates maps client to canvas', () => {
    const viewport = { scale: 2, x: 100, y: 50 }
    const { x, y } = transformCanvasCoordinates(140, 70, viewport)
    expect(x).toBeCloseTo(20)
    expect(y).toBeCloseTo(10)
  })

  it('defaultRectAt returns rect with defaults at position', () => {
    const rect = defaultRectAt(10, 20)
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
  })

  describe('cursor coordinate transformations', () => {
    it('should correctly transform cursor position with scale', () => {
      const viewport = { x: 0, y: 0, scale: 2 }
      const stagePos = { x: 200, y: 200 }
      const canvasPos = transformCanvasCoordinates(stagePos.x, stagePos.y, viewport)
      expect(canvasPos).toEqual({ x: 100, y: 100 })
    })

    it('should correctly transform cursor position with pan', () => {
      const viewport = { x: 50, y: 50, scale: 1 }
      const stagePos = { x: 200, y: 200 }
      const canvasPos = transformCanvasCoordinates(stagePos.x, stagePos.y, viewport)
      expect(canvasPos).toEqual({ x: 150, y: 150 })
    })

    it('should maintain cursor position through round-trip', () => {
      const viewport = { x: 100, y: 100, scale: 1.5 }
      const originalCanvas = { x: 300, y: 300 }
      
      // Simulate displaying the cursor
      const displayX = viewport.x + originalCanvas.x * viewport.scale
      const displayY = viewport.y + originalCanvas.y * viewport.scale
      
      // Simulate receiving it back
      const receivedCanvas = transformCanvasCoordinates(displayX, displayY, viewport)
      
      expect(receivedCanvas.x).toBeCloseTo(originalCanvas.x, 1)
      expect(receivedCanvas.y).toBeCloseTo(originalCanvas.y, 1)
    })
  })

  describe('calculateShapeNumbers', () => {
    it('should assign sequential numbers to shapes by type', () => {
      const shapes: Rectangle[] = [
        { id: 'shape1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
        { id: 'shape2', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#00ff00' },
        { id: 'shape3', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#0000ff' },
        { id: 'shape4', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#ffff00' },
      ]

      const numbers = calculateShapeNumbers(shapes)
      
      expect(numbers.get('shape1')).toBe(1) // First rectangle
      expect(numbers.get('shape3')).toBe(2) // Second rectangle
      expect(numbers.get('shape2')).toBe(1) // First circle
      expect(numbers.get('shape4')).toBe(2) // Second circle
    })

    it('should handle shapes without type (default to rect)', () => {
      const shapes: Rectangle[] = [
        { id: 'shape1', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
        { id: 'shape2', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#00ff00' },
      ]

      const numbers = calculateShapeNumbers(shapes)
      
      expect(numbers.get('shape1')).toBe(1) // First rect (no type)
      expect(numbers.get('shape2')).toBe(2) // Second rect
    })

    it('should handle empty shapes array', () => {
      const numbers = calculateShapeNumbers([])
      expect(numbers.size).toBe(0)
    })
  })

  describe('getShapeTypeName', () => {
    it('should return correct names for all shape types', () => {
      expect(getShapeTypeName('rect')).toBe('Rectangle')
      expect(getShapeTypeName('circle')).toBe('Circle')
      expect(getShapeTypeName('triangle')).toBe('Triangle')
      expect(getShapeTypeName('star')).toBe('Star')
      expect(getShapeTypeName('arrow')).toBe('Arrow')
      expect(getShapeTypeName('text')).toBe('Text')
    })

    it('should default to Rectangle for undefined type', () => {
      expect(getShapeTypeName(undefined)).toBe('Rectangle')
    })

    it('should default to Shape for unknown type', () => {
      expect(getShapeTypeName('unknown' as CanvasShapeType)).toBe('Shape')
    })
  })

  describe('generateGradientColors', () => {
    it('should return empty array for count <= 0', () => {
      expect(generateGradientColors('#ff0000', 0)).toEqual([])
      expect(generateGradientColors('#ff0000', -1)).toEqual([])
    })

    it('should return single color for count = 1', () => {
      expect(generateGradientColors('#ff0000', 1)).toEqual(['#ff0000'])
    })

    it('should generate lighter gradient', () => {
      const colors = generateGradientColors('#ff0000', 3, 'lighter')
      expect(colors).toHaveLength(3)
      expect(colors[0]).toBe('#ff0000') // Base color
      expect(colors[1]).not.toBe('#ff0000') // Lighter
      expect(colors[2]).not.toBe('#ff0000') // Even lighter
    })

    it('should generate darker gradient', () => {
      const colors = generateGradientColors('#ff0000', 3, 'darker')
      expect(colors).toHaveLength(3)
      expect(colors[0]).not.toBe('#ff0000') // Darker
      expect(colors[1]).not.toBe('#ff0000') // Less dark
      expect(colors[2]).toBe('#ff0000') // Base color
    })

    it('should generate both directions gradient', () => {
      const colors = generateGradientColors('#ff0000', 5, 'both')
      expect(colors).toHaveLength(5)
      // Should have darker -> base -> lighter progression
    })
  })

  describe('selectShapesByColor', () => {
    const shapes: Rectangle[] = [
      { id: 'shape1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
      { id: 'shape2', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#00ff00' },
      { id: 'shape3', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
    ]

    it('should select shapes with exact color match', () => {
      const redShapes = selectShapesByColor(shapes, '#ff0000')
      expect(redShapes).toHaveLength(2)
      expect(redShapes.map(s => s.id)).toEqual(['shape1', 'shape3'])
    })

    it('should select shapes with similar colors within tolerance', () => {
      const redShapes = selectShapesByColor(shapes, '#ff0000', 50)
      expect(redShapes).toHaveLength(2)
    })

    it('should return empty array for no matches', () => {
      const blueShapes = selectShapesByColor(shapes, '#0000ff')
      expect(blueShapes).toHaveLength(0)
    })
  })

  describe('selectShapeByTypeAndNumber', () => {
    const shapes: Rectangle[] = [
      { id: 'shape1', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000' },
      { id: 'shape2', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#00ff00' },
      { id: 'shape3', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#0000ff' },
    ]

    it('should select first shape of type', () => {
      const shape = selectShapeByTypeAndNumber(shapes, 'rect', 1)
      expect(shape?.id).toBe('shape1')
    })

    it('should select second shape of type', () => {
      const shape = selectShapeByTypeAndNumber(shapes, 'rect', 2)
      expect(shape?.id).toBe('shape3')
    })

    it('should return null for non-existent number', () => {
      const shape = selectShapeByTypeAndNumber(shapes, 'rect', 3)
      expect(shape).toBeNull()
    })

    it('should return null for non-existent type', () => {
      const shape = selectShapeByTypeAndNumber(shapes, 'triangle', 1)
      expect(shape).toBeNull()
    })
  })

  describe('calculateRelativeSize', () => {
    it('should multiply size by factor', () => {
      expect(calculateRelativeSize(100, 2)).toBe(200)
      expect(calculateRelativeSize(50, 0.5)).toBe(25)
    })

    it('should enforce minimum size of 10', () => {
      expect(calculateRelativeSize(5, 0.5)).toBe(10)
      expect(calculateRelativeSize(20, 0.1)).toBe(10)
    })
  })

  describe('parseSizeModifier', () => {
    it('should parse common phrases', () => {
      expect(parseSizeModifier('twice')).toBe(2)
      expect(parseSizeModifier('double')).toBe(2)
      expect(parseSizeModifier('half')).toBe(0.5)
      expect(parseSizeModifier('triple')).toBe(3)
      expect(parseSizeModifier('quarter')).toBe(0.25)
    })

    it('should parse numeric formats', () => {
      expect(parseSizeModifier('2x')).toBe(2)
      expect(parseSizeModifier('0.5x')).toBe(0.5)
      expect(parseSizeModifier('1.5x')).toBe(1.5)
    })

    it('should parse percentages', () => {
      expect(parseSizeModifier('50%')).toBe(0.5)
      expect(parseSizeModifier('150%')).toBe(1.5)
      expect(parseSizeModifier('25%')).toBe(0.25)
    })

    it('should return null for invalid input', () => {
      expect(parseSizeModifier('invalid')).toBeNull()
      expect(parseSizeModifier('')).toBeNull()
      expect(parseSizeModifier('abc')).toBeNull()
    })
  })

  describe('calculateAnchorPosition', () => {
    // Mock window dimensions
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight
    
    beforeAll(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    })
    
    afterAll(() => {
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
    })

    const viewport: ViewportTransform = { x: 0, y: 0, scale: 1 }

    it('should calculate center position', () => {
      const pos = calculateAnchorPosition('center', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(550) // (1200/2) - (100/2)
      expect(pos.y).toBeCloseTo(375) // (800/2) - (50/2)
    })

    it('should calculate top position', () => {
      const pos = calculateAnchorPosition('top', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(550) // (1200/2) - (100/2)
      expect(pos.y).toBeCloseTo(50) // 50px from top
    })

    it('should calculate bottom position', () => {
      const pos = calculateAnchorPosition('bottom', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(550) // (1200/2) - (100/2)
      expect(pos.y).toBeCloseTo(700) // 800 - 50 - 50
    })

    it('should calculate left position', () => {
      const pos = calculateAnchorPosition('left', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(50) // 50px from left
      expect(pos.y).toBeCloseTo(375) // (800/2) - (50/2)
    })

    it('should calculate right position', () => {
      const pos = calculateAnchorPosition('right', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(1050) // 1200 - 50 - 100
      expect(pos.y).toBeCloseTo(375) // (800/2) - (50/2)
    })

    it('should default to center for unknown anchor', () => {
      const pos = calculateAnchorPosition('unknown', viewport, 100, 50)
      expect(pos.x).toBeCloseTo(550)
      expect(pos.y).toBeCloseTo(375)
    })
  })

  describe('parseRotationDirection', () => {
    it('should parse right/clockwise rotation', () => {
      expect(parseRotationDirection('right')).toBe(90)
      expect(parseRotationDirection('clockwise')).toBe(90)
      expect(parseRotationDirection('turn right')).toBe(90)
    })

    it('should parse left/counterclockwise rotation', () => {
      expect(parseRotationDirection('left')).toBe(-90)
      expect(parseRotationDirection('counter')).toBe(-90)
      expect(parseRotationDirection('turn left')).toBe(-90)
    })

    it('should parse flip rotation', () => {
      expect(parseRotationDirection('flip')).toBe(180)
      expect(parseRotationDirection('upside down')).toBe(180)
    })

    it('should return 0 for unknown direction', () => {
      expect(parseRotationDirection('unknown')).toBe(0)
      expect(parseRotationDirection('')).toBe(0)
    })
  })

  describe('getApproximatePosition', () => {
    // Mock window dimensions
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight
    
    beforeAll(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    })
    
    afterAll(() => {
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
    })

    const viewport: ViewportTransform = { x: 0, y: 0, scale: 1 }

    it('should identify center position', () => {
      const shape: Rectangle = { id: 'shape1', type: 'rect', x: 600, y: 400, width: 100, height: 100, fill: '#ff0000' }
      const position = getApproximatePosition(shape, viewport)
      expect(position).toBe('center')
    })

    it('should identify top-left position', () => {
      const shape: Rectangle = { id: 'shape1', type: 'rect', x: 100, y: 100, width: 100, height: 100, fill: '#ff0000' }
      const position = getApproximatePosition(shape, viewport)
      expect(position).toBe('top-left')
    })

    it('should identify bottom-right position', () => {
      const shape: Rectangle = { id: 'shape1', type: 'rect', x: 1000, y: 600, width: 100, height: 100, fill: '#ff0000' }
      const position = getApproximatePosition(shape, viewport)
      expect(position).toBe('bottom-right')
    })

    it('should identify middle positions', () => {
      const shape: Rectangle = { id: 'shape1', type: 'rect', x: 600, y: 100, width: 100, height: 100, fill: '#ff0000' }
      const position = getApproximatePosition(shape, viewport)
      expect(position).toBe('top')
    })
  })
})


