import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithGoogle, signOut, handleRedirectResult } from '../services/auth'
import type { AuthState, AuthUserProfile } from '../types/user.types'

export interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const handleAuth = async () => {
      console.log('🚀 AuthProvider: Starting auth check...')
      try {
        // Check if there's a redirect result to handle
        const redirectUser = await handleRedirectResult()
        if (redirectUser) {
          console.log('✅ AuthProvider: Redirect user found, setting user:', redirectUser)
          setUser(redirectUser)
          setIsLoading(false)
          return
        }
        console.log('❌ AuthProvider: No redirect user, setting up listener')
      } catch (error) {
        console.error('❌ AuthProvider: Error handling redirect result:', error)
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged((u) => {
        console.log('🔄 AuthProvider: Auth state changed:', u)
        setUser(u)
        setIsLoading(false)
      })
    }

    handleAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const handleSignIn = async () => {
    console.log('🔐 AuthProvider: Starting sign-in process...')
    setError(null)
    try {
      await signInWithGoogle()
      console.log('✅ AuthProvider: Sign-in process completed')
    } catch (e) {
      console.error('❌ AuthProvider: Sign-in error:', e)
      setError((e as Error).message)
    }
  }

  const handleSignOut = async () => {
    console.log('🚪 AuthProvider: Starting sign-out process...')
    setError(null)
    try {
<<<<<<< HEAD
      await signOut(user?.id)
=======
      await signOut()
      console.log('✅ AuthProvider: Sign-out completed')
>>>>>>> Dev
    } catch (e) {
      console.error('❌ AuthProvider: Sign-out error:', e)
      setError((e as Error).message)
    }
  }

  const value: AuthContextValue = useMemo(
    () => ({ user, isLoading, error, signInWithGoogle: handleSignIn, signOut: handleSignOut }),
    [user, isLoading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


