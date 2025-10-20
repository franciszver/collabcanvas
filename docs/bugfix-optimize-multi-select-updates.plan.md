<!-- 4dd148c0-2b3e-43ec-9f0e-69ba73b4d49e 85534c5a-e156-440e-901e-6cd2ee2daedc -->
# Optimize Multi-Select Real-Time Updates

## Current Behavior

When multiple shapes are selected and transformed (moved, rotated, or resized):

- `handleDragMove` publishes live RTDB updates on every mouse movement
- `updateRectangle` is called multiple times during the operation
- Other users see intermediate positions, causing unnecessary network traffic

## Changes Required

### 1. Modify `handleDragMove` in Canvas.tsx

**File:** `src/components/Canvas/Canvas.tsx` (~line 513)

Skip live drag updates when multiple shapes are selected:

```typescript
const handleDragMove = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
  const cx = node.x()
  const cy = node.y()
  const { x, y } = toTopLeft(cx, cy)
  lastDragPosRef.current[r.id] = { x, y }
  
  // Only publish live updates for single shape selection
  const selected = selectedIdsRef.current
  if (user && selected.size <= 1) {
    publishDragUpdate(r.id, { x, y }).catch(console.error)
  }
}
```

### 2. Modify `handleDragEnd` in Canvas.tsx

**File:** `src/components/Canvas/Canvas.tsx` (~line 525)

Ensure all selected shapes are updated in one batch at the end:

```typescript
const handleDragEnd = (node: Konva.Node, toTopLeft: (cx: number, cy: number) => { x: number; y: number }) => {
  const cx = node.x()
  const cy = node.y()
  const { x, y } = toTopLeft(cx, cy)
  const selected = selectedIdsRef.current
  
  const oldX = r.x
  const oldY = r.y
  
  if (selected.size > 1) {
    // Calculate deltas and update all shapes in batch
    const prev = lastDragPosRef.current[r.id] || { x, y }
    const dx = x - prev.x
    const dy = y - prev.y
    
    for (const id of selected) {
      if (id === r.id) {
        updateRectangle(id, { x, y })
        if (user) {
          trackShapeEdit(id, { x: oldX, y: oldY }, { x, y }, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
        }
      } else {
        const cur = rectangles.find((rc: Rectangle) => rc.id === id)
        if (cur) {
          const newX = cur.x + dx
          const newY = cur.y + dy
          updateRectangle(id, { x: newX, y: newY })
          if (user) {
            trackShapeEdit(id, { x: cur.x, y: cur.y }, { x: newX, y: newY }, user.id, user.displayName || 'Unknown User', cur.history).catch(console.error)
          }
        }
      }
    }
  } else {
    // Single shape - update normally
    updateRectangle(r.id, { x, y })
    if (user) {
      trackShapeEdit(r.id, { x: oldX, y: oldY }, { x, y }, user.id, user.displayName || 'Unknown User', r.history).catch(console.error)
    }
  }
  
  draggingIdRef.current = null
  
  // Clear RTDB drag data
  if (user) {
    clearDragUpdate(r.id).catch(() => {})
  }
}
```

### 3. Handle Multi-Shape Transforms (Rotation/Resize)

**File:** `src/components/Canvas/Canvas.tsx` (multiple `onTransformEnd` handlers)

The Transformer component already handles multi-shape transforms as a single operation that only fires `onTransformEnd` once. However, we need to add logic to calculate and apply transforms to all selected shapes:

Add a new handler after the Transformer effect hook (~line 313):

```typescript
// Handle multi-shape transform end
useEffect(() => {
  const tr = transformerRef.current
  if (!tr) return
  
  const handleTransformEnd = () => {
    const selected = selectedIdsRef.current
    if (selected.size <= 1) return // Single shape transforms are handled by individual onTransformEnd
    
    // Get all nodes being transformed
    const nodes = tr.nodes()
    if (nodes.length === 0) return
    
    // Update all transformed shapes
    nodes.forEach(node => {
      const id = (node.attrs as any).id
      if (!id) return
      
      const shape = rectangles.find((r: Rectangle) => r.id === id)
      if (!shape) return
      
      // Calculate new properties based on shape type
      const updates: Partial<Rectangle> = {}
      
      // Position
      if (shape.type === 'circle' || shape.type === 'triangle' || shape.type === 'star') {
        updates.x = node.x() - node.width() / 2
        updates.y = node.y() - node.height() / 2
      } else {
        updates.x = node.x()
        updates.y = node.y()
      }
      
      // Size
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      updates.width = Math.max(5, shape.width * scaleX)
      updates.height = Math.max(5, shape.height * scaleY)
      
      // Rotation
      updates.rotation = node.rotation()
      
      // Reset scale
      node.scaleX(1)
      node.scaleY(1)
      
      // Update shape
      updateRectangle(id, updates)
      
      // Track activity
      if (user) {
        const oldProps = { x: shape.x, y: shape.y, width: shape.width, height: shape.height, rotation: shape.rotation }
        trackShapeEdit(id, oldProps, updates, user.id, user.displayName || 'Unknown User', shape.history).catch(console.error)
      }
    })
  }
  
  tr.on('transformend', handleTransformEnd)
  
  return () => {
    tr.off('transformend', handleTransformEnd)
  }
}, [selectedIds, rectangles, user, updateRectangle])
```

## Benefits

1. **Reduced Network Traffic**: Only send final positions instead of every intermediate position
2. **Better Performance**: Less RTDB writes = faster operations
3. **Cleaner UX**: Other users won't see jittery intermediate positions
4. **Consistent Behavior**: All multi-select operations (drag, rotate, resize) work the same way

## Testing

- Test dragging multiple shapes
- Test rotating multiple shapes with Transformer
- Test resizing multiple shapes with Transformer
- Verify single shape operations still work as before
- Verify other users only see final positions

### To-dos

- [ ] Modify handleDragMove to skip live updates for multi-select
- [ ] Verify handleDragEnd batches all shape updates correctly
- [ ] Add multi-shape transform end handler for rotation and resizing
- [ ] Test all multi-select operations work correctly