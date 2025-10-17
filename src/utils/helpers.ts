import { DEFAULT_RECT_HEIGHT, DEFAULT_RECT_WIDTH } from './constants'
import type { ViewportTransform, Rectangle, CanvasShapeType } from '../types/canvas.types'

export function generateRectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return `rect_${Math.random().toString(36).slice(2, 10)}`
}

export function getRandomColor(): string {
  const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function transformCanvasCoordinates(
  clientX: number,
  clientY: number,
  viewport: ViewportTransform
): { x: number; y: number } {
  const x = (clientX - viewport.x) / viewport.scale
  const y = (clientY - viewport.y) / viewport.scale
  return { x, y }
}

export function defaultRectAt(x: number, y: number) {
  return { x, y, width: DEFAULT_RECT_WIDTH, height: DEFAULT_RECT_HEIGHT, fill: getRandomColor() }
}

/**
 * Calculate sequential display numbers for shapes grouped by type.
 * Shapes are numbered based on creation order (determined by ID).
 * Returns a map of shapeId -> displayNumber
 */
export function calculateShapeNumbers(shapes: Rectangle[]): Map<string, number> {
  const numberMap = new Map<string, number>()
  
  // Group shapes by type
  const shapesByType: Record<string, Rectangle[]> = {}
  
  for (const shape of shapes) {
    const type = shape.type || 'rect'
    if (!shapesByType[type]) {
      shapesByType[type] = []
    }
    shapesByType[type].push(shape)
  }
  
  // For each type, sort by ID (which contains creation timestamp) and assign numbers
  for (const type in shapesByType) {
    const typedShapes = shapesByType[type]
    // Sort by ID to maintain consistent creation order
    typedShapes.sort((a, b) => a.id.localeCompare(b.id))
    
    // Assign sequential numbers
    typedShapes.forEach((shape, index) => {
      numberMap.set(shape.id, index + 1)
    })
  }
  
  return numberMap
}

/**
 * Get human-readable shape type name
 */
export function getShapeTypeName(type?: CanvasShapeType): string {
  const typeNames: Record<CanvasShapeType, string> = {
    'rect': 'Rectangle',
    'circle': 'Circle',
    'triangle': 'Triangle',
    'star': 'Star',
    'arrow': 'Arrow',
    'text': 'Text'
  }
  return typeNames[type || 'rect'] || 'Shape'
}

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360
  s = s / 100
  l = l / 100
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Adjust lightness of a color
 */
function adjustLightness(hsl: { h: number; s: number; l: number }, factor: number): string {
  const newLightness = Math.max(0, Math.min(100, hsl.l + factor))
  return hslToHex(hsl.h, hsl.s, newLightness)
}

/**
 * Generate gradient colors from a base color
 */
export function generateGradientColors(
  baseColor: string, 
  count: number, 
  direction: 'lighter' | 'darker' | 'both' = 'lighter',
  intensity: number = 0.3
): string[] {
  if (count <= 0) return []
  if (count === 1) return [baseColor]
  
  // Convert base color to HSL
  const baseHsl = hexToHsl(baseColor)
  const colors: string[] = []
  
  // Calculate step size based on direction and intensity
  const maxStep = Math.min(30, baseHsl.l * intensity) // Max 30% change
  
  if (direction === 'lighter') {
    // Start with base color, get progressively lighter
    for (let i = 0; i < count; i++) {
      const step = (maxStep * i) / (count - 1)
      colors.push(adjustLightness(baseHsl, step))
    }
  } else if (direction === 'darker') {
    // Start darker, progress to base color
    for (let i = 0; i < count; i++) {
      const step = -(maxStep * (count - 1 - i)) / (count - 1)
      colors.push(adjustLightness(baseHsl, step))
    }
  } else if (direction === 'both') {
    // Start darker, go through base, end lighter
    const halfCount = Math.ceil(count / 2)
    for (let i = 0; i < count; i++) {
      let step: number
      if (i < halfCount) {
        // Darker side
        step = -(maxStep * (halfCount - 1 - i)) / (halfCount - 1)
      } else {
        // Lighter side
        step = (maxStep * (i - halfCount + 1)) / (count - halfCount)
      }
      colors.push(adjustLightness(baseHsl, step))
    }
  }
  
  return colors
}


