import { getRealtimeDB } from './firebase'
import {
  ref,
  onValue,
  off,
  update,
  remove,
  serverTimestamp,
  onDisconnect,
  type Database,
} from 'firebase/database'
import type { CursorPosition, UserPresence } from '../types/presence.types'

function rtdb(): Database {
  return getRealtimeDB()
}

// Presence (cursors) via RTDB
export function subscribeToPresenceRtdb(
  callback: (rows: UserPresence[]) => void
): () => void {
  const presenceRef = ref(rtdb(), 'presence')
  const handler = (snap: any) => {
    const val = snap.val() || {}
    const rows: UserPresence[] = Object.keys(val).map((userId) => {
      const data = val[userId] || {}
      const updatedAtRaw = data.updatedAt
      const updatedAt = typeof updatedAtRaw === 'number' ? updatedAtRaw : 0
      return {
        userId,
        displayName: data.displayName ?? null,
        cursor: data.cursor ?? null,
        updatedAt,
        isActive: data.isActive !== false, // Default to true if not set
      }
    })
    callback(rows)
  }
  onValue(presenceRef, handler)
  return () => off(presenceRef, 'value', handler)
}

export async function updateCursorPositionRtdb(userId: string, pos: CursorPosition): Promise<void> {
  const presenceRef = ref(rtdb(), `presence/${userId}`)
  
  try {
    await update(presenceRef, { 
      cursor: pos, 
      updatedAt: serverTimestamp() as any,
      isActive: true 
    })
  } catch (error) {
    console.warn('Failed to update cursor position, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(presenceRef, { 
          cursor: pos, 
          updatedAt: serverTimestamp() as any,
          isActive: true 
        })
      } catch (retryError) {
        console.error('Failed to update cursor position after retry:', retryError)
      }
    }, 100)
  }
}

export async function setUserOnlineRtdb(userId: string, displayName: string | null): Promise<void> {
  const presenceRef = ref(rtdb(), `presence/${userId}`)
  await update(presenceRef, { 
    displayName, 
    updatedAt: serverTimestamp() as any,
    isActive: true 
  })
}

export async function setUserOfflineRtdb(userId: string): Promise<void> {
  const presenceRef = ref(rtdb(), `presence/${userId}`)
  // mark offline by clearing cursor and setting updatedAt; actual deletion optional
  await update(presenceRef, { cursor: null, updatedAt: serverTimestamp() as any })
}

export async function removeUserPresenceRtdb(userId: string): Promise<void> {
  const presenceRef = ref(rtdb(), `presence/${userId}`)
  // completely remove user's presence data
  await remove(presenceRef)
}

// Clean up stale cursor data (call periodically)
export async function cleanupStaleCursorsRtdb(maxAgeMs: number = 30000): Promise<void> {
  const presenceRef = ref(rtdb(), 'presence')
  const now = Date.now()
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(presenceRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const updates: Record<string, any> = {}
    
    for (const [userId, userData] of Object.entries(data)) {
      const user = userData as any
      const updatedAt = typeof user.updatedAt === 'number' ? user.updatedAt : 0
      
      if (now - updatedAt > maxAgeMs) {
        updates[`presence/${userId}/cursor`] = null
        updates[`presence/${userId}/updatedAt`] = serverTimestamp()
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb()), updates)
    }
  } catch (error) {
    console.warn('Failed to cleanup stale cursors:', error)
  }
}

// Mark users as inactive (disable green light) after 60 seconds
export async function markInactiveUsersRtdb(inactiveThresholdMs: number = 60000): Promise<number> {
  const presenceRef = ref(rtdb(), 'presence')
  const now = Date.now()
  let markedCount = 0
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(presenceRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const updates: Record<string, any> = {}
    
    for (const [userId, userData] of Object.entries(data)) {
      const user = userData as any
      const updatedAt = typeof user.updatedAt === 'number' ? user.updatedAt : 0
      const isActive = user.isActive !== false // Default to active if not set
      
      // If user hasn't been active for more than threshold and is still marked as active
      if (now - updatedAt > inactiveThresholdMs && isActive) {
        updates[`presence/${userId}/isActive`] = false
        markedCount++
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb()), updates)
    }
  } catch (error) {
    console.warn('Failed to mark inactive users:', error)
  }
  
  return markedCount
}

// Remove users completely after 5 minutes of inactivity
export async function cleanupInactiveUsersRtdb(removalThresholdMs: number = 300000): Promise<number> {
  const presenceRef = ref(rtdb(), 'presence')
  const now = Date.now()
  let removedCount = 0
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(presenceRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const usersToRemove: string[] = []
    
    for (const [userId, userData] of Object.entries(data)) {
      const user = userData as any
      const updatedAt = typeof user.updatedAt === 'number' ? user.updatedAt : 0
      
      // If user hasn't been active for more than removal threshold, mark for removal
      if (now - updatedAt > removalThresholdMs) {
        usersToRemove.push(userId)
      }
    }
    
    // Remove inactive users from RTDB
    if (usersToRemove.length > 0) {
      const updates: Record<string, any> = {}
      for (const userId of usersToRemove) {
        updates[`presence/${userId}`] = null
      }
      
      await update(ref(rtdb()), updates)
      removedCount = usersToRemove.length
    }
  } catch (error) {
    console.warn('Failed to cleanup inactive users:', error)
  }
  
  return removedCount
}

// Drag channel via RTDB
export async function publishDragPositionsRtdb(
  entries: Array<[string, { x: number; y: number }]>,
  userId: string
): Promise<void> {
  if (!entries.length) return
  const payload: Record<string, any> = {}
  const ts = serverTimestamp() as any
  for (const [rectId, pos] of entries) {
    payload[`drag/${rectId}/${userId}`] = { x: pos.x, y: pos.y, updatedAt: ts }
  }
  await update(ref(rtdb()), payload)
}

export function subscribeToDragRtdb(
  selfUserId: string,
  callback: (live: Record<string, { x: number; y: number; ts: number }>) => void
): () => void {
  const dragRef = ref(rtdb(), 'drag')
  const handler = (snap: any) => {
    const val = snap.val() || {}
    const live: Record<string, { x: number; y: number; ts: number }> = {}
    for (const rectId of Object.keys(val)) {
      const users = val[rectId] || {}
      let best: { x: number; y: number; ts: number } | null = null
      for (const uid of Object.keys(users)) {
        if (uid === selfUserId) continue
        const d = users[uid]
        const ts = typeof d?.updatedAt === 'number' ? d.updatedAt : 0
        if (!best || ts > best.ts) best = { x: d?.x ?? 0, y: d?.y ?? 0, ts }
      }
      if (best) live[rectId] = best
    }
    callback(live)
  }
  onValue(dragRef, handler)
  return () => off(dragRef, 'value', handler)
}

export async function clearDragPositionRtdb(rectId: string, userId: string): Promise<void> {
  const dragRef = ref(rtdb(), `drag/${rectId}/${userId}`)
  await remove(dragRef)
}

// Throttled drag position updates for smooth animations
const DRAG_THROTTLE_MS = 1000 / 30 // 30fps max
const dragThrottleMap = new Map<string, number>()

// Viewport throttling for 60fps smooth panning
const VIEWPORT_THROTTLE_MS = 1000 / 60 // 60fps max
const viewportThrottleMap = new Map<string, number>()

export async function publishDragPositionsRtdbThrottled(
  entries: Array<[string, { x: number; y: number }]>,
  userId: string
): Promise<void> {
  if (!entries.length) return
  
  const now = Date.now()
  const throttledEntries: Array<[string, { x: number; y: number }]> = []
  
  for (const [rectId, pos] of entries) {
    const key = `${rectId}-${userId}`
    const lastUpdate = dragThrottleMap.get(key) || 0
    
    if (now - lastUpdate >= DRAG_THROTTLE_MS) {
      throttledEntries.push([rectId, pos])
      dragThrottleMap.set(key, now)
    }
  }
  
  if (throttledEntries.length > 0) {
    await publishDragPositionsRtdb(throttledEntries, userId)
  }
}

// Throttled resize position updates
export async function publishResizePositionsRtdb(
  entries: Array<[string, { x: number; y: number; width: number; height: number }]>,
  userId: string
): Promise<void> {
  if (!entries.length) return
  const payload: Record<string, any> = {}
  const ts = serverTimestamp() as any
  for (const [rectId, data] of entries) {
    payload[`resize/${rectId}/${userId}`] = { ...data, updatedAt: ts }
  }
  await update(ref(rtdb()), payload)
}

export function subscribeToResizeRtdb(
  selfUserId: string,
  callback: (live: Record<string, { x: number; y: number; width: number; height: number; ts: number }>) => void
): () => void {
  const resizeRef = ref(rtdb(), 'resize')
  const handler = (snap: any) => {
    const val = snap.val() || {}
    const live: Record<string, { x: number; y: number; width: number; height: number; ts: number }> = {}
    for (const rectId of Object.keys(val)) {
      const users = val[rectId] || {}
      let best: { x: number; y: number; width: number; height: number; ts: number } | null = null
      for (const uid of Object.keys(users)) {
        if (uid === selfUserId) continue
        const d = users[uid]
        const ts = typeof d?.updatedAt === 'number' ? d.updatedAt : 0
        if (!best || ts > best.ts) {
          best = { 
            x: d?.x ?? 0, 
            y: d?.y ?? 0, 
            width: d?.width ?? 100, 
            height: d?.height ?? 100, 
            ts 
          }
        }
      }
      if (best) live[rectId] = best
    }
    callback(live)
  }
  onValue(resizeRef, handler)
  return () => off(resizeRef, 'value', handler)
}

export async function clearResizePositionRtdb(rectId: string, userId: string): Promise<void> {
  const resizeRef = ref(rtdb(), `resize/${rectId}/${userId}`)
  await remove(resizeRef)
}

// Selection broadcasting via RTDB
export async function publishSelectionRtdb(
  userId: string, 
  shapeIds: string[], 
  color: string
): Promise<void> {
  const selectionRef = ref(rtdb(), `selections/${userId}`)
  
  try {
    await update(selectionRef, {
      shapeIds,
      color,
      updatedAt: serverTimestamp() as any
    })
  } catch (error) {
    console.warn('Failed to publish selection, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(selectionRef, {
          shapeIds,
          color,
          updatedAt: serverTimestamp() as any
        })
      } catch (retryError) {
        console.error('Failed to publish selection after retry:', retryError)
      }
    }, 100)
  }
}

export function subscribeToSelectionsRtdb(
  callback: (selections: Record<string, {shapeIds: string[], color: string, updatedAt: number}>) => void
): () => void {
  const selectionsRef = ref(rtdb(), 'selections')
  const handler = (snap: any) => {
    const val = snap.val() || {}
    const selections: Record<string, {shapeIds: string[], color: string, updatedAt: number}> = {}
    
    for (const [userId, data] of Object.entries(val)) {
      const userData = data as any
      const updatedAt = typeof userData?.updatedAt === 'number' ? userData.updatedAt : 0
      
      // Only include recent selections (within 10 seconds)
      if (Date.now() - updatedAt < 10000) {
        selections[userId] = {
          shapeIds: userData?.shapeIds || [],
          color: userData?.color || '#3B82F6',
          updatedAt
        }
      }
    }
    
    callback(selections)
  }
  
  onValue(selectionsRef, handler)
  return () => off(selectionsRef, 'value', handler)
}

export async function clearSelectionRtdb(userId: string): Promise<void> {
  const selectionRef = ref(rtdb(), `selections/${userId}`)
  await remove(selectionRef)
}

// Clean up stale selections (call periodically)
export async function cleanupStaleSelectionsRtdb(maxAgeMs: number = 10000): Promise<void> {
  const selectionsRef = ref(rtdb(), 'selections')
  const now = Date.now()
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(selectionsRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const updates: Record<string, any> = {}
    
    for (const [userId, userData] of Object.entries(data)) {
      const user = userData as any
      const updatedAt = typeof user?.updatedAt === 'number' ? user.updatedAt : 0
      
      if (now - updatedAt > maxAgeMs) {
        updates[`selections/${userId}`] = null
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb()), updates)
    }
  } catch (error) {
    console.warn('Failed to cleanup stale selections:', error)
  }
}

// Viewport panning via RTDB for 60fps smooth updates
export async function publishViewportRtdb(
  userId: string,
  viewport: { x: number; y: number; scale: number },
  documentId: string
): Promise<void> {
  const viewportRef = ref(rtdb(), `viewport/${userId}/current`)
  
  try {
    await update(viewportRef, {
      x: viewport.x,
      y: viewport.y,
      scale: viewport.scale,
      documentId,
      updatedAt: serverTimestamp() as any
    })
  } catch (error) {
    console.warn('Failed to publish viewport, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(viewportRef, {
          x: viewport.x,
          y: viewport.y,
          scale: viewport.scale,
          documentId,
          updatedAt: serverTimestamp() as any
        })
      } catch (retryError) {
        console.warn('Failed to publish viewport after retry:', retryError)
      }
    }, 100)
  }
}

// Throttled viewport updates for smooth 60fps panning
export async function publishViewportRtdbThrottled(
  userId: string,
  viewport: { x: number; y: number; scale: number },
  documentId: string
): Promise<void> {
  const now = Date.now()
  const key = userId
  const lastUpdate = viewportThrottleMap.get(key) || 0
  
  if (now - lastUpdate >= VIEWPORT_THROTTLE_MS) {
    viewportThrottleMap.set(key, now)
    await publishViewportRtdb(userId, viewport, documentId)
  }
}

// Subscribe to viewport updates from RTDB (for cross-tab sync)
export function subscribeToViewportRtdb(
  userId: string,
  callback: (viewport: { x: number; y: number; scale: number; documentId: string } | null) => void
): () => void {
  const viewportRef = ref(rtdb(), `viewport/${userId}/current`)
  const handler = (snap: any) => {
    const data = snap.val()
    if (data && typeof data.x === 'number' && typeof data.y === 'number' && typeof data.scale === 'number') {
      callback({
        x: data.x,
        y: data.y,
        scale: data.scale,
        documentId: data.documentId || ''
      })
    } else {
      callback(null)
    }
  }
  
  onValue(viewportRef, handler)
  return () => off(viewportRef, 'value', handler)
}

// Clear viewport from RTDB when done panning
export async function clearViewportRtdb(userId: string): Promise<void> {
  const viewportRef = ref(rtdb(), `viewport/${userId}/current`)
  await remove(viewportRef)
}

// Setup automatic cleanup of viewport on disconnect
export async function setupViewportDisconnectCleanup(userId: string): Promise<void> {
  const viewportRef = ref(rtdb(), `viewport/${userId}/current`)
  try {
    await onDisconnect(viewportRef).remove()
  } catch (error) {
    console.warn('Failed to setup viewport disconnect cleanup:', error)
  }
}

// Bulk updates channel via RTDB
export interface BulkShapeUpdate {
  shapeId: string
  updates: Record<string, any>
}

export async function publishBulkUpdateRtdb(
  userId: string,
  updates: BulkShapeUpdate[],
  documentId: string
): Promise<void> {
  if (!updates.length) return
  
  const timestamp = Date.now()
  const bulkUpdateRef = ref(rtdb(), `bulkUpdates/${documentId}/${userId}/${timestamp}`)
  
  try {
    await update(bulkUpdateRef, {
      updates,
      updatedAt: serverTimestamp() as any
    })
    
    // Auto-expire after 5 seconds to prevent memory buildup
    setTimeout(async () => {
      try {
        await remove(bulkUpdateRef)
      } catch (error) {
        console.warn('Failed to cleanup bulk update:', error)
      }
    }, 5000)
  } catch (error) {
    console.warn('Failed to publish bulk update, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(bulkUpdateRef, {
          updates,
          updatedAt: serverTimestamp() as any
        })
      } catch (retryError) {
        console.error('Failed to publish bulk update after retry:', retryError)
      }
    }, 100)
  }
}

export function subscribeToBulkUpdateRtdb(
  documentId: string,
  selfUserId: string,
  callback: (updates: BulkShapeUpdate[], fromUserId: string) => void
): () => void {
  const bulkUpdatesRef = ref(rtdb(), `bulkUpdates/${documentId}`)
  
  const handler = (snap: any) => {
    const val = snap.val() || {}
    
    // Process updates from all users except self
    for (const [userId, userUpdates] of Object.entries(val)) {
      if (userId === selfUserId) continue
      
      // Process all timestamps for this user
      const timestampData = userUpdates as any
      for (const data of Object.values(timestampData)) {
        const updateData = data as any
        if (updateData?.updates && Array.isArray(updateData.updates)) {
          callback(updateData.updates, userId)
        }
      }
    }
  }
  
  onValue(bulkUpdatesRef, handler)
  return () => off(bulkUpdatesRef, 'value', handler)
}

// Clean up stale bulk updates (call periodically if needed)
export async function cleanupStaleBulkUpdatesRtdb(documentId: string, maxAgeMs: number = 10000): Promise<void> {
  const bulkUpdatesRef = ref(rtdb(), `bulkUpdates/${documentId}`)
  const now = Date.now()
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(bulkUpdatesRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const updates: Record<string, any> = {}
    
    for (const [userId, userUpdates] of Object.entries(data)) {
      const timestampData = userUpdates as any
      for (const [timestamp] of Object.entries(timestampData)) {
        const ts = parseInt(timestamp, 10)
        if (now - ts > maxAgeMs) {
          updates[`bulkUpdates/${documentId}/${userId}/${timestamp}`] = null
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb()), updates)
    }
  } catch (error) {
    console.warn('Failed to cleanup stale bulk updates:', error)
  }
}

// Multi-delete channel via RTDB for instant deletion propagation
export async function publishMultiDeleteRtdb(
  userId: string,
  shapeIds: string[],
  documentId: string
): Promise<void> {
  if (!shapeIds.length) return
  
  const timestamp = Date.now()
  const multiDeleteRef = ref(rtdb(), `multiDelete/${documentId}/${userId}/${timestamp}`)
  
  try {
    await update(multiDeleteRef, {
      shapeIds,
      updatedAt: serverTimestamp() as any
    })
    
    // Auto-expire after 5 seconds to prevent memory buildup
    setTimeout(async () => {
      try {
        await remove(multiDeleteRef)
      } catch (error) {
        console.warn('Failed to cleanup multi-delete event:', error)
      }
    }, 5000)
  } catch (error) {
    console.warn('Failed to publish multi-delete, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(multiDeleteRef, {
          shapeIds,
          updatedAt: serverTimestamp() as any
        })
      } catch (retryError) {
        console.error('Failed to publish multi-delete after retry:', retryError)
      }
    }, 100)
  }
}

export function subscribeToMultiDeleteRtdb(
  documentId: string,
  selfUserId: string,
  callback: (shapeIds: string[], fromUserId: string) => void
): () => void {
  const multiDeleteRef = ref(rtdb(), `multiDelete/${documentId}`)
  
  const handler = (snap: any) => {
    const val = snap.val() || {}
    
    // Process deletions from all users except self
    for (const [userId, userDeletes] of Object.entries(val)) {
      if (userId === selfUserId) continue
      
      // Process all timestamps for this user
      const timestampData = userDeletes as any
      for (const data of Object.values(timestampData)) {
        const deleteData = data as any
        if (deleteData?.shapeIds && Array.isArray(deleteData.shapeIds)) {
          callback(deleteData.shapeIds, userId)
        }
      }
    }
  }
  
  onValue(multiDeleteRef, handler)
  return () => off(multiDeleteRef, 'value', handler)
}

// Clean up stale multi-delete events (call periodically if needed)
export async function cleanupStaleMultiDeleteRtdb(documentId: string, maxAgeMs: number = 10000): Promise<void> {
  const multiDeleteRef = ref(rtdb(), `multiDelete/${documentId}`)
  const now = Date.now()
  
  try {
    const snapshot = await new Promise<any>((resolve) => {
      onValue(multiDeleteRef, resolve, { onlyOnce: true })
    })
    
    const data = snapshot.val() || {}
    const updates: Record<string, any> = {}
    
    for (const [userId, userDeletes] of Object.entries(data)) {
      const timestampData = userDeletes as any
      for (const [timestamp] of Object.entries(timestampData)) {
        const ts = parseInt(timestamp, 10)
        if (now - ts > maxAgeMs) {
          updates[`multiDelete/${documentId}/${userId}/${timestamp}`] = null
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb()), updates)
    }
  } catch (error) {
    console.warn('Failed to cleanup stale multi-delete events:', error)
  }
}


