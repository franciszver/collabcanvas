import { getFirebaseApp } from './firebase'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
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


// Real-time subscription to rectangle documents. Returns an unsubscribe function.
export function subscribeToRectangles(
  callback: (rows: { rect: Rectangle; updatedAtMs: number }[]) => void
): Unsubscribe {
  return onSnapshot(rectanglesCollection(), (snapshot) => {
    const rows: { rect: Rectangle; updatedAtMs: number }[] = snapshot.docs.map((d) => {
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



