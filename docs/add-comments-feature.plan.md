<!-- c1194651-7722-4e2b-85b0-bc0c38bda9fe 160c4281-b6f7-4db8-acef-d75338a7c0f4 -->
# Add Comments and Change History to Shapes and Groups

## Data Model Changes

### Update Type Definitions

**File**: `src/types/canvas.types.ts`

Add to `Rectangle` interface:

```typescript
// Manual comments
comment?: string
commentBy?: string
commentByName?: string
commentAt?: number

// Combined history (comments + automatic change tracking)
history?: Array<{
  type: 'comment' | 'edit'
  // For comments
  text?: string
  // For edits
  action?: string  // e.g., "changed fill color", "moved shape", "resized"
  details?: string // e.g., "from #FF0000 to #00FF00"
  // Common fields
  by: string       // userId
  byName: string
  at: number       // timestamp
}>
```

Add same fields to `ShapeGroup` interface with additional edit actions like "added shape", "removed shape", "renamed group".

### Update Firestore Schema

**File**: `docs/firestore-schema.md`

Document comment and history fields for shapes and groups collections. History limited to 10 most recent entries.

## Change Tracking Logic

### Create History Utility

**New file**: `src/utils/historyTracking.ts`

Functions to generate history entries:

- `createCommentEntry(text, userId, userName)` - for manual comments
- `createEditEntry(oldProps, newProps, userId, userName)` - detects and describes changes
  - Tracks: position (x, y), size (width, height), visual (fill, stroke, strokeWidth, opacity, rotation)
  - Returns human-readable descriptions: "moved shape", "changed fill from #FF0000 to #00FF00"
- `addToHistory(currentHistory, newEntry, limit=10)` - prepends entry, keeps last 10

### Update Shape Update Logic

**File**: `src/services/shapes.ts` or wherever shapes are updated

Intercept all shape property updates:

- Before saving, compare old vs new properties
- Generate edit entry with `createEditEntry()`
- Append to history array (max 10 entries)
- Save to Firestore

### Update Group Update Logic

Track group changes:

- Membership changes: "added [ShapeName] to group", "removed [ShapeName] from group"
- Property changes: "renamed group", "changed group color"
- Same history limit of 10 entries

## UI Components

### Create ActivityPanel Component

**New file**: `src/components/Canvas/ActivityPanel.tsx`

Combined panel showing:

1. **Comment Section** (top):

   - Current comment with author and timestamp
   - Textarea for adding/editing comment
   - Save button

2. **Activity History** (below):

   - Scrollable list of last 10 entries
   - Each entry shows icon (💬 for comment, ✏️ for edit), description, author, timestamp
   - Example entries:
     - "💬 Alice: This needs adjustment - 2 mins ago"
     - "✏️ Bob changed fill color from red to blue - 5 mins ago"
     - "✏️ Alice moved shape - 10 mins ago"

### Update Canvas Component

**File**: `src/components/Canvas/Canvas.tsx`

- Render ActivityPanel in fixed right sidebar (300-400px width)
- Pass selected shape/group data to panel
- Only visible when something is selected

### Add Activity Badge Indicator

**File**: `src/components/Canvas/Canvas.tsx`

- Show badge icon on shapes that have comments or activity history
- Use different icon/color for shapes with manual comments vs just edit history

## Services

### Update Comment Service

**File**: `src/services/shapes.ts`

Add `updateShapeComment()`:

- Creates comment history entry
- Updates comment field
- Prepends to history array (limit 10)
- Saves to Firestore

Add `updateGroupComment()` for groups.

### Intercept All Shape Edits

Modify existing shape update functions:

- Hook into drag, resize, style changes
- Call `createEditEntry()` before each update
- Append to history

## Real-time Updates

Firestore listeners sync all history changes to collaborators in real-time.

## Summary

Provides:

- Manual text comments with edit capability
- Automatic tracking of all shape/group changes
- Unified activity feed (last 10 items)
- Real-time collaboration
- Visual indicators for activity
- User attribution with timestamps

### To-dos

- [ ] Add comment and commentHistory fields to Rectangle and ShapeGroup interfaces
- [ ] Document comment fields in Firestore schema documentation
- [ ] Create CommentPanel component with input, history display, and save functionality
- [ ] Integrate CommentPanel into Canvas component with side panel layout
- [ ] Add comment badge icons to shapes and groups that have comments
- [ ] Add updateShapeComment function to shapes service
- [ ] Add updateGroupComment function to groups service