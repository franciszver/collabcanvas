import { useState, useEffect, useCallback } from 'react'
import { subscribeToGroups, createGroup, updateGroup, deleteGroup, addShapesToGroup, removeShapesFromGroup, ungroupShapes } from '../services/groups'
import type { ShapeGroup } from '../types/canvas.types'
import { useAuth } from '../contexts/AuthContext'

export interface UseGroupsOptions {
  documentId: string
}

export interface UseGroupsReturn {
  groups: ShapeGroup[]
  isLoading: boolean
  error: string | null
  
  // Group operations
  createGroup: (shapeIds: string[], name?: string) => Promise<string>
  updateGroup: (groupId: string, updates: Partial<ShapeGroup>) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  addShapesToGroup: (groupId: string, shapeIds: string[]) => Promise<void>
  removeShapesFromGroup: (groupId: string, shapeIds: string[]) => Promise<void>
  ungroupShapes: (groupId: string) => Promise<void>
  
  // Utility methods
  getGroupById: (groupId: string) => ShapeGroup | undefined
  getShapesInGroup: (groupId: string) => string[]
  isShapeInGroup: (shapeId: string) => boolean
  getGroupForShape: (shapeId: string) => ShapeGroup | undefined
  selectGroup: (groupId: string) => void
}

export function useGroups({ documentId }: UseGroupsOptions): UseGroupsReturn {
  const [groups, setGroups] = useState<ShapeGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Subscribe to groups changes
  useEffect(() => {
    if (!documentId) return

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeToGroups(
      documentId, 
      (newGroups) => {
        setGroups(newGroups)
        setIsLoading(false)
      },
      (error) => {
        console.error('Error in groups subscription:', error)
        setError(error.message)
        setIsLoading(false)
        setGroups([]) // Clear groups on error
      }
    )

    return () => {
      unsubscribe()
    }
  }, [documentId])

  // Group operations
  const createGroupHandler = useCallback(async (shapeIds: string[], name?: string): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to create groups')
    }

    try {
      setError(null)
      const groupId = await createGroup(
        documentId,
        shapeIds,
        user.id,
        user.displayName || 'Unknown User',
        name
      )
      return groupId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group'
      setError(errorMessage)
      throw err
    }
  }, [documentId, user])

  const updateGroupHandler = useCallback(async (groupId: string, updates: Partial<Omit<ShapeGroup, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>>): Promise<void> => {
    try {
      setError(null)
      await updateGroup(groupId, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deleteGroupHandler = useCallback(async (groupId: string): Promise<void> => {
    try {
      setError(null)
      await deleteGroup(groupId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addShapesToGroupHandler = useCallback(async (groupId: string, shapeIds: string[]): Promise<void> => {
    try {
      setError(null)
      await addShapesToGroup(groupId, shapeIds)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add shapes to group'
      setError(errorMessage)
      throw err
    }
  }, [])

  const removeShapesFromGroupHandler = useCallback(async (groupId: string, shapeIds: string[]): Promise<void> => {
    try {
      setError(null)
      await removeShapesFromGroup(groupId, shapeIds)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove shapes from group'
      setError(errorMessage)
      throw err
    }
  }, [])

  const ungroupShapesHandler = useCallback(async (groupId: string): Promise<void> => {
    try {
      setError(null)
      await ungroupShapes(groupId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ungroup shapes'
      setError(errorMessage)
      throw err
    }
  }, [])

  // Utility methods
  const getGroupById = useCallback((groupId: string): ShapeGroup | undefined => {
    return groups.find(group => group.id === groupId)
  }, [groups])

  const getShapesInGroup = useCallback((groupId: string): string[] => {
    const group = getGroupById(groupId)
    return group?.shapeIds || []
  }, [getGroupById])

  const isShapeInGroup = useCallback((shapeId: string): boolean => {
    return groups.some(group => group.shapeIds.includes(shapeId))
  }, [groups])

  const getGroupForShape = useCallback((shapeId: string): ShapeGroup | undefined => {
    return groups.find(group => group.shapeIds.includes(shapeId))
  }, [groups])

  const selectGroup = useCallback((groupId: string): void => {
    // This would typically be handled by the selection system
    // For now, we'll just log it - the actual implementation would depend on
    // how the selection system is integrated
    console.log('Select group:', groupId)
  }, [])

  return {
    groups,
    isLoading,
    error,
    
    // Group operations
    createGroup: createGroupHandler,
    updateGroup: updateGroupHandler,
    deleteGroup: deleteGroupHandler,
    addShapesToGroup: addShapesToGroupHandler,
    removeShapesFromGroup: removeShapesFromGroupHandler,
    ungroupShapes: ungroupShapesHandler,
    
    // Utility methods
    getGroupById,
    getShapesInGroup,
    isShapeInGroup,
    getGroupForShape,
    selectGroup
  }
}

export default useGroups
