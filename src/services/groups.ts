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
  serverTimestamp
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import type { ShapeGroup } from '../types/canvas.types'

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
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const groupData: Omit<GroupDocument, 'id'> = {
      name: name || `Group ${Date.now()}`,
      shapeIds,
      documentId,
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      color: generateGroupColor(),
      isCollapsed: false
    }

    const db = getFirestore()
    const docRef = await addDoc(collection(db, 'groups'), {
      ...groupData,
      id: groupId
    })

    return docRef.id
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
    await updateDoc(groupRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
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
    
    await updateDoc(groupRef, {
      shapeIds: updatedShapeIds,
      updatedAt: serverTimestamp()
    })
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
      await updateDoc(groupRef, {
        shapeIds: updatedShapeIds,
        updatedAt: serverTimestamp()
      })
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
  callback: (groups: ShapeGroup[]) => void
): () => void {
  const groupsRef = collection(getFirestore(), 'groups')
  const q = query(
    groupsRef,
    where('documentId', '==', documentId),
    orderBy('createdAt', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const groups: ShapeGroup[] = snapshot.docs.map(doc => {
      const data = doc.data() as GroupDocument
      return {
        id: data.id,
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
    callback(groups)
  }, (error) => {
    console.error('Error subscribing to groups:', error)
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
    
    const groupData = groupDoc.docs[0].data() as GroupDocument
    
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
        id: data.id,
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
            batch.update(groupRef, {
              ...operation.data,
              updatedAt: serverTimestamp()
            })
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
