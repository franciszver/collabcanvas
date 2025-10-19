import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from './firebase'

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
    const functions = getFunctions(getFirebaseApp())
    const aiCommand = httpsCallable(functions, 'aiCanvasCommand')
    
    const result = await aiCommand({ prompt })
    const data = result.data as CanvasAction | { error: string }
    
    if ('error' in data) {
      return {
        success: false,
        error: data.error
      }
    }
    
    return {
      success: true,
      data: data as CanvasAction
    }
  } catch (error) {
    console.error('Error calling AI function:', error)
    return {
      success: false,
      error: 'Failed to process your request. Please try again.'
    }
  }
}
