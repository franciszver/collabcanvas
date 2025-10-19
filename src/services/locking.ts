import { updateShape } from './firestore'
import { getRealtimeDB } from './firebase'
import { ref, update, remove, serverTimestamp } from 'firebase/database'
import type { Rectangle, ShapeLock } from '../types/canvas.types'

function rtdb() {
  return getRealtimeDB()
}

/**
 * Lock shapes for editing by a specific user
 */
export async function lockShapes(
  shapeIds: string[], 
  userId: string, 
  userName: string
): Promise<void> {
  if (shapeIds.length === 0) return

  const now = Date.now()
  const lockData = {
    lockedBy: userId,
    lockedByName: userName,
    lockedAt: now
  }

  // Update each shape in Firestore with lock information
  const updatePromises = shapeIds.map(shapeId => 
    updateShape(shapeId, lockData)
  )

  await Promise.all(updatePromises)
}

/**
 * Unlock shapes (remove lock from shapes)
 */
export async function unlockShapes(shapeIds: string[]): Promise<void> {
  if (shapeIds.length === 0) return

  const unlockData = {
        lockedBy: undefined,
        lockedByName: undefined,
        lockedAt: undefined
  }

  // Update each shape in Firestore to remove lock
  const updatePromises = shapeIds.map(shapeId => 
    updateShape(shapeId, unlockData)
  )

  await Promise.all(updatePromises)
}

/**
 * Unlock all shapes locked by a specific user (cleanup on disconnect)
 */
export async function unlockUserShapes(userId: string): Promise<void> {
  // This would ideally query Firestore for all shapes locked by this user
  // For now, we'll rely on the presence system to handle this
  // In a production app, you might want to add a Firestore query here
  console.log(`Unlocking all shapes for user ${userId}`)
}

/**
 * Check if a shape is locked by someone other than the current user
 */
export function isShapeLocked(shape: Rectangle, currentUserId: string): boolean {
  return !!(shape.lockedBy && shape.lockedBy !== currentUserId)
}

/**
 * Check if a shape is locked by the current user
 */
export function isShapeLockedByUser(shape: Rectangle, currentUserId: string): boolean {
  return !!(shape.lockedBy && shape.lockedBy === currentUserId)
}

/**
 * Get lock information for multiple shapes
 * This would typically query Firestore, but for now returns empty object
 */
export async function getShapeLocks(shapeIds: string[]): Promise<Record<string, ShapeLock>> {
  // In a real implementation, this would query Firestore for lock data
  // For now, return empty object as locks are stored on the shape objects themselves
  return {}
}

/**
 * Check if any of the provided shapes are locked by others
 */
export function hasLockedShapes(shapes: Rectangle[], currentUserId: string): boolean {
  return shapes.some(shape => isShapeLocked(shape, currentUserId))
}

/**
 * Get shapes that are locked by others
 */
export function getLockedShapes(shapes: Rectangle[], currentUserId: string): Rectangle[] {
  return shapes.filter(shape => isShapeLocked(shape, currentUserId))
}

/**
 * Get shapes that are locked by the current user
 */
export function getUserLockedShapes(shapes: Rectangle[], currentUserId: string): Rectangle[] {
  return shapes.filter(shape => isShapeLockedByUser(shape, currentUserId))
}

/**
 * Check if shapes can be locked (not already locked by others)
 */
export function canLockShapes(shapes: Rectangle[], currentUserId: string): boolean {
  return !hasLockedShapes(shapes, currentUserId)
}

/**
 * Get lock information for a single shape
 */
export function getShapeLock(shape: Rectangle): ShapeLock | null {
  if (!shape.lockedBy || !shape.lockedAt) return null
  
  return {
    lockedBy: shape.lockedBy,
    lockedByName: shape.lockedByName || 'Unknown User',
    lockedAt: shape.lockedAt
  }
}

/**
 * Check if a lock is stale (older than 5 minutes)
 */
export function isLockStale(shape: Rectangle, staleThresholdMs: number = 5 * 60 * 1000): boolean {
  if (!shape.lockedAt) return false
  return Date.now() - shape.lockedAt > staleThresholdMs
}

/**
 * Clean up stale locks (call periodically)
 */
export async function cleanupStaleLocks(staleThresholdMs: number = 5 * 60 * 1000): Promise<string[]> {
  // This would ideally query Firestore for shapes with stale locks
  // For now, return empty array as this is handled by the presence system
  console.log(`Cleaning up locks older than ${staleThresholdMs}ms`)
  return []
}
