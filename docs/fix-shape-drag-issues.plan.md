<!-- 9f409cdd-90d8-46e4-bfd2-6b2336f39017 c4f325d4-3931-4244-95b8-658c309e1bee -->
# Fix Shape Dragging Issues

## Problem Summary

1. **Firestore Error**: Shape updates contain undefined field values that Firestore rejects
2. **Visual Lag**: Transformer (rotate/resize controls) don't follow shapes during drag, only jumping to position after drag ends

## Solution Approach

### 1. Create Firestore Sanitization Utility

Create a utility function to strip undefined values from objects before sending to Firestore.

**File**: `src/utils/firestore-helpers.ts` (new file)

- Implement `sanitizeForFirestore()` that recursively removes undefined values
- Handle nested objects safely
- Preserve null values (Firestore allows null but not undefined)

### 2. Apply Sanitization in useShapes Hook

Update the shape update handler to sanitize data before sending to Firestore.

**File**: `src/hooks/useShapes.ts`

- Import the sanitization utility
- Apply sanitization to `shapeUpdates` object in `updateShapeHandler` (line 124)
- Also add explicit handling for missing Rectangle fields: `radius`, `sides`, `points`, `groupId`

### 3. Fix Transformer Real-time Sync

Make Transformer controls follow shapes smoothly during dragging.

**File**: `src/components/Canvas/Canvas.tsx`

- In `handleDragMove` function (~line 452), add `transformerRef.current?.getLayer()?.batchDraw()` to force Transformer redraw
- This ensures the Transformer updates its position in real-time as shapes move

### 4. Verify All Shape Types

Ensure all shape types (circle, triangle, star, arrow, rect, text) properly update during drag.

**Files to check**:

- `Canvas.tsx` - All onDragMove handlers for different shape types

## Expected Outcome

- No more Firestore errors when moving shapes
- Smooth visual feedback with Transformer following shapes during drag
- Professional UX matching modern design tools

### To-dos

- [ ] Create sanitizeForFirestore utility function to strip undefined values
- [ ] Apply sanitization in useShapes hook and add missing field handlers
- [ ] Add real-time Transformer updates during drag moves
- [ ] Verify dragging works for all shape types without errors