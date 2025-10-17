import { useMemo } from 'react'
import { usePresence as usePresenceContext } from '../contexts/PresenceContext'

export interface UsePresenceResult {
  onlineUsers: { id: string; name: string | null; isActive: boolean }[]
  onlineCount: number
  activeCount: number
}

export default function usePresence(): UsePresenceResult {
  const { users } = usePresenceContext()
  return useMemo(() => {
    const onlineUsers = Object.values(users).map((u) => ({ 
      id: u.userId, 
      name: u.displayName ?? null, 
      isActive: u.isActive !== false // Default to true if not set
    }))
    const activeCount = onlineUsers.filter(u => u.isActive).length
    return { onlineUsers, onlineCount: onlineUsers.length, activeCount }
  }, [users])
}


