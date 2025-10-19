<!-- cf370baf-d277-436d-a725-2cf80e843281 bad9090b-ee78-4774-b8d4-9a412cec39c1 -->
# Pan/Zoom Controls Implementation

## Overview

Add a floating control panel in the bottom-right corner with buttons for zooming in/out, displaying current zoom level, resetting to 100%, and fitting all shapes in view.

## Implementation Steps

### 1. Create ZoomControls Component

**File:** `/home/ciscodg/main-collabcanvas/src/components/Canvas/ZoomControls.tsx`

Create a new component with the following functionality:

- Display current zoom percentage (clickable to reset to 100%)
- Zoom in button (+) - increases zoom by 20%
- Zoom out button (-) - decreases zoom by 20%
- Fit to screen button (⊕) - calculates bounding box of all shapes and fits them in view with padding

**Key Features:**

- Zoom operations centered on viewport center for smooth UX
- Respect MIN_SCALE (0.2) and MAX_SCALE (3) from constants
- Disable buttons when at zoom limits
- Hover states and tooltips
- Match existing UI design (white background, #D4C5A9 borders, earthy color palette)

**Positioning:**

- Fixed position: bottom 48px, right 16px
- Z-index 30 (above canvas, below modals)
- Above status bar with proper spacing

### 2. Integrate into Canvas Component

**File:** `/home/ciscodg/main-collabcanvas/src/components/Canvas/Canvas.tsx`

- Import the ZoomControls component
- Add component at the end of the Canvas component's JSX (before closing div)
- Pass containerWidth and containerHeight as props from existing containerSize state

### 3. Styling Details

- Vertical stack layout with flexbox
- White background (#FFFFFF) with subtle shadow
- Border color: #D4C5A9
- Hover state: #F0ECE3 background
- Disabled state: #B5A89D text color
- Fit button accent color: #5B8FA3

## Technical Details

**Zoom In/Out Logic:**

- Calculate mouse point relative to center of viewport
- Apply scale transformation
- Adjust x/y position to maintain center point

**Fit to Screen Logic:**

- If no shapes exist, reset to default view
- Calculate bounding box (min/max x/y) of all shapes
- Add 10% padding on all sides
- Calculate scale to fit content within viewport
- Center the content in viewport

## Files Modified

1. `/home/ciscodg/main-collabcanvas/src/components/Canvas/ZoomControls.tsx` (new file)
2. `/home/ciscodg/main-collabcanvas/src/components/Canvas/Canvas.tsx` (import and render component)

## Dependencies

Uses existing:

- CanvasContext (viewport, setViewport, rectangles)
- Constants (MIN_SCALE, MAX_SCALE, INITIAL_SCALE)
- No new npm packages required