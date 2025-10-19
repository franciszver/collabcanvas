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
  // Locking fields
  lockedBy?: string
  lockedByName?: string
  lockedAt?: number
  // Grouping field
  groupId?: string
}

export interface CanvasState {
  rectangles: Rectangle[]
  viewport: ViewportTransform
  selectedTool: 'pan' | 'rect'
}

// Selection types
export interface ShapeLock {
  lockedBy: string
  lockedByName: string
  lockedAt: number
}

export interface SelectionState {
  selectedIds: Set<string>
  isBoxSelecting: boolean
  selectionBox: { x1: number; y1: number; x2: number; y2: number } | null
}

export interface SelectionBoxCoords {
  x: number
  y: number
  width: number
  height: number
}

// Group types
export interface ShapeGroup {
  id: string
  name: string
  shapeIds: string[]
  documentId: string
  createdBy: string
  createdByName: string
  createdAt: number
  updatedAt: number
  color?: string
  isCollapsed?: boolean
}


