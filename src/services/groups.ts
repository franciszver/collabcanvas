import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp,
  deleteField
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import type { ShapeGroup } from '../types/canvas.types'

// Helper to filter out undefined values from update objects
// Firestore rejects undefined - fields must be omitted or use deleteField()
function filterUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

// Re-export deleteField for use in other files
export { deleteField }

export interface GroupDocument {
  id: string
  name: string
  shapeIds: string[]
  documentId: string
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  color?: string
  isCollapsed?: boolean
}

/**
 * Create a new group with the given shapes
 */
export async function createGroup(
  documentId: string,
  shapeIds: string[],
  userId: string,
  userName: string,
  name?: string
): Promise<string> {
  try {
    console.log('Creating group with data:', { documentId, shapeIds, userId, userName, name })
    
    const db = getFirestore()
    
    const groupData = {
      name: name || `Group ${Date.now()}`,
      shapeIds,
      documentId,
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      color: generateGroupColor(),
      isCollapsed: false
    }

    console.log('Group data to be saved:', groupData)
    try {
      const docRef = await addDoc(collection(db, 'groups'), groupData)
      const groupId = docRef.id
      console.log('Group created successfully with ID:', groupId)
      return groupId
    } catch (addDocError) {
      console.error('Error in addDoc operation:', addDocError)
      throw addDocError
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    throw error
  }
}

/**
 * Update an existing group
 */
export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<GroupDocument, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>>
): Promise<void> {
  try {
    const groupRef = doc(getFirestore(), 'groups', groupId)
    const filteredUpdates = filterUndefined({
      ...updates,
      updatedAt: serverTimestamp()
    })
    await updateDoc(groupRef, filteredUpdates)
  } catch (error) {
    console.error('Failed to update group:', error)
    throw error
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const groupRef = doc(getFirestore(), 'groups', groupId)
    await deleteDoc(groupRef)
  } catch (error) {
    console.error('Failed to delete group:', error)
    throw error
  }
}

/**
 * Add shapes to an existing group
 */
export async function addShapesToGroup(
  groupId: string,
  shapeIds: string[]
): Promise<void> {
  try {
    const groupRef = doc(getFirestore(), 'groups', groupId)
    const groupDoc = await getDocs(query(collection(getFirestore(), 'groups'), where('id', '==', groupId)))
    
    if (groupDoc.empty) {
      throw new Error('Group not found')
    }
    
    const groupData = groupDoc.docs[0].data() as GroupDocument
    const updatedShapeIds = [...new Set([...groupData.shapeIds, ...shapeIds])]
    
    const filteredUpdates = filterUndefined({
      shapeIds: updatedShapeIds,
      updatedAt: serverTimestamp()
    })
    await updateDoc(groupRef, filteredUpdates)
  } catch (error) {
    console.error('Failed to add shapes to group:', error)
    throw error
  }
}

/**
 * Remove shapes from a group
 */
export async function removeShapesFromGroup(
  groupId: string,
  shapeIds: string[]
): Promise<void> {
  try {
    const groupRef = doc(getFirestore(), 'groups', groupId)
    const groupDoc = await getDocs(query(collection(getFirestore(), 'groups'), where('id', '==', groupId)))
    
    if (groupDoc.empty) {
      throw new Error('Group not found')
    }
    
    const groupData = groupDoc.docs[0].data() as GroupDocument
    const updatedShapeIds = groupData.shapeIds.filter(id => !shapeIds.includes(id))
    
    if (updatedShapeIds.length === 0) {
      // If no shapes left, delete the group
      await deleteGroup(groupId)
    } else {
      const filteredUpdates = filterUndefined({
        shapeIds: updatedShapeIds,
        updatedAt: serverTimestamp()
      })
      await updateDoc(groupRef, filteredUpdates)
    }
  } catch (error) {
    console.error('Failed to remove shapes from group:', error)
    throw error
  }
}

/**
 * Subscribe to groups for a specific document
 */
export function subscribeToGroups(
  documentId: string,
  callback: (groups: ShapeGroup[]) => void,
  onError?: (error: Error) => void
): () => void {
  const groupsRef = collection(getFirestore(), 'groups')
  
  // Try the full query first (with orderBy)
  const q = query(
    groupsRef,
    where('documentId', '==', documentId),
    orderBy('createdAt', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    console.log('Groups subscription update - snapshot size:', snapshot.docs.length)
    const groups: ShapeGroup[] = snapshot.docs.map(doc => {
      const data = doc.data() as GroupDocument
      const group = {
        id: doc.id, // Use Firestore document ID
        name: data.name,
        shapeIds: data.shapeIds,
        documentId: data.documentId,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
        isCollapsed: data.isCollapsed || false
      }
      console.log('Mapped group:', group)
      return group
    })
    console.log('Calling callback with groups:', groups)
    callback(groups)
  }, (error) => {
    console.error('Error subscribing to groups:', error)
    
    // If it's an index error, try a simpler query without orderBy
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.log('Retrying groups query without orderBy due to missing index...')
      const simpleQ = query(
        groupsRef,
        where('documentId', '==', documentId)
      )
      
      return onSnapshot(simpleQ, (snapshot) => {
        console.log('Fallback groups query update - snapshot size:', snapshot.docs.length)
        const groups: ShapeGroup[] = snapshot.docs
          .map(doc => {
            const data = doc.data() as GroupDocument
            const group = {
              id: doc.id, // Use Firestore document ID
              name: data.name,
              shapeIds: data.shapeIds,
              documentId: data.documentId,
              createdBy: data.createdBy,
              createdByName: data.createdByName,
              createdAt: data.createdAt.toMillis(),
              updatedAt: data.updatedAt.toMillis(),
              isCollapsed: data.isCollapsed || false
            }
            console.log('Fallback mapped group:', group)
            return group
          })
          .sort((a, b) => a.createdAt - b.createdAt) // Sort client-side
        console.log('Fallback calling callback with groups:', groups)
        callback(groups)
      }, (fallbackError) => {
        console.error('Error in fallback groups query:', fallbackError)
        if (onError) {
          onError(fallbackError)
        } else {
          callback([])
        }
      })
    }
    
    // Call the error callback to update loading state
    if (onError) {
      onError(error)
    } else {
      // Fallback: call the main callback with empty array to stop loading
      callback([])
    }
  })
}

/**
 * Ungroup shapes by removing their group ID
 */
export async function ungroupShapes(groupId: string): Promise<void> {
  try {
    // Get the group to find all shapes
    const groupDoc = await getDocs(query(collection(getFirestore(), 'groups'), where('id', '==', groupId)))
    
    if (groupDoc.empty) {
      throw new Error('Group not found')
    }
    
    // const groupData = groupDoc.docs[0].data() as GroupDocument
    
    // Delete the group
    await deleteGroup(groupId)
    
    // Note: The actual shape updates (removing groupId) should be handled
    // by the calling code using the shape update service
  } catch (error) {
    console.error('Failed to ungroup shapes:', error)
    throw error
  }
}

/**
 * Get all groups for a document
 */
export async function getGroups(documentId: string): Promise<ShapeGroup[]> {
  try {
    const groupsRef = collection(getFirestore(), 'groups')
    const q = query(
      groupsRef,
      where('documentId', '==', documentId),
      orderBy('createdAt', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => {
      const data = doc.data() as GroupDocument
      return {
        id: doc.id, // Use Firestore document ID
        name: data.name,
        shapeIds: data.shapeIds,
        documentId: data.documentId,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
        isCollapsed: data.isCollapsed || false
      }
    })
  } catch (error) {
    console.error('Failed to get groups:', error)
    throw error
  }
}

/**
 * Generate a random color for a group
 */
function generateGroupColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Batch operations for better performance
 */
export async function batchUpdateGroups(operations: Array<{
  type: 'create' | 'update' | 'delete'
  groupId?: string
  data?: Partial<GroupDocument>
}>): Promise<void> {
  try {
    const batch = writeBatch(getFirestore())
    
    for (const operation of operations) {
      switch (operation.type) {
        case 'create':
          if (operation.data) {
            const groupRef = doc(collection(getFirestore(), 'groups'))
            batch.set(groupRef, {
              ...operation.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          }
          break
          
        case 'update':
          if (operation.groupId && operation.data) {
            const groupRef = doc(getFirestore(), 'groups', operation.groupId)
            const filteredUpdates = filterUndefined({
              ...operation.data,
              updatedAt: serverTimestamp()
            })
            batch.update(groupRef, filteredUpdates)
          }
          break
          
        case 'delete':
          if (operation.groupId) {
            const groupRef = doc(getFirestore(), 'groups', operation.groupId)
            batch.delete(groupRef)
          }
          break
      }
    }
    
    await batch.commit()
  } catch (error) {
    console.error('Failed to batch update groups:', error)
    throw error
  }
}
