import { useAuth } from '../../contexts/AuthContext'

export default function SignInButton() {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <button onClick={signInWithGoogle} aria-label="Sign in with Google">
        Sign in with Google
      </button>
    )
  }

  return (
    <button onClick={signOut} aria-label="Sign out">
      Sign out ({user.displayName ?? 'User'})
    </button>
  )
}


