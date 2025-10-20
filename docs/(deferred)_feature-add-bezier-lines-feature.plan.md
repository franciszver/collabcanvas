<!-- 354d2bb3-1a8e-44d4-8ff9-b139f84902dc ea0ed8f8-63c0-4563-8429-b48d25ccd199 -->
# Add Bezier Line Drawing for Multi-Selected Shapes

## Overview

Enable users to create smooth bezier curves connecting shapes when 2+ shapes are selected by pressing "L" or clicking a toolbar button. The curves are rendered as static shapes with automatically calculated control points.

## Implementation Plan

### 1. Update Shape Types

**File: `src/types/canvas.types.ts`**

- Add `'bezier'` to `CanvasShapeType` union (line 7)
- Add bezier-specific properties to `Rectangle` interface:
- `points?: number[]` - array of coordinates for the bezier curve
- `bezier?: boolean` - flag to indicate bezier rendering

### 2. Create Bezier Curve Generation Utility

**File: `src/utils/bezierHelpers.ts` (new file)**

- Create function `generateBezierCurves(shapes: Rectangle[]): Rectangle[]`
- Chains shapes: shape1 → shape2 → shape3, etc.
- For each pair, calculate center points
- Generate control point(s) for smooth curve (perpendicular offset from midpoint)
- Return array of bezier shape objects with calculated points
- Helper: `calculateShapeCenter(shape: Rectangle): {x: number, y: number}`
- Helper: `calculateBezierControlPoint(start, end): {x, y}` - simple quadratic bezier logic

### 3. Update Keyboard Shortcuts

**File: `src/hooks/useKeyboardShortcuts.ts`**

- Modify the `'l'/'L'` case (lines 168-178):
- Change from `if (isCtrlOrCmd)` to check for multi-selection first
- If no modifier + 2+ shapes selected → create bezier curves
- If Ctrl/Cmd pressed → keep existing lock behavior
- Add dependency on `addRectangle` and `rectangles` to callback

### 4. Add Bezier Rendering to Canvas

**File: `src/components/Canvas/Canvas.tsx`**

- Add bezier shape rendering case after the arrow type (after line 718)
- Use Konva's `<Line>` component with:
- `points={r.points}`
- `stroke={r.fill}`
- `strokeWidth={r.strokeWidth || 3}`
- `lineCap="round"`
- `lineJoin="round"`
- `bezier={true}` (enables Konva's built-in bezier rendering)
- Standard drag/transform handlers adapted for curves

### 5. Add Toolbar Button (Optional Enhancement)

**File: `src/components/Header/Toolbar.tsx` (or create if needed)**

- Add button with bezier curve icon
- Enable only when `selectedIds.size >= 2`
- Call the same bezier generation logic as keyboard shortcut
- Position in toolbar next to other shape tools

### 6. Context Integration

**File: `src/contexts/CanvasContext.tsx`**

- Add method `createBezierLines: () => Promise<void>` to context interface (line 65)
- Implement handler that:
- Gets selected shapes
- Calls `generateBezierCurves()` utility
- Adds resulting bezier shapes via `addRectangle()`
- Export in context value (lines 477-535)

## Key Technical Decisions

**Static vs Dynamic:** Curves are static shapes - once created, they don't move with the original shapes. This is simplest and follows the user's request for maximum simplicity.

**Bezier Type:** Using quadratic bezier (1 control point) for simplicity. Calculated as perpendicular offset from line midpoint.

**Connection Pattern:** Chain pattern - connects shapes in selection order: 1→2→3→4, creating N-1 curves for N shapes.

**Connection Points:** Center-to-center for simplest math. Can be enhanced later with edge anchors.

**Rendering:** Use Konva's built-in `bezier` prop on Line component - no need to manually calculate curve segments.

## Testing Considerations

- Multi-select 2 shapes, press "L", verify curve appears
- Multi-select 3+ shapes, verify chain connection
- Verify curves can be selected, moved, deleted like other shapes
- Verify Ctrl+L still locks shapes (backward compatibility)
- Test with various shape types (circles, rectangles, etc.)

### To-dos

- [ ] Add 'bezier' type to CanvasShapeType and extend Rectangle interface with curve properties
- [ ] Create bezierHelpers.ts utility with curve generation logic and control point calculation
- [ ] Modify useKeyboardShortcuts.ts to handle 'L' key for bezier creation when shapes selected
- [ ] Add bezier shape rendering case in Canvas.tsx using Konva Line component
- [ ] Add createBezierLines method to CanvasContext and expose in context value
- [ ] Add optional toolbar button for bezier creation (if toolbar component exists)