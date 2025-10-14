import { useMemo } from 'react'
import { usePresence as usePresenceContext } from '../contexts/PresenceContext'

export interface UsePresenceResult {
  onlineUsers: { id: string; name: string | null }[]
  onlineCount: number
}

export default function usePresence(): UsePresenceResult {
  const { users } = usePresenceContext()
  return useMemo(() => {
    const onlineUsers = Object.values(users).map((u) => ({ id: u.userId, name: u.displayName ?? null }))
    return { onlineUsers, onlineCount: onlineUsers.length }
  }, [users])
}


