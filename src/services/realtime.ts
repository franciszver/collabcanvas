import { getFirebaseApp } from './firebase'
import {
  getDatabase,
  ref,
  onValue,
  off,
  update,
  remove,
  serverTimestamp,
  type Database,
} from 'firebase/database'
import type { CursorPosition, UserPresence } from '../types/presence.types'
import type { Rectangle } from '../types/canvas.types'

function rtdb(): Database {
  return getDatabase(getFirebaseApp())
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
  await update(presenceRef, { cursor: pos, updatedAt: serverTimestamp() as any })
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

// Rectangle CRUD operations via RTDB
export async function createRectangleRtdb(rect: Rectangle): Promise<void> {
  const rectRef = ref(rtdb(), `rectangles/${rect.id}`)
  await update(rectRef, { ...rect, updatedAt: serverTimestamp() as any })
}

export async function updateRectangleRtdb(id: string, updateData: Partial<Rectangle>): Promise<void> {
  const rectRef = ref(rtdb(), `rectangles/${id}`)
  await update(rectRef, { ...updateData, updatedAt: serverTimestamp() as any })
}

export async function deleteRectangleRtdb(id: string): Promise<void> {
  const rectRef = ref(rtdb(), `rectangles/${id}`)
  await remove(rectRef)
}

export async function deleteAllRectanglesRtdb(): Promise<void> {
  const rectanglesRef = ref(rtdb(), 'rectangles')
  await remove(rectanglesRef)
}

export function subscribeToRectanglesRtdb(
  callback: (rectangles: Rectangle[]) => void
): () => void {
  const rectanglesRef = ref(rtdb(), 'rectangles')
  const handler = (snap: any) => {
    const val = snap.val() || {}
    const rectangles: Rectangle[] = Object.keys(val).map((id) => {
      const data = val[id] || {}
      return {
        id,
        x: data.x ?? 0,
        y: data.y ?? 0,
        width: data.width ?? 100,
        height: data.height ?? 100,
        fill: data.fill ?? '#3b82f6',
        type: data.type ?? 'rect',
        rotation: data.rotation ?? 0,
        z: data.z ?? 0,
      }
    })
    callback(rectangles)
  }
  onValue(rectanglesRef, handler)
  return () => off(rectanglesRef, 'value', handler)
}


