export interface ViewportTransform {
  scale: number
  x: number
  y: number
}

export type CanvasShapeType = 'rect' | 'circle' | 'triangle' | 'star' | 'arrow'

export interface Rectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  type?: CanvasShapeType
  radius?: number
  sides?: number
  points?: number
  rotation?: number
  z?: number
}

export interface CanvasState {
  rectangles: Rectangle[]
  viewport: ViewportTransform
  selectedTool: 'pan' | 'rect'
}


