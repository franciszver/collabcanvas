import { createContext, useContext } from 'react'

// Placeholder for PR #1
export interface PresenceContextValue {}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider')
  return ctx
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  return <PresenceContext.Provider value={{}}>{children}</PresenceContext.Provider>
}


