import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react'
import usePresence from '../../hooks/usePresence'
import { useCanvas } from '../../contexts/CanvasContext'
import { usePresence as usePresenceContext } from '../../contexts/PresenceContext'
import type { Rectangle } from '../../types/canvas.types'
import { calculateShapeNumbers, getShapeTypeName } from '../../utils/helpers'

export interface LocateDropdownRef {
  openDropdown: () => void
}

const LocateDropdown = forwardRef<LocateDropdownRef>((_, ref) => {
  const { onlineUsers } = usePresence()
  const { users } = usePresenceContext()
  const { rectangles, panToPosition, panToShapePosition } = useCanvas()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Calculate shape numbers for display
  const shapeNumbers = useMemo(() => calculateShapeNumbers(rectangles), [rectangles])

  // Expose openDropdown method to parent
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      setOpen(true)
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }))

  // Filter users with cursor positions
  const usersWithCursors = onlineUsers.filter(u => {
    const userPresence = users[u.id]
    return userPresence && userPresence.cursor !== null
  }).map(u => ({
    id: u.id,
    name: u.name || 'Unknown',
    cursor: users[u.id].cursor!
  }))

  // Filter shapes based on search query
  const textShapes = rectangles.filter(r => r.type === 'text' && r.text)
  const otherShapes = rectangles.filter(r => r.type !== 'text' || !r.text)

  // Search filtering
  const filteredUsers = usersWithCursors.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredTextShapes = textShapes.filter(s =>
    s.text && s.text.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredOtherShapes = otherShapes.filter(s => {
    const shapeNumber = shapeNumbers.get(s.id) || 0
    const shapeTypeName = getShapeTypeName(s.type)
    const shapeName = `${shapeTypeName} #${shapeNumber}`
    return shapeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.id.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Limit results to 10 per section
  const MAX_RESULTS = 10
  const displayUsers = filteredUsers.slice(0, MAX_RESULTS)
  const displayTextShapes = filteredTextShapes.slice(0, MAX_RESULTS)
  const displayOtherShapes = filteredOtherShapes.slice(0, MAX_RESULTS)

  const hasMoreUsers = filteredUsers.length > MAX_RESULTS
  const hasMoreTextShapes = filteredTextShapes.length > MAX_RESULTS
  const hasMoreOtherShapes = filteredOtherShapes.length > MAX_RESULTS

  // All searchable items for keyboard navigation
  const allItems = [
    ...displayUsers.map(u => ({ type: 'user' as const, data: u })),
    ...displayTextShapes.map(s => ({ type: 'text-shape' as const, data: s })),
    ...displayOtherShapes.map(s => ({ type: 'other-shape' as const, data: s }))
  ]

  const hasResults = allItems.length > 0
  const noResults = searchQuery && !hasResults

  // Handle navigation to selected item
  const navigateToItem = (item: typeof allItems[number]) => {
    if (item.type === 'user') {
      panToPosition(item.data.cursor.x, item.data.cursor.y, 1.0)
    } else {
      panToShapePosition(item.data as Rectangle)
    }
    setOpen(false)
    setSearchQuery('')
    setSelectedIndex(0)
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearchQuery('')
        setSelectedIndex(0)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allItems[selectedIndex]) {
          navigateToItem(allItems[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, allItems])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [open])

  // Click outside to close
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!open) return
      if (menuRef.current && menuRef.current.contains(t)) return
      if (btnRef.current && btnRef.current.contains(t)) return
      setOpen(false)
      setSearchQuery('')
      setSelectedIndex(0)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Locate user or shape"
        title="Locate user or shape (Ctrl+K)"
        style={{
          background: '#111827',
          color: '#E5E7EB',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 16,
        }}
      >
        <span aria-hidden>🔍</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 6,
            background: '#0b1220',
            border: '1px solid #1f2937',
            borderRadius: 8,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 30,
            padding: 10,
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          {/* Search input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users or shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              color: '#E5E7EB',
              fontSize: 13,
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#60A5FA'}
            onBlur={(e) => e.target.style.borderColor = '#374151'}
          />

          {/* No results message */}
          {noResults && (
            <div style={{ padding: '12px 8px', color: '#9CA3AF', textAlign: 'center', fontSize: 13 }}>
              No results found
            </div>
          )}

          {/* Users with cursors section */}
          {displayUsers.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Users with Cursors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayUsers.map((u, idx) => {
                  const globalIdx = allItems.findIndex(item => item.type === 'user' && item.data.id === u.id)
                  const isSelected = globalIdx === selectedIndex
                  return (
                    <button
                      key={u.id}
                      onClick={() => navigateToItem({ type: 'user', data: u })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: isSelected ? '#1f2937' : 'transparent',
                        border: 'none',
                        borderRadius: 4,
                        color: '#E5E7EB',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#111827'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>👤</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              {hasMoreUsers && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, paddingLeft: 10 }}>
                  ...and {filteredUsers.length - MAX_RESULTS} more
                </div>
              )}
            </div>
          )}

          {/* Text shapes section */}
          {displayTextShapes.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Text Shapes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayTextShapes.map((s) => {
                  const globalIdx = allItems.findIndex(item => item.type === 'text-shape' && item.data.id === s.id)
                  const isSelected = globalIdx === selectedIndex
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigateToItem({ type: 'text-shape', data: s })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: isSelected ? '#1f2937' : 'transparent',
                        border: 'none',
                        borderRadius: 4,
                        color: '#E5E7EB',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#111827'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>T</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.text}
                      </span>
                    </button>
                  )
                })}
              </div>
              {hasMoreTextShapes && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, paddingLeft: 10 }}>
                  ...and {filteredTextShapes.length - MAX_RESULTS} more
                </div>
              )}
            </div>
          )}

          {/* Other shapes section */}
          {displayOtherShapes.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Other Shapes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayOtherShapes.map((s) => {
                  const globalIdx = allItems.findIndex(item => item.type === 'other-shape' && item.data.id === s.id)
                  const isSelected = globalIdx === selectedIndex
                  const icon = s.type === 'circle' ? '●' : s.type === 'triangle' ? '▲' : s.type === 'star' ? '★' : s.type === 'arrow' ? '➜' : '■'
                  const shapeNumber = shapeNumbers.get(s.id) || 0
                  const shapeTypeName = getShapeTypeName(s.type)
                  const shapeName = `${shapeTypeName} #${shapeNumber}`
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigateToItem({ type: 'other-shape', data: s })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: isSelected ? '#1f2937' : 'transparent',
                        border: 'none',
                        borderRadius: 4,
                        color: '#E5E7EB',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#111827'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shapeName}
                      </span>
                    </button>
                  )
                })}
              </div>
              {hasMoreOtherShapes && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, paddingLeft: 10 }}>
                  ...and {filteredOtherShapes.length - MAX_RESULTS} more
                </div>
              )}
            </div>
          )}

          {/* Empty state when no search */}
          {!searchQuery && !hasResults && (
            <div style={{ padding: '12px 8px', color: '#9CA3AF', textAlign: 'center', fontSize: 13 }}>
              <div style={{ marginBottom: 8 }}>Search for users or shapes</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                Use ↑↓ to navigate, Enter to select
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

LocateDropdown.displayName = 'LocateDropdown'

export default LocateDropdown

