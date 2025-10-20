<!-- dd256fc6-8d69-459c-80c2-52909693ad41 8bd8ce18-f295-4697-b577-e9b1761d8f93 -->
# Viewport Image Export Feature

## Overview

Add functionality to export the canvas viewport as a high-quality PNG image, following design tool best practices (clean output without background/grid, accessible UI placement, automatic naming).

## Implementation Approach

### 1. Create Export Component

**File**: `src/components/Header/ExportDropdown.tsx`

- New dropdown component matching existing header dropdown style
- Single "Export as PNG" button with clean, simple UI
- Follow the pattern from `DetailsDropdown.tsx` and `StatsDropdown.tsx`
- Dark theme styling consistent with other dropdowns

### 2. Add Export Utility Function

**File**: `src/utils/canvasExport.ts` (new file)

- Core export logic using Konva Stage's `toDataURL()` method
- Export configuration:
  - **Format**: PNG (supports transparency, lossless)
  - **Content**: Shapes only (exclude background image and grid lines)
  - **Quality**: Use `pixelRatio: 2` for high-quality export
  - **Filename**: `canvas-export-YYYY-MM-DD-HHmmss.png` (timestamp-based)
- Implementation approach:

  1. Clone the shapes layer only (exclude grid and background)
  2. Create temporary Stage with white/transparent background
  3. Export to data URL
  4. Trigger browser download
  5. Clean up temporary elements

### 3. Expose Stage Ref from Canvas

**File**: `src/components/Canvas/Canvas.tsx`

- The Stage ref (`stageRef`) already exists at line 516
- Add it to CanvasContext to make it accessible to export function
- Update `CanvasContextValue` interface to include `getStageRef` method

**File**: `src/contexts/CanvasContext.tsx`

- Add `stageRef` state/ref at provider level
- Add `setStageRef` and `getStageRef` methods to context value
- Pass ref from Canvas component to context

### 4. Integrate Export Button

**File**: `src/App.tsx`

- Add `ExportDropdown` component to header (line ~208, between `StatsDropdown` and `LocateDropdown`)
- Maintain consistent spacing with other header elements

### 5. Add Success Notification

**File**: `src/components/Toast.tsx` (already exists)

- Use existing Toast component to show success message: "Canvas exported successfully"
- Display for 2 seconds after export completes

## Technical Details

### Export Process

```typescript
1. Access Stage ref from CanvasContext
2. Get only the shapes layer (index 1, not grid layer at index 0)
3. Temporarily hide/modify background
4. Generate PNG using stage.toDataURL({ pixelRatio: 2 })
5. Create download link and trigger
6. Show success toast
```

### Why These Choices?

- **PNG format**: Industry standard for design exports, supports transparency
- **Shapes only**: Users want clean exports without UI elements (grid/background are helpers)
- **High DPI (pixelRatio: 2)**: Ensures crisp images on retina displays
- **Auto filename with timestamp**: No prompt needed, prevents naming conflicts
- **Header placement**: Accessible but not intrusive, consistent with app patterns

## Files to Modify

1. `src/components/Header/ExportDropdown.tsx` (new)
2. `src/utils/canvasExport.ts` (new)
3. `src/contexts/CanvasContext.tsx` (modify)
4. `src/components/Canvas/Canvas.tsx` (modify)
5. `src/App.tsx` (modify)

## Benefits

- Clean, professional image exports
- No complex UI or configuration needed
- Follows established design tool patterns
- High-quality output for presentations/sharing

### To-dos

- [ ] Create canvasExport.ts utility with PNG export logic using Konva's toDataURL
- [ ] Add Stage ref access methods to CanvasContext
- [ ] Pass Stage ref to CanvasContext from Canvas component
- [ ] Create ExportDropdown component with matching header styling
- [ ] Add ExportDropdown to App.tsx header