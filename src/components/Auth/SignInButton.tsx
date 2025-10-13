import { useAuth } from '../../contexts/AuthContext'
import { signInWithGoogleRedirect } from '../../services/auth'

export default function SignInButton() {
  const { user, isLoading, signOut } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <button onClick={signInWithGoogleRedirect} aria-label="Sign in with Google">
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


