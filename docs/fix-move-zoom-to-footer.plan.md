<!-- 1e8536ae-dd6d-4cd7-b625-c7676df7b96d 57a8541a-4bf6-479f-8d5a-e77952076c88 -->
# Move Zoom Controls to Footer

## Problem

The ZoomControls component is currently positioned at `bottom: 48px; right: 16px` which overlaps with the ChatBox (AI chat bot icon) at the same location.

## Solution

Integrate the zoom controls directly into the status bar footer next to the Activity button, converting them from a floating vertical panel to inline horizontal buttons.

## Changes

### 1. Update ZoomControls Component

**File:** `src/components/Canvas/ZoomControls.tsx`

Convert the vertical floating panel into horizontal inline buttons:

- Remove fixed positioning styles (bottom: 48px, right: 16px)
- Change `flexDirection` from `column` to `row`
- Remove outer container styling (border, shadow, borderRadius)
- Update button styles for horizontal inline layout
- Remove border separators between buttons
- Make buttons more compact for footer integration
- Add gap between buttons instead of borders

### 2. Integrate into Canvas Status Bar

**File:** `src/components/Canvas/Canvas.tsx`

In the status bar (around line 1310-1479):

- Remove the standalone `<ZoomControls />` rendering at line 1516-1519
- Add zoom controls to the left side of the status bar, after the Activity button
- Add separator (`<span>•</span>`) before zoom controls
- Pass `containerWidth` and `containerHeight` from `containerSize` state
- Ensure proper spacing with existing footer elements

The zoom controls will appear in this order in the footer:

```
[Selection info] • [Groups] • [Activity] • [Zoom Controls] | [Right side info]
```

### 3. Styling Considerations

- Match footer button style (fontSize: 11px, padding: 2px-4px)
- Use consistent colors with footer (#6B5F54 for text, #D4C5A9 for borders)
- Keep disabled states (#B5A89D)
- Maintain hover effects but adapted for smaller inline buttons
- Remove shadows and heavy borders for cleaner footer integration

## Files Modified

1. `src/components/Canvas/ZoomControls.tsx` - Convert to inline horizontal buttons
2. `src/components/Canvas/Canvas.tsx` - Move rendering location from floating to footer