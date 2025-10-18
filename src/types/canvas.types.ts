export interface ViewportTransform {
  scale: number
  x: number
  y: number
}

export type CanvasShapeType = 'rect' | 'circle' | 'triangle' | 'star' | 'arrow' | 'text'

export interface Rectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke?: string
  strokeWidth?: number
  type?: CanvasShapeType
  radius?: number
  sides?: number
  points?: number
  rotation?: number
  z?: number
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  textDecoration?: 'none' | 'line-through'
}

export interface CanvasState {
  rectangles: Rectangle[]
  viewport: ViewportTransform
  selectedTool: 'pan' | 'rect'
}


