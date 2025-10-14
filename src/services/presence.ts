import { collection, doc, onSnapshot, serverTimestamp, setDoc, deleteDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firestore'
import type { CursorPosition, UserPresence } from '../types/presence.types'

function presenceCollection() {
  return collection(db(), 'presence')
}

export async function setUserOnline(userId: string, displayName: string | null): Promise<void> {
  const ref = doc(presenceCollection(), userId)
  await setDoc(ref, { userId, displayName, cursor: null, updatedAt: serverTimestamp() }, { merge: true })
}

export async function setUserOffline(userId: string): Promise<void> {
  const ref = doc(presenceCollection(), userId)
  await deleteDoc(ref)
}

export async function updateCursorPosition(userId: string, pos: CursorPosition): Promise<void> {
  const ref = doc(presenceCollection(), userId)
  await setDoc(ref, { cursor: pos, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeToCursors(callback: (rows: UserPresence[]) => void): Unsubscribe {
  return onSnapshot(presenceCollection(), (snap) => {
    const rows: UserPresence[] = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        userId: d.id,
        displayName: data.displayName ?? null,
        cursor: data.cursor ?? null,
        updatedAt: data.updatedAt && typeof data.updatedAt.toMillis === 'function' ? data.updatedAt.toMillis() : 0,
      }
    })
    callback(rows)
  })
}


