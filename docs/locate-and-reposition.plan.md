<!-- 5b5a0129-2b05-4ab6-9525-b34120b39b35 a474970f-4898-4dec-8c16-3e9f0466e38e -->
# Locate Button and Keyboard Shortcuts Panel Repositioning

## Overview

Implement a Locate dropdown button in the header that allows users to search and snap to any user's cursor or shape on the canvas, and reposition the keyboard shortcuts panel to the lower left corner to prevent it from covering the header.

## Implementation Steps

### 1. Create Locate Dropdown Component

Create `/home/ciscodg/main-collabcanvas/src/components/Header/LocateDropdown.tsx`:

- Follow the pattern from `StatsDropdown.tsx` and `ShapeSelector.tsx`
- Add a search input field that accepts username or shape name
- Implement autocomplete/filtering for users and shapes:
  - Fetch online users from `usePresence()` hook (only those with active cursor positions)
  - Fetch shapes from `useCanvas()` context
  - Display filtered results as user types
  - For shapes: search by shape ID only
- For user location:
  - Get user's cursor position from presence data (see `UserPresence` type)
  - Only show users who have a current cursor position on the canvas
  - Pan viewport to center on that cursor position and reset zoom to a comfortable level (e.g., scale = 1.0)
- For shape location:
  - Get shape's x, y, width, height from rectangles array
  - Pan viewport to center on that shape's center point and reset zoom to ensure shape is visible
- Use the viewport transform calculation from `ShapeSelector.tsx` (lines 21-29) in reverse to pan to a specific workspace position

### 2. Add Locate Button to Header

Update `/home/ciscodg/main-collabcanvas/src/App.tsx`:

- Import the new `LocateDropdown` component
- Add it to the header's button group (around line 184):
  ```tsx
  <LocateDropdown />
  ```

- Position it between `StatsDropdown` and `UserMenu` for visual consistency

### 3. Implement Viewport Snapping Logic

Enhance `/home/ciscodg/main-collabcanvas/src/contexts/CanvasContext.tsx`:

- Add a new method `panToPosition(x: number, y: number)` to the context
- This method should:
  - Calculate the viewport transform to center a workspace position on screen
  - Call `setViewport()` with the new transform
  - Use the inverse of the viewport transformation math from `ShapeSelector.tsx`

### 4. Reposition Keyboard Shortcuts Panel

Update `/home/ciscodg/main-collabcanvas/src/components/KeyboardShortcutsHelp.tsx`:

- Change the modal positioning from centered to lower-left:
  - Remove the `justify-center` and `items-center` flex centering
  - Change line 71-80 styles to position at lower-left:
    ```tsx
    className="fixed inset-0 flex items-end"
    style={{
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      padding: '20px'
    }}
    ```

  - Adjust the inner div styles (lines 85-97) to remove centering and add margin from bottom-left

## Files to Modify

1. **New file**: `/home/ciscodg/main-collabcanvas/src/components/Header/LocateDropdown.tsx` - Locate dropdown component
2. `/home/ciscodg/main-collabcanvas/src/App.tsx` - Add LocateDropdown to header
3. `/home/ciscodg/main-collabcanvas/src/contexts/CanvasContext.tsx` - Add panToPosition method
4. `/home/ciscodg/main-collabcanvas/src/components/KeyboardShortcutsHelp.tsx` - Reposition to lower-left

## Key Technical Details

- Use `viewport.scale`, `viewport.x`, `viewport.y` to calculate transformations
- Center position formula: `screenPos = (workspacePos * scale) + viewport.offset`
- Reverse to find viewport offset: `viewport.offset = screenCenter - (workspacePos * scale)`
- Access user cursor positions via `PresenceContext.users[userId].cursor`
- Match shapes by searching the `text` property for text shapes, or fall back to searching by shape ID

### To-dos

- [ ] Create LocateDropdown component with search functionality for users and shapes
- [ ] Add panToPosition method to CanvasContext for viewport snapping
- [ ] Add LocateDropdown to the header in App.tsx
- [ ] Update KeyboardShortcutsHelp component to position at lower-left