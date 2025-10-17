import { useEffect, useRef, useCallback } from 'react'
import { subscribeToPresenceRtdb } from '../services/realtime'
import type { UserPresence } from '../types/presence.types'
import { usePresence } from '../contexts/PresenceContext'

export function useCursorSync(): void {
  const { setUsers } = usePresence()
  const lastUsersRef = useRef<Record<string, UserPresence>>({})

  const handlePresenceUpdate = useCallback((rows: UserPresence[]) => {
    const map: Record<string, UserPresence> = {}
    let hasChanges = false
    
    for (const r of rows) {
      map[r.userId] = r
      // Only trigger update if data actually changed
      const lastUser = lastUsersRef.current[r.userId]
      if (!lastUser || 
          lastUser.displayName !== r.displayName ||
          lastUser.cursor?.x !== r.cursor?.x ||
          lastUser.cursor?.y !== r.cursor?.y ||
          lastUser.updatedAt !== r.updatedAt ||
          lastUser.isActive !== r.isActive) {
        hasChanges = true
      }
    }
    
    // Check for removed users
    if (Object.keys(lastUsersRef.current).length !== Object.keys(map).length) {
      hasChanges = true
    }
    
    if (hasChanges) {
      lastUsersRef.current = map
      setUsers(map)
    }
  }, [setUsers])

  useEffect(() => {
    const unsub = subscribeToPresenceRtdb(handlePresenceUpdate)
    return unsub
  }, [handlePresenceUpdate])
}

export default undefined


