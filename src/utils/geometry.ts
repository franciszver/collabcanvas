import type { Rectangle, SelectionBoxCoords } from '../types/canvas.types'

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/**
 * Check if two rectangles intersect
 */
export function rectsIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/**
 * Check if a shape intersects with a selection box
 */
export function shapeIntersectsSelectionBox(
  shape: Rectangle,
  selectionBox: SelectionBoxCoords
): boolean {
  const shapeRect = {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  }
  
  return rectsIntersect(shapeRect, selectionBox)
}

/**
 * Get shapes that intersect with a selection box
 */
export function getShapesInSelectionBox(
  shapes: Rectangle[],
  selectionBox: SelectionBoxCoords
): Rectangle[] {
  return shapes.filter(shape => shapeIntersectsSelectionBox(shape, selectionBox))
}

/**
 * Calculate bounding box for multiple shapes
 */
export function calculateBoundingBox(shapes: Rectangle[]): {
  x: number
  y: number
  width: number
  height: number
} | null {
  if (shapes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    minX = Math.min(minX, shape.x)
    minY = Math.min(minY, shape.y)
    maxX = Math.max(maxX, shape.x + shape.width)
    maxY = Math.max(maxY, shape.y + shape.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Calculate center point of multiple shapes
 */
export function calculateShapesCenter(shapes: Rectangle[]): { x: number; y: number } | null {
  const boundingBox = calculateBoundingBox(shapes)
  if (!boundingBox) return null

  return {
    x: boundingBox.x + boundingBox.width / 2,
    y: boundingBox.y + boundingBox.height / 2
  }
}

/**
 * Calculate distance between two points
 */
export function distance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if a selection box is large enough to be meaningful
 * (avoids accidental selections from tiny mouse movements)
 */
export function isSelectionBoxValid(selectionBox: SelectionBoxCoords, minSize: number = 5): boolean {
  return selectionBox.width >= minSize && selectionBox.height >= minSize
}

/**
 * Normalize selection box coordinates (ensure positive width/height)
 */
export function normalizeSelectionBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): SelectionBoxCoords {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY)
  }
}

/**
 * Check if a point is near a shape (for click detection with tolerance)
 */
export function pointNearShape(
  point: { x: number; y: number },
  shape: Rectangle,
  tolerance: number = 5
): boolean {
  const shapeRect = {
    x: shape.x - tolerance,
    y: shape.y - tolerance,
    width: shape.width + tolerance * 2,
    height: shape.height + tolerance * 2
  }
  
  return pointInRect(point, shapeRect)
}

/**
 * Find the closest shape to a point
 */
export function findClosestShape(
  point: { x: number; y: number },
  shapes: Rectangle[]
): Rectangle | null {
  if (shapes.length === 0) return null

  let closestShape: Rectangle | null = null
  let closestDistance = Infinity

  for (const shape of shapes) {
    const center = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2
    }
    
    const dist = distance(point, center)
    if (dist < closestDistance) {
      closestDistance = dist
      closestShape = shape
    }
  }

  return closestShape
}

/**
 * Calculate the area of a rectangle
 */
export function rectArea(rect: { width: number; height: number }): number {
  return rect.width * rect.height
}

/**
 * Check if a selection box contains another rectangle completely
 */
export function selectionBoxContains(
  selectionBox: SelectionBoxCoords,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    selectionBox.x <= rect.x &&
    selectionBox.y <= rect.y &&
    selectionBox.x + selectionBox.width >= rect.x + rect.width &&
    selectionBox.y + selectionBox.height >= rect.y + rect.height
  )
}
