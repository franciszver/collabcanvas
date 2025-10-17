import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import OpenAI from 'openai'

// Initialize Firebase Admin
initializeApp()

// Initialize OpenAI (lazy initialization)
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({ apiKey })
  }
  return openai
}

// Canvas action schema
interface CanvasAction {
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

export const aiCanvasCommand = onCall(async (request) => {
  try {
    const { prompt } = request.data

    if (!prompt || typeof prompt !== 'string') {
      throw new HttpsError('invalid-argument', 'Prompt is required and must be a string')
    }

    // System prompt to restrict AI to JSON schema
    const systemPrompt = `You are an AI assistant for a collaborative canvas application. 
    You can only respond with JSON objects that match the canvas action schema.
    
    Available actions:
    - create: Create shapes (circle, rectangle, text, arrow, star, triangle)
    - manipulate: Move, resize, rotate existing shapes
    - layout: Arrange shapes in rows, columns, or grids
    - complex: Create complex UI elements (forms, navbars, cards)
    
    Required fields for create:
    - action: "create"
    - shapeType: one of the available shape types
    - x, y: position coordinates
    - width, height: dimensions (or radius for circles)
    - fill: color (hex code)
    - text: text content (for text shapes)
    - fontSize: font size (for text shapes)
    
    If the user's request is unrelated to canvas operations, respond with:
    {"error": "Unsupported command"}
    
    Always respond with valid JSON only.`

    const openaiClient = getOpenAI()
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
      stream: false // Keep non-streaming for now, can be enhanced later
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new HttpsError('internal', 'No response from OpenAI')
    }

    // Try to parse the response as JSON
    let parsedResponse: CanvasAction | { error: string }
    try {
      parsedResponse = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', response)
      return { error: 'Invalid response format from AI' }
    }

    // Check if it's an error response
    if ('error' in parsedResponse) {
      return parsedResponse
    }

    // Validate the action structure
    if (!parsedResponse.action) {
      return { error: 'Invalid action structure' }
    }

    return parsedResponse

  } catch (error) {
    console.error('Error in aiCanvasCommand:', error)
    
    if (error instanceof HttpsError) {
      throw error
    }
    
    throw new HttpsError('internal', 'An error occurred processing your request')
  }
})
