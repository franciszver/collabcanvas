import { getFirebaseApp } from './firebase'
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User
} from 'firebase/auth'
import { setUserOfflineRtdb, removeUserPresenceRtdb } from './realtime'
import type { AuthUserProfile } from '../types/user.types'

function mapUser(user: User | null): AuthUserProfile | null {
  if (!user) return null
  return {
    id: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

export async function signInWithGoogle(): Promise<AuthUserProfile | void> {
  const auth = getAuth(getFirebaseApp())
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    const profile = mapUser(result.user)
    if (!profile) throw new Error('Failed to retrieve user after sign-in')
    return profile
  } catch (_err) {
    // Fallback for environments where popups are restricted by COOP/COEP or browser settings
    await signInWithRedirect(auth, provider)
    // After redirect, onAuthStateChanged will fire; no profile to return here
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  const provider = new GoogleAuthProvider()
  await signInWithRedirect(auth, provider)
}

export async function signOut(userId?: string): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  
  // Remove user's presence data from realtime database before signing out
  if (userId) {
    try {
      // First set offline (clears cursor)
      await setUserOfflineRtdb(userId)
      // Then completely remove presence data
      await removeUserPresenceRtdb(userId)
    } catch (err) {
      console.error('Failed to remove user presence on sign out:', err)
    }
  }
  
  await firebaseSignOut(auth)
}

export function onAuthStateChanged(
  callback: (user: AuthUserProfile | null) => void
): () => void {
  const auth = getAuth(getFirebaseApp())
  return firebaseOnAuthStateChanged(auth, (user) => callback(mapUser(user)))
}


