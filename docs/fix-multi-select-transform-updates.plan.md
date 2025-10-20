<!-- 3eed9f52-5767-471d-94cd-c80b17577107 66fc26dd-9a32-4e5f-904f-7abca5f3c55d -->
# Fix Multi-Select Transform Redundant Network Calls

## Problem

During multi-select transform (rotate/resize), individual shape `onTransformEnd` handlers are firing alongside the multi-shape handler, causing N+1 network calls instead of 1 bulk call.

## Solution

Add multi-select check to each individual shape's `onTransformEnd` handler. If `selectedIdsRef.current.size > 1`, skip the individual update and let the multi-shape transform handler (lines 334-412) handle it via bulk update.

## Changes Required

### File: `src/components/Canvas/Canvas.tsx`

Update 6 individual `onTransformEnd` handlers to skip execution when multiple shapes are selected:

1. **Circle transform handler** (~line 730-752)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

2. **Triangle transform handler** (~line 785-807)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

3. **Star transform handler** (~line 831-853)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

4. **Arrow transform handler** (~line 875-897)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

5. **Text transform handler** (~line 921-943)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

6. **Rect transform handler** (~line 962-984)

- Add check at start: `if (selectedIdsRef.current.size > 1) return`

## Technical Details

- The multi-shape transform handler (lines 334-412) already correctly uses `updateMultipleRectangles()` for bulk updates
- Drag operations don't have this issue because `handleDragEnd` already has the multi-select check
- This fix ensures transform operations match the drag behavior

## Expected Result

**Before:** Multi-select transform of 10 shapes = 11 network calls (1 bulk + 10 individual)
**After:** Multi-select transform of 10 shapes = 1 network call (bulk only)

~90% reduction in network calls during multi-select transform operations.