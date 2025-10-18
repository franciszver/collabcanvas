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
      try {
        // Check if there's a redirect result to handle
        const redirectUser = await handleRedirectResult()
        if (redirectUser) {
          setUser(redirectUser)
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error handling redirect result:', error)
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged((u) => {
        // Use setTimeout to ensure state updates happen in the next tick
        // This helps avoid act() warnings in tests
        setTimeout(() => {
          setUser(u)
          setIsLoading(false)
        }, 0)
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
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error('❌ AuthProvider: Sign-in error:', e)
      setError((e as Error).message)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
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


