import { getFirebaseApp } from './firebase'
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User
} from 'firebase/auth'
import { setUserOfflineRtdb, removeUserPresenceRtdb, markInactiveUsersRtdb, cleanupInactiveUsersRtdb } from './realtime'
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
  } catch (error) {
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

export async function handleRedirectResult(): Promise<AuthUserProfile | null> {
  const auth = getAuth(getFirebaseApp())
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      const user = mapUser(result.user)
      return user
    }
    return null
  } catch (error) {
    console.error('❌ Error handling redirect result:', error)
    return null
  }
}

export async function signOut(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  const currentUser = auth.currentUser
  
  // Remove user's presence data from realtime database before signing out
  if (currentUser) {
    try {
      // First set offline (clears cursor)
      await setUserOfflineRtdb(currentUser.uid)
      // Then completely remove presence data
      await removeUserPresenceRtdb(currentUser.uid)
    } catch (err) {
      console.error('Failed to remove user presence on sign out:', err)
    }
  }
  
  await firebaseSignOut(auth)
  
  // Trigger cleanup of any other inactive users
  try {
    await markInactiveUsersRtdb(60000) // Mark users inactive after 60 seconds
    await cleanupInactiveUsersRtdb(300000) // Remove users after 5 minutes
  } catch (err) {
    console.warn('Failed to cleanup inactive users on logout:', err)
  }
}

export function onAuthStateChanged(
  callback: (user: AuthUserProfile | null) => void
): () => void {
  const auth = getAuth(getFirebaseApp())
  return firebaseOnAuthStateChanged(auth, (user) => callback(mapUser(user)))
}


