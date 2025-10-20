import type Konva from 'konva'
import type { Rectangle, ViewportTransform } from '../types/canvas.types'

/**
 * Check if a shape intersects with the viewport bounds
 */
function isShapeInViewport(
  shape: Rectangle,
  viewport: ViewportTransform,
  screenWidth: number,
  screenHeight: number
): boolean {
  // Convert viewport bounds to canvas coordinates
  const viewportLeft = -viewport.x / viewport.scale
  const viewportTop = -viewport.y / viewport.scale
  const viewportRight = (screenWidth - viewport.x) / viewport.scale
  const viewportBottom = (screenHeight - viewport.y) / viewport.scale

  // Get shape bounds (accounting for rotation by using bounding box)
  const shapeRight = shape.x + shape.width
  const shapeBottom = shape.y + shape.height

  // Check intersection
  return !(
    shape.x > viewportRight ||
    shapeRight < viewportLeft ||
    shape.y > viewportBottom ||
    shapeBottom < viewportTop
  )
}

/**
 * Export the current viewport as a PNG image
 * 
 * @param stageRef - Reference to the Konva Stage
 * @param viewport - Current viewport transform
 * @param shapes - All canvas shapes
 * @returns Promise that resolves when export is complete
 */
export async function exportViewportAsPNG(
  stageRef: Konva.Stage | null,
  viewport: ViewportTransform,
  shapes: Rectangle[]
): Promise<void> {
  if (!stageRef) {
    console.error('Stage reference not available')
    return
  }

  // Get viewport dimensions (screen size)
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // Filter shapes that are visible in the viewport
  const visibleShapes = shapes.filter(shape =>
    isShapeInViewport(shape, viewport, screenWidth, screenHeight)
  )

  if (visibleShapes.length === 0) {
    console.warn('No shapes visible in viewport to export')
    return
  }

  try {
    // Create a temporary off-screen stage for export
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-10000px'
    tempDiv.style.top = '-10000px'
    document.body.appendChild(tempDiv)

    // Use dynamic import for Konva to access Stage constructor
    const Konva = await import('konva')
    
    const tempStage = new Konva.default.Stage({
      container: tempDiv,
      width: screenWidth,
      height: screenHeight,
    })

    const layer = new Konva.default.Layer()
    tempStage.add(layer)

    // Add white background
    const background = new Konva.default.Rect({
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight,
      fill: '#FFFFFF',
    })
    layer.add(background)

    // Add visible shapes to the temporary stage
    visibleShapes.forEach(shape => {
      // Convert canvas coordinates to screen coordinates
      const screenX = shape.x * viewport.scale + viewport.x
      const screenY = shape.y * viewport.scale + viewport.y

      // Common properties for all shapes
      const commonProps = {
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth || 0,
        rotation: shape.rotation || 0,
        scaleX: viewport.scale,
        scaleY: viewport.scale,
      }

      // Create appropriate Konva shape based on type
      let konvaShape: Konva.Shape | null = null

      switch (shape.type) {
        case 'circle': {
          const radius = (shape.radius ?? Math.min(shape.width, shape.height) / 2)
          konvaShape = new Konva.default.Circle({
            ...commonProps,
            x: screenX + (shape.width * viewport.scale) / 2,
            y: screenY + (shape.height * viewport.scale) / 2,
            radius: radius * viewport.scale,
          })
          break
        }

        case 'triangle': {
          const radius = Math.min(shape.width, shape.height) / 2
          konvaShape = new Konva.default.RegularPolygon({
            ...commonProps,
            x: screenX + (shape.width * viewport.scale) / 2,
            y: screenY + (shape.height * viewport.scale) / 2,
            sides: 3,
            radius: radius * viewport.scale,
          })
          break
        }

        case 'star': {
          const outer = Math.min(shape.width, shape.height) / 2
          const inner = outer / 2
          konvaShape = new Konva.default.Star({
            ...commonProps,
            x: screenX + (shape.width * viewport.scale) / 2,
            y: screenY + (shape.height * viewport.scale) / 2,
            numPoints: 5,
            innerRadius: inner * viewport.scale,
            outerRadius: outer * viewport.scale,
          })
          break
        }

        case 'arrow': {
          const points = [0, shape.height / 2, shape.width, shape.height / 2]
          konvaShape = new Konva.default.Arrow({
            ...commonProps,
            x: screenX,
            y: screenY,
            points: points,
            stroke: shape.fill,
            fill: shape.fill,
            strokeWidth: Math.max(2, Math.min(10, shape.height / 4)) * viewport.scale,
            pointerLength: Math.max(8, Math.min(24, shape.height)) * viewport.scale,
            pointerWidth: Math.max(8, Math.min(24, shape.height / 1.5)) * viewport.scale,
          })
          break
        }

        case 'text': {
          konvaShape = new Konva.default.Text({
            ...commonProps,
            x: screenX,
            y: screenY,
            width: shape.width * viewport.scale,
            height: shape.height * viewport.scale,
            text: shape.text ?? '',
            fontSize: (shape.fontSize || 64) * viewport.scale,
            align: 'left',
            verticalAlign: 'top',
            padding: 8 * viewport.scale,
            wrap: 'none',
          })
          break
        }

        default: // 'rect' or undefined
          konvaShape = new Konva.default.Rect({
            ...commonProps,
            x: screenX,
            y: screenY,
            width: shape.width * viewport.scale,
            height: shape.height * viewport.scale,
          })
      }

      if (konvaShape) {
        layer.add(konvaShape)
      }
    })

    // Draw the layer
    layer.batchDraw()

    // Export to PNG with high quality
    const dataURL = tempStage.toDataURL({
      pixelRatio: 2, // High-DPI export for crisp images
      mimeType: 'image/png',
    })

    // Create download link
    const link = document.createElement('a')
    const timestamp = new Date()
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/:/g, '')
    link.download = `canvas-export-${timestamp}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    tempStage.destroy()
    document.body.removeChild(tempDiv)
  } catch (error) {
    console.error('Failed to export canvas:', error)
    throw error
  }
}

/**
 * Check if there are any shapes visible in the current viewport
 */
export function hasVisibleShapes(
  viewport: ViewportTransform,
  shapes: Rectangle[],
  screenWidth: number = window.innerWidth,
  screenHeight: number = window.innerHeight
): boolean {
  return shapes.some(shape =>
    isShapeInViewport(shape, viewport, screenWidth, screenHeight)
  )
}

