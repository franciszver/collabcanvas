import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp, getAuthService } from './firebase'

export interface CanvasAction {
  action: 'create' | 'manipulate' | 'layout' | 'complex'
  target: 'circle' | 'rectangle' | 'text' | 'triangle' | 'star' | 'arrow' | 'group' | 'form' | 'navbar' | 'card'
  parameters: {
    id?: string // Optional: explicit shape ID to manipulate
    x?: number
    y?: number
    width?: number
    height?: number
    radius?: number
    rotation?: number
    color?: string
    text?: string
    fontSize?: number
    layout?: 'grid' | 'row' | 'column'
    count?: number
    spacing?: number // Gap between shapes in pixels for layouts
    rows?: number // Grid rows (optional, auto-calculated if not provided)
    cols?: number // Grid columns (optional, auto-calculated if not provided)
    formType?: 'login' | 'signup' | 'contact' | 'custom' | 'login-oauth' // Form template type
    gradientDirection?: 'lighter' | 'darker' | 'both'
    gradientIntensity?: number
    selector?: {
      color?: string
      shapeNumber?: number
      shapeType?: string
    }
    sizeMultiplier?: number
    relativeResize?: boolean
    rotationDirection?: 'right' | 'left' | 'flip' | 'clockwise' | 'counterclockwise'
    rotationDegrees?: number
    relativeRotation?: boolean
    positionAnchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    offsetX?: number
    offsetY?: number
    fields?: string[]
    items?: string[]
    buttonLabels?: string[]
  }
}

export interface AIResponse {
  success: boolean
  data?: CanvasAction
  error?: string
}

export async function aiCanvasCommand(prompt: string): Promise<AIResponse> {
  try {
    // Ensure user is authenticated before calling the function
    const auth = getAuthService()
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be signed in to use AI commands. Please sign in and try again.'
      }
    }
    
    const functions = getFunctions(getFirebaseApp())
    const aiCommand = httpsCallable(functions, 'aiCanvasCommand')
    
    const result = await aiCommand({ prompt })
    const data = result.data as CanvasAction | { error: string | { message?: string; status?: string } }
    
    if ('error' in data) {
      // Handle nested error objects (e.g., {"error":{"message":"Unauthenticated","status":"UNAUTHENTICATED"}})
      if (typeof data.error === 'object' && data.error !== null) {
        const errorObj = data.error as { message?: string; status?: string }
        if (errorObj.status === 'UNAUTHENTICATED' || errorObj.message?.includes('Unauthenticated')) {
          return {
            success: false,
            error: 'You must be signed in to use AI commands. Please sign in and try again.'
          }
        }
        return {
          success: false,
          error: errorObj.message || 'An error occurred processing your request.'
        }
      }
      // Handle string errors
      return {
        success: false,
        error: typeof data.error === 'string' ? data.error : 'An error occurred processing your request.'
      }
    }
    
    return {
      success: true,
      data: data as CanvasAction
    }
  } catch (error) {
    // Only log full error details in development
    if (import.meta.env.DEV) {
      console.error('Error calling AI function:', error)
    }
    
    // Handle Firebase HttpsError specifically
    if (error && typeof error === 'object' && 'code' in error) {
      const httpsError = error as { code: string; message?: string }
      
      if (httpsError.code === 'unauthenticated' || httpsError.code === 'functions/unauthenticated') {
        return {
          success: false,
          error: 'You must be signed in to use AI commands. Please sign in and try again.'
        }
      }
      
      if (httpsError.message) {
        return {
          success: false,
          error: httpsError.message
        }
      }
    }
    
    // Check if error has the structure from Firebase SDK
    if (error && typeof error === 'object' && 'error' in error) {
      const errorObj = error as { error: { message?: string; status?: string } }
      if (errorObj.error?.status === 'UNAUTHENTICATED' || errorObj.error?.message?.includes('Unauthenticated')) {
        return {
          success: false,
          error: 'You must be signed in to use AI commands. Please sign in and try again.'
        }
      }
      if (errorObj.error?.message) {
        return {
          success: false,
          error: errorObj.error.message
        }
      }
    }
    
    return {
      success: false,
      error: 'Failed to process your request. Please try again.'
    }
  }
}
