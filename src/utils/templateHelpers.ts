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
  // Login form options
  includeRememberMe?: boolean
  includeForgotPassword?: boolean
  oauthProviders?: ('google' | 'github' | 'facebook')[]
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
    description: 'User ID, password, and OAuth buttons with customization options',
    example: 'create a login form',
    parameters: {
      includeRememberMe: 'Include Remember Me checkbox (optional, defaults to true)',
      includeForgotPassword: 'Include Forgot Password link (optional, defaults to true)',
      oauthProviders: 'OAuth providers array (optional, defaults to [google])'
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
    // Validate login form parameters
    if (params.includeRememberMe !== undefined && typeof params.includeRememberMe !== 'boolean') {
      errors.push('includeRememberMe must be a boolean')
    }
    
    if (params.includeForgotPassword !== undefined && typeof params.includeForgotPassword !== 'boolean') {
      errors.push('includeForgotPassword must be a boolean')
    }
    
    if (params.oauthProviders !== undefined) {
      if (!Array.isArray(params.oauthProviders)) {
        errors.push('oauthProviders must be an array')
      } else {
        const validProviders = ['google', 'github', 'facebook']
        const invalidProviders = params.oauthProviders.filter((provider: string) => !validProviders.includes(provider))
        if (invalidProviders.length > 0) {
          errors.push(`Invalid OAuth providers: ${invalidProviders.join(', ')}. Valid providers: ${validProviders.join(', ')}`)
        }
      }
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
    // Direct command for login form with options
    const result = await applyCanvasCommand({
      action: 'complex',
      target: 'form',
      parameters: {
        formType: 'login-oauth',
        includeRememberMe: params.includeRememberMe,
        includeForgotPassword: params.includeForgotPassword,
        oauthProviders: params.oauthProviders
      } as any
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
 * @param _action - The action from AI response (unused, kept for API compatibility)
 * @param target - The target from AI response
 * @returns True if this is a template request
 */
export function isTemplateRequest(_action: string, target: string): boolean {
  const targetLower = target.toLowerCase()
  
  // Check for navbar variations
  if (targetLower === 'navbar' || targetLower === 'navigation bar') {
    return true
  }
  
  // Check for form/login form/template variations
  if (targetLower === 'form' || targetLower === 'login form' || targetLower === 'template') {
    return true
  }
  
  return false
}

/**
 * Extract template ID from AI response
 * 
 * @param target - The target from AI response
 * @returns The template ID to use
 */
export function extractTemplateId(target: string): string {
  const targetLower = target.toLowerCase()
  
  // Normalize navbar variations
  if (targetLower === 'navbar' || targetLower === 'navigation bar') {
    return 'navbar'
  }
  
  // Normalize form variations
  if (targetLower === 'form' || targetLower === 'login form' || targetLower === 'template') {
    return 'login-oauth'
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

