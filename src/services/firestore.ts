import { getFirebaseApp } from './firebase'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
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



