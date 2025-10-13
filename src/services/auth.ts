import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
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

export async function signInWithGoogle(): Promise<AuthUserProfile> {
  const auth = getAuth()
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const profile = mapUser(result.user)
  if (!profile) throw new Error('Failed to retrieve user after sign-in')
  return profile
}

export async function signOut(): Promise<void> {
  const auth = getAuth()
  await firebaseSignOut(auth)
}

export function onAuthStateChanged(
  callback: (user: AuthUserProfile | null) => void
): () => void {
  const auth = getAuth()
  return firebaseOnAuthStateChanged(auth, (user) => callback(mapUser(user)))
}


