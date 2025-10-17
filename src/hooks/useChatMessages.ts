import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
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

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const db = getFirestore(getFirebaseApp())
    const messagesRef = collection(db, 'chatMessages')
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50))

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
  }, [])

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

  return {
    messages,
    isLoading,
    sendMessage
  }
}
