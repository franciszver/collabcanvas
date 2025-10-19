<!-- f7b665bc-1761-481f-956d-1d3de75b5c31 ef8ca2f9-21b9-4c96-88ab-1621070501ff -->
# Fix Comments Not Showing in Activity History

## Root Cause

The `ShapeDocument` interface and `shapeToRectangle` conversion function in `firestore.ts` are missing the comment and history fields. When comments are saved to Firestore, they persist correctly, but when shapes are read back, these fields are not mapped to the Rectangle objects used by the app.

## Changes Required

### 1. Update `ShapeDocument` Interface

**File:** `src/services/firestore.ts` (lines 22-47)

Add the following fields to the `ShapeDocument` interface:

```typescript
// Comments and Activity Tracking
comment?: string
commentBy?: string
commentByName?: string
commentAt?: number
history?: ActivityHistoryEntry[]
```

Also import `ActivityHistoryEntry` type at the top of the file:

```typescript
import type { Rectangle, ActivityHistoryEntry } from '../types/canvas.types'
```

### 2. Update `shapeToRectangle` Function

**File:** `src/services/firestore.ts` (lines 153-167)

Add the comment and history fields to the returned Rectangle object:

```typescript
export function shapeToRectangle(shape: ShapeDocument): Rectangle {
  return {
    id: shape.id,
    type: shape.type as any,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation,
    z: shape.z,
    fill: shape.fill,
    text: shape.text,
    fontSize: shape.fontSize,
    // Add comment and history fields
    comment: shape.comment,
    commentBy: shape.commentBy,
    commentByName: shape.commentByName,
    commentAt: shape.commentAt,
    history: shape.history,
  }
}
```

### 3. Update `rectangleToShape` Function (Optional)

**File:** `src/services/firestore.ts` (lines 125-150)

Add comment and history fields when they exist:

```typescript
// Add after line 147 (after fontSize check)
if (rect.comment !== undefined) {
  shape.comment = rect.comment
  shape.commentBy = rect.commentBy
  shape.commentByName = rect.commentByName
  shape.commentAt = rect.commentAt
}
if (rect.history !== undefined) {
  shape.history = rect.history
}
```

## Expected Result

After these changes:

- Comments saved to Firestore will appear in the activity history
- The ActivityPanel will display comment entries with the 💬 icon
- All existing comments in Firestore will become visible
- Edit history tracking will also work properly