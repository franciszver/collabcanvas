import { useCallback } from 'react'
import { useShapes } from './useShapes'
import { useCanvas } from '../contexts/CanvasContext'
import type { CanvasAction } from '../services/ai'
import type { Rectangle } from '../types/canvas.types'
import { generateRectId } from '../utils/helpers'

export interface UseCanvasCommandsOptions {
  documentId: string
}

export interface UseCanvasCommandsReturn {
  applyCanvasCommand: (command: CanvasAction) => Promise<{ success: boolean; error?: string; createdShapes?: string[]; details?: string }>
}

// Track last created shape position for cascade positioning
let lastShapePosition = { x: 0, y: 0 }

// Store last created shape ID per user (survives page refresh)
const STORAGE_KEY = 'collabcanvas:lastCreatedShapeId'

// Maximum shapes per layout command
const MAX_LAYOUT_SHAPES = 20

function getLastCreatedShapeId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEY)
}

function setLastCreatedShapeId(shapeId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, shapeId)
}

// Layout utility functions
interface LayoutOptions {
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom'
}

function arrangeRow(
  shapes: Rectangle[], 
  startX: number, 
  startY: number, 
  options: LayoutOptions = {}
): Rectangle[] {
  const spacing = options.spacing ?? 20
  const alignment = options.alignment ?? 'center'
  
  let currentX = startX
  const maxHeight = Math.max(...shapes.map(s => s.height))
  
  return shapes.map(shape => {
    let alignedY = startY
    if (alignment === 'center') {
      alignedY = startY + (maxHeight - shape.height) / 2
    } else if (alignment === 'bottom') {
      alignedY = startY + maxHeight - shape.height
    }
    
    const positioned = {
      ...shape,
      x: currentX,
      y: alignedY,
      rotation: 0 // Reset rotation for clean layout
    }
    
    currentX += shape.width + spacing
    return positioned
  })
}

function arrangeColumn(
  shapes: Rectangle[], 
  startX: number, 
  startY: number, 
  options: LayoutOptions = {}
): Rectangle[] {
  const spacing = options.spacing ?? 20
  const alignment = options.alignment ?? 'center'
  
  let currentY = startY
  const maxWidth = Math.max(...shapes.map(s => s.width))
  
  return shapes.map(shape => {
    let alignedX = startX
    if (alignment === 'center') {
      alignedX = startX + (maxWidth - shape.width) / 2
    } else if (alignment === 'bottom') {
      // 'bottom' becomes 'right' for columns
      alignedX = startX + maxWidth - shape.width
    }
    
    const positioned = {
      ...shape,
      x: alignedX,
      y: currentY,
      rotation: 0
    }
    
    currentY += shape.height + spacing
    return positioned
  })
}

function arrangeGrid(
  shapes: Rectangle[], 
  startX: number, 
  startY: number,
  rows?: number,
  cols?: number,
  options: LayoutOptions = {}
): Rectangle[] {
  const spacing = options.spacing ?? 20
  const count = shapes.length
  
  // Auto-calculate grid dimensions to be roughly square
  if (!rows && !cols) {
    cols = Math.ceil(Math.sqrt(count))
    rows = Math.ceil(count / cols)
  } else if (!rows) {
    rows = Math.ceil(count / cols!)
  } else if (!cols) {
    cols = Math.ceil(count / rows!)
  }
  
  // Calculate cell sizes based on max width/height in each row/column
  const cellWidth = Math.max(...shapes.map(s => s.width))
  const cellHeight = Math.max(...shapes.map(s => s.height))
  
  return shapes.map((shape, index) => {
    const row = Math.floor(index / cols!)
    const col = index % cols!
    
    // Center shape within its grid cell
    const cellX = startX + col * (cellWidth + spacing)
    const cellY = startY + row * (cellHeight + spacing)
    const centeredX = cellX + (cellWidth - shape.width) / 2
    const centeredY = cellY + (cellHeight - shape.height) / 2
    
    return {
      ...shape,
      x: centeredX,
      y: centeredY,
      rotation: 0
    }
  })
}

export function useCanvasCommands({ documentId }: UseCanvasCommandsOptions): UseCanvasCommandsReturn {
  const { addShape, updateShape, shapes: rectangles } = useShapes({ documentId, enableLiveDrag: true })
  const { viewport, selectedId } = useCanvas()

  const applyCanvasCommand = useCallback(async (command: CanvasAction): Promise<{ success: boolean; error?: string; createdShapes?: string[]; details?: string }> => {
    try {
      const { action, target, parameters } = command
      const createdShapes: string[] = []
      const errors: string[] = []

      // Handle create action
      if (action === 'create') {
        const count = parameters.count ?? 1
        
        // Validate max shapes for create-with-layout
        if (parameters.layout && count > MAX_LAYOUT_SHAPES) {
          return {
            success: false,
            error: `Cannot create more than ${MAX_LAYOUT_SHAPES} shapes with layout`,
            details: `Requested: ${count} shapes. Maximum allowed: ${MAX_LAYOUT_SHAPES}`
          }
        }
        
        for (let i = 0; i < count; i++) {
          try {
            const shape = await createShapeFromCommand(target, parameters, viewport, i)
            if (shape) {
              await addShape(shape)
              createdShapes.push(shape.id)
              // Update last position for cascade
              lastShapePosition = { x: shape.x, y: shape.y }
              // Track last created shape ID for manipulation
              setLastCreatedShapeId(shape.id)
            }
          } catch (shapeError) {
            // Try to fix specific parameter issues
            const fixedParams = fixParameters(parameters, shapeError)
            
            try {
              const fixedShape = await createShapeFromCommand(target, fixedParams, viewport, i)
              if (fixedShape) {
                await addShape(fixedShape)
                createdShapes.push(fixedShape.id)
                errors.push(`Fixed parameters for ${target}: ${shapeError instanceof Error ? shapeError.message : 'Invalid parameters'}`)
                lastShapePosition = { x: fixedShape.x, y: fixedShape.y }
                setLastCreatedShapeId(fixedShape.id)
              }
            } catch (fixedError) {
              // Try with default values if fixing fails
              try {
                const defaultShape = await createShapeFromCommand(target, {}, viewport, i)
                if (defaultShape) {
                  await addShape(defaultShape)
                  createdShapes.push(defaultShape.id)
                  errors.push(`Used default values for ${target} due to: ${fixedError instanceof Error ? fixedError.message : 'Invalid parameters'}`)
                  lastShapePosition = { x: defaultShape.x, y: defaultShape.y }
                  setLastCreatedShapeId(defaultShape.id)
                }
              } catch (defaultError) {
                errors.push(`Failed to create ${target}: ${defaultError instanceof Error ? defaultError.message : 'Unknown error'}`)
              }
            }
          }
        }
        
        // Apply layout if specified for create action
        if (createdShapes.length > 1 && parameters.layout) {
          const layoutType = parameters.layout
          const startX = (-viewport.x + 400) / viewport.scale
          const startY = (-viewport.y + 300) / viewport.scale
          const spacing = parameters.spacing ?? 20
          
          // Get the shapes we just created
          const shapesToArrange = rectangles.filter(r => createdShapes.includes(r.id))
          
          if (shapesToArrange.length > 0) {
            // Apply layout
            let arrangedShapes: Rectangle[]
            if (layoutType === 'row') {
              arrangedShapes = arrangeRow(shapesToArrange, startX, startY, { spacing })
            } else if (layoutType === 'column') {
              arrangedShapes = arrangeColumn(shapesToArrange, startX, startY, { spacing })
            } else if (layoutType === 'grid') {
              arrangedShapes = arrangeGrid(shapesToArrange, startX, startY, parameters.rows, parameters.cols, { spacing })
            } else {
              arrangedShapes = shapesToArrange
            }
            
            // Update positions
            try {
              await Promise.all(
                arrangedShapes.map(shape => 
                  updateShape(shape.id, { x: shape.x, y: shape.y, rotation: 0 })
                )
              )
            } catch (layoutError) {
              errors.push(`Created shapes but failed to apply ${layoutType} layout: ${layoutError instanceof Error ? layoutError.message : 'Unknown error'}`)
            }
          }
        }
      }
      
      // Handle manipulate action
      if (action === 'manipulate') {
        // Determine target shape ID using fallback chain
        const targetId = parameters.id || getLastCreatedShapeId() || selectedId
        
        if (!targetId) {
          return { 
            success: false, 
            error: 'No shape available to manipulate. Please select a shape or create one first.',
            details: 'Target resolution failed: no explicit ID, last created, or selected shape found'
          }
        }
        
        // Find the shape to manipulate
        const targetShape = rectangles.find(r => r.id === targetId)
        if (!targetShape) {
          return { 
            success: false, 
            error: `Shape not found: ${targetId}`,
            details: 'Shape may have been deleted or does not exist'
          }
        }
        
        // Build update object from parameters
        const updates: Partial<Rectangle> = {}
        if (parameters.x !== undefined) updates.x = parameters.x
        if (parameters.y !== undefined) updates.y = parameters.y
        if (parameters.width !== undefined) updates.width = parameters.width
        if (parameters.height !== undefined) updates.height = parameters.height
        if (parameters.radius !== undefined) {
          // For circles, radius maps to width/height
          updates.width = parameters.radius * 2
          updates.height = parameters.radius * 2
        }
        if (parameters.rotation !== undefined) updates.rotation = parameters.rotation
        if (parameters.color !== undefined) updates.fill = validateColor(parameters.color) || targetShape.fill
        
        // Apply the manipulation
        await updateShape(targetId, updates)
        
        return {
          success: true,
          details: `Manipulated ${targetShape.type} (ID: ${targetId})`,
          createdShapes: [] // No new shapes created
        }
      }
      
      // Handle layout action
      if (action === 'layout') {
        // Determine which shapes to layout
        const count = parameters.count ?? 5 // Default to 5 shapes
        const layoutType = parameters.layout ?? 'row'
        
        // Enforce maximum shapes per layout
        if (count > MAX_LAYOUT_SHAPES) {
          return {
            success: false,
            error: `Cannot layout more than ${MAX_LAYOUT_SHAPES} shapes at once`,
            details: `Requested: ${count} shapes. Maximum allowed: ${MAX_LAYOUT_SHAPES}`
          }
        }
        
        // Get last N shapes to layout
        const shapesToLayout = rectangles.slice(-count)
        
        if (shapesToLayout.length === 0) {
          return {
            success: false,
            error: 'No shapes available to layout. Please create shapes first.',
            details: `Attempted to layout ${count} shapes but none exist`
          }
        }
        
        // Calculate starting position (center of viewport)
        const startX = (-viewport.x + 400) / viewport.scale
        const startY = (-viewport.y + 300) / viewport.scale
        
        // Apply layout based on type
        let arrangedShapes: Rectangle[]
        const spacing = parameters.spacing ?? 20
        
        if (layoutType === 'row') {
          arrangedShapes = arrangeRow(shapesToLayout, startX, startY, { spacing })
        } else if (layoutType === 'column') {
          arrangedShapes = arrangeColumn(shapesToLayout, startX, startY, { spacing })
        } else if (layoutType === 'grid') {
          const rows = parameters.rows
          const cols = parameters.cols
          arrangedShapes = arrangeGrid(shapesToLayout, startX, startY, rows, cols, { spacing })
        } else {
          return {
            success: false,
            error: `Unsupported layout type: ${layoutType}`,
            details: 'Supported layouts: row, column, grid'
          }
        }
        
        // Batch update all shapes
        try {
          await Promise.all(
            arrangedShapes.map(shape => 
              updateShape(shape.id, { 
                x: shape.x, 
                y: shape.y, 
                rotation: shape.rotation 
              })
            )
          )
          
          return {
            success: true,
            details: `Arranged ${arrangedShapes.length} shapes in ${layoutType} layout`,
            createdShapes: []
          }
        } catch (error) {
          return {
            success: false,
            error: 'Failed to apply layout',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
      
      // TODO: Handle complex actions in future epics

      const details = errors.length > 0 ? errors.join('; ') : undefined
      return { success: createdShapes.length > 0, error: errors.length > 0 ? errors.join('; ') : undefined, createdShapes, details }
    } catch (error) {
      console.error('Error applying canvas command:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }, [addShape, updateShape, rectangles, viewport, selectedId])

  return { applyCanvasCommand }
}

// Helper function to create shape from AI command
async function createShapeFromCommand(
  target: CanvasAction['target'], 
  parameters: CanvasAction['parameters'], 
  viewport: { scale: number; x: number; y: number },
  index: number = 0
): Promise<Rectangle | null> {
  const id = generateRectId()
  
  // Calculate position with cascade logic
  let x: number, y: number
  if (parameters.x !== undefined && parameters.y !== undefined) {
    x = parameters.x
    y = parameters.y
  } else {
    // Default position (center of viewport)
    // Calculate the actual center of the user's visible area
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2
    const defaultX = (screenCenterX - viewport.x) / viewport.scale
    const defaultY = (screenCenterY - viewport.y) / viewport.scale
    
    if (index === 0) {
      x = defaultX
      y = defaultY
    } else {
      // Cascade positioning: offset from last shape
      const offset = 60 // 60px offset
      x = lastShapePosition.x + offset
      y = lastShapePosition.y + offset
    }
  }
  
  const color = validateColor(parameters.color) ?? '#3B82F6'
  const rotation = validateRotation(parameters.rotation) ?? 0

  // Map AI target to shape type
  const typeMap: Record<string, Rectangle['type']> = {
    'circle': 'circle',
    'rectangle': 'rect',
    'text': 'text'
  }

  const shapeType = typeMap[target]
  if (!shapeType) {
    throw new Error(`Unsupported target type: ${target}`)
  }

  // Create shape based on type
  if (target === 'circle') {
    const radius = validateDimension(parameters.radius) ?? 50
    // Position circle by center point
    return {
      id,
      type: 'circle',
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
      fill: color,
      rotation,
      z: 0
    }
  } else if (target === 'rectangle') {
    const width = validateDimension(parameters.width) ?? 100
    const height = validateDimension(parameters.height) ?? 60
    return {
      id,
      type: 'rect',
      x,
      y,
      width,
      height,
      fill: color,
      rotation,
      z: 0
    }
  } else if (target === 'text') {
    const width = validateDimension(parameters.width) ?? 200
    const height = validateDimension(parameters.height) ?? 40
    // Use fontSize parameter if provided, otherwise calculate based on width
    const fontSize = parameters.fontSize ? validateFontSize(parameters.fontSize) : Math.min(64, Math.max(8, Math.floor(width / 10)))
    return {
      id,
      type: 'text',
      x,
      y,
      width,
      height,
      fill: color,
      rotation,
      z: 0,
      text: parameters.text ?? 'Enter Text',
      fontSize: fontSize ?? 16
    }
  }

  return null
}

// Validation helper functions
function validateColor(color?: string): string | null {
  if (!color) return null
  
  // Basic color validation (hex, rgb, named colors)
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
  const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey']
  
  if (hexPattern.test(color) || rgbPattern.test(color) || namedColors.includes(color.toLowerCase())) {
    return color
  }
  
  throw new Error(`Invalid color format: ${color}`)
}

function validateRotation(rotation?: number): number | null {
  if (rotation === undefined || rotation === null) return null
  
  if (typeof rotation !== 'number' || isNaN(rotation)) {
    throw new Error(`Invalid rotation: ${rotation}`)
  }
  
  // Normalize rotation to 0-360 degrees
  return ((rotation % 360) + 360) % 360
}

function validateDimension(dimension?: number): number | null {
  if (dimension === undefined || dimension === null) return null
  
  if (typeof dimension !== 'number' || isNaN(dimension)) {
    throw new Error(`Invalid dimension: ${dimension}`)
  }
  
  // Enforce reasonable bounds
  const min = 5
  const max = 1000
  
  if (dimension < min || dimension > max) {
    throw new Error(`Dimension out of bounds (${min}-${max}): ${dimension}`)
  }
  
  return dimension
}

function validateFontSize(fontSize?: number): number | null {
  if (fontSize === undefined || fontSize === null) return null
  
  if (typeof fontSize !== 'number' || isNaN(fontSize)) {
    throw new Error(`Invalid font size: ${fontSize}`)
  }
  
  // Enforce reasonable font size bounds
  const min = 8
  const max = 144
  
  if (fontSize < min || fontSize > max) {
    throw new Error(`Font size out of bounds (${min}-${max}): ${fontSize}`)
  }
  
  return fontSize
}

// Helper function to fix parameter issues
function fixParameters(parameters: CanvasAction['parameters'], error: unknown): CanvasAction['parameters'] {
  const fixed = { ...parameters }
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Fix color issues
  if (errorMessage.includes('Invalid color format')) {
    fixed.color = '#3B82F6' // Default blue
  }
  
  // Fix dimension issues
  if (errorMessage.includes('Dimension out of bounds')) {
    if (errorMessage.includes('width')) fixed.width = 100
    if (errorMessage.includes('height')) fixed.height = 60
    if (errorMessage.includes('radius')) fixed.radius = 50
  }
  
  // Fix font size issues
  if (errorMessage.includes('Font size out of bounds')) {
    fixed.fontSize = 16
  }
  
  // Fix rotation issues
  if (errorMessage.includes('Invalid rotation')) {
    fixed.rotation = 0
  }
  
  return fixed
}

