import type { ActivityHistoryEntry, Rectangle } from '../types/canvas.types'

/**
 * Creates a comment history entry
 */
export function createCommentEntry(
  text: string,
  userId: string,
  userName: string
): ActivityHistoryEntry {
  return {
    type: 'comment',
    text,
    by: userId,
    byName: userName,
    at: Date.now()
  }
}

/**
 * Detects and describes changes between old and new shape properties
 */
export function createEditEntry(
  oldProps: Partial<Rectangle>,
  newProps: Partial<Rectangle>,
  userId: string,
  userName: string
): ActivityHistoryEntry | null {
  const changes: string[] = []
  let action = ''
  let details = ''

  // Track position changes (only if moved significantly - more than 5px)
  if (
    newProps.x !== undefined &&
    newProps.y !== undefined &&
    oldProps.x !== undefined &&
    oldProps.y !== undefined
  ) {
    const dx = Math.abs(newProps.x - oldProps.x)
    const dy = Math.abs(newProps.y - oldProps.y)
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 5) {
      changes.push('moved')
    }
  }

  // Track size changes
  if (
    (newProps.width !== undefined && oldProps.width !== undefined && Math.abs(newProps.width - oldProps.width) > 2) ||
    (newProps.height !== undefined && oldProps.height !== undefined && Math.abs(newProps.height - oldProps.height) > 2)
  ) {
    changes.push('resized')
  }

  // Track rotation changes
  if (
    newProps.rotation !== undefined &&
    oldProps.rotation !== undefined &&
    Math.abs(newProps.rotation - oldProps.rotation) > 1
  ) {
    changes.push('rotated')
  }

  // Track fill color changes
  if (newProps.fill !== undefined && oldProps.fill !== undefined && newProps.fill !== oldProps.fill) {
    changes.push('changed fill')
    details = `from ${oldProps.fill} to ${newProps.fill}`
  }

  // Track stroke changes
  if (newProps.stroke !== undefined && oldProps.stroke !== undefined && newProps.stroke !== oldProps.stroke) {
    changes.push('changed stroke')
    if (details) {
      details += '; '
    }
    details += `stroke from ${oldProps.stroke} to ${newProps.stroke}`
  }

  // Track stroke width changes
  if (
    newProps.strokeWidth !== undefined &&
    oldProps.strokeWidth !== undefined &&
    newProps.strokeWidth !== oldProps.strokeWidth
  ) {
    changes.push('changed stroke width')
  }

  // Track opacity changes
  if (
    newProps.opacity !== undefined &&
    oldProps.opacity !== undefined &&
    Math.abs(newProps.opacity - oldProps.opacity) > 0.05
  ) {
    changes.push('changed opacity')
  }

  // Track text changes
  if (newProps.text !== undefined && oldProps.text !== undefined && newProps.text !== oldProps.text) {
    changes.push('changed text')
  }

  // Track font size changes
  if (
    newProps.fontSize !== undefined &&
    oldProps.fontSize !== undefined &&
    newProps.fontSize !== oldProps.fontSize
  ) {
    changes.push('changed font size')
  }

  // Track layer changes (z-index)
  if (newProps.z !== undefined && oldProps.z !== undefined && newProps.z !== oldProps.z) {
    if (newProps.z > oldProps.z) {
      changes.push('moved to front')
    } else {
      changes.push('moved to back')
    }
  }

  // If no significant changes detected, return null
  if (changes.length === 0) {
    return null
  }

  // Generate action description
  if (changes.length === 1) {
    action = changes[0]
  } else if (changes.length === 2) {
    action = `${changes[0]} and ${changes[1]}`
  } else {
    action = `${changes.slice(0, -1).join(', ')}, and ${changes[changes.length - 1]}`
  }

  return {
    type: 'edit',
    action,
    details: details || undefined,
    by: userId,
    byName: userName,
    at: Date.now()
  }
}

/**
 * Adds a new entry to history, maintaining the limit
 */
export function addToHistory(
  currentHistory: ActivityHistoryEntry[] | undefined,
  newEntry: ActivityHistoryEntry,
  limit: number = 10
): ActivityHistoryEntry[] {
  const history = currentHistory || []
  
  // Prepend new entry and keep only the last N entries
  return [newEntry, ...history].slice(0, limit)
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  
  // Format as date
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Gets an icon/emoji for a history entry
 */
export function getHistoryIcon(entry: ActivityHistoryEntry): string {
  if (entry.type === 'comment') {
    return '💬'
  }
  return '✏️'
}

