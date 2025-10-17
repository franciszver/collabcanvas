export interface CursorPosition {
  x: number
  y: number
}

export interface UserPresence {
  userId: string
  displayName: string | null
  cursor: CursorPosition | null
  updatedAt: number
  isActive?: boolean
}


