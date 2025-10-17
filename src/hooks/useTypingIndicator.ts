import { useState, useEffect } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '../services/firebase'

export interface TypingUser {
  userId: string
  displayName: string
  isTyping: boolean
  lastSeen: number
}

export function useTypingIndicator(userId: string, displayName: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const db = getFirestore(getFirebaseApp())
    const typingRef = doc(db, 'typing', 'users')

    const unsubscribe = onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const users: TypingUser[] = []
        
        Object.entries(data).forEach(([id, userData]: [string, any]) => {
          if (id !== userId && userData.isTyping) {
            const lastSeen = userData.lastSeen?.toMillis() || 0
            // Only show users who have been typing within the last 3 seconds
            if (Date.now() - lastSeen < 3000) {
              users.push({
                userId: id,
                displayName: userData.displayName || 'Unknown',
                isTyping: userData.isTyping,
                lastSeen
              })
            }
          }
        })
        
        setTypingUsers(users)
      }
    })

    return () => unsubscribe()
  }, [userId])

  const setUserTyping = async (typing: boolean) => {
    try {
      const db = getFirestore(getFirebaseApp())
      const typingRef = doc(db, 'typing', 'users')
      
      await setDoc(typingRef, {
        [userId]: {
          displayName,
          isTyping: typing,
          lastSeen: serverTimestamp()
        }
      }, { merge: true })
      
      setIsTyping(typing)
    } catch (error) {
      console.error('Error updating typing status:', error)
    }
  }

  return {
    typingUsers,
    isTyping,
    setUserTyping
  }
}
