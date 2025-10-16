import { defaultRectAt, generateRectId, getRandomColor, transformCanvasCoordinates } from '../../utils/helpers'

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
})


