import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, writeBatch, doc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '../services/firebase'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  userId: string
  displayName?: string
}

export function useChatMessages(userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only subscribe if userId is provided
    if (!userId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    const db = getFirestore(getFirebaseApp())
    const messagesRef = collection(db, 'chatMessages')
    // Filter messages by userId to ensure privacy
    const q = query(
      messagesRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'), 
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: ChatMessage[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        messagesData.push({
          id: doc.id,
          content: data.content,
          role: data.role,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          userId: data.userId,
          displayName: data.displayName
        })
      })
      
      // Reverse to show oldest first
      setMessages(messagesData.reverse())
      setIsLoading(false)
    }, (error) => {
      console.error('Error listening to chat messages:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const sendMessage = async (content: string, userId: string, displayName?: string, role: 'user' | 'assistant' = 'user') => {
    try {
      const db = getFirestore(getFirebaseApp())
      const messagesRef = collection(db, 'chatMessages')
      
      await addDoc(messagesRef, {
        content,
        role,
        userId,
        displayName,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const clearMessages = async (userId?: string) => {
    try {
      // Only clear if userId is provided
      if (!userId) {
        throw new Error('User ID required to clear messages')
      }

      const db = getFirestore(getFirebaseApp())
      const messagesRef = collection(db, 'chatMessages')
      // Only delete messages belonging to this user
      const q = query(messagesRef, where('userId', '==', userId))
      
      const snapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(doc(db, 'chatMessages', docSnapshot.id))
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Error clearing messages:', error)
      throw error
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  }
}
