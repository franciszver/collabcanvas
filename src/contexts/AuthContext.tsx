import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithGoogle, signOut } from '../services/auth'
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
    const unsubscribe = onAuthStateChanged((u) => {
      setUser(u)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const handleSignIn = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut(user?.id)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const value: AuthContextValue = useMemo(
    () => ({ user, isLoading, error, signInWithGoogle: handleSignIn, signOut: handleSignOut }),
    [user, isLoading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


