import type { Rectangle, ViewportTransform } from '../types/canvas.types'

/**
 * Calculate the visible bounds in canvas coordinates from viewport transform.
 * Returns the bounding box of the visible area with optional padding.
 */
function calculateVisibleBounds(
  viewport: ViewportTransform,
  containerWidth: number,
  containerHeight: number,
  padding: number = 300
): { minX: number; minY: number; maxX: number; maxY: number } {
  // Convert screen coordinates to canvas coordinates (inverse transform)
  // Screen point (sx, sy) to canvas point (cx, cy):
  // cx = (sx - viewport.x) / viewport.scale
  // cy = (sy - viewport.y) / viewport.scale
  
  const minX = (-viewport.x - padding) / viewport.scale
  const minY = (-viewport.y - padding) / viewport.scale
  const maxX = (containerWidth - viewport.x + padding) / viewport.scale
  const maxY = (containerHeight - viewport.y + padding) / viewport.scale
  
  return { minX, minY, maxX, maxY }
}

/**
 * Check if a shape's bounding box intersects with the visible bounds.
 * This works for all shape types by using their enclosing bounding box.
 */
function isShapeVisible(
  shape: Rectangle,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  // Get shape's bounding box
  // For most shapes, this is straightforward (x, y, width, height)
  // For centered shapes (circle, triangle, star), the Rectangle interface
  // already stores x, y as top-left of the bounding box
  
  const shapeMinX = shape.x
  const shapeMinY = shape.y
  const shapeMaxX = shape.x + shape.width
  const shapeMaxY = shape.y + shape.height
  
  // Check for intersection using separating axis theorem
  // Two rectangles DON'T intersect if:
  // - One is completely to the left of the other
  // - One is completely to the right of the other
  // - One is completely above the other
  // - One is completely below the other
  
  const noOverlap = 
    shapeMaxX < bounds.minX ||  // shape is completely to the left
    shapeMinX > bounds.maxX ||  // shape is completely to the right
    shapeMaxY < bounds.minY ||  // shape is completely above
    shapeMinY > bounds.maxY     // shape is completely below
  
  return !noOverlap
}

/**
 * Filter shapes to only include those visible in the current viewport.
 * Uses bounding box intersection for fast culling.
 * 
 * @param shapes - Array of all shapes in the canvas
 * @param viewport - Current viewport transform (scale, x, y)
 * @param containerWidth - Width of the canvas container in pixels
 * @param containerHeight - Height of the canvas container in pixels
 * @param padding - Extra padding in pixels to render off-screen shapes (default: 300)
 * @returns Filtered array of visible shapes
 */
export function getVisibleShapes(
  shapes: Rectangle[],
  viewport: ViewportTransform,
  containerWidth: number,
  containerHeight: number,
  padding: number = 300
): Rectangle[] {
  // Calculate visible bounds in canvas coordinates
  const bounds = calculateVisibleBounds(viewport, containerWidth, containerHeight, padding)
  
  // Filter shapes by intersection with visible bounds
  return shapes.filter(shape => isShapeVisible(shape, bounds))
}

