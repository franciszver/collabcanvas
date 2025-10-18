/**
 * Form Layout Engine
 * 
 * This module calculates positions and dimensions for all form elements
 * based on template definitions. It handles centering, spacing, and
 * proper layout of labels, inputs, checkboxes, and buttons.
 */

import type { FormTemplate } from './formTemplates'

/**
 * Layout constants for form generation
 */
export const FORM_LAYOUT = {
  // Spacing and margins
  margin: 40,                    // Outer margin around form
  fieldWidth: 320,               // Width of input fields
  fieldHeight: 40,               // Height of input fields
  textareaHeight: 100,           // Height of textarea fields
  labelSpacing: 8,               // Space between label and input
  verticalSpacing: 20,           // Space between form elements
  
  // Button styling
  buttonWidth: 160,              // Button width
  buttonHeight: 44,              // Button height
  buttonMarginTop: 24,           // Extra space above buttons
  
  // Checkbox styling
  checkboxDiameter: 20,          // Diameter of checkbox circle
  checkboxLabelOffset: 8,        // Space between checkbox and label
  
  // Typography
  labelFontSize: 14,             // Font size for labels
  inputFontSize: 14,             // Font size for input placeholder text
  buttonFontSize: 16,            // Font size for button text
  
  // Validation
  maxFormHeight: 0.8,            // Max form height as percentage of viewport (80%)
}

/**
 * Color scheme for form elements
 */
export const FORM_COLORS = {
  // Input fields
  inputFill: '#F3F4F6',          // Light gray background
  inputStroke: '#D1D5DB',        // Medium gray border
  inputStrokeWidth: 2,
  
  // Buttons
  buttonFill: '#3B82F6',         // Blue background
  buttonStroke: '#2563EB',       // Darker blue border
  buttonStrokeWidth: 2,
  
  // Text
  labelColor: '#374151',         // Dark gray
  buttonTextColor: '#FFFFFF',    // White
  inputTextColor: '#6B7280',     // Medium gray (placeholder)
  
  // Checkboxes
  checkboxFill: '#FFFFFF',       // White background
  checkboxStroke: '#3B82F6',     // Blue border
  checkboxStrokeWidth: 2,
}

/**
 * Shape definition for form elements
 */
export interface FormShape {
  type: 'rect' | 'circle' | 'text'
  role: 'label' | 'input' | 'button' | 'checkbox' | 'button-text' | 'input-placeholder'
  x: number
  y: number
  width: number
  height: number
  text?: string
  fontSize?: number
  fill: string
  stroke?: string
  strokeWidth?: number
  rotation?: number  // Always 0 for forms, but required for Rectangle conversion
}

/**
 * Configuration for form layout generation
 */
export interface FormLayoutConfig {
  viewport: {
    x: number
    y: number
    scale: number
    width?: number
    height?: number
  }
  centerX?: boolean  // Default: true
  centerY?: boolean  // Default: true
  startY?: number    // Override vertical centering with specific Y position
}

/**
 * Calculate the position for text within a container
 * 
 * @param containerX - X position of container
 * @param containerY - Y position of container
 * @param containerWidth - Width of container
 * @param containerHeight - Height of container
 * @param fontSize - Font size of text
 * @param text - The text content
 * @param align - Horizontal alignment ('left' or 'center')
 * @returns The calculated x,y position for the text
 */
function calculateTextPosition(
  containerX: number,
  containerY: number,
  containerWidth: number,
  containerHeight: number,
  fontSize: number,
  text: string,
  align: 'left' | 'center'
): { x: number; y: number } {
  // Approximate text width (rough estimation: 0.6 * fontSize per character)
  const approxTextWidth = text.length * fontSize * 0.6
  
  const x = align === 'center' 
    ? containerX + (containerWidth - approxTextWidth) / 2
    : containerX
    
  // Vertically center in container
  const y = containerY + (containerHeight - fontSize) / 2
  
  return { x, y }
}

/**
 * Calculate total form height before rendering
 * 
 * @param template - The form template
 * @returns Total height in pixels
 */
export function calculateTotalFormHeight(template: FormTemplate): number {
  let height = FORM_LAYOUT.margin // Top margin
  
  // Fields (each field has label + input + spacing)
  template.fields.forEach(field => {
    height += FORM_LAYOUT.labelFontSize // Label
    height += FORM_LAYOUT.labelSpacing // Gap between label and input
    height += field.type === 'textarea' 
      ? FORM_LAYOUT.textareaHeight 
      : FORM_LAYOUT.fieldHeight // Input
    height += FORM_LAYOUT.verticalSpacing // Gap to next element
  })
  
  // Options (checkboxes/radios)
  if (template.options.length > 0) {
    height += template.options.length * (FORM_LAYOUT.checkboxDiameter + FORM_LAYOUT.verticalSpacing)
  }
  
  // Buttons
  if (template.buttons.length > 0) {
    height += FORM_LAYOUT.buttonMarginTop // Extra space before buttons
    height += FORM_LAYOUT.buttonHeight
  }
  
  height += FORM_LAYOUT.margin // Bottom margin
  
  return height
}

/**
 * Generate all shapes needed to render a form
 * 
 * Coordinate System:
 * - Origin (0,0) is top-left of canvas
 * - Text shapes: (x,y) is top-left corner of text bounding box
 * - Rectangles: (x,y) is top-left corner
 * - Circles: (x,y) is center point
 * 
 * Centering Logic:
 * - Horizontal: Centers the fixed-width form (320px + margins) in viewport
 * - Vertical: Centers the form height in viewport, or uses startY if provided
 * - Forms taller than 80% of viewport will be top-aligned instead
 * 
 * Stacking Order:
 * 1. Field labels (text)
 * 2. Input rectangles
 * 3. Checkbox circles
 * 4. Checkbox labels (text)
 * 5. Button rectangles
 * 6. Button text (centered)
 * 
 * @param template - The form template to generate
 * @param config - Layout configuration including viewport
 * @returns Array of shape definitions with calculated positions
 */
export function generateFormShapes(
  template: FormTemplate,
  config: FormLayoutConfig
): FormShape[] {
  const shapes: FormShape[] = []
  
  // Get viewport dimensions with fallbacks
  const viewportWidth = config.viewport.width ?? 1920
  const viewportHeight = config.viewport.height ?? 1080
  
  // Calculate total form height
  const totalFormHeight = calculateTotalFormHeight(template)
  
  // Validate form fits in viewport
  const maxAllowedHeight = viewportHeight * FORM_LAYOUT.maxFormHeight
  const shouldTopAlign = totalFormHeight > maxAllowedHeight
  
  if (shouldTopAlign) {
    console.warn(
      `Form height (${totalFormHeight}px) exceeds ${FORM_LAYOUT.maxFormHeight * 100}% of viewport (${maxAllowedHeight}px). Using top alignment.`
    )
  }
  
  // Calculate starting position
  const formWidth = FORM_LAYOUT.fieldWidth + (FORM_LAYOUT.margin * 2)
  
  // Horizontal centering (default: true)
  const centerX = config.centerX !== false
  const startX = centerX
    ? (viewportWidth - formWidth) / 2 + FORM_LAYOUT.margin
    : config.viewport.x + FORM_LAYOUT.margin
  
  // Vertical centering or top-alignment
  let currentY: number
  if (config.startY !== undefined) {
    // Use explicit start position
    currentY = config.startY + FORM_LAYOUT.margin
  } else if (shouldTopAlign || config.centerY === false) {
    // Top-align (20% from top)
    currentY = viewportHeight * 0.2
  } else {
    // Center vertically
    currentY = (viewportHeight - totalFormHeight) / 2 + FORM_LAYOUT.margin
  }
  
  // Generate field shapes (label + input for each field)
  template.fields.forEach(field => {
    // Label text
    shapes.push({
      type: 'text',
      role: 'label',
      x: startX,
      y: currentY,
      width: FORM_LAYOUT.fieldWidth,
      height: FORM_LAYOUT.labelFontSize,
      text: field.label,
      fontSize: FORM_LAYOUT.labelFontSize,
      fill: FORM_COLORS.labelColor,
      rotation: 0,
    })
    
    currentY += FORM_LAYOUT.labelFontSize + FORM_LAYOUT.labelSpacing
    
    // Input rectangle
    const inputHeight = field.type === 'textarea' 
      ? FORM_LAYOUT.textareaHeight 
      : FORM_LAYOUT.fieldHeight
    
    shapes.push({
      type: 'rect',
      role: 'input',
      x: startX,
      y: currentY,
      width: FORM_LAYOUT.fieldWidth,
      height: inputHeight,
      fill: FORM_COLORS.inputFill,
      stroke: FORM_COLORS.inputStroke,
      strokeWidth: FORM_COLORS.inputStrokeWidth,
      rotation: 0,
    })
    
    currentY += inputHeight + FORM_LAYOUT.verticalSpacing
  })
  
  // Generate checkbox/radio shapes
  template.options.forEach(option => {
    // Checkbox circle
    const circleY = currentY + FORM_LAYOUT.checkboxDiameter / 2
    
    shapes.push({
      type: 'circle',
      role: 'checkbox',
      x: startX + FORM_LAYOUT.checkboxDiameter / 2, // Center of circle
      y: circleY, // Center of circle
      width: FORM_LAYOUT.checkboxDiameter,
      height: FORM_LAYOUT.checkboxDiameter,
      fill: FORM_COLORS.checkboxFill,
      stroke: FORM_COLORS.checkboxStroke,
      strokeWidth: FORM_COLORS.checkboxStrokeWidth,
      rotation: 0,
    })
    
    // Checkbox label (to the right of circle)
    const labelX = startX + FORM_LAYOUT.checkboxDiameter + FORM_LAYOUT.checkboxLabelOffset
    
    shapes.push({
      type: 'text',
      role: 'label',
      x: labelX,
      y: currentY,
      width: FORM_LAYOUT.fieldWidth - FORM_LAYOUT.checkboxDiameter - FORM_LAYOUT.checkboxLabelOffset,
      height: FORM_LAYOUT.checkboxDiameter,
      text: option.label,
      fontSize: FORM_LAYOUT.labelFontSize,
      fill: FORM_COLORS.labelColor,
      rotation: 0,
    })
    
    currentY += FORM_LAYOUT.checkboxDiameter + FORM_LAYOUT.verticalSpacing
  })
  
  // Generate button shapes
  if (template.buttons.length > 0) {
    currentY += FORM_LAYOUT.buttonMarginTop
    
    template.buttons.forEach(button => {
      const buttonX = startX + (FORM_LAYOUT.fieldWidth - FORM_LAYOUT.buttonWidth) / 2
      
      // Button rectangle
      shapes.push({
        type: 'rect',
        role: 'button',
        x: buttonX,
        y: currentY,
        width: FORM_LAYOUT.buttonWidth,
        height: FORM_LAYOUT.buttonHeight,
        fill: button.type === 'primary' ? FORM_COLORS.buttonFill : FORM_COLORS.inputFill,
        stroke: button.type === 'primary' ? FORM_COLORS.buttonStroke : FORM_COLORS.inputStroke,
        strokeWidth: FORM_COLORS.buttonStrokeWidth,
        rotation: 0,
      })
      
      // Button text (centered)
      const textPos = calculateTextPosition(
        buttonX,
        currentY,
        FORM_LAYOUT.buttonWidth,
        FORM_LAYOUT.buttonHeight,
        FORM_LAYOUT.buttonFontSize,
        button.label,
        'center'
      )
      
      shapes.push({
        type: 'text',
        role: 'button-text',
        x: textPos.x,
        y: textPos.y,
        width: FORM_LAYOUT.buttonWidth,
        height: FORM_LAYOUT.buttonFontSize,
        text: button.label,
        fontSize: FORM_LAYOUT.buttonFontSize,
        fill: button.type === 'primary' ? FORM_COLORS.buttonTextColor : FORM_COLORS.labelColor,
        rotation: 0,
      })
      
      currentY += FORM_LAYOUT.buttonHeight + FORM_LAYOUT.verticalSpacing
    })
  }
  
  return shapes
}

