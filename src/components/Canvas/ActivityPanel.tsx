import { useState, useEffect } from 'react'
import type { Rectangle, ActivityHistoryEntry } from '../../types/canvas.types'
import { updateShapeComment } from '../../services/activityService'
import { formatTimestamp, getHistoryIcon } from '../../utils/historyTracking'
import { useAuth } from '../../contexts/AuthContext'
import styles from './ActivityPanel.module.css'

interface ActivityPanelProps {
  shape: Rectangle | null
  onClose: () => void
}

export default function ActivityPanel({ shape, onClose }: ActivityPanelProps) {
  const { user } = useAuth()
  const [commentText, setCommentText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing comment when shape changes
  useEffect(() => {
    if (shape?.comment) {
      setCommentText(shape.comment)
    } else {
      setCommentText('')
    }
    setError(null)
  }, [shape?.id, shape?.comment])

  const handleSaveComment = async () => {
    if (!shape || !user) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await updateShapeComment(
        shape.id,
        commentText.trim(),
        user.id,
        user.displayName || 'Unknown User',
        shape
      )
    } catch (err) {
      console.error('Failed to save comment:', err)
      setError('Failed to save comment. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderHistoryEntry = (entry: ActivityHistoryEntry, index: number) => {
    const icon = getHistoryIcon(entry)
    const timestamp = formatTimestamp(entry.at)

    if (entry.type === 'comment') {
      return (
        <div key={`${entry.at}-${index}`} className={styles.historyEntry}>
          <div className={styles.historyIcon}>{icon}</div>
          <div className={styles.historyContent}>
            <div className={styles.historyText}>
              <strong>{entry.byName}:</strong> {entry.text}
            </div>
            <div className={styles.historyTimestamp}>{timestamp}</div>
          </div>
        </div>
      )
    }

    // Edit entry
    return (
      <div key={`${entry.at}-${index}`} className={styles.historyEntry}>
        <div className={styles.historyIcon}>{icon}</div>
        <div className={styles.historyContent}>
          <div className={styles.historyText}>
            <strong>{entry.byName}</strong> {entry.action}
            {entry.details && <span className={styles.historyDetails}> ({entry.details})</span>}
          </div>
          <div className={styles.historyTimestamp}>{timestamp}</div>
        </div>
      </div>
    )
  }

  if (!shape) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>Activity</h3>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close activity panel"
          >
            ×
          </button>
        </div>
        <div className={styles.emptyState}>
          <p>Select a shape to view its activity</p>
        </div>
      </div>
    )
  }

  const history = shape.history || []
  const hasHistory = history.length > 0

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Activity</h3>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close activity panel"
        >
          ×
        </button>
      </div>

      {/* Comment Section */}
      <div className={styles.commentSection}>
        <h4>Comment</h4>
        <textarea
          className={styles.commentTextarea}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <div className={styles.commentActions}>
          <button
            className={styles.saveButton}
            onClick={handleSaveComment}
            disabled={isSaving || commentText.trim() === shape.comment}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {shape.comment && (
            <span className={styles.commentMeta}>
              Last updated by {shape.commentByName} {formatTimestamp(shape.commentAt || 0)}
            </span>
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {/* History Section */}
      <div className={styles.historySection}>
        <h4>Activity History</h4>
        {hasHistory ? (
          <div className={styles.historyList}>
            {history.map((entry, index) => renderHistoryEntry(entry, index))}
          </div>
        ) : (
          <div className={styles.emptyHistory}>
            <p>No activity yet. Changes to this shape will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

