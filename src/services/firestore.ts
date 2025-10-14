import { getFirebaseApp } from './firebase'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore'
import type { Rectangle } from '../types/canvas.types'

export function db(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function rectanglesCollection() {
  return collection(db(), 'objects')
}

export function presenceCollection() {
  return collection(db(), 'presence')
}

export function usersCollection() {
  return collection(db(), 'users')
}

export async function createRectangle(rect: Rectangle): Promise<void> {
  const ref = doc(rectanglesCollection(), rect.id)
  await setDoc(ref, { ...rect, updatedAt: serverTimestamp() })
}

export async function updateRectangleDoc(id: string, update: Partial<Rectangle>): Promise<void> {
  const ref = doc(rectanglesCollection(), id)
  await updateDoc(ref, { ...update, updatedAt: serverTimestamp() })
}

export async function deleteRectangleDoc(id: string): Promise<void> {
  const ref = doc(rectanglesCollection(), id)
  await deleteDoc(ref)
}

// Deletes all rectangle documents in the collection. Sequential, suitable for small counts.
export async function deleteAllRectangles(): Promise<void> {
  const snap = await getDocs(rectanglesCollection())
  const ops: Promise<void>[] = []
  snap.forEach((d) => {
    ops.push(deleteDoc(doc(rectanglesCollection(), d.id)))
  })
  for (const p of ops) {
    await p
  }
}


// Real-time subscription to rectangle documents. Returns an unsubscribe function.
export function subscribeToRectangles(
  callback: (rows: { rect: Rectangle; updatedAtMs: number }[]) => void
): Unsubscribe {
  const col = rectanglesCollection()
  let source: any = col
  try {
    const hasQuery = typeof (query as unknown as Function) === 'function'
    const hasOrderBy = typeof (orderBy as unknown as Function) === 'function'
    const hasLimit = typeof (limit as unknown as Function) === 'function'
    if (hasQuery && hasOrderBy && hasLimit) {
      source = (query as any)(col, (orderBy as any)('updatedAt', 'asc'), (limit as any)(1000))
    }
  } catch {}
  return onSnapshot(source, (snapshot: any) => {
    const rows: { rect: Rectangle; updatedAtMs: number }[] = snapshot.docs.map((d: any) => {
      const data = d.data() as any
      const updatedAtMs = data && data.updatedAt && typeof data.updatedAt.toMillis === 'function' ? data.updatedAt.toMillis() : 0
      const rect: Rectangle = {
        id: d.id,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        fill: data.fill,
      }
      return { rect, updatedAtMs }
    })
    callback(rows)
  })
}



