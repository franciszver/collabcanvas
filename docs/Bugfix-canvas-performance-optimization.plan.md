<!-- 9cc088f6-e3a1-49c0-a9c9-0f7617c95276 a60ffd0b-7427-4317-a614-6cc6ac4fe8d3 -->
# Canvas Performance Optimization

## Overview

Implement scalable performance optimizations following best practices from production collaborative canvas tools (Figma, Miro, FigJam). These optimizations ensure smooth performance regardless of shape count.

## Core Optimizations

### 1. Viewport Culling System

**File:** `src/utils/viewportCulling.ts` (new)

Only render shapes visible in the current viewport (frustum culling):

- Calculate visible bounds from viewport transform (scale, x, y)
- Add configurable padding (~200-400px) to render slightly off-screen shapes for smooth panning
- Filter shapes by intersection with visible bounds before rendering
- Memoize culling calculations to avoid recalculation on every render
- Handle edge cases: partially visible shapes, rotated shapes, grouped shapes

**Why:** Fundamental optimization used by all major canvas tools. Prevents rendering thousands of off-screen shapes.

### 2. Spatial Indexing with Quadtree

**File:** `src/utils/spatialIndex.ts` (new)

Implement spatial data structure for O(log n) queries instead of O(n):

- Build quadtree from shape positions (subdivide space into quadrants)
- Query for viewport intersections efficiently
- Use for: viewport culling, selection box queries, nearest neighbor searches
- Rebuild strategy: debounce tree rebuilds during rapid shape updates (300ms)
- Balance tree depth vs query performance (max depth: 8 levels)

**Why:** Industry standard for spatial queries. Essential for scaling beyond hundreds of shapes.

### 3. Konva Rendering Optimizations

**File:** `src/components/Canvas/Canvas.tsx`

Apply Konva-specific performance flags and techniques:

- Verify `perfectDrawEnabled={false}` on all shapes (pixel-perfect not needed)
- Verify `shadowForStrokeEnabled={false}` on all shapes (shadow rendering expensive)
- Ensure `listening={false}` on decorative layers (grid, selection overlay)
- Use `batchDraw()` instead of `draw()` when updating multiple shapes
- Consider layer separation by update frequency (static vs dynamic shapes)
- Avoid unnecessary `getLayer()?.batchDraw()` calls

**Why:** Konva-specific optimizations following library best practices. Low-hanging fruit with significant impact.

### 4. React Rendering Optimizations

**Files:** `src/components/Canvas/Canvas.tsx`, `src/components/Canvas/ShapeRenderer.tsx` (new)

Prevent unnecessary React re-renders:

- Extract individual shape rendering to memoized `ShapeRenderer` component
- Use `React.memo()` with custom comparison function (compare only relevant props)
- Implement `useMemo` for expensive computations (filtered shapes, bounds calculations)
- Ensure `useCallback` stability for event handlers passed to Konva components
- Profile and optimize the monolithic Canvas component (currently 1600+ lines)

**Why:** React re-renders the entire shape list on any state change. Memoization prevents wasted work.

### 5. Optimized Drag Performance

**File:** `src/components/Canvas/Canvas.tsx`

Improve multi-shape drag performance:

- Current approach updates state on every drag move - optimize this
- Apply visual transforms during drag without updating shape data
- Only commit final positions to Firestore on dragEnd
- Batch position updates for multi-shape selections (single write)
- Ensure RTDB throttling is appropriate (currently 16ms, verify this is optimal)

**Why:** Dragging currently triggers full React re-renders. Transform-based approach much smoother.

### 6. Level of Detail (LOD) System

**File:** `src/utils/lodSystem.ts` (new)

Adaptive rendering based on zoom level:

- Define LOD levels: LOW (scale < 0.3), MEDIUM (0.3-1.0), HIGH (> 1.0)
- LOW: Simplified rendering (skip text, reduce strokes, skip small shapes)
- MEDIUM: Normal rendering with some optimizations
- HIGH: Full detail rendering
- Apply LOD per shape based on viewport scale

**Why:** Standard technique in graphics applications. Viewing overview shouldn't render all details.

### 7. Performance Monitoring

**Files:** `src/utils/performanceMonitor.ts` (enhance existing), `src/components/Canvas/PerformanceOverlay.tsx` (new)

Add instrumentation to measure and validate improvements:

- Extend existing `PerformanceMonitor` class with FPS tracking
- Monitor: shape count (total/visible/rendered), render time, memory
- Optional dev overlay showing real-time metrics (toggle with keyboard shortcut)
- Log performance warnings to console when thresholds exceeded
- Export performance API for integration tests

**Why:** Can't optimize what you don't measure. Validates improvements and catches regressions.

### 8. Lazy Shape Loading (Optional/Future)

**File:** `src/hooks/useShapes.ts`

Progressive data loading for very large documents:

- Current approach loads all shapes on mount via Firestore subscription
- For future scaling: implement pagination or viewport-based queries
- Firestore compound queries: WHERE x > minX AND x < maxX
- Requires Firestore index on x, y coordinates

**Why:** Future-proofing for documents with 10k+ shapes. Not needed immediately but plan architecture for it.

## Implementation Priority

### Phase 1: Foundation (High Impact, Low Risk)

1. **Viewport Culling** - Immediate 80-90% rendering reduction
2. **React Memoization** - Quick wins, prevents wasted re-renders
3. **Konva Optimizations** - Verify existing flags, add batching

### Phase 2: Advanced Optimizations

4. **Spatial Indexing** - Foundational for efficient queries
5. **Optimized Dragging** - Significant UX improvement
6. **Performance Monitoring** - Validation infrastructure

### Phase 3: Polish

7. **LOD System** - Further optimization for zoom interactions
8. **Lazy Loading** - Future-proofing (evaluate need first)

## Performance Best Practices Applied

### 1. Virtualization Pattern

Only render what's visible (viewport culling). Used by: Figma, VS Code, Twitter feed.

### 2. Spatial Partitioning

Use data structures optimized for spatial queries (quadtree). Used by: game engines, CAD tools, mapping applications.

### 3. Level of Detail

Reduce fidelity when zoomed out. Used by: Google Maps, 3D modeling tools, Figma.

### 4. Memoization

Cache expensive computations and prevent redundant work. Used by: all modern React apps.

### 5. Batching

Group updates to reduce overhead. Used by: React (automatic batching), databases (transactions).

### 6. Transform-based Manipulation

Apply visual updates immediately, persist later. Used by: Figma, Sketch, Adobe XD.

### 7. Throttling/Debouncing

Rate-limit expensive operations. Used by: search inputs, scroll handlers, resize handlers.

## Validation Strategy

### Baseline Metrics (Current State)

- Create test document with varied shape counts: 50, 100, 500, 1000
- Measure: FPS during pan, drag latency, initial load time, memory usage
- Document baseline for comparison

### Incremental Validation

- Apply each optimization independently
- Measure performance delta
- Ensure no regression in collaborative features
- Profile with React DevTools and browser Performance tab

### Acceptance Criteria

- Maintain 60 FPS during panning (regardless of shape count)
- Drag latency < 16ms (one frame)
- No visible lag during zoom operations
- Initial render time scales sub-linearly with shape count
- All collaborative features work correctly (cursor sync, live drag, locking)

## Collaborative Features Preservation

All optimizations must maintain existing functionality:

- Real-time cursor tracking via RTDB
- Live drag position updates via RTDB (throttled)
- Shape locking indicators and behavior
- Multi-user selection synchronization
- Optimistic UI updates with Firestore sync
- Cross-tab viewport sync

## Edge Cases & Considerations

### Viewport Culling Edge Cases

- Shapes partially outside viewport (include with padding)
- Very large shapes spanning entire viewport
- Rotated shapes (bounding box calculation)
- Grouped shapes (check group bounds, not individual)

### Performance Edge Cases

- Rapid zoom in/out (debounce expensive recalculations)
- Mass shape creation (batch render, not incremental)
- Simultaneous multi-user editing (existing throttling should handle)
- Tab switching (pause expensive operations when hidden)

### Data Structure Edge Cases

- Empty canvas (handle gracefully, no division by zero)
- All shapes at same position (quadtree degeneracy)
- Canvas bounds exceeded (clamp or expand dynamically)

## Code Quality Standards

- Add TypeScript types for all new utilities
- Write unit tests for pure functions (culling, spatial index)
- Add integration tests for performance-critical paths
- Document performance characteristics in JSDoc comments
- Use existing `performance.ts` utilities where applicable
- Follow existing code style and patterns

## AI Chatbot Compatibility

**All optimizations are fully compatible with AI chatbot functionality.** In fact, they will improve AI performance:

### How Each Optimization Affects AI

1. **Viewport Culling**

- ✅ No impact on AI shape creation/manipulation
- ✅ AI-created shapes render faster when in viewport
- ✅ Batch shape creation (grids, forms) benefits from culling

2. **Spatial Indexing**

- ✅ Improves AI queries like "select all blue circles"
- ✅ Faster proximity-based operations
- ✅ Better performance for layout commands on existing shapes

3. **React Memoization**

- ✅ AI batch operations trigger fewer re-renders
- ✅ Faster UI updates when AI creates multiple shapes
- ✅ No functional changes to AI commands

4. **Konva Optimizations**

- ✅ AI-generated shapes render more efficiently
- ✅ Batch shape creation benefits from batchDraw()
- ✅ No impact on AI logic, only rendering

5. **Optimized Dragging**

- ✅ N/A - AI sets positions directly, doesn't drag
- ✅ No impact on AI operations

6. **LOD System**

- ⚠️ Minor consideration: AI-created shapes may render simplified when zoomed out
- ✅ This is expected behavior and doesn't affect functionality
- ✅ AI commands still create full-detail shapes

7. **Performance Monitoring**

- ✅ Helpful for debugging AI performance
- ✅ Can track AI batch operation efficiency

### AI Batch Operations Enhanced

The AI currently creates shapes via `addShape()` in loops. These optimizations will:

- Reduce render lag when AI creates 10+ shapes at once
- Make grid/form generation feel more responsive
- Allow AI to create larger layouts without performance degradation

### No Breaking Changes

- AI command interface unchanged
- All AI functions (`applyCanvasCommand`) work identically
- Shape creation/manipulation APIs remain the same
- Firestore write patterns unchanged

### Testing AI Commands

During validation, we'll test:

- AI-generated grids (3x3, 5x5, 10x10)
- AI-generated forms (login, signup, contact)
- AI-generated navbars with multiple items
- AI shape selection and manipulation commands
- Verify no regression in AI batch operations

## Questions Before Starting

1. **Scope confirmation:** Should we implement all phases, or start with Phase 1 and validate?
2. **Performance targets:** Are the general best practices sufficient, or do you have specific FPS/latency requirements?
3. **Testing:** Do you want automated performance tests, or manual validation acceptable?
4. **Dev tools:** Should performance overlay be always available (dev mode) or behind feature flag?
5. **Breaking changes:** Any concerns about changing render behavior (viewport culling might affect edge cases)?

### To-dos

- [ ] Implement viewport culling utility with configurable padding and memoization
- [ ] Integrate viewport culling into Canvas.tsx shape rendering loop
- [ ] Add React.memo and useMemo optimizations to Canvas component
- [ ] Extract ShapeRenderer component with optimized memoization
- [ ] Verify and enhance Konva performance flags across all shape types
- [ ] Implement quadtree spatial indexing structure
- [ ] Replace linear shape queries with quadtree lookups
- [ ] Optimize multi-shape dragging with transform-based updates
- [ ] Create performance monitoring utilities and optional dev overlay
- [ ] Implement progressive rendering hook for large shape counts
- [ ] Add level-of-detail rendering based on zoom scale
- [ ] Create test scenarios and validate performance improvements