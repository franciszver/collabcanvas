import { useState, useMemo } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import styles from './MultiShapeProperties.module.css'

interface MultiShapePropertiesProps {
  onClose: () => void
}

export default function MultiShapeProperties({ onClose }: MultiShapePropertiesProps) {
  const { 
    selectedIds, 
    getSelectedShapes, 
    updateMultipleRectangles,
    deleteRectangle,
    bringToFront,
    sendToBack,
    groupShapes,
    ungroupShapes,
    nudgeShapes,
    selectionCount
  } = useCanvas()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const selectedShapes = getSelectedShapes()
  
  // Analyze common properties
  const commonProperties = useMemo(() => {
    if (selectedShapes.length === 0) return null
    
    const colors = [...new Set(selectedShapes.map(s => s.fill))]
    const types = [...new Set(selectedShapes.map(s => s.type))]
    const strokeColors = [...new Set(selectedShapes.map(s => s.stroke))]
    const strokeWidths = [...new Set(selectedShapes.map(s => s.strokeWidth))]
    
    return {
      color: colors.length === 1 ? colors[0] : 'Mixed',
      type: types.length === 1 ? types[0] : 'Mixed',
      strokeColor: strokeColors.length === 1 ? strokeColors[0] : 'Mixed',
      strokeWidth: strokeWidths.length === 1 ? strokeWidths[0] : 'Mixed',
      hasGroups: selectedShapes.some(s => s.groupId),
      allInSameGroup: selectedShapes.length > 1 && selectedShapes.every(s => s.groupId === selectedShapes[0].groupId)
    }
  }, [selectedShapes])
  
  const handleColorChange = async (color: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      // Use bulk update for instant sync
      await updateMultipleRectangles(
        selectedShapes.map(shape => ({ id: shape.id, updates: { fill: color } }))
      )
    } catch (error) {
      console.error('Failed to update colors:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleStrokeColorChange = async (color: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      // Use bulk update for instant sync
      await updateMultipleRectangles(
        selectedShapes.map(shape => ({ id: shape.id, updates: { stroke: color } }))
      )
    } catch (error) {
      console.error('Failed to update stroke colors:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleStrokeWidthChange = async (width: number) => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      // Use bulk update for instant sync
      await updateMultipleRectangles(
        selectedShapes.map(shape => ({ id: shape.id, updates: { strokeWidth: width } }))
      )
    } catch (error) {
      console.error('Failed to update stroke widths:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleDelete = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      const deletePromises = selectedShapes.map(shape => deleteRectangle(shape.id))
      await Promise.all(deletePromises)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Failed to delete shapes:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleBringToFront = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      await bringToFront(Array.from(selectedIds))
    } catch (error) {
      console.error('Failed to bring to front:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleSendToBack = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      await sendToBack(Array.from(selectedIds))
    } catch (error) {
      console.error('Failed to send to back:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleGroup = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      await groupShapes(Array.from(selectedIds))
    } catch (error) {
      console.error('Failed to group shapes:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleUngroup = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      await ungroupShapes(Array.from(selectedIds))
    } catch (error) {
      console.error('Failed to ungroup shapes:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (isProcessing) return
    nudgeShapes(Array.from(selectedIds), deltaX, deltaY)
  }
  
  if (selectedShapes.length === 0) return null
  
  const commonColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{selectionCount} shape{selectionCount !== 1 ? 's' : ''} selected</h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          disabled={isProcessing}
        >
          ×
        </button>
      </div>
      
      <div className={styles.content}>
        {/* Color Controls */}
        <div className={styles.section}>
          <label className={styles.label}>Fill Color</label>
          <div className={styles.colorGrid}>
            {commonColors.map(color => (
              <button
                key={color}
                className={`${styles.colorButton} ${
                  commonProperties?.color === color ? styles.active : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                disabled={isProcessing}
                title={color}
              />
            ))}
            {commonProperties?.color === 'Mixed' && (
              <div className={styles.mixedIndicator}>Mixed</div>
            )}
          </div>
        </div>
        
        {/* Stroke Controls */}
        <div className={styles.section}>
          <label className={styles.label}>Stroke Color</label>
          <div className={styles.colorGrid}>
            {commonColors.map(color => (
              <button
                key={color}
                className={`${styles.colorButton} ${
                  commonProperties?.strokeColor === color ? styles.active : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleStrokeColorChange(color)}
                disabled={isProcessing}
                title={color}
              />
            ))}
            {commonProperties?.strokeColor === 'Mixed' && (
              <div className={styles.mixedIndicator}>Mixed</div>
            )}
          </div>
        </div>
        
        <div className={styles.section}>
          <label className={styles.label}>Stroke Width</label>
          <div className={styles.strokeWidthControls}>
            {[1, 2, 4, 8].map(width => (
              <button
                key={width}
                className={`${styles.strokeWidthButton} ${
                  commonProperties?.strokeWidth === width ? styles.active : ''
                }`}
                onClick={() => handleStrokeWidthChange(width)}
                disabled={isProcessing}
              >
                {width}px
              </button>
            ))}
            {commonProperties?.strokeWidth === 'Mixed' && (
              <div className={styles.mixedIndicator}>Mixed</div>
            )}
          </div>
        </div>
        
        {/* Layer Controls */}
        <div className={styles.section}>
          <label className={styles.label}>Layer Order</label>
          <div className={styles.buttonGroup}>
            <button
              className={styles.actionButton}
              onClick={handleBringToFront}
              disabled={isProcessing}
            >
              Bring to Front
            </button>
            <button
              className={styles.actionButton}
              onClick={handleSendToBack}
              disabled={isProcessing}
            >
              Send to Back
            </button>
          </div>
        </div>
        
        {/* Nudge Controls */}
        <div className={styles.section}>
          <label className={styles.label}>Nudge</label>
          <div className={styles.nudgeGrid}>
            <button
              className={styles.nudgeButton}
              onClick={() => handleNudge(-1, 0)}
              disabled={isProcessing}
              title="Left"
            >
              ←
            </button>
            <button
              className={styles.nudgeButton}
              onClick={() => handleNudge(0, -1)}
              disabled={isProcessing}
              title="Up"
            >
              ↑
            </button>
            <button
              className={styles.nudgeButton}
              onClick={() => handleNudge(0, 1)}
              disabled={isProcessing}
              title="Down"
            >
              ↓
            </button>
            <button
              className={styles.nudgeButton}
              onClick={() => handleNudge(1, 0)}
              disabled={isProcessing}
              title="Right"
            >
              →
            </button>
          </div>
        </div>
        
        {/* Group Controls */}
        <div className={styles.section}>
          <label className={styles.label}>Grouping</label>
          <div className={styles.buttonGroup}>
            {commonProperties?.allInSameGroup ? (
              <button
                className={styles.actionButton}
                onClick={handleUngroup}
                disabled={isProcessing}
              >
                Ungroup
              </button>
            ) : (
              <button
                className={styles.actionButton}
                onClick={handleGroup}
                disabled={isProcessing || selectedShapes.length < 2}
              >
                Group Shapes
              </button>
            )}
          </div>
        </div>
        
        {/* Delete Control */}
        <div className={styles.section}>
          <label className={styles.label}>Actions</label>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.actionButton} ${styles.dangerButton}`}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete {selectionCount} shape{selectionCount !== 1 ? 's' : ''}?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmButton} ${styles.dangerButton}`}
                onClick={handleDelete}
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
