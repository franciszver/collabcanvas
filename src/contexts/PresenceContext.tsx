import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { UserPresence } from '../types/presence.types'
import { setUserOfflineRtdb, setUserOnlineRtdb, cleanupStaleCursorsRtdb } from '../services/realtime'
import { useAuth } from './AuthContext'

export interface PresenceContextValue {
  users: Record<string, UserPresence>
  setUsers: (u: Record<string, UserPresence>) => void
  isOnline: boolean
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider')
  return ctx
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<Record<string, UserPresence>>({})
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true)

  // Manage online/offline lifecycle for the authenticated user
  useEffect(() => {
    if (!user) return
    if (typeof setUserOnlineRtdb === 'function') {
      const result = setUserOnlineRtdb(user.id, user.displayName ?? null)
      if (result && typeof result.catch === 'function') {
        result.catch(() => {})
      }
    }
    const handleBeforeUnload = () => {
      if (typeof setUserOfflineRtdb === 'function') {
        const result = setUserOfflineRtdb(user.id)
        if (result && typeof result.catch === 'function') {
          result.catch(() => {})
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (typeof setUserOfflineRtdb === 'function') {
        const result = setUserOfflineRtdb(user.id)
        if (result && typeof result.catch === 'function') {
          result.catch(() => {})
        }
      }
    }
  }, [user])

  // Track browser online/offline and re-establish presence on reconnect
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      if (user && typeof setUserOnlineRtdb === 'function') {
        const result = setUserOnlineRtdb(user.id, user.displayName ?? null)
        if (result && typeof result.catch === 'function') {
          result.catch(() => {})
        }
      }
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [user])

  // Periodic cleanup of stale cursors
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (typeof cleanupStaleCursorsRtdb === 'function') {
        const result = cleanupStaleCursorsRtdb(30000) // Clean up cursors older than 30 seconds
        if (result && typeof result.catch === 'function') {
          result.catch(() => {})
        }
      }
    }, 60000) // Run cleanup every minute

    return () => clearInterval(cleanupInterval)
  }, [])

  const value: PresenceContextValue = useMemo(() => ({ users, setUsers, isOnline }), [users, isOnline])

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}


