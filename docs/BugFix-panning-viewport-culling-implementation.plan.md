<!-- 33e8c0a8-f7a1-4d23-83f8-43ec02f19889 f85acc16-4741-4b49-8c3e-e23cc49371ef -->
# Viewport Culling Implementation

## Overview

Implement continuous viewport culling that filters shapes during every render, only displaying those visible in the viewport. This runs fast enough (~0.5-1ms) to execute on every frame during panning.

## Implementation Steps

### 1. Create Viewport Culling Utility

**File:** `src/utils/viewportCulling.ts` (new)

Create utility functions to:

- Calculate visible viewport bounds from transform (scale, x, y)
- Add configurable padding (300px) to render slightly off-screen shapes for smooth panning
- Filter shapes by intersection with visible bounds
- Handle edge cases: rotated shapes, different shape types (rect, circle, star, arrow, text)

**Key function signature:**

```typescript
function getVisibleShapes(
  shapes: Rectangle[],
  viewport: ViewportTransform,
  containerWidth: number,
  containerHeight: number,
  padding: number = 300
): Rectangle[]
```

**Algorithm:**

1. Calculate viewport bounds in canvas coordinates (inverse transform)
2. Expand bounds by padding
3. For each shape, check if its bounding box intersects viewport bounds
4. Return filtered array

### 2. Add Memoization

**File:** `src/components/Canvas/Canvas.tsx`

Use `useMemo` to memoize the visible shapes calculation:

- Only recalculate when `rectangles`, `viewport`, or `containerSize` change
- Prevents redundant filtering on unrelated re-renders

**Implementation:**

```typescript
const visibleShapes = useMemo(() => {
  return getVisibleShapes(
    rectangles,
    viewport,
    containerSize.width,
    containerSize.height
  )
}, [rectangles, viewport, containerSize])
```

### 3. Integrate into Shape Rendering Loop

**File:** `src/components/Canvas/Canvas.tsx` (line ~435)

**Current code:**

```typescript
{([...rectangles].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))).map((r: Rectangle) => {
```

**Updated code:**

```typescript
{([...visibleShapes].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))).map((r: Rectangle) => {
```

This simple change means only visible shapes are rendered. The sorting and rendering logic remains unchanged.

### 4. Add Performance Tracking (Optional)

**File:** `src/components/Canvas/Canvas.tsx`

Add metrics to status bar showing:

- Total shapes: X
- Rendered shapes: Y
- (helps validate culling is working)

Update existing status bar to show: `Total: {rectangles.length} shapes ({visibleShapes.length} visible)`

## Edge Cases Handled

### Shape Type Considerations

- **Rectangle/Text:** Simple bounding box check
- **Circle:** Check if circle bounds (x, y, width, height) intersect viewport
- **Triangle/Star:** Use enclosing bounding box
- **Arrow:** Check both endpoints and stroke width

### Rotation Handling

For rotated shapes, use the shape's bounding box (which already accounts for rotation in the Rectangle interface). This is conservative (may include slightly off-screen rotated shapes) but safe and fast.

### Padding Benefits

The 300px padding ensures:

- Shapes smoothly appear during panning (no pop-in)
- Small inaccuracies in bounding box calculations don't cause flickering
- User never sees empty space during normal panning speeds

## Performance Expectations

**Before (1000 shapes):**

- Render time: ~100ms per frame (10 FPS)
- All 1000 shapes rendered regardless of visibility

**After (1000 shapes, typical viewport):**

- Culling time: ~0.5-1ms
- Render time: ~5-10ms per frame (60+ FPS)
- Only ~30-100 shapes rendered (depending on zoom level)

**Expected improvement:** 80-95% reduction in shapes rendered, maintaining smooth 60 FPS panning.

## Testing Approach

1. **Manual visual testing:**

   - Create canvas with 500-1000 shapes spread across large area
   - Pan around and verify smooth performance
   - Verify no shapes disappear incorrectly
   - Zoom in/out and verify culling adapts

2. **Status bar validation:**

   - Check "X visible" count updates as you pan
   - Verify count increases when zooming out, decreases when zooming in

3. **Edge case testing:**

   - Test with rotated shapes
   - Test with different shape types (circles, stars, arrows, text)
   - Test rapid panning
   - Test at extreme zoom levels (very zoomed in/out)

## Files Changed

- `src/utils/viewportCulling.ts` - New file with culling logic
- `src/components/Canvas/Canvas.tsx` - Integration and memoization
- `src/types/canvas.types.ts` - May need ViewportTransform export (already exists)

## Estimated Implementation Time

**45-60 minutes** of focused implementation and testing.

### To-dos

- [ ] Create viewportCulling.ts with getVisibleShapes function and bounding box intersection logic
- [ ] Add useMemo hook in Canvas.tsx to memoize visible shapes calculation
- [ ] Replace rectangles with visibleShapes in the shape rendering loop (line 435)
- [ ] Update status bar to show both total and visible shape counts
- [ ] Test with large shape counts, panning, zooming, and edge cases