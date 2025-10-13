import { createContext, useContext } from 'react'

// Placeholder types for PR #1
export interface AuthContextValue {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
}


