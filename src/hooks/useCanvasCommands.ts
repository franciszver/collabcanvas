import { useCallback } from 'react'
import { useShapes } from './useShapes'
import { useCanvas } from '../contexts/CanvasContext'
import type { CanvasAction } from '../services/ai'
import type { Rectangle } from '../types/canvas.types'
import { 
  generateRectId, 
  generateGradientColors, 
  selectShapesByColor,
  selectShapeByTypeAndNumber,
  calculateRelativeSize,
  calculateAnchorPosition,
  parseRotationDirection,
  getApproximatePosition,
  getShapeTypeName
} from '../utils/helpers'
import { getFormTemplate } from '../utils/formTemplates'
import { generateFormShapes } from '../utils/formLayout'

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
  viewport: { x: number; y: number; scale: number; width?: number; height?: number },
  rows?: number,
  cols?: number,
  _options: LayoutOptions = {}
): Rectangle[] {
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
  
  // Get viewport dimensions (default to 1920x1080 if not provided)
  const viewportWidth = viewport.width ?? 1920
  const viewportHeight = viewport.height ?? 1080
  
  // Calculate target area: middle 50% of viewport
  const targetWidth = viewportWidth * 0.5
  const targetHeight = viewportHeight * 0.5
  
  // Calculate total shape dimensions
  const maxShapeWidth = Math.max(...shapes.map(s => s.width))
  const maxShapeHeight = Math.max(...shapes.map(s => s.height))
  
  // Calculate total grid dimensions (including shapes)
  const totalShapeWidth = cols! * maxShapeWidth
  const totalShapeHeight = rows! * maxShapeHeight
  
  // Calculate spacing to fit in target area
  const horizontalSpacing = cols! > 1 ? Math.max(10, (targetWidth - totalShapeWidth) / (cols! - 1)) : 0
  const verticalSpacing = rows! > 1 ? Math.max(10, (targetHeight - totalShapeHeight) / (rows! - 1)) : 0
  
  // Use the smaller spacing to maintain square-like grid
  const spacing = Math.min(horizontalSpacing, verticalSpacing)
  
  // Calculate total grid dimensions with spacing
  const totalGridWidth = totalShapeWidth + (cols! - 1) * spacing
  const totalGridHeight = totalShapeHeight + (rows! - 1) * spacing
  
  // Center the grid in the visible screen area (accounting for pan/zoom)
  // Calculate the center of the visible screen in canvas coordinates
  const screenCenterX = window.innerWidth / 2
  const screenCenterY = window.innerHeight / 2
  const canvasCenterX = (screenCenterX - viewport.x) / viewport.scale
  const canvasCenterY = (screenCenterY - viewport.y) / viewport.scale

  // Position grid so its center aligns with canvas center
  const startX = canvasCenterX - (totalGridWidth / 2)
  const startY = canvasCenterY - (totalGridHeight / 2)
  
  return shapes.map((shape, index) => {
    const row = Math.floor(index / cols!)
    const col = index % cols!
    
    // Calculate position with equal spacing
    const cellX = startX + col * (maxShapeWidth + spacing)
    const cellY = startY + row * (maxShapeHeight + spacing)
    
    // Center shape within its grid cell
    const centeredX = cellX + (maxShapeWidth - shape.width) / 2
    const centeredY = cellY + (maxShapeHeight - shape.height) / 2
    
    return {
      ...shape,
      x: centeredX,
      y: centeredY,
      rotation: 0
    }
  })
}

export function useCanvasCommands({ documentId }: UseCanvasCommandsOptions): UseCanvasCommandsReturn {
  const { addShape, updateShape, shapes } = useShapes({ documentId, enableLiveDrag: true })
  const { viewport, selectedId } = useCanvas()

  const applyCanvasCommand = useCallback(async (command: CanvasAction): Promise<{ success: boolean; error?: string; createdShapes?: string[]; details?: string }> => {
    try {
      const { action, target, parameters } = command
      const createdShapes: string[] = []
      const errors: string[] = []

      // Handle create action
      if (action === 'create') {
        // Forms and other complex targets should use action='complex' instead
        if (target === 'form' || target === 'navbar' || target === 'card') {
          return {
            success: false,
            error: `Target "${target}" requires action="complex", not action="create"`,
            details: `Please use action="complex" with target="${target}". The AI may need to be retrained.`
          }
        }
        
        const count = parameters.count ?? 1
        
        // Validate max shapes for create-with-layout
        if (parameters.layout && count > MAX_LAYOUT_SHAPES) {
          return {
            success: false,
            error: `Cannot create more than ${MAX_LAYOUT_SHAPES} shapes with layout`,
            details: `Requested: ${count} shapes. Maximum allowed: ${MAX_LAYOUT_SHAPES}`
          }
        }
        
        // Generate gradient colors if gradient parameters are provided
        let gradientColors: string[] | undefined
        if (count > 1 && parameters.gradientDirection && parameters.color) {
          const baseColor = parameters.color
          const direction = parameters.gradientDirection
          const intensity = parameters.gradientIntensity ?? 0.3
          gradientColors = generateGradientColors(baseColor, count, direction, intensity)
        }
        
        // Store created shapes for layout processing
        const createdShapeObjects: Rectangle[] = []
        
        for (let i = 0; i < count; i++) {
          try {
            // Pass layout info to skip cascade when layout is specified
            const shape = await createShapeFromCommand(target, parameters, viewport, i, gradientColors, parameters.layout)
            if (shape) {
              await addShape(shape)
              createdShapes.push(shape.id)
              createdShapeObjects.push(shape) // Store the shape object for layout
              // Update last position for cascade (only if no layout specified)
              if (!parameters.layout) {
                lastShapePosition = { x: shape.x, y: shape.y }
              }
              // Track last created shape ID for manipulation
              setLastCreatedShapeId(shape.id)
            }
          } catch (shapeError) {
            // Try to fix specific parameter issues
            const fixedParams = fixParameters(parameters, shapeError)
            
            try {
              const fixedShape = await createShapeFromCommand(target, fixedParams, viewport, i, gradientColors, parameters.layout)
              if (fixedShape) {
                await addShape(fixedShape)
                createdShapes.push(fixedShape.id)
                createdShapeObjects.push(fixedShape) // Store the shape object for layout
                errors.push(`Fixed parameters for ${target}: ${shapeError instanceof Error ? shapeError.message : 'Invalid parameters'}`)
                // Update last position for cascade (only if no layout specified)
                if (!parameters.layout) {
                  lastShapePosition = { x: fixedShape.x, y: fixedShape.y }
                }
                setLastCreatedShapeId(fixedShape.id)
              }
            } catch (fixedError) {
              // Try with default values if fixing fails
              try {
                const defaultShape = await createShapeFromCommand(target, {}, viewport, i, gradientColors, parameters.layout)
                if (defaultShape) {
                  await addShape(defaultShape)
                  createdShapes.push(defaultShape.id)
                  createdShapeObjects.push(defaultShape) // Store the shape object for layout
                  errors.push(`Used default values for ${target} due to: ${fixedError instanceof Error ? fixedError.message : 'Invalid parameters'}`)
                  // Update last position for cascade (only if no layout specified)
                  if (!parameters.layout) {
                    lastShapePosition = { x: defaultShape.x, y: defaultShape.y }
                  }
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
          
          // Use the shapes we just created directly (no Firestore dependency)
          const shapesToArrange = createdShapeObjects
          
          console.log(`[Grid Layout] Creating ${layoutType} layout for ${shapesToArrange.length} shapes`)
          console.log(`[Grid Layout] Created shape IDs:`, createdShapes)
          console.log(`[Grid Layout] Using created shapes directly:`, shapesToArrange.map(s => ({ id: s.id, x: s.x, y: s.y })))
          
          if (shapesToArrange.length > 0) {
            // Apply layout
            let arrangedShapes: Rectangle[]
            if (layoutType === 'row') {
              arrangedShapes = arrangeRow(shapesToArrange, startX, startY, { spacing })
            } else if (layoutType === 'column') {
              arrangedShapes = arrangeColumn(shapesToArrange, startX, startY, { spacing })
            } else if (layoutType === 'grid') {
              // Use new grid algorithm with actual window dimensions
              const viewportWithDims = {
                ...viewport,
                width: window.innerWidth,
                height: window.innerHeight
              }
              console.log(`[Grid Layout] Grid params: rows=${parameters.rows}, cols=${parameters.cols}, spacing=${spacing}`)
              console.log(`[Grid Layout] Viewport:`, viewportWithDims)
              
              arrangedShapes = arrangeGrid(shapesToArrange, viewportWithDims, parameters.rows, parameters.cols, { spacing })
              
              console.log(`[Grid Layout] Arranged shapes:`, arrangedShapes.map(s => ({ id: s.id, x: s.x, y: s.y })))
            } else {
              arrangedShapes = shapesToArrange
            }
            
            // Update positions
            try {
              console.log(`[Grid Layout] Updating ${arrangedShapes.length} shapes with new positions`)
              await Promise.all(
                arrangedShapes.map(shape => {
                  console.log(`[Grid Layout] Updating shape ${shape.id} to position (${shape.x}, ${shape.y})`)
                  return updateShape(shape.id, { x: shape.x, y: shape.y, rotation: 0 })
                })
              )
              console.log(`[Grid Layout] Successfully updated all shape positions`)
            } catch (layoutError) {
              console.error(`[Grid Layout] Failed to update positions:`, layoutError)
              errors.push(`Created shapes but failed to apply ${layoutType} layout: ${layoutError instanceof Error ? layoutError.message : 'Unknown error'}`)
            }
          }
        }
      }
      
      // Handle manipulate action
      if (action === 'manipulate') {
        // Enhanced shape selection logic
        let selectedShapes: Rectangle[] = []
        
        // 1. Try selector-based selection first
        if (parameters.selector) {
          const { color, shapeNumber, shapeType } = parameters.selector
          
          if (color) {
            // Select by color
            selectedShapes = selectShapesByColor(shapes, color)
            if (selectedShapes.length === 0) {
              return {
                success: false,
                error: `No shapes found with color "${color}". Try creating a shape with that color first.`,
                details: 'Color selection returned no results'
              }
            }
          } else if (shapeNumber !== undefined) {
            // Select by type and number - use shapeType from selector or fallback to target
            const typeToUse = shapeType || target
            const mappedType = typeToUse === 'rectangle' ? 'rect' : typeToUse as any
            const shape = selectShapeByTypeAndNumber(shapes, mappedType, shapeNumber)
            if (shape) {
              selectedShapes = [shape]
            } else {
              const displayType = typeToUse || target
              return {
                success: false,
                error: `Could not find ${displayType} #${shapeNumber}. Check the shape number and try again.`,
                details: 'Shape number selection failed'
              }
            }
          }
        } else if (target && !parameters.selector) {
          // 2. Handle "the [shape]" without specific identifier - ask for clarification
          const shapesOfType = shapes.filter(s => (s.type || 'rect') === (target === 'rectangle' ? 'rect' : target))
          
          if (shapesOfType.length === 0) {
            // No shapes of this type exist, ask user to specify shape type and number
            const allShapes = shapes.map((s, i) => {
              const typeName = getShapeTypeName(s.type)
              const position = getApproximatePosition(s, viewport)
              const colorName = s.fill
              return `${typeName} #${i + 1} (${colorName}, ${position})`
            })
            
            if (allShapes.length === 0) {
              return {
                success: false,
                error: `No shapes found. Please create a shape first, then specify which one to modify.`,
                details: 'No shapes exist'
              }
            } else {
              return {
                success: false,
                error: `No ${target}s found. I found these shapes:\n${allShapes.join('\n')}\n\nPlease specify which shape to modify by saying something like "circle #1" or "rectangle #2".`,
                details: 'No shapes of specified type exist'
              }
            }
          } else if (shapesOfType.length === 1) {
            // Only one shape of this type, use it
            selectedShapes = shapesOfType
          } else {
            // Multiple shapes of this type, ask for clarification with numbers
            const shapeDescriptions = shapesOfType.map((s, i) => {
              const typeName = getShapeTypeName(s.type)
              const position = getApproximatePosition(s, viewport)
              const colorName = s.fill
              return `${typeName} #${i + 1} (${colorName}, ${position})`
            })
            
            return {
              success: false,
              error: `I found ${shapesOfType.length} ${target}s:\n${shapeDescriptions.join('\n')}\n\nPlease specify which one by saying something like "${target} #1" or "${target} #2".`,
              details: 'Multiple shapes of same type - clarification needed'
            }
          }
        }
        
        // 3. Fallback to ID, last created, or selected shape
        if (selectedShapes.length === 0) {
          const targetId = parameters.id || getLastCreatedShapeId() || selectedId
          
          if (!targetId) {
            return { 
              success: false, 
              error: 'No shape available to manipulate. Please select a shape, specify a color, or create one first.',
              details: 'Target resolution failed: no explicit ID, last created, or selected shape found'
            }
          }
          
          const targetShape = shapes.find(r => r.id === targetId)
          if (!targetShape) {
            return { 
              success: false, 
              error: `Shape not found: ${targetId}`,
              details: 'Shape may have been deleted or does not exist'
            }
          }
          
          selectedShapes = [targetShape]
        }
        
        // 4. Handle multiple matches (ask for clarification)
        if (selectedShapes.length > 1) {
          const shapeDescriptions = selectedShapes.map((s, i) => {
            const typeName = getShapeTypeName(s.type)
            const position = getApproximatePosition(s, viewport)
            return `${typeName} #${i + 1} (${position})`
          })
          
          return {
            success: false,
            error: `I found ${selectedShapes.length} matching shapes:\n${shapeDescriptions.join('\n')}\n\nPlease specify which one by saying something like "${getShapeTypeName(selectedShapes[0].type)} #1"`,
            details: 'Multiple shapes matched - clarification needed'
          }
        }
        
        // 5. We have exactly one shape, proceed with manipulation
        const targetShape = selectedShapes[0]
        const updates: Partial<Rectangle> = {}
        
        // Handle relative sizing
        if (parameters.relativeResize && parameters.sizeMultiplier) {
          updates.width = calculateRelativeSize(targetShape.width, parameters.sizeMultiplier)
          updates.height = calculateRelativeSize(targetShape.height, parameters.sizeMultiplier)
        } else {
          // Absolute sizing
          if (parameters.width !== undefined) updates.width = parameters.width
          if (parameters.height !== undefined) updates.height = parameters.height
        }
        
        // Handle rotation
        if (parameters.rotationDirection) {
          const degrees = parseRotationDirection(parameters.rotationDirection)
          updates.rotation = ((targetShape.rotation || 0) + degrees) % 360
        } else if (parameters.rotationDegrees !== undefined) {
          if (parameters.relativeRotation) {
            updates.rotation = ((targetShape.rotation || 0) + parameters.rotationDegrees) % 360
          } else {
            updates.rotation = parameters.rotationDegrees % 360
          }
        } else if (parameters.rotation !== undefined) {
          updates.rotation = parameters.rotation % 360
        }
        
        // Handle smart positioning
        if (parameters.positionAnchor) {
          const position = calculateAnchorPosition(
            parameters.positionAnchor,
            viewport,
            targetShape.width,
            targetShape.height
          )
          updates.x = position.x + (parameters.offsetX || 0)
          updates.y = position.y + (parameters.offsetY || 0)
        } else {
          // Absolute positioning
          if (parameters.x !== undefined) updates.x = parameters.x
          if (parameters.y !== undefined) updates.y = parameters.y
        }
        
        // Handle radius for circles
        if (parameters.radius !== undefined) {
          updates.width = parameters.radius * 2
          updates.height = parameters.radius * 2
        }
        
        // Handle color
        if (parameters.color !== undefined) {
          updates.fill = validateColor(parameters.color) || targetShape.fill
        }
        
        // Apply the manipulation
        await updateShape(targetShape.id, updates)
        
        const actionDescription = []
        if (updates.width || updates.height) actionDescription.push('resized')
        if (updates.rotation !== undefined) actionDescription.push('rotated')
        if (updates.x !== undefined || updates.y !== undefined) actionDescription.push('moved')
        if (updates.fill) actionDescription.push('recolored')
        
        return {
          success: true,
          details: `Successfully ${actionDescription.join(', ')} ${getShapeTypeName(targetShape.type)} #${targetShape.id.slice(0, 8)}`,
          createdShapes: []
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
        
        // Select shapes based on selector or target
        let shapesToLayout: Rectangle[] = []
        
        if (parameters.selector) {
          const { color, shapeType } = parameters.selector
          
          if (color) {
            // Select by color
            shapesToLayout = selectShapesByColor(shapes, color)
            if (shapesToLayout.length === 0) {
              return {
                success: false,
                error: `No shapes found with color "${color}". Try creating a shape with that color first.`,
                details: 'Color selection returned no results'
              }
            }
          } else if (shapeType) {
            // Select by shape type
            const mappedType = shapeType === 'rectangle' ? 'rect' : shapeType as any
            shapesToLayout = shapes.filter(shape => (shape.type || 'rect') === mappedType)
            if (shapesToLayout.length === 0) {
              return {
                success: false,
                error: `No ${shapeType} shapes found. Try creating some ${shapeType} shapes first.`,
                details: 'Shape type selection returned no results'
              }
            }
          }
        } else if (target) {
          // Select by target type
          const mappedType = target === 'rectangle' ? 'rect' : target as any
          shapesToLayout = shapes.filter(shape => (shape.type || 'rect') === mappedType)
          if (shapesToLayout.length === 0) {
            return {
              success: false,
              error: `No ${target} shapes found. Try creating some ${target} shapes first.`,
              details: 'Target type selection returned no results'
            }
          }
        } else {
          // Fallback: get last N shapes
          shapesToLayout = shapes.slice(-count)
        }
        
        // Limit to requested count if we have more shapes than needed
        if (shapesToLayout.length > count) {
          shapesToLayout = shapesToLayout.slice(-count)
        }
        
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
          // Use new grid algorithm with viewport dimensions
          const viewportWithDims = {
            ...viewport,
            width: 1920, // Default viewport width
            height: 1080 // Default viewport height
          }
          arrangedShapes = arrangeGrid(shapesToLayout, viewportWithDims, rows, cols, { spacing })
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
      
      // Handle complex action (forms, navbars, cards, etc.)
      else if (action === 'complex') {
        if (target === 'form') {
          const formType = parameters.formType
          
          if (!formType) {
            return {
              success: false,
              error: 'Form type is required',
              details: 'Available types: login, signup, contact. Example: "create a login form"'
            }
          }
          
          // Get form template
          const template = getFormTemplate(formType)
          if (!template) {
            return {
              success: false,
              error: `Unknown form type: "${formType}"`,
              details: 'Available types: login, signup, contact'
            }
          }
          
          // Get viewport dimensions from window
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          // Generate form shapes
          const formShapes = generateFormShapes(template, {
            viewport: {
              x: viewport.x,
              y: viewport.y,
              scale: viewport.scale,
              width: viewportWidth,
              height: viewportHeight
            }
          })
          
          // Convert FormShapes to Rectangle shapes and add to canvas
          const createdShapeIds: string[] = []
          let currentZ = getMaxZ(shapes) + 1 // Start above existing shapes
          
          try {
            for (const formShape of formShapes) {
              const shapeId = generateRectId()
              
              // Convert FormShape to Rectangle
              const rectangleShape: Rectangle = {
                id: shapeId,
                type: formShape.type, // Direct assignment - types already match
                x: formShape.x,
                y: formShape.y,
                width: formShape.width,
                height: formShape.height,
                radius: formShape.type === 'circle' ? formShape.width / 2 : undefined,
                rotation: 0,
                fill: formShape.fill,
                stroke: formShape.stroke,
                strokeWidth: formShape.strokeWidth,
                text: formShape.text,
                fontSize: formShape.fontSize,
                z: currentZ++ // Increment z-index for each shape to maintain stacking order
              }
              
              // Add to Firestore
              await addShape(rectangleShape)
              createdShapeIds.push(shapeId)
            }
            
            return {
              success: true,
              createdShapes: createdShapeIds,
              details: `Created ${formType} form with ${formShapes.length} elements`
            }
          } catch (error) {
            return {
              success: false,
              error: 'Failed to create form',
              details: error instanceof Error ? error.message : 'Unknown error creating form shapes'
            }
          }
        }
        
        // Future: handle other complex targets (navbar, card, etc.)
        return {
          success: false,
          error: `Complex target "${target}" is not yet implemented`,
          details: 'Currently supported: form'
        }
      }

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
  }, [addShape, updateShape, shapes, viewport, selectedId])

  return { applyCanvasCommand }
}

// Helper function to get maximum z-index from existing shapes
function getMaxZ(shapes: Rectangle[]): number {
  if (shapes.length === 0) return 0
  return Math.max(...shapes.map(s => s.z ?? 0))
}

// Helper function to create shape from AI command
async function createShapeFromCommand(
  target: CanvasAction['target'], 
  parameters: CanvasAction['parameters'], 
  viewport: { scale: number; x: number; y: number },
  index: number = 0,
  gradientColors?: string[],
  layout?: string
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
    
    if (layout) {
      // When layout is specified, all shapes get the same default position
      // The layout algorithm will position them correctly
      x = defaultX
      y = defaultY
    } else if (index === 0) {
      // No layout specified, use cascade for multiple shapes
      x = defaultX
      y = defaultY
    } else {
      // Cascade positioning: offset from last shape
      const offset = 60 // 60px offset
      x = lastShapePosition.x + offset
      y = lastShapePosition.y + offset
    }
  }
  
  // Use gradient color if available, otherwise use base color
  const baseColor = validateColor(parameters.color) ?? '#3B82F6'
  const color = gradientColors && gradientColors[index] ? gradientColors[index] : baseColor
  const rotation = validateRotation(parameters.rotation) ?? 0

  // Map AI target to shape type
  const typeMap: Record<string, Rectangle['type']> = {
    'circle': 'circle',
    'rectangle': 'rect',
    'text': 'text',
    'triangle': 'triangle',
    'star': 'star',
    'arrow': 'arrow'
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
    const fontSize = parameters.fontSize ? validateFontSize(parameters.fontSize) : Math.min(72, Math.max(8, Math.floor(width / 10)))
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
  } else if (target === 'triangle') {
    const width = validateDimension(parameters.width) ?? 100
    const height = validateDimension(parameters.height) ?? 100
    return {
      id,
      type: 'triangle',
      x,
      y,
      width,
      height,
      fill: color,
      rotation,
      z: 0
    }
  } else if (target === 'star') {
    const width = validateDimension(parameters.width) ?? 100
    const height = validateDimension(parameters.height) ?? 100
    return {
      id,
      type: 'star',
      x,
      y,
      width,
      height,
      fill: color,
      rotation,
      z: 0
    }
  } else if (target === 'arrow') {
    const width = validateDimension(parameters.width) ?? 100
    const height = validateDimension(parameters.height) ?? 60
    return {
      id,
      type: 'arrow',
      x,
      y,
      width,
      height,
      fill: color,
      rotation,
      z: 0
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
  
  // Enforce size constraints: minimum 10x10, maximum viewport size
  const min = 10
  const max = Math.min(window.innerWidth, window.innerHeight) // Limit to viewport size
  
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
  
  // Enforce font size bounds: 8-72 as requested
  const min = 8
  const max = 72
  
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

