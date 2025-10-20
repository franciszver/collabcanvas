<!-- 8a814094-273b-48b6-8828-43d14a07e150 93691084-5882-4936-a1c5-895197f56e38 -->
# Offline Queue MVP Implementation

## Overview

Enable users to work offline with automatic sync on reconnect. Simple implementation with in-memory queue, no localStorage persistence, no retry mechanism.

## Scope

### Included

- Offline/online detection
- Offline banner with pending count
- In-memory queue for shape operations
- Auto-sync on reconnect
- Success toast ("X changes synced")
- Failure toast with list of failed items

### Excluded

- LocalStorage persistence (queue lost on refresh)
- Conflict detection (last-write-wins)
- Manual retry button
- Auto-retry of failures
- Per-shape visual indicators
- Connection status indicator

## User Experience

### Normal Flow

1. User goes offline → Banner appears: "⚠️ Offline (0 pending)"
2. User edits shapes → Banner updates: "⚠️ Offline (3 pending)"
3. User reconnects → Banner disappears
4. Toast: "✅ 3 changes synced"

### Failure Flow

1. User reconnects → Some changes fail to sync
2. Toast: "⚠️ 3 synced, 2 failed"
3. Expandable list shows:

   - Rectangle ABC (network error)
   - Circle DEF (permission denied)

4. Failed items are discarded (not retried)

## Implementation Steps

### Step 1: Online Status Detection (10 min)

**File:** `src/hooks/useOnlineStatus.ts` (NEW)

Create simple hook using browser APIs:

```typescript
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}
```

### Step 2: Offline Queue Hook (30 min)

**File:** `src/hooks/useOfflineQueue.ts` (NEW)

In-memory queue that tracks pending operations:

```typescript
interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  shapeId: string
  data: any // Shape data or updates
  timestamp: number
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedOperation[]>([])
  const isOnline = useOnlineStatus()
  
  // Add to queue
  const enqueue = (type, shapeId, data) => {...}
  
  // Process queue on reconnect
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue()
    }
  }, [isOnline])
  
  // Process all items, collect successes/failures
  const processQueue = async () => {
    const results = { success: [], failed: [] }
    
    for (const op of queue) {
      try {
        await executeOperation(op)
        results.success.push(op)
      } catch (error) {
        results.failed.push({ op, error })
      }
    }
    
    // Clear entire queue (discard failures)
    setQueue([])
    
    // Show toast with results
    showSyncResults(results)
  }
  
  return { queue, enqueue, queueCount: queue.length }
}
```

### Step 3: Modify useShapes Hook (20 min)

**File:** `src/hooks/useShapes.ts` (MODIFY)

Integrate offline queue into existing shape operations:

1. Import useOfflineQueue
2. In `addShape`: Check if offline, enqueue instead of Firestore write
3. In `updateShapeHandler`: Check if offline, enqueue instead of Firestore write
4. In `deleteShapeHandler`: Check if offline, enqueue instead of Firestore write
5. Keep optimistic updates (shapes appear immediately in UI)
```typescript
const { queue, enqueue, queueCount } = useOfflineQueue()
const isOnline = useOnlineStatus()

const addShape = useCallback(async (shape: Rectangle) => {
  // Optimistic update
  setShapes(prev => [...prev, shape])
  
  if (!isOnline) {
    enqueue('create', shape.id, shape)
    return
  }
  
  // Normal online flow
  await createShape(...)
}, [isOnline, enqueue])
```


### Step 4: Offline Banner Component (10 min)

**File:** `src/components/Layout/OfflineBanner.tsx` (NEW)

**File:** `src/components/Layout/OfflineBanner.css` (NEW)

Simple banner at top of screen:

```tsx
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const { queueCount } = useOfflineQueue()
  
  if (isOnline) return null
  
  return (
    <div className="offline-banner">
      <span>⚠️ Offline</span>
      {queueCount > 0 && <span>({queueCount} pending)</span>}
    </div>
  )
}
```

CSS: Yellow/orange background, fixed top position, z-index 10000

### Step 5: Toast Notifications (15 min)

**File:** Modify existing Toast component OR create simple one

Two toast types:

**Success:**

```
✅ 3 changes synced
```

**Partial/Full Failure:**

```
⚠️ 3 synced, 2 failed

Failed to sync:
• Rectangle (network error)
• Circle (permission denied)
```

Show for 8 seconds, auto-dismiss.

### Step 6: Integration (10 min)

**File:** `src/App.tsx` (MODIFY)

Add OfflineBanner to layout:

```tsx
<>
  <OfflineBanner />
  {/* existing app content */}
</>
```

### Step 7: Type Definitions (5 min)

**File:** `src/types/canvas.types.ts` (MODIFY if needed)

Add any needed types for queue operations.

## Testing Checklist

- [ ] Go offline (Chrome DevTools), create shape, go online → syncs
- [ ] Go offline, update shape, go online → syncs
- [ ] Go offline, delete shape, go online → syncs
- [ ] Go offline, make 5 changes, go online → all sync
- [ ] Banner shows correct pending count
- [ ] Toast shows success message
- [ ] Simulate failure (disconnect Firebase) → toast shows failures
- [ ] Refresh while offline → queue is lost (expected)

## Limitations (Acceptable for MVP)

1. **No persistence**: Queue lost on refresh (use localStorage in v2)
2. **Last-write-wins**: No conflict detection (add in v2)
3. **No retry**: Failed items discarded (user aware via toast)
4. **In-memory only**: Limited by browser session

## Files Summary

**New Files (3):**

- `src/hooks/useOnlineStatus.ts`
- `src/hooks/useOfflineQueue.ts`
- `src/components/Layout/OfflineBanner.tsx`
- `src/components/Layout/OfflineBanner.css`

**Modified Files (2-3):**

- `src/hooks/useShapes.ts`
- `src/App.tsx`
- `src/components/Toast.tsx` (or existing toast component)

**Total Time: ~80 minutes**

### To-dos

- [ ] Create useOnlineStatus hook for offline/online detection
- [ ] Create useOfflineQueue hook with in-memory queue and auto-sync
- [ ] Modify useShapes to integrate offline queue for create/update/delete
- [ ] Create OfflineBanner component with pending count
- [ ] Add toast notifications for sync success/failure with list
- [ ] Integrate OfflineBanner into App.tsx layout
- [ ] Test complete offline/online flow with DevTools