<!-- 31e28b58-6848-49f1-b7a2-33f973eb5708 8a09911b-57df-4834-81a9-6ec6f54d29f3 -->
# Fix Panning Mouse Leave Bug

## Problem

When a user pans the canvas by dragging the mouse, if they drag outside the canvas/window, the panning state gets stuck. This happens because:

1. `onMouseDown` sets `isPanningRef.current = true` (line 179 in Canvas.tsx)
2. `onMouseMove` and `onMouseUp` are Konva events that only fire when the mouse is over the Stage
3. When the mouse leaves the Stage/window during a drag, `onMouseUp` never fires
4. The `isPanningRef.current` stays `true`, keeping the user stuck in panning mode

## Solution

Add window-level event listeners to catch `mouseup` events that occur outside the canvas. This ensures the panning state is always properly reset, regardless of where the mouse button is released.

## Implementation

### File: `src/components/Canvas/Canvas.tsx`

Add a new `useEffect` hook after the existing resize handler (around line 101) that:

1. Listens to `window` for `mouseup` events
2. Calls the same cleanup logic as the existing `onMouseUp` handler
3. Cleans up listeners on unmount

The logic should:

- Reset `isPanningRef.current = false`
- Reset `lastPosRef.current = null`
- Call `clearViewportRtdb(user.id)` if user exists
- Call `endBoxSelection()` if `isBoxSelecting` is true

This ensures that whenever the mouse is released anywhere (in or out of the canvas), the panning state is properly cleared.

## Testing

After implementation, verify:

1. Start panning by clicking and dragging on the canvas
2. While dragging, move mouse outside the browser window
3. Release mouse button outside the window
4. Move mouse back into the canvas
5. Confirm panning is NOT active (canvas should not pan without clicking)

### To-dos

- [ ] Add useEffect with window mouseup event listener to reset panning state
- [ ] Test that panning properly stops when mouse is released outside the window