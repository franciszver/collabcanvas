import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from './firebase'

export interface CanvasAction {
  action: 'create' | 'manipulate' | 'layout' | 'complex'
  shapeType?: 'circle' | 'rectangle' | 'text' | 'arrow' | 'star' | 'triangle'
  id?: string
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fill?: string
  rotation?: number
  shapes?: string[]
  layout?: 'row' | 'column' | 'grid'
  rows?: number
  cols?: number
  padding?: number
  complexType?: 'form' | 'navbar' | 'card'
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
