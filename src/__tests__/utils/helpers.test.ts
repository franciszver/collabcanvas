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
})


