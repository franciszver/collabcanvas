/**
 * Form Template Definitions
 * 
 * This module defines the structure and presets for form templates
 * that can be generated on the canvas via AI commands.
 */

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea'
}

export interface FormButton {
  label: string
  type: 'primary' | 'secondary'
}

export interface FormOption {
  label: string
  type: 'checkbox' | 'radio'
}

export interface FormTemplate {
  formType: 'login' | 'signup' | 'contact' | 'custom'
  fields: FormField[]
  buttons: FormButton[]
  options: FormOption[]
}

/**
 * Predefined form templates
 */
export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  login: {
    formType: 'login',
    fields: [
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'password', label: 'Password', type: 'password' }
    ],
    buttons: [
      { label: 'Login', type: 'primary' }
    ],
    options: [
      { label: 'Remember me', type: 'checkbox' }
    ]
  },
  
  signup: {
    formType: 'signup',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password' }
    ],
    buttons: [
      { label: 'Sign Up', type: 'primary' }
    ],
    options: []
  },
  
  contact: {
    formType: 'contact',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'message', label: 'Message', type: 'textarea' }
    ],
    buttons: [
      { label: 'Send', type: 'primary' }
    ],
    options: []
  },
  
  // Placeholder for future custom form support
  custom: {
    formType: 'custom',
    fields: [],
    buttons: [],
    options: []
  },
  
  'login-oauth': {
    formType: 'custom',
    fields: [
      { name: 'userid', label: 'User ID', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' }
    ],
    buttons: [
      { label: 'Sign in with Google', type: 'primary' }
    ],
    options: []
  }
}

/**
 * Get a form template by type
 * @param formType - The type of form template to retrieve
 * @returns The form template or null if not found
 */
export function getFormTemplate(formType: string): FormTemplate | null {
  return FORM_TEMPLATES[formType.toLowerCase()] || null
}

