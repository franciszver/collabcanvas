import { useState } from 'react'
import { useGroups } from '../../hooks/useGroups'
import { useCanvas } from '../../contexts/CanvasContext'
import styles from './GroupsPanel.module.css'

interface GroupsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function GroupsPanel({ isOpen, onClose }: GroupsPanelProps) {
  const { groups, isLoading, error, updateGroup, deleteGroup } = useGroups({ 
    documentId: 'default-document' 
  })
  const { getSelectedShapes, selectShape, clearSelection } = useCanvas()
  
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
    
    // Clear current selection and select all shapes in the group
    clearSelection()
    group.shapeIds.forEach(shapeId => {
      selectShape(shapeId)
    })
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedShapes.length === 0) return
    
    try {
      // This would typically be handled by the canvas context
      // For now, we'll just log it
      console.log('Create group with shapes:', selectedShapes.map(s => s.id), 'name:', newGroupName)
      setShowCreateForm(false)
      setNewGroupName('')
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
                      {group.shapeIds.length} shape{group.shapeIds.length !== 1 ? 's' : ''}
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
                          const shape = selectedShapes.find(s => s.id === shapeId)
                          return (
                            <div key={shapeId} className={styles.shapeItem}>
                              <span className={styles.shapeType}>
                                {shape?.type || 'rect'}
                              </span>
                              <span className={styles.shapeId}>
                                {shapeId.slice(-8)}
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
