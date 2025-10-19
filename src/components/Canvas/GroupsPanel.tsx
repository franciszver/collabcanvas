import { useState } from 'react'
import { useGroups } from '../../hooks/useGroups'
import { useCanvas } from '../../contexts/CanvasContext'
import styles from './GroupsPanel.module.css'

interface GroupsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function GroupsPanel({ isOpen, onClose }: GroupsPanelProps) {
  const { groups, isLoading, error, createGroup, updateGroup, deleteGroup } = useGroups({ 
    documentId: 'default-document' 
  })
  const { getSelectedShapes, selectShape, clearSelection, rectangles } = useCanvas()
  
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Group the selected shapes by their current groups
  const selectedShapes = getSelectedShapes()

  const handleRenameGroup = async (groupId: string, newName: string) => {
    if (!newName.trim()) return
    
    try {
      await updateGroup(groupId, { name: newName.trim() })
      setEditingGroup(null)
      setEditName('')
    } catch (error) {
      console.error('Failed to rename group:', error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will not delete the shapes.')) {
      return
    }
    
    try {
      await deleteGroup(groupId)
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const handleSelectGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    
    // Check which shapes actually exist in the canvas
    const existingShapeIds = group.shapeIds.filter(shapeId => 
      rectangles.some(rect => rect.id === shapeId)
    )
    
    const missingCount = group.shapeIds.length - existingShapeIds.length
    
    // If some shapes are missing, show a warning
    if (missingCount > 0) {
      const message = missingCount === group.shapeIds.length
        ? `All shapes in this group (${missingCount}) have been deleted. Would you like to delete this group?`
        : `${missingCount} shape${missingCount > 1 ? 's' : ''} in this group ${missingCount > 1 ? 'have' : 'has'} been deleted. Select the remaining ${existingShapeIds.length} shape${existingShapeIds.length > 1 ? 's' : ''}?`
      
      if (!confirm(message)) {
        return
      }
      
      // If all shapes are missing, offer to delete the group
      if (missingCount === group.shapeIds.length) {
        handleDeleteGroup(groupId)
        return
      }
    }
    
    // Clear current selection and select all existing shapes in the group
    clearSelection()
    existingShapeIds.forEach(shapeId => {
      selectShape(shapeId)
    })
  }

  const handleCreateGroup = async () => {
    if (selectedShapes.length === 0) return
    
    try {
      const shapeIds = selectedShapes.map(s => s.id)
      await createGroup(shapeIds, newGroupName.trim() || undefined)
      setShowCreateForm(false)
      setNewGroupName('')
      clearSelection()
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  const handleToggleCollapse = async (groupId: string, isCollapsed: boolean) => {
    try {
      await updateGroup(groupId, { isCollapsed: !isCollapsed })
    } catch (error) {
      console.error('Failed to toggle group collapse:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>Groups</h3>
          <div className={styles.headerActions}>
            {selectedShapes.length > 0 && (
              <button
                className={styles.createButton}
                onClick={() => setShowCreateForm(true)}
                title="Create group from selected shapes"
              >
                + Group
              </button>
            )}
            <button
              className={styles.closeButton}
              onClick={onClose}
              title="Close groups panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading groups...</div>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
          ) : groups.length === 0 ? (
            <div className={styles.empty}>
              <p>No groups yet</p>
              {selectedShapes.length > 0 && (
                <p className={styles.hint}>
                  Select shapes and click "Group" to create your first group
                </p>
              )}
            </div>
          ) : (
            <div className={styles.groupsList}>
              {groups.map(group => (
                <div key={group.id} className={styles.groupItem}>
                  <div className={styles.groupHeader}>
                    <button
                      className={styles.collapseButton}
                      onClick={() => handleToggleCollapse(group.id, group.isCollapsed || false)}
                      title={group.isCollapsed ? 'Expand group' : 'Collapse group'}
                    >
                      {group.isCollapsed ? '▶' : '▼'}
                    </button>
                    
                    {editingGroup === group.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRenameGroup(group.id, editName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameGroup(group.id, editName)
                          } else if (e.key === 'Escape') {
                            setEditingGroup(null)
                            setEditName('')
                          }
                        }}
                        className={styles.nameInput}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={styles.groupName}
                        onClick={() => setEditingGroup(group.id)}
                        title="Click to rename"
                      >
                        {group.name}
                      </span>
                    )}
                    
                    <span className={styles.shapeCount}>
                      {(() => {
                        const existingCount = group.shapeIds.filter(id => 
                          rectangles.some(rect => rect.id === id)
                        ).length
                        const total = group.shapeIds.length
                        if (existingCount < total) {
                          return `${existingCount}/${total} shape${total !== 1 ? 's' : ''} ⚠️`
                        }
                        return `${total} shape${total !== 1 ? 's' : ''}`
                      })()}
                    </span>
                  </div>
                  
                  {!group.isCollapsed && (
                    <div className={styles.groupContent}>
                      <div className={styles.groupActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleSelectGroup(group.id)}
                          title="Select all shapes in group"
                        >
                          Select All
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleDeleteGroup(group.id)}
                          title="Delete group"
                        >
                          Delete
                        </button>
                      </div>
                      
                      <div className={styles.shapesList}>
                        {group.shapeIds.map(shapeId => {
                          const shape = rectangles.find(s => s.id === shapeId)
                          const isMissing = !shape
                          return (
                            <div key={shapeId} className={styles.shapeItem} style={{ opacity: isMissing ? 0.5 : 1 }}>
                              <span className={styles.shapeType}>
                                {shape?.type || 'missing'}
                              </span>
                              <span className={styles.shapeId}>
                                {shapeId.slice(-8)} {isMissing ? '❌' : ''}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Form */}
        {showCreateForm && (
          <div className={styles.createForm}>
            <h4>Create Group</h4>
            <input
              type="text"
              placeholder="Group name (optional)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={styles.nameInput}
              autoFocus
            />
            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateForm(false)
                  setNewGroupName('')
                }}
              >
                Cancel
              </button>
              <button
                className={styles.createButton}
                onClick={handleCreateGroup}
                disabled={selectedShapes.length === 0}
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
