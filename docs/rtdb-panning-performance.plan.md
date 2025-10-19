<!-- 5a29f802-4d22-4f11-9b41-57db43e69c6d bb142be3-2a74-4cc5-947f-6ff23de9fbda -->
# RTDB Panning Performance Optimization

## Overview

Switch canvas panning to use Firebase Realtime Database (RTDB) for smooth 60fps updates during active panning, while persisting final viewport position to Firestore for durability.

## Implementation Steps

### 1. Add RTDB Viewport Functions

**File:** `src/services/realtime.ts`

Add viewport publishing and subscription functions (similar to existing drag/resize pattern at lines 198-319):

```typescript
// Publish viewport position to RTDB (throttled)
export async function publishViewportRtdb(
  userId: string, 
  viewport: { x: number; y: number; scale: number }
): Promise<void>

// Subscribe to viewport updates from RTDB
export function subscribeToViewportRtdb(
  userId: string,
  callback: (viewport: { x: number; y: number; scale: number }) => void
): () => void

// Clear viewport from RTDB when done panning
export async function clearViewportRtdb(userId: string): Promise<void>
```

Add throttling at 60fps (16ms) similar to `DRAG_THROTTLE_MS` at line 242.

### 2. Update Canvas Panning Handlers

**File:** `src/components/Canvas/Canvas.tsx`

Modify panning logic (currently at lines 157-227):

- **onMouseDown** (line 157): Mark panning start
- **onMouseMove** (line 181-216): 
  - Update local viewport state immediately for smooth UI
  - Publish to RTDB (throttled)
  - Skip Firestore updates during active panning
- **onMouseUp** (line 218): 
  - Mark panning end
  - Clear RTDB viewport
  - Persist final viewport to Firestore once

### 3. Optimize Viewport State Updates

**File:** `src/contexts/CanvasContext.tsx`

Add optimization at viewport setter (line 82-98):

- Use `useRef` to track viewport during panning without triggering context updates
- Only update context state when panning ends
- This prevents re-renders of all canvas children during panning

### 4. Add Firestore Debouncing

**File:** `src/contexts/CanvasContext.tsx`

Debounce the `updateDocumentViewport` call (line 136) when panning completes:

- Wait 500ms after panning ends before Firestore write
- Cancel debounced write if user starts panning again
- Ensures only one Firestore write per panning session

## Key Files

- `src/services/realtime.ts` - RTDB viewport functions
- `src/components/Canvas/Canvas.tsx` - Panning event handlers
- `src/contexts/CanvasContext.tsx` - Viewport state optimization

## Testing

- Verify smooth 60fps panning without jank
- Confirm viewport persists after refresh
- Check no RTDB throttling errors in console

### To-dos

- [ ] Add RTDB viewport functions to realtime.ts (publish, subscribe, clear, throttling)
- [ ] Update Canvas.tsx panning handlers to use RTDB during active panning
- [ ] Optimize CanvasContext viewport state to prevent re-renders during panning
- [ ] Add debounced Firestore persistence when panning ends