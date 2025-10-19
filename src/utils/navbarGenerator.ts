import type { Rectangle } from '../types/canvas.types'
import { generateRectId } from './helpers'

export function generateNavbarShapes(
  buttonLabels: string[] | undefined,
  color: string | undefined,
  viewport: { x: number; y: number; scale: number; width: number; height: number }
): Rectangle[] {
  const shapes: Rectangle[] = []
  const viewportWidth = viewport.width ?? window.innerWidth
  const viewportHeight = viewport.height ?? window.innerHeight
  
  // Default labels if not provided
  const labels = buttonLabels || ['Home', 'About', 'Services']
  
  // Color defaults
  const bgColor = color || '#1F2937'
  
  // Navbar dimensions
  const navbarWidth = viewportWidth * 0.9
  const navbarHeight = 60
  const startX = (viewportWidth - navbarWidth) / 2
  const startY = viewportHeight * 0.1
  
  let zIndex = 0
  
  // Background bar
  shapes.push({
    id: generateRectId(),
    type: 'rect',
    x: startX,
    y: startY,
    width: navbarWidth,
    height: navbarHeight,
    fill: bgColor,
    rotation: 0,
    z: zIndex++
  })
  
  // Calculate button layout
  const buttonWidth = 120
  const buttonHeight = 40
  const spacing = 20
  const totalButtonsWidth = labels.length * buttonWidth + (labels.length - 1) * spacing
  let currentX = startX + (navbarWidth - totalButtonsWidth) / 2
  
  // Create buttons
  labels.forEach((label) => {
    // Button background (transparent, just for hover effect in future)
    shapes.push({
      id: generateRectId(),
      type: 'rect',
      x: currentX,
      y: startY + (navbarHeight - buttonHeight) / 2,
      width: buttonWidth,
      height: buttonHeight,
      fill: 'transparent',
      rotation: 0,
      z: zIndex++
    })
    
    // Button text
    shapes.push({
      id: generateRectId(),
      type: 'text',
      x: currentX + buttonWidth / 2,
      y: startY + navbarHeight / 2,
      width: buttonWidth - 20,
      height: 20,
      text: label,
      fontSize: 14,
      fill: '#FFFFFF',
      rotation: 0,
      z: zIndex++
    })
    
    currentX += buttonWidth + spacing
  })
  
  return shapes
}
