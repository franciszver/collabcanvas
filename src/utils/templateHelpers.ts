/**
 * Shared Template Creation Logic
 * 
 * This module provides reusable functions for creating templates (forms, navbars)
 * that can be used by both the TemplatesDropdown component and AI chat.
 * This ensures 100% consistency between button clicks and AI commands.
 */

import type { CanvasAction } from '../services/ai'

export interface TemplateCreationParams {
  templateId: 'login-oauth' | 'navbar'
  buttonLabels?: string[]
  color?: string
}

export interface TemplateCreationResult {
  success: boolean
  error?: string
  createdShapes?: string[]
  details?: string
}

/**
 * Template error messages for better UX
 */
export const TEMPLATE_ERRORS = {
  'navbar': 'Failed to create navigation bar',
  'login-oauth': 'Failed to create login form',
  'validation': 'Invalid parameters provided',
  'network': 'Network error - please try again',
  'unknown': 'Unknown template type',
  'canvas': 'Canvas error - please try again'
} as const

/**
 * Template information for user guidance
 */
export const TEMPLATE_INFO = {
  'navbar': {
    name: 'Navigation Bar',
    description: 'Horizontal menu with customizable buttons',
    example: 'create a navbar with Home, About, Contact',
    parameters: {
      buttonLabels: 'Array of button text (optional, defaults to Home, About, Services)',
      color: 'Background color (optional)'
    }
  },
  'login-oauth': {
    name: 'Login Form',
    description: 'User ID, password, and Google OAuth button',
    example: 'create a login form',
    parameters: {
      none: 'No parameters needed - fixed structure'
    }
  }
} as const

/**
 * Validate template parameters
 * 
 * @param templateId - The template type
 * @param params - The parameters to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateTemplateParams(templateId: string, params: any): string[] {
  const errors: string[] = []
  
  if (templateId === 'navbar') {
    if (params.buttonLabels !== undefined) {
      if (!Array.isArray(params.buttonLabels)) {
        errors.push('buttonLabels must be an array')
      } else if (params.buttonLabels.length > 10) {
        errors.push('Maximum 10 buttons allowed')
      } else if (params.buttonLabels.some((label: any) => typeof label !== 'string' || label.trim() === '')) {
        errors.push('All button labels must be non-empty strings')
      }
    }
    
    if (params.color !== undefined && typeof params.color !== 'string') {
      errors.push('Color must be a string')
    }
  }
  
  if (templateId === 'login-oauth') {
    // No parameters needed for login form
    if (Object.keys(params).length > 0) {
      errors.push('Login form does not accept custom parameters')
    }
  }
  
  return errors
}

/**
 * Create template shapes using shared logic
 * 
 * This function handles the creation of templates (forms, navbars) and can be used
 * by both the TemplatesDropdown component and AI chat to ensure identical results.
 * 
 * @param templateId - The type of template to create
 * @param params - Template-specific parameters
 * @param applyCanvasCommand - The canvas command function from useCanvasCommands
 * @returns Promise with creation result
 */
export async function createTemplateShapes(
  templateId: string,
  params: TemplateCreationParams,
  applyCanvasCommand: (command: CanvasAction) => Promise<{ success: boolean; error?: string; createdShapes?: string[]; details?: string }>
): Promise<TemplateCreationResult> {
  
  // Validate parameters first
  const validationErrors = validateTemplateParams(templateId, params)
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: `${TEMPLATE_ERRORS.validation}: ${validationErrors.join(', ')}`
    }
  }
  
  if (templateId === 'login-oauth') {
    // Direct command for login form
    const result = await applyCanvasCommand({
      action: 'complex',
      target: 'form',
      parameters: {
        formType: 'login-oauth'
      }
    })
    
    return {
      success: result.success,
      error: result.success ? undefined : (result.error || TEMPLATE_ERRORS['login-oauth']),
      createdShapes: result.createdShapes,
      details: result.details
    }
  }
  
  if (templateId === 'navbar') {
    // Direct command for navbar
    const result = await applyCanvasCommand({
      action: 'complex',
      target: 'navbar',
      parameters: {
        buttonLabels: params.buttonLabels,
        color: params.color
      }
    })
    
    return {
      success: result.success,
      error: result.success ? undefined : (result.error || TEMPLATE_ERRORS['navbar']),
      createdShapes: result.createdShapes,
      details: result.details
    }
  }
  
  return {
    success: false,
    error: `${TEMPLATE_ERRORS.unknown}: ${templateId}`
  }
}

/**
 * Check if an AI response is a template request
 * 
 * @param action - The action from AI response
 * @param target - The target from AI response
 * @returns True if this is a template request
 */
export function isTemplateRequest(action: string, target: string): boolean {
  return (
    action === 'complex' && 
    (target === 'navbar' || target === 'form')
  )
}

/**
 * Extract template ID from AI response
 * 
 * @param target - The target from AI response
 * @returns The template ID to use
 */
export function extractTemplateId(target: string): string {
  if (target === 'form') {
    return 'login-oauth' // Currently only one form template
  }
  if (target === 'navbar') {
    return 'navbar'
  }
  return target
}

/**
 * Extract template parameters from AI response
 * 
 * @param target - The target from AI response
 * @param parameters - The parameters from AI response
 * @returns Template parameters object
 */
export function extractTemplateParams(target: string, parameters: any): TemplateCreationParams {
  if (target === 'navbar') {
    return {
      templateId: 'navbar',
      buttonLabels: parameters.buttonLabels,
      color: parameters.color
    }
  }
  
  if (target === 'form') {
    return {
      templateId: 'login-oauth'
    }
  }
  
  return {
    templateId: target as any
  }
}
