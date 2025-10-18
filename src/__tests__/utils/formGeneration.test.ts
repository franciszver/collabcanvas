/**
 * Tests for form generation integration
 */

import { generateFormShapes, FORM_LAYOUT, FORM_COLORS } from '../../utils/formLayout'
import { FORM_TEMPLATES } from '../../utils/formTemplates'

describe('Form Generation Integration', () => {
  const defaultViewport = {
    x: 0,
    y: 0,
    scale: 1,
    width: 1920,
    height: 1080
  }

  describe('Login Form', () => {
    it('should generate correct number of shapes', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // 2 labels + 2 inputs + 1 checkbox + 1 checkbox label + 1 button + 1 button text = 8
      expect(shapes.length).toBe(8)
    })

    it('should include stroke properties on input rectangles', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const inputs = shapes.filter(s => s.role === 'input')
      expect(inputs.length).toBe(2)
      
      inputs.forEach(input => {
        expect(input.stroke).toBe(FORM_COLORS.inputStroke)
        expect(input.strokeWidth).toBe(FORM_COLORS.inputStrokeWidth)
        expect(input.type).toBe('rect')
      })
    })

    it('should include stroke properties on checkbox circle', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const checkbox = shapes.find(s => s.role === 'checkbox')
      expect(checkbox).toBeDefined()
      expect(checkbox?.type).toBe('circle')
      expect(checkbox?.stroke).toBe(FORM_COLORS.checkboxStroke)
      expect(checkbox?.strokeWidth).toBe(FORM_COLORS.checkboxStrokeWidth)
    })

    it('should include stroke properties on button', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const button = shapes.find(s => s.role === 'button')
      expect(button).toBeDefined()
      expect(button?.type).toBe('rect')
      expect(button?.stroke).toBe(FORM_COLORS.buttonStroke)
      expect(button?.strokeWidth).toBe(FORM_COLORS.buttonStrokeWidth)
    })

    it('should have all rotation values set to 0', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      shapes.forEach(shape => {
        expect(shape.rotation).toBe(0)
      })
    })

    it('should have correct shape types', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const types = shapes.map(s => s.type)
      expect(types).toContain('text')
      expect(types).toContain('rect')
      expect(types).toContain('circle')
    })
  })

  describe('Signup Form', () => {
    it('should generate correct number of shapes', () => {
      const template = FORM_TEMPLATES.signup
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // 4 labels + 4 inputs + 1 button + 1 button text = 10
      expect(shapes.length).toBe(10)
    })

    it('should have no checkboxes', () => {
      const template = FORM_TEMPLATES.signup
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const checkboxes = shapes.filter(s => s.role === 'checkbox')
      expect(checkboxes.length).toBe(0)
    })

    it('should have 4 input fields with strokes', () => {
      const template = FORM_TEMPLATES.signup
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const inputs = shapes.filter(s => s.role === 'input')
      expect(inputs.length).toBe(4)
      
      inputs.forEach(input => {
        expect(input.stroke).toBeDefined()
        expect(input.strokeWidth).toBe(2)
      })
    })
  })

  describe('Contact Form', () => {
    it('should generate correct number of shapes', () => {
      const template = FORM_TEMPLATES.contact
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // 3 labels + 3 inputs (2 regular + 1 textarea) + 1 button + 1 button text = 8
      expect(shapes.length).toBe(8)
    })

    it('should have textarea with correct height', () => {
      const template = FORM_TEMPLATES.contact
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const inputs = shapes.filter(s => s.role === 'input')
      expect(inputs.length).toBe(3)
      
      // Last input should be textarea with height 100
      const textarea = inputs[inputs.length - 1]
      expect(textarea.height).toBe(FORM_LAYOUT.textareaHeight)
    })

    it('should have all inputs with stroke properties', () => {
      const template = FORM_TEMPLATES.contact
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const inputs = shapes.filter(s => s.role === 'input')
      
      inputs.forEach(input => {
        expect(input.stroke).toBe(FORM_COLORS.inputStroke)
        expect(input.strokeWidth).toBe(FORM_COLORS.inputStrokeWidth)
      })
    })
  })

  describe('Shape Properties for Rectangle Conversion', () => {
    it('should have all required Rectangle properties', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      shapes.forEach(shape => {
        // Required properties
        expect(shape.type).toBeDefined()
        expect(shape.x).toBeDefined()
        expect(shape.y).toBeDefined()
        expect(shape.width).toBeDefined()
        expect(shape.height).toBeDefined()
        expect(shape.fill).toBeDefined()
        expect(shape.rotation).toBeDefined()
        
        // Type should be valid
        expect(['rect', 'circle', 'text']).toContain(shape.type)
      })
    })

    it('should have stroke and strokeWidth for rect and circle types', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const rectAndCircleShapes = shapes.filter(s => s.type === 'rect' || s.type === 'circle')
      
      rectAndCircleShapes.forEach(shape => {
        if (shape.role !== 'button-text' && shape.role !== 'label') {
          expect(shape.stroke).toBeDefined()
          expect(shape.strokeWidth).toBeDefined()
        }
      })
    })

    it('should have text and fontSize for text shapes', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      const textShapes = shapes.filter(s => s.type === 'text')
      
      textShapes.forEach(shape => {
        expect(shape.text).toBeDefined()
        expect(shape.fontSize).toBeDefined()
        expect(typeof shape.fontSize).toBe('number')
      })
    })

    it('should be ready for direct Rectangle conversion', () => {
      const template = FORM_TEMPLATES.signup
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // Simulate conversion to Rectangle
      shapes.forEach(shape => {
        const rect = {
          id: 'test-id',
          type: shape.type, // Should work directly
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          radius: shape.type === 'circle' ? shape.width / 2 : undefined,
          rotation: shape.rotation,
          fill: shape.fill,
          stroke: shape.stroke,
          strokeWidth: shape.strokeWidth,
          text: shape.text,
          fontSize: shape.fontSize,
          z: 1
        }
        
        // All properties should be defined
        expect(rect.type).toBeDefined()
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.y).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Form Centering', () => {
    it('should center forms horizontally', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // All shapes should have similar x values (within form width)
      const xValues = shapes.map(s => s.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      
      // Form should be roughly centered (within reasonable range)
      const formCenter = (minX + maxX) / 2
      const viewportCenter = defaultViewport.width / 2
      
      // Allow 200px tolerance for centering
      expect(Math.abs(formCenter - viewportCenter)).toBeLessThan(200)
    })
  })

  describe('Z-index Compatibility', () => {
    it('should work with sequential z-index assignment', () => {
      const template = FORM_TEMPLATES.login
      const shapes = generateFormShapes(template, { viewport: defaultViewport })
      
      // Simulate z-index assignment
      let currentZ = 100 // Starting z-index
      const shapesWithZ = shapes.map(shape => ({
        ...shape,
        z: currentZ++
      }))
      
      // Verify sequential z-indexes
      expect(shapesWithZ[0].z).toBe(100)
      expect(shapesWithZ[7].z).toBe(107)
      expect(shapesWithZ.length).toBe(8)
    })
  })
})

