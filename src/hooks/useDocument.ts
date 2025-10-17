import { useEffect, useState, useCallback } from 'react'
import { subscribeToDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore'
import type { DocumentDocument } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'

export interface UseDocumentOptions {
  documentId: string
  createIfNotExists?: boolean
  defaultTitle?: string
}

export interface UseDocumentReturn {
  document: DocumentDocument | null
  isLoading: boolean
  error: Error | null
  
  // Document operations
  updateDocument: (updates: Partial<Omit<DocumentDocument, 'id' | 'createdAt' | 'ownerId'>>) => Promise<void>
  deleteDocument: () => Promise<void>
  
  // Viewport operations
  updateViewport: (viewport: { x: number; y: number; scale: number }) => Promise<void>
}

export function useDocument({ 
  documentId, 
  createIfNotExists = false, 
  defaultTitle = 'Untitled Document' 
}: UseDocumentOptions): UseDocumentReturn {
  const [document, setDocument] = useState<DocumentDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  // Subscribe to document
  useEffect(() => {
    if (!documentId) return

    const unsubscribe = subscribeToDocument(documentId, (doc) => {
      setDocument(doc)
      setIsLoading(false)
      setError(null)
    })

    return unsubscribe
  }, [documentId])

  // Create document if it doesn't exist
  useEffect(() => {
    if (!createIfNotExists || !user || document !== null || isLoading) return

    const createDefaultDocument = async () => {
      try {
        await createDocument(documentId, defaultTitle, user.id, {
          x: 0,
          y: 0,
          scale: 1,
        })
      } catch (err) {
        setError(err as Error)
      }
    }

    createDefaultDocument()
  }, [createIfNotExists, user, document, documentId, defaultTitle, isLoading])

  // Document operations
  const updateDocumentHandler = useCallback(async (updates: Partial<Omit<DocumentDocument, 'id' | 'createdAt' | 'ownerId'>>) => {
    if (!user) {
      console.warn('User not authenticated, skipping document update')
      return
    }
    
    try {
      await updateDocument(documentId, updates)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [user, documentId])

  const deleteDocumentHandler = useCallback(async () => {
    try {
      await deleteDocument(documentId)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [documentId])

  const updateViewport = useCallback(async (viewport: { x: number; y: number; scale: number }) => {
    await updateDocumentHandler({ viewport })
  }, [updateDocumentHandler])

  return {
    document,
    isLoading,
    error,
    updateDocument: updateDocumentHandler,
    deleteDocument: deleteDocumentHandler,
    updateViewport,
  }
}

export default useDocument
