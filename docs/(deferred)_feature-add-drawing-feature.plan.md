<!-- 9b81b305-3b53-4784-875f-3048994157e6 c68c85ae-4e4b-4314-9d9a-8e5b3a1ac7c9 -->
# Add Simple Drawing Feature

## Overview

Add a free-hand drawing tool activated by pressing `D` key. Users can draw custom paths that are saved as shapes and work with existing selection, locking, grouping, and commenting features.

## Implementation Steps

### 1. Type Definitions

**File: `src/types/canvas.types.ts`**

- Add `'drawing'` to `CanvasShapeType` union (line 7)
- The `Rectangle` interface already has `points?: number[]` field for storing path data

### 2. Drawing State Management

**File: `src/contexts/CanvasContext.tsx`**

- Add `isDrawing` and `currentDrawingPoints` to state
- Add `setIsDrawing` function to toggle drawing mode
- Handle `D` key press to activate drawing mode (integrate with existing keyboard handling)

### 3. Canvas Drawing Interaction

**File: `src/components/Canvas/Canvas.tsx`**

- Add drawing mode handlers:
- `onMouseDown`: Start capturing points when in drawing mode
- `onMouseMove`: Collect points while drawing
- `onMouseUp`: Save completed drawing to Firestore
- Render in-progress drawing with temporary Line component
- Render completed drawing shapes using Konva `Line` with `tension: 0.5` for smoothing

### 4. Drawing Shape Rendering

**File: `src/components/Canvas/Canvas.tsx`** (shape rendering section)

- Add case for `r.type === 'drawing'`:
- Use Konva `Line` component
- Support `points` array, `stroke` (color), `strokeWidth: 3`
- Enable dragging, selection, deletion like other shapes
- Skip transform (resize/rotate) for MVP

### 5. Keyboard Shortcut

**File: `src/hooks/useKeyboardShortcuts.ts`**

- Add `D` key handler to toggle drawing mode
- Update help modal to show drawing shortcut

### 6. Visual Feedback

**File: `src/components/Canvas/Canvas.tsx`** (status bar)

- Show "Drawing mode: Click and drag to draw, press D to exit" when active
- Change cursor style to crosshair when in drawing mode

## Key Technical Details

- Store points as flat array: `[x1, y1, x2, y2, ...]`
- Fixed stroke width: 3px
- Use default black color initially, editable via properties panel
- No real-time collaboration during drawing (only show final result)
- Bounding box for drawing: calculate from min/max points for `x, y, width, height`

### To-dos

- [ ] Add 'drawing' to CanvasShapeType union in canvas.types.ts
- [ ] Add drawing state management to CanvasContext (isDrawing, currentDrawingPoints)
- [ ] Add 'D' key handler to toggle drawing mode in useKeyboardShortcuts
- [ ] Implement drawing capture logic (mouse down/move/up) in Canvas.tsx
- [ ] Add rendering for completed drawing shapes using Konva Line
- [ ] Add status bar message and cursor style for drawing mode