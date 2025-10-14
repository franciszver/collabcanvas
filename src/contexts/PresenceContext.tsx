import { createContext, useContext, useMemo, useState } from 'react'
import type { UserPresence } from '../types/presence.types'

export interface PresenceContextValue {
  users: Record<string, UserPresence>
  setUsers: (u: Record<string, UserPresence>) => void
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider')
  return ctx
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<Record<string, UserPresence>>({})

  const value: PresenceContextValue = useMemo(() => ({ users, setUsers }), [users])

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}


