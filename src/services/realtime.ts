import { getRealtimeDB } from './firebase'
import {
  ref,
  onValue,
  off,
  update,
  remove,
  serverTimestamp,
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
    await update(presenceRef, { cursor: pos, updatedAt: serverTimestamp() as any })
  } catch (error) {
    console.warn('Failed to update cursor position, retrying...', error)
    // Retry once after a short delay
    setTimeout(async () => {
      try {
        await update(presenceRef, { cursor: pos, updatedAt: serverTimestamp() as any })
      } catch (retryError) {
        console.error('Failed to update cursor position after retry:', retryError)
      }
    }, 100)
  }
}

export async function setUserOnlineRtdb(userId: string, displayName: string | null): Promise<void> {
  const presenceRef = ref(rtdb(), `presence/${userId}`)
  await update(presenceRef, { displayName, updatedAt: serverTimestamp() as any })
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


