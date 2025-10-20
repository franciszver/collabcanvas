<!-- 4312fb7d-6c84-4342-ad83-3a778ed4c686 c2c1b69c-d92f-4585-9b98-c0683959683a -->
# Fix Firestore Undefined Field Updates

## Problem Analysis

When bringing shapes to the top or bottom, Firestore throws: `Unsupported field value: undefined`.

**Root cause**: `src/services/firestore.ts` (lines 110-113, 151-154) spreads update objects directly into `updateDoc()` and `writeBatch.update()`, which passes through undefined values. Firestore rejects undefined - fields must either be omitted or explicitly deleted with `deleteField()`.

## Affected Code Locations

### 1. Places explicitly passing undefined (need deleteField):

- **src/contexts/CanvasContext.tsx** line 385: `{ groupId: undefined }` when ungrouping shapes
- **src/services/locking.ts** lines 36-38: `{ lockedBy: undefined, lockedByName: undefined, lockedAt: undefined }` when unlocking
- **src/services/activityService.ts** lines 35-38: `{ comment: undefined, commentBy: undefined, commentByName: undefined, commentAt: undefined }` when clearing comments

### 2. Missing field handling in useShapes.ts:

- `groupId`, `radius`, `sides`, `points`, `lockedBy`, `lockedByName`, `lockedAt` fields aren't explicitly checked in updateShapeHandler (line 126) or updateMultipleShapesHandler (line 215)
- If these fields exist in an update object, they pass through as undefined

### 3. The immediate bug:

- When you click "Bring to Front" or "Send to Back", it calls `bringToFrontHandler`/`sendToBackHandler` in CanvasContext.tsx (lines 299-327)
- These call `updateShape(shapeId, { z: maxZ + index + 1 })` 
- The `z` value is correct, but if the Rectangle type includes other optional fields, they might be spreading undefined values

## Impact Analysis

**Will NOT affect other functionality** because:

1. All 19 `updateRectangle` calls in Canvas.tsx pass concrete values (checked each one)
2. useCanvasCommands.ts builds updates object with explicit checks
3. MultiShapeProperties.tsx uses explicit field names
4. The only undefined values are the 3 intentional field deletion cases above

**Will FIX these issues**:

1. ✅ Bring to front/back operations (the reported bug)
2. ✅ Ungrouping shapes (currently broken)
3. ✅ Unlocking shapes (currently broken)  
4. ✅ Clearing comments (currently broken)

## Solution

### 1. Add filterUndefined helper in firestore.ts

Add a defensive filter that removes undefined values before Firestore calls:

```typescript
function filterUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}
```

Apply in `updateShape` (line 110) and `updateMultipleShapes` (line 151).

### 2. Use deleteField() for intentional deletions

Import `deleteField` from firebase/firestore and use it in:

- **locking.ts** (line 35): Replace undefined with `deleteField()`
- **activityService.ts** (line 34): Replace undefined with `deleteField()`  
- **CanvasContext.tsx** (line 385): Replace undefined with `deleteField()`

### 3. Add missing field checks in useShapes.ts

In both `updateShapeHandler` (after line 131) and `updateMultipleShapesHandler` (after line 216), add:

```typescript
if (updates.groupId !== undefined) shapeUpdates.groupId = updates.groupId
if (updates.radius !== undefined) shapeUpdates.radius = updates.radius
if (updates.sides !== undefined) shapeUpdates.sides = updates.sides
if (updates.points !== undefined) shapeUpdates.points = updates.points
if (updates.lockedBy !== undefined) shapeUpdates.lockedBy = updates.lockedBy
if (updates.lockedByName !== undefined) shapeUpdates.lockedByName = updates.lockedByName
if (updates.lockedAt !== undefined) shapeUpdates.lockedAt = updates.lockedAt
```

## Why This is Safe

- Defensive filtering in firestore.ts catches any accidental undefined values
- Explicit `deleteField()` ensures field deletion works correctly
- All existing update calls already pass concrete values
- No changes to the update API or calling patterns

### To-dos

- [ ] Add filterUndefined helper and apply it in updateShape and updateMultipleShapes in firestore.ts
- [ ] Replace undefined with deleteField() in locking.ts, activityService.ts, and CanvasContext.tsx
- [ ] Add explicit checks for missing fields (groupId, radius, sides, points, lockedBy, lockedByName, lockedAt) in useShapes.ts
- [ ] Add filterUndefined helper and apply it in updateShape and updateMultipleShapes in firestore.ts
- [ ] Add explicit checks for groupId, radius, sides, points in useShapes.ts updateShapeHandler and updateMultipleShapesHandler
- [ ] Fix ungroupShapesHandler to use deleteField() instead of undefined for removing groupId