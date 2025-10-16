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
    console.log('🔄 Attempting popup sign-in...')
    const result = await signInWithPopup(auth, provider)
    const profile = mapUser(result.user)
    if (!profile) throw new Error('Failed to retrieve user after sign-in')
    console.log('✅ Popup sign-in successful:', profile)
    return profile
  } catch (error) {
    console.log('⚠️ Popup failed, falling back to redirect:', error)
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
    console.log('🔍 Checking for redirect result...')
    const result = await getRedirectResult(auth)
    console.log('🔍 Redirect result:', result)
    if (result) {
      const user = mapUser(result.user)
      console.log('✅ Redirect user mapped:', user)
      return user
    }
    console.log('❌ No redirect result found')
    return null
  } catch (error) {
    console.error('❌ Error handling redirect result:', error)
    return null
  }
}

export async function signOut(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  await firebaseSignOut(auth)
}

export function onAuthStateChanged(
  callback: (user: AuthUserProfile | null) => void
): () => void {
  const auth = getAuth(getFirebaseApp())
  return firebaseOnAuthStateChanged(auth, (user) => callback(mapUser(user)))
}


