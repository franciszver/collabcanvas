import { DEFAULT_RECT_HEIGHT, DEFAULT_RECT_WIDTH } from './constants'
import type { ViewportTransform } from '../types/canvas.types'

export function generateRectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return `rect_${Math.random().toString(36).slice(2, 10)}`
}

export function getRandomColor(): string {
  const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function transformCanvasCoordinates(
  clientX: number,
  clientY: number,
  viewport: ViewportTransform
): { x: number; y: number } {
  const x = (clientX - viewport.x) / viewport.scale
  const y = (clientY - viewport.y) / viewport.scale
  return { x, y }
}

export function defaultRectAt(x: number, y: number) {
  return { x, y, width: DEFAULT_RECT_WIDTH, height: DEFAULT_RECT_HEIGHT, fill: getRandomColor() }
}


