import type { Rectangle, SelectionBoxCoords } from '../types/canvas.types'
import { getShapesInSelectionBox, isSelectionBoxValid } from './geometry'

/**
 * Generate a unique selection ID for tracking
 */
export function generateSelectionId(): string {
  return `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if a shape can be selected based on various criteria
 */
export function canSelectShape(
  shape: Rectangle,
  currentUserId: string | null,
  maxSelection: number = 100,
  currentSelectionCount: number = 0
): boolean {
  // Check if user is authenticated
  if (!currentUserId) return false
  
  // Check if shape is locked by another user
  if (shape.lockedBy && shape.lockedBy !== currentUserId) return false
  
  // Check selection limit
  if (currentSelectionCount >= maxSelection) return false
  
  return true
}

/**
 * Filter shapes that can be selected
 */
export function getSelectableShapes(
  shapes: Rectangle[],
  currentUserId: string | null,
  maxSelection: number = 100
): Rectangle[] {
  return shapes.filter(shape => canSelectShape(shape, currentUserId, maxSelection))
}

/**
 * Get shapes that are locked by other users
 */
export function getLockedShapes(
  shapes: Rectangle[],
  currentUserId: string | null
): Rectangle[] {
  if (!currentUserId) return []
  
  return shapes.filter(shape => 
    shape.lockedBy && shape.lockedBy !== currentUserId
  )
}

/**
 * Get shapes that are locked by the current user
 */
export function getUserLockedShapes(
  shapes: Rectangle[],
  currentUserId: string | null
): Rectangle[] {
  if (!currentUserId) return []
  
  return shapes.filter(shape => 
    shape.lockedBy === currentUserId
  )
}

/**
 * Check if any shapes in a list are locked by others
 */
export function hasLockedShapes(
  shapes: Rectangle[],
  currentUserId: string | null
): boolean {
  return getLockedShapes(shapes, currentUserId).length > 0
}

/**
 * Get selection summary for UI display
 */
export function getSelectionSummary(
  selectedShapes: Rectangle[],
  totalShapes: number
): {
  count: number
  types: Record<string, number>
  hasMixedTypes: boolean
  hasMixedColors: boolean
  commonColor: string | null
} {
  const count = selectedShapes.length
  const types: Record<string, number> = {}
  const colors = new Set<string>()
  
  for (const shape of selectedShapes) {
    const type = shape.type || 'rect'
    types[type] = (types[type] || 0) + 1
    colors.add(shape.fill)
  }
  
  const hasMixedTypes = Object.keys(types).length > 1
  const hasMixedColors = colors.size > 1
  const commonColor = colors.size === 1 ? Array.from(colors)[0] : null
  
  return {
    count,
    types,
    hasMixedTypes,
    hasMixedColors,
    commonColor
  }
}

/**
 * Create a selection box from mouse coordinates
 */
export function createSelectionBox(
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
 * Select shapes within a selection box
 */
export function selectShapesInBox(
  shapes: Rectangle[],
  selectionBox: SelectionBoxCoords,
  currentUserId: string | null,
  maxSelection: number = 100
): Rectangle[] {
  if (!isSelectionBoxValid(selectionBox)) return []
  
  const selectableShapes = getSelectableShapes(shapes, currentUserId, maxSelection)
  const shapesInBox = getShapesInSelectionBox(selectableShapes, selectionBox)
  
  // Limit to maxSelection
  return shapesInBox.slice(0, maxSelection)
}

/**
 * Check if a selection is valid (not empty, within limits)
 */
export function isValidSelection(
  selectedIds: Set<string>,
  maxSelection: number = 100
): boolean {
  return selectedIds.size > 0 && selectedIds.size <= maxSelection
}

/**
 * Get selection bounds for UI display
 */
export function getSelectionBounds(shapes: Rectangle[]): {
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
 * Calculate selection center point
 */
export function getSelectionCenter(shapes: Rectangle[]): { x: number; y: number } | null {
  const bounds = getSelectionBounds(shapes)
  if (!bounds) return null
  
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  }
}

/**
 * Check if a shape is in a selection
 */
export function isShapeInSelection(shapeId: string, selectedIds: Set<string>): boolean {
  return selectedIds.has(shapeId)
}

/**
 * Toggle shape selection
 */
export function toggleShapeSelection(
  shapeId: string,
  selectedIds: Set<string>
): Set<string> {
  const newSelection = new Set(selectedIds)
  
  if (newSelection.has(shapeId)) {
    newSelection.delete(shapeId)
  } else {
    newSelection.add(shapeId)
  }
  
  return newSelection
}

/**
 * Add shape to selection
 */
export function addShapeToSelection(
  shapeId: string,
  selectedIds: Set<string>
): Set<string> {
  const newSelection = new Set(selectedIds)
  newSelection.add(shapeId)
  return newSelection
}

/**
 * Remove shape from selection
 */
export function removeShapeFromSelection(
  shapeId: string,
  selectedIds: Set<string>
): Set<string> {
  const newSelection = new Set(selectedIds)
  newSelection.delete(shapeId)
  return newSelection
}

/**
 * Clear all selections
 */
export function clearSelection(): Set<string> {
  return new Set()
}

/**
 * Select all available shapes
 */
export function selectAllShapes(
  shapes: Rectangle[],
  currentUserId: string | null,
  maxSelection: number = 100
): Set<string> {
  const selectableShapes = getSelectableShapes(shapes, currentUserId, maxSelection)
  const limitedShapes = selectableShapes.slice(0, maxSelection)
  return new Set(limitedShapes.map(shape => shape.id))
}

/**
 * Get selection statistics for analytics
 */
export function getSelectionStats(
  selectedShapes: Rectangle[],
  totalShapes: number
): {
  selectionCount: number
  selectionPercentage: number
  typeDistribution: Record<string, number>
  colorDistribution: Record<string, number>
  averageShapeSize: number
} {
  const selectionCount = selectedShapes.length
  const selectionPercentage = totalShapes > 0 ? (selectionCount / totalShapes) * 100 : 0
  
  const typeDistribution: Record<string, number> = {}
  const colorDistribution: Record<string, number> = {}
  let totalArea = 0
  
  for (const shape of selectedShapes) {
    const type = shape.type || 'rect'
    typeDistribution[type] = (typeDistribution[type] || 0) + 1
    
    colorDistribution[shape.fill] = (colorDistribution[shape.fill] || 0) + 1
    
    totalArea += shape.width * shape.height
  }
  
  const averageShapeSize = selectionCount > 0 ? totalArea / selectionCount : 0
  
  return {
    selectionCount,
    selectionPercentage,
    typeDistribution,
    colorDistribution,
    averageShapeSize
  }
}
