import type { Rectangle } from '../types/canvas.types'
import { generateRectId } from './helpers'

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// Calculate button color based on position
function getButtonColor(index: number, total: number): string {
  if (index === 0) return '#3B82F6' // Primary (blue)
  if (total >= 3 && index === total - 1) return '#10B981' // CTA (green)
  return '#374151' // Secondary (gray)
}

// Auto-calculate text color for readability
function getTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor)
  const luminance = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114)
  return luminance > 186 ? '#1F2937' : '#FFFFFF'
}

// Estimate text width for dynamic button sizing
function estimateTextWidth(text: string): number {
  return text.length * 8 + 40 // ~8px per char + padding
}

export function generateNavbarShapes(
  buttonLabels: string[] | undefined,
  color: string | undefined,
  viewport: { x: number; y: number; scale: number; width: number; height: number },
  centerX?: number,
  centerY?: number
): Rectangle[] {
  const shapes: Rectangle[] = []
  const viewportWidth = viewport.width ?? window.innerWidth
  const viewportHeight = viewport.height ?? window.innerHeight
  
  // Default labels if not provided
  const labels = buttonLabels || ['Home', 'About', 'Services']
  
  // Color defaults
  const bgColor = color || '#1F2937'
  
  // Navbar dimensions
  const navbarHeight = 60
  const navbarPadding = 40 // 20px on each side
  
  // Use provided center Y or calculate from viewport (deprecated)
  const targetY = centerY !== undefined ? centerY - navbarHeight / 2 : viewportHeight * 0.1
  
  // Calculate dynamic button dimensions
  const buttonHeight = 40
  let buttonSpacing = 20
  
  // Calculate ideal button widths based on text length
  const idealButtonWidths = labels.map(label => 
    Math.max(100, Math.min(200, estimateTextWidth(label)))
  )
  
  // Calculate total ideal width
  const totalButtonsWidth = idealButtonWidths.reduce((sum, width) => sum + width, 0) + 
                           (labels.length - 1) * buttonSpacing
  const idealNavbarWidth = totalButtonsWidth + navbarPadding
  
  // Apply max-width constraint (90% of viewport)
  const maxNavbarWidth = viewportWidth * 0.9
  let navbarWidth: number
  let buttonWidths: number[]
  
  if (idealNavbarWidth <= maxNavbarWidth) {
    // Use ideal dimensions
    navbarWidth = idealNavbarWidth
    buttonWidths = idealButtonWidths
  } else {
    // Scale down proportionally
    const scaleFactor = maxNavbarWidth / idealNavbarWidth
    navbarWidth = maxNavbarWidth
    buttonWidths = idealButtonWidths.map(width => Math.max(80, width * scaleFactor))
    buttonSpacing = Math.max(12, buttonSpacing * scaleFactor)
  }
  
  // Use provided center X or calculate from viewport (deprecated)
  const targetX = centerX !== undefined ? centerX - navbarWidth / 2 : (viewportWidth - navbarWidth) / 2
  
  let zIndex = 0
  
  // Background bar
  shapes.push({
    id: generateRectId(),
    type: 'rect',
    x: targetX,
    y: targetY,
    width: navbarWidth,
    height: navbarHeight,
    fill: bgColor,
    rotation: 0,
    z: zIndex++
  })
  
  // Calculate button positions
  let currentX = targetX + navbarPadding / 2
  
  // Create buttons
  labels.forEach((label, index) => {
    const buttonWidth = buttonWidths[index]
    const buttonColor = getButtonColor(index, labels.length)
    const textColor = getTextColor(buttonColor)
    
    // Button background
    shapes.push({
      id: generateRectId(),
      type: 'rect',
      x: currentX,
      y: targetY + (navbarHeight - buttonHeight) / 2,
      width: buttonWidth,
      height: buttonHeight,
      fill: buttonColor,
      rotation: 0,
      z: zIndex++
    })
    
    // Button text
    shapes.push({
      id: generateRectId(),
      type: 'text',
      x: currentX + buttonWidth / 2,
      y: targetY + navbarHeight / 2,
      width: buttonWidth - 20,
      height: 20,
      text: label,
      fontSize: 14,
      fill: textColor,
      rotation: 0,
      z: zIndex++
    })
    
    currentX += buttonWidth + buttonSpacing
  })
  
  return shapes
}
