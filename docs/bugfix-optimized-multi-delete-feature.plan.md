<!-- 4a554df0-d7a2-487c-8b3d-ab03cea49a42 0ea7e481-c007-4dc3-8e3f-4939610e860c -->
# Optimized Multi-Delete Feature

## Overview

Optimize multi-shape deletion by: (1) immediately deleting from local store, (2) sending single network call for batch deletion, (3) broadcasting via RTDB to remote users before backend completes, so remote users see instant updates.

## Current Architecture

- **Deletion flow**: Each shape deleted individually via `deleteRectangle()` → `deleteShape()` → Firestore `deleteDoc()`
- **Remote sync**: Firestore `onSnapshot` listener propagates changes to all clients
- **Real-time channels**: RTDB used for drag, resize, selections, viewport (not deletions yet)

## Implementation Steps

### 1. Add RTDB Multi-Delete Channel (`src/services/realtime.ts`)

Add functions to broadcast and subscribe to multi-delete events:

- `publishMultiDeleteRtdb(userId, shapeIds, documentId)` - broadcasts deletion event
- `subscribeToMultiDeleteRtdb(documentId, callback)` - listens for deletion events
- Channel structure: `multiDelete/{documentId}/{userId}/{timestamp}`

### 2. Add Batch Delete Function (`src/services/firestore.ts`)

Create efficient batch deletion with industry best practices:

- `deleteMultipleShapes(shapeIds: string[]): Promise<void>` - deletes multiple shapes atomically
- **Use Firestore `writeBatch()` API** for atomic operations (all succeed or all fail)
- Handle 500 operation limit per batch (split into multiple batches if needed)
- Comprehensive error handling with detailed error messages
- Return success/failure info for rollback on error

### 3. Update useShapes Hook (`src/hooks/useShapes.ts`)

Add multi-delete with optimistic updates:

- New function: `deleteMultipleShapes(shapeIds: string[])`
- Subscribe to RTDB multi-delete channel in `useEffect`
- On receiving delete event from RTDB: immediately filter shapes from local state
- Call batch delete function in background

### 4. Wire Up to CanvasContext (`src/contexts/CanvasContext.tsx`)

Expose multi-delete capability:

- Add `deleteMultipleRectangles(ids: string[])` to context
- Provide to consumers via context value

### 5. Update UI Components

Replace individual deletions with batch call:

- **Canvas.tsx** (`handleMultiDelete` ~line 1008): Replace `forEach(deleteRectangle)` with `deleteMultipleRectangles(selectedShapes.map(s => s.id))`
- **useKeyboardShortcuts.ts** (Delete/Backspace handler ~line 67): Replace loop with batch call
- **MultiShapeProperties.tsx** (`handleDelete` ~line 93): Add similar batch call

## Flow Diagram

**User deletes shapes:**

1. User action → `deleteMultipleRectangles([id1, id2, ...])`
2. Immediate local state update (remove from shapes array)
3. Broadcast to RTDB channel
4. Background: Batch delete from Firestore

**Remote user receives:**

1. RTDB listener fires with deleted shape IDs
2. Immediate local state update (remove from shapes array)
3. Eventually: Firestore snapshot confirms (redundant but harmless)

## Key Files to Modify

- `src/services/realtime.ts` - RTDB delete channel
- `src/services/firestore.ts` - Batch delete function
- `src/hooks/useShapes.ts` - Multi-delete logic with optimistic updates
- `src/contexts/CanvasContext.tsx` - Context integration
- `src/components/Canvas/Canvas.tsx` - UI handler
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard handler
- `src/components/Canvas/MultiShapeProperties.tsx` - Properties panel handler

### To-dos

- [ ] Add RTDB multi-delete broadcast and subscription functions to realtime.ts
- [ ] Implement batch delete function in firestore.ts
- [ ] Add multi-delete with optimistic updates to useShapes hook
- [ ] Wire up deleteMultipleRectangles to CanvasContext
- [ ] Update Canvas.tsx, useKeyboardShortcuts.ts, and MultiShapeProperties.tsx to use batch delete