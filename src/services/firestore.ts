import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  deleteField,
  type Unsubscribe,
  type Firestore,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { getFirestoreDB } from './firebase'
import type { Rectangle, ActivityHistoryEntry } from '../types/canvas.types'

// Re-export deleteField for use in other services
export { deleteField }

// Shape document interface for Firestore
export interface ShapeDocument {
  id: string
  type: 'rect' | 'circle' | 'line' | 'text' | 'triangle' | 'star' | 'arrow'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z: number
  fill: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  createdBy: string
  createdAt: any // Firestore Timestamp
  updatedBy: string
  updatedAt: any // Firestore Timestamp
  documentId: string
  isLocked?: boolean
  lockedBy?: string
  lockedByName?: string
  lockedAt?: any // Firestore Timestamp
  // Shape-specific fields
  radius?: number
  sides?: number
  points?: number
  // Grouping
  groupId?: string
  // Comments and Activity Tracking
  comment?: string
  commentBy?: string
  commentByName?: string
  commentAt?: number
  history?: ActivityHistoryEntry[]
}

// Document metadata interface
export interface DocumentDocument {
  id: string
  title: string
  description?: string
  viewport: {
    x: number
    y: number
    scale: number
  }
  ownerId: string
  collaborators: string[]
  isPublic: boolean
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  lastAccessedAt: any // Firestore Timestamp
  shapeCount: number
  lastShapeId?: string
}

function db(): Firestore {
  return getFirestoreDB()
}

// Helper to filter out undefined values from update objects (including nested objects/arrays)
// Firestore rejects undefined - fields must be omitted or use deleteField()
function filterUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Skip undefined values
      continue
    } else if (Array.isArray(value)) {
      // Recursively filter arrays
      result[key] = value.map(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return filterUndefined(item)
        }
        return item
      })
    } else if (typeof value === 'object' && value !== null && value.constructor === Object) {
      // Recursively filter plain objects (not Firestore special objects like Timestamp)
      result[key] = filterUndefined(value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

// Shape operations
export function shapesCollection() {
  return collection(db(), 'shapes')
}

export function shapeDoc(shapeId: string) {
  return doc(db(), 'shapes', shapeId)
}

export function documentsCollection() {
  return collection(db(), 'documents')
}

export function documentDoc(documentId: string) {
  return doc(db(), 'documents', documentId)
}

// Shape CRUD operations
export async function createShape(shape: Omit<ShapeDocument, 'createdAt' | 'updatedAt'>): Promise<void> {
  const shapeRef = doc(shapesCollection(), shape.id)
  const shapeData = {
    ...shape,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(shapeRef, shapeData)
}

export async function updateShape(shapeId: string, updates: Partial<Omit<ShapeDocument, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
  const shapeRef = shapeDoc(shapeId)
  const filteredUpdates = filterUndefined({
    ...updates,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(shapeRef, filteredUpdates)
}

export async function deleteShape(shapeId: string): Promise<void> {
  const shapeRef = shapeDoc(shapeId)
  await deleteDoc(shapeRef)
}

export async function deleteAllShapes(documentId: string): Promise<void> {
  const shapesQuery = query(
    shapesCollection(),
    where('documentId', '==', documentId)
  )
  const snapshot = await getDocs(shapesQuery)
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
}

// Batch update multiple shapes atomically
export async function updateMultipleShapes(
  updates: Array<{ shapeId: string; updates: Partial<Omit<ShapeDocument, 'id' | 'createdAt' | 'createdBy'>> }>
): Promise<void> {
  if (!updates.length) return
  
  const BATCH_LIMIT = 500 // Firestore batch limit
  const batches: Array<Array<typeof updates[0]>> = []
  
  // Split updates into chunks of 500
  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    batches.push(updates.slice(i, i + BATCH_LIMIT))
  }
  
  // Execute batches sequentially
  for (const batch of batches) {
    const writeBatchInstance = writeBatch(db())
    
    for (const { shapeId, updates: shapeUpdates } of batch) {
      const shapeRef = shapeDoc(shapeId)
      const filteredUpdates = filterUndefined({
        ...shapeUpdates,
        updatedAt: serverTimestamp(),
      })
      writeBatchInstance.update(shapeRef, filteredUpdates)
    }
    
    try {
      await writeBatchInstance.commit()
    } catch (error) {
      console.error('Failed to commit batch update:', error)
      // Don't throw - let Firestore snapshot reconcile
      // This prevents cascading failures
    }
  }
}

// Batch delete multiple shapes atomically
export async function deleteMultipleShapes(shapeIds: string[]): Promise<void> {
  if (!shapeIds.length) return
  
  const BATCH_LIMIT = 500 // Firestore batch limit
  const batches: Array<string[]> = []
  
  // Split deletions into chunks of 500
  for (let i = 0; i < shapeIds.length; i += BATCH_LIMIT) {
    batches.push(shapeIds.slice(i, i + BATCH_LIMIT))
  }
  
  // Execute batches sequentially
  for (const batch of batches) {
    const writeBatchInstance = writeBatch(db())
    
    for (const shapeId of batch) {
      const shapeRef = shapeDoc(shapeId)
      writeBatchInstance.delete(shapeRef)
    }
    
    try {
      await writeBatchInstance.commit()
    } catch (error) {
      console.error('Failed to commit batch delete:', error)
      // Don't throw - let Firestore snapshot reconcile
      // This prevents cascading failures
    }
  }
}

// Convert Rectangle to ShapeDocument
export function rectangleToShape(rect: Rectangle, documentId: string, userId: string): Omit<ShapeDocument, 'createdAt' | 'updatedAt'> {
  const shape: any = {
    id: rect.id,
    type: rect.type || 'rect',
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: rect.rotation || 0,
    z: rect.z || 0,
    fill: rect.fill,
    createdBy: userId,
    updatedBy: userId,
    documentId,
  }
  
  // Only include text fields if they have values
  if (rect.text !== undefined) {
    shape.text = rect.text
  }
  if (rect.fontSize !== undefined) {
    shape.fontSize = rect.fontSize
  }
  
  // Include comment fields if they exist
  if (rect.comment !== undefined) {
    shape.comment = rect.comment
    shape.commentBy = rect.commentBy
    shape.commentByName = rect.commentByName
    shape.commentAt = rect.commentAt
  }
  if (rect.history !== undefined) {
    shape.history = rect.history
  }
  
  return shape
}

// Convert ShapeDocument to Rectangle
export function shapeToRectangle(shape: ShapeDocument): Rectangle {
  return {
    id: shape.id,
    type: shape.type as any, // Cast to handle type differences
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation,
    z: shape.z,
    fill: shape.fill,
    text: shape.text,
    fontSize: shape.fontSize,
    // Map comment and history fields
    comment: shape.comment,
    commentBy: shape.commentBy,
    commentByName: shape.commentByName,
    commentAt: shape.commentAt,
    history: shape.history,
  }
}

// Real-time subscription to shapes in a document
export function subscribeToShapes(
  documentId: string,
  callback: (shapes: Rectangle[]) => void
): Unsubscribe {
  const shapesQuery = query(
    shapesCollection(),
    where('documentId', '==', documentId),
    orderBy('z', 'asc')
  )
  
  return onSnapshot(shapesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const shapes: Rectangle[] = snapshot.docs.map(doc => {
      const data = doc.data() as ShapeDocument
      return shapeToRectangle(data)
    })
    callback(shapes)
  })
}

// Document operations
export async function createDocument(
  documentId: string,
  title: string,
  ownerId: string,
  viewport: { x: number; y: number; scale: number }
): Promise<void> {
  const docRef = documentDoc(documentId)
  await setDoc(docRef, {
    id: documentId,
    title,
    ownerId,
    collaborators: [],
    isPublic: false,
    viewport,
    shapeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastAccessedAt: serverTimestamp(),
  })
}

export async function updateDocument(
  documentId: string,
  updates: Partial<Omit<DocumentDocument, 'id' | 'createdAt' | 'ownerId'>>
): Promise<void> {
  const docRef = documentDoc(documentId)
  const filteredUpdates = filterUndefined({
    ...updates,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(docRef, filteredUpdates)
}

export async function deleteDocument(documentId: string): Promise<void> {
  // First delete all shapes in the document
  await deleteAllShapes(documentId)
  // Then delete the document
  const docRef = documentDoc(documentId)
  await deleteDoc(docRef)
}

// Subscribe to document metadata
export function subscribeToDocument(
  documentId: string,
  callback: (document: DocumentDocument | null) => void
): Unsubscribe {
  const docRef = documentDoc(documentId)
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as DocumentDocument
      callback(data)
    } else {
      callback(null)
    }
  })
}
