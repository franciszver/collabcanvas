import { updateShape, deleteField } from './firestore'
import { createCommentEntry, createEditEntry, addToHistory } from '../utils/historyTracking'
import type { Rectangle, ActivityHistoryEntry } from '../types/canvas.types'

/**
 * Adds or updates a comment on a shape
 */
export async function updateShapeComment(
  shapeId: string,
  commentText: string,
  userId: string,
  userName: string,
  currentShape: Rectangle
): Promise<void> {
  const commentEntry = createCommentEntry(commentText, userId, userName)
  const newHistory = addToHistory(currentShape.history, commentEntry, 10)

  await updateShape(shapeId, {
    comment: commentText,
    commentBy: userId,
    commentByName: userName,
    commentAt: Date.now(),
    history: newHistory
  })
}

/**
 * Clears a comment from a shape
 */
export async function clearShapeComment(
  shapeId: string,
  currentShape: Rectangle
): Promise<void> {
  await updateShape(shapeId, {
    comment: deleteField(),
    commentBy: deleteField(),
    commentByName: deleteField(),
    commentAt: deleteField(),
    // Keep history intact
  })
}

/**
 * Tracks an edit to a shape by comparing old and new properties
 * Returns true if a history entry was created, false otherwise
 */
export async function trackShapeEdit(
  shapeId: string,
  oldProps: Partial<Rectangle>,
  newProps: Partial<Rectangle>,
  userId: string,
  userName: string,
  currentHistory?: ActivityHistoryEntry[]
): Promise<boolean> {
  const editEntry = createEditEntry(oldProps, newProps, userId, userName)
  
  // If no significant changes detected, don't create an entry
  if (!editEntry) {
    return false
  }

  const newHistory = addToHistory(currentHistory, editEntry, 10)

  await updateShape(shapeId, {
    history: newHistory
  })

  return true
}

/**
 * Gets the full history for a shape
 */
export function getShapeHistory(shape: Rectangle): ActivityHistoryEntry[] {
  return shape.history || []
}

/**
 * Checks if a shape has any comments
 */
export function hasComment(shape: Rectangle): boolean {
  return !!shape.comment && shape.comment.trim().length > 0
}

/**
 * Checks if a shape has any activity history (beyond just comments)
 */
export function hasActivity(shape: Rectangle): boolean {
  return (shape.history?.length || 0) > 0
}

/**
 * Gets a summary of activity for a shape
 */
export function getActivitySummary(shape: Rectangle): {
  hasComment: boolean
  hasEdits: boolean
  totalEntries: number
  lastActivity?: ActivityHistoryEntry
} {
  const history = shape.history || []
  const hasCommentFlag = hasComment(shape)
  const hasEdits = history.some(entry => entry.type === 'edit')
  const lastActivity = history[0] // Most recent entry

  return {
    hasComment: hasCommentFlag,
    hasEdits,
    totalEntries: history.length,
    lastActivity
  }
}

