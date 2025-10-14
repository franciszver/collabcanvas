import { useEffect } from 'react'
import { subscribeToPresenceRtdb } from '../services/realtime'
import type { UserPresence } from '../types/presence.types'
import { usePresence } from '../contexts/PresenceContext'
import { useAuth } from '../contexts/AuthContext'

export function useCursorSync(): void {
  const { setUsers } = usePresence()
  const { user } = useAuth()

  useEffect(() => {
    const unsub = subscribeToPresenceRtdb((rows: UserPresence[]) => {
      const map: Record<string, UserPresence> = {}
      for (const r of rows) {
        // Store all users; consumer can filter out self
        map[r.userId] = r
      }
      setUsers(map)
    })
    return unsub
  }, [setUsers, user?.id])
}

export default undefined


