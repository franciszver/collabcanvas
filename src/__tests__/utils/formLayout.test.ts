/**
 * Unit tests for form layout generation
 */

import { 
  generateFormShapes, 
  calculateTotalFormHeight,
  FORM_LAYOUT,
  FORM_COLORS 
} from '../../utils/formLayout'
import { FORM_TEMPLATES } from '../../utils/formTemplates'

describe('formLayout', () => {
  describe('calculateTotalFormHeight', () => {
    it('should calculate correct height for login form', () => {
      const template = FORM_TEMPLATES.login
      const height = calculateTotalFormHeight(template)
      
      // 2 fields * (label + spacing + input + spacing) + checkbox + button
      const expectedHeight = 
        40 + // top margin
        (14 + 8 + 40 + 20) * 2 + // 2 fields (label + spacing + input + spacing)
        (20 + 20) + // checkbox + spacing
        24 + 44 + // button margin + button height
        40 // bottom margin
      
      expect(height).toBe(expectedHeight)
    })
    
    it('should calculate correct height for signup form', () => {
      const template = FORM_TEMPLATES.signup
      const height = calculateTotalFormHeight(template)
      
      // 4 fields * (label + spacing + input + spacing) + button
      const expectedHeight = 
        40 + // top margin
        (14 + 8 + 40 + 20) * 4 + // 4 fields
        24 + 44 + // button margin + button height
        40 // bottom margin
      
      expect(height).toBe(expectedHeight)
    })
    
    it('should calculate correct height for contact form with textarea', () => {
      const template = FORM_TEMPLATES.contact
      const height = calculateTotalFormHeight(template)
      
      // 2 text fields + 1 textarea + button
      const expectedHeight = 
        40 + // top margin
        (14 + 8 + 40 + 20) * 2 + // 2 text fields
        (14 + 8 + 100 + 20) + // 1 textarea (height=100)
        24 + 44 + // button margin + button height
        40 // bottom margin
      
      expect(height).toBe(expectedHeight)
    })
  })
  
  describe('generateFormShapes', () => {
    const defaultViewport = {
      x: 0,
      y: 0,
      scale: 1,
      width: 1920,
      height: 1080
    }
    
    it('should generate correct number of shapes for login form', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      // Should have: 2 labels, 2 inputs, 1 checkbox, 1 checkbox label, 1 button, 1 button text
      expect(shapes.length).toBe(8)
      
      // Verify shape roles
      const labels = shapes.filter(s => s.role === 'label')
      const inputs = shapes.filter(s => s.role === 'input')
      const checkboxes = shapes.filter(s => s.role === 'checkbox')
      const buttons = shapes.filter(s => s.role === 'button')
      const buttonTexts = shapes.filter(s => s.role === 'button-text')
      
      expect(labels.length).toBe(3) // 2 field labels + 1 checkbox label
      expect(inputs.length).toBe(2)
      expect(checkboxes.length).toBe(1)
      expect(buttons.length).toBe(1)
      expect(buttonTexts.length).toBe(1)
    })
    
    it('should generate correct number of shapes for signup form', () => {
      const template = FORM_TEMPLATES.signup
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      // Should have: 4 labels, 4 inputs, 1 button, 1 button text
      expect(shapes.length).toBe(10)
      
      const labels = shapes.filter(s => s.role === 'label')
      const inputs = shapes.filter(s => s.role === 'input')
      const buttons = shapes.filter(s => s.role === 'button')
      
      expect(labels.length).toBe(4)
      expect(inputs.length).toBe(4)
      expect(buttons.length).toBe(1)
    })
    
    it('should horizontally center form in viewport', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const firstShape = shapes.find(s => s.role === 'label')
      expect(firstShape).toBeDefined()
      
      // Expected X = (viewportWidth - formWidth) / 2 + margin
      // formWidth = fieldWidth + margin*2 = 320 + 80 = 400
      // expectedX = (1920 - 400) / 2 + 40 = 760 + 40 = 800
      expect(firstShape!.x).toBe(800)
    })
    
    it('should vertically center form in viewport', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const totalHeight = calculateTotalFormHeight(template)
      const expectedStartY = (1080 - totalHeight) / 2 + FORM_LAYOUT.margin
      
      const firstShape = shapes[0]
      expect(firstShape.y).toBeCloseTo(expectedStartY, 0)
    })
    
    it('should use correct colors for form elements', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      // Check input colors
      const inputShape = shapes.find(s => s.role === 'input')
      expect(inputShape?.fill).toBe(FORM_COLORS.inputFill)
      expect(inputShape?.stroke).toBe(FORM_COLORS.inputStroke)
      expect(inputShape?.strokeWidth).toBe(FORM_COLORS.inputStrokeWidth)
      
      // Check button colors
      const buttonShape = shapes.find(s => s.role === 'button')
      expect(buttonShape?.fill).toBe(FORM_COLORS.buttonFill)
      expect(buttonShape?.stroke).toBe(FORM_COLORS.buttonStroke)
      
      // Check label colors
      const labelShape = shapes.find(s => s.role === 'label')
      expect(labelShape?.fill).toBe(FORM_COLORS.labelColor)
      
      // Check checkbox colors
      const checkboxShape = shapes.find(s => s.role === 'checkbox')
      expect(checkboxShape?.fill).toBe(FORM_COLORS.checkboxFill)
      expect(checkboxShape?.stroke).toBe(FORM_COLORS.checkboxStroke)
    })
    
    it('should handle small viewports with top alignment', () => {
      const template = FORM_TEMPLATES.signup
      const config = {
        viewport: {
          x: 0,
          y: 0,
          scale: 1,
          width: 800,
          height: 600
        }
      }
      const shapes = generateFormShapes(template, config)
      
      // Should still generate all shapes
      expect(shapes.length).toBeGreaterThan(0)
      
      // Should top-align when form is too tall (>80% of 600 = 480px)
      const totalHeight = calculateTotalFormHeight(template)
      if (totalHeight > 480) {
        const firstShape = shapes[0]
        // Should be at 20% from top = 120px
        expect(firstShape.y).toBe(600 * 0.2)
      }
    })
    
    it('should maintain proper vertical spacing between elements', () => {
      const template = FORM_TEMPLATES.contact
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      // Find consecutive input fields
      const inputs = shapes.filter(s => s.role === 'input')
      
      if (inputs.length >= 2) {
        // Calculate spacing between first two inputs
        const firstInputBottom = inputs[0].y + inputs[0].height
        const secondInputTop = inputs[1].y
        
        // Find the label between them
        const labelsBetween = shapes.filter(s => 
          s.role === 'label' && 
          s.y > firstInputBottom && 
          s.y < secondInputTop
        )
        
        // Should have label + spacing between inputs
        expect(labelsBetween.length).toBeGreaterThan(0)
      }
    })
    
    it('should center button horizontally within form width', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const button = shapes.find(s => s.role === 'button')
      const firstInput = shapes.find(s => s.role === 'input')
      
      expect(button).toBeDefined()
      expect(firstInput).toBeDefined()
      
      // Button should be centered within the field width
      const buttonCenterX = button!.x + button!.width / 2
      const inputCenterX = firstInput!.x + firstInput!.width / 2
      
      expect(buttonCenterX).toBeCloseTo(inputCenterX, 0)
    })
    
    it('should center button text within button', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const button = shapes.find(s => s.role === 'button')
      const buttonText = shapes.find(s => s.role === 'button-text')
      
      expect(button).toBeDefined()
      expect(buttonText).toBeDefined()
      
      // Button text should be approximately centered within button
      const buttonCenterX = button!.x + button!.width / 2
      const textApproxWidth = buttonText!.text!.length * FORM_LAYOUT.buttonFontSize * 0.6
      const textCenterX = buttonText!.x + textApproxWidth / 2
      
      // Allow 10px tolerance for text approximation
      expect(Math.abs(buttonCenterX - textCenterX)).toBeLessThan(10)
    })
    
    it('should position checkbox labels to the right of checkboxes', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const checkbox = shapes.find(s => s.role === 'checkbox')
      const checkboxLabel = shapes.find(s => 
        s.role === 'label' && s.text === 'Remember me'
      )
      
      expect(checkbox).toBeDefined()
      expect(checkboxLabel).toBeDefined()
      
      // Label should start after checkbox center + radius + offset
      const expectedLabelX = 
        checkbox!.x + 
        FORM_LAYOUT.checkboxDiameter / 2 + 
        FORM_LAYOUT.checkboxLabelOffset
      
      expect(checkboxLabel!.x).toBeCloseTo(expectedLabelX, 0)
    })
    
    it('should respect centerX configuration option', () => {
      const template = FORM_TEMPLATES.login
      const config = {
        viewport: defaultViewport,
        centerX: false
      }
      const shapes = generateFormShapes(template, config)
      
      const firstShape = shapes[0]
      // Should use viewport.x + margin instead of centering
      expect(firstShape.x).toBe(defaultViewport.x + FORM_LAYOUT.margin)
    })
    
    it('should respect startY configuration option', () => {
      const template = FORM_TEMPLATES.login
      const startY = 200
      const config = {
        viewport: defaultViewport,
        startY
      }
      const shapes = generateFormShapes(template, config)
      
      const firstShape = shapes[0]
      // Should start at specified Y + margin
      expect(firstShape.y).toBe(startY + FORM_LAYOUT.margin)
    })
    
    it('should set rotation to 0 for all shapes', () => {
      const template = FORM_TEMPLATES.login
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      // All shapes should have rotation = 0
      shapes.forEach(shape => {
        expect(shape.rotation).toBe(0)
      })
    })
    
    it('should generate textarea with correct height', () => {
      const template = FORM_TEMPLATES.contact
      const config = { viewport: defaultViewport }
      const shapes = generateFormShapes(template, config)
      
      const inputs = shapes.filter(s => s.role === 'input')
      
      // Last input should be textarea with height 100
      const textareaInput = inputs[inputs.length - 1]
      expect(textareaInput.height).toBe(FORM_LAYOUT.textareaHeight)
      
      // First two should be regular inputs with height 40
      expect(inputs[0].height).toBe(FORM_LAYOUT.fieldHeight)
      expect(inputs[1].height).toBe(FORM_LAYOUT.fieldHeight)
    })
    
    it('should use fallback viewport dimensions if not provided', () => {
      const template = FORM_TEMPLATES.login
      const config = {
        viewport: {
          x: 0,
          y: 0,
          scale: 1
          // width and height not provided
        }
      }
      const shapes = generateFormShapes(template, config)
      
      // Should not throw and should generate shapes
      expect(shapes.length).toBeGreaterThan(0)
      
      // Should use 1920x1080 defaults for centering
      const firstShape = shapes[0]
      const expectedX = (1920 - 400) / 2 + 40
      expect(firstShape.x).toBe(expectedX)
    })
  })
})

