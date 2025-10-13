export interface ViewportTransform {
  scale: number
  x: number
  y: number
}

export interface Rectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
}

export interface CanvasState {
  rectangles: Rectangle[]
  viewport: ViewportTransform
  selectedTool: 'pan' | 'rect'
}


