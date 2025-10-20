<!-- c1f1f1a0-ebcf-4dc3-aff6-93676379020d 48c7f8d1-277e-40b1-8e60-a3b8561b991c -->
# Small Quality of Life Bug Fixes

## Bug Fixes

### 1. Clear multi-selection when clicking a new shape (outside existing selection)

**File:** `src/components/Canvas/Canvas.tsx`

When a user clicks on a shape without holding Shift, it should clear any existing multi-selection and only select the clicked shape. Currently, the `selectShape` function adds to the selection instead of replacing it.

**Location:** Lines 419-430 (onClick handler)

**Fix:** Before calling `selectShape(r.id)`, check if the shape is not already selected. If it's a new shape, call `clearSelection()` first, then `selectShape(r.id)`.

```typescript
onClick: (evt: Konva.KonvaEventObject<MouseEvent>) => { 
  evt.cancelBubble = true
  if (isLocked) {
    return
  }
  if (evt.evt.shiftKey) { 
    toggleShape(r.id) 
  } else { 
    // If clicking a shape not in current selection, clear first
    if (!isSelected(r.id)) {
      clearSelection()
    }
    selectShape(r.id) 
  }
}
```

### 2. Auto-focus input after clicking Send in AI chatbot

**File:** `src/components/Chat/ChatBox.tsx`

After the user clicks the Send button, the input field should automatically regain focus for seamless interaction.

**Location:** `handleSendMessage` function (line 215) and the Send button (line 747-753)

**Fix:** Add a ref to the textarea and focus it at the end of `handleSendMessage` and in the button's onClick handler.

### 3. Keep focus in input after pressing Enter

**File:** `src/components/Chat/ChatBox.tsx`

When the user presses Enter to send a message, the textarea should retain focus.

**Location:** `handleKeyDown` function (line 587-592)

**Fix:** After calling `handleSendMessage()`, refocus the textarea element. This can use the same ref as fix #2.

### 4. Hide cursor when user has shapes selected

**File:** `src/components/Canvas/Canvas.tsx`

When a user has one or more shapes selected, their cursor should not be broadcast to other users. We'll clear the cursor position when selection occurs.

**Locations:**

- `onStageMouseMove` function (line 337-347) - Skip broadcasting while shapes are selected
- Add `useEffect` to watch `hasSelection` - Clear cursor when selection changes

**Fix:**

1. In `onStageMouseMove`, check if `hasSelection` is true and skip cursor updates if so
2. Add a `useEffect` that watches `hasSelection` and sends a cursor clear signal when it becomes true
3. Use `updateCursorPositionRtdb` with `{ x: -1, y: -1 }` or similar sentinel value to signal "hide cursor" to other users
```typescript
// Add useEffect to clear cursor when selection changes
useEffect(() => {
  if (hasSelection && user) {
    // Clear cursor position when shapes are selected
    updateCursorPositionRtdb(user.id, { x: -1, y: -1 }).catch(console.warn)
  }
}, [hasSelection, user])

const onStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
  // Don't broadcast cursor if user has shapes selected
  if (hasSelection) {
    return
  }
  
  const stage = e.target.getStage()
  // ... rest of the function
}, [viewport, scheduleCursorSend, hasSelection])
```


## Testing Considerations

- Test multi-selection: Select multiple shapes with Shift, then click a different shape without Shift - should clear and select only the new shape
- Test AI chatbot: Send messages with both Enter key and Send button - focus should remain in input
- Test cursor hiding: Select a shape and verify other users don't see your cursor moving

### To-dos

- [ ] Clear existing multi-selection when clicking a new shape without Shift key
- [ ] Auto-focus AI chatbot input after clicking Send button
- [ ] Keep focus in AI chatbot input after pressing Enter
- [ ] Hide user cursor from others when shapes are selected