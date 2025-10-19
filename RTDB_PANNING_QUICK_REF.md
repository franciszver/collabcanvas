# RTDB Panning - Quick Developer Reference

## 🎯 What Changed

Optimized canvas panning to use Firebase Realtime Database for smooth 60fps updates.

## 📦 New API Functions

### In `src/services/realtime.ts`

```typescript
// Publish viewport (throttled at 60fps)
await publishViewportRtdbThrottled(userId, viewport, documentId)

// Subscribe to viewport updates (cross-tab sync)
const unsubscribe = subscribeToViewportRtdb(userId, (viewport) => {
  // Handle viewport update
})

// Clear viewport when panning ends
await clearViewportRtdb(userId)

// Setup auto-cleanup on disconnect
await setupViewportDisconnectCleanup(userId)
```

## 🏗️ Architecture Flow

```
Pan Start → Local State (0ms) + localStorage (0ms)
         ↓
Pan Move → RTDB Update (16ms throttled)
         ↓
Pan End  → Clear RTDB + Firestore Write (500ms debounced)
```

## 🎨 UX Benefits

- **60fps smooth panning** (was choppy before)
- **Cross-tab sync** (viewport updates across tabs)
- **Instant restore** (localStorage on page load)
- **Single Firestore write** per pan session (was many)

## 🔍 Key Implementation Details

### Three-Layer Persistence

1. **localStorage** - Instant restore (0ms)
2. **RTDB** - Cross-tab sync (16ms throttled)
3. **Firestore** - Durable storage (500ms debounced)

### Throttling Rates

- Viewport: **60fps (16ms)** - entire canvas needs smooth updates
- Drag: **30fps (33ms)** - individual shapes, less critical

### Error Handling

- RTDB failures → Silent retry, continue with local state
- No user-facing errors during panning
- Firestore writes guaranteed via debounce

## 📝 Modified Files

1. `src/services/realtime.ts` - Viewport RTDB functions
2. `src/components/Canvas/Canvas.tsx` - Panning handlers
3. `src/contexts/CanvasContext.tsx` - Viewport state management

## 🧪 Testing Checklist

- [ ] Smooth 60fps panning (no stutter)
- [ ] Cross-tab viewport sync works
- [ ] Page reload restores viewport instantly
- [ ] Only 1 Firestore write per pan session
- [ ] RTDB auto-clears on tab close

## 🚨 Troubleshooting

**Viewport not syncing across tabs?**
- Check RTDB rules allow read/write for `viewport/{userId}`
- Verify user is authenticated

**Panning feels laggy?**
- Check DevTools Performance tab for dropped frames
- Verify RTDB throttling is at 16ms (60fps)

**Firestore writes still too frequent?**
- Verify debounce is set to 500ms in CanvasContext
- Check that panning actually stops between writes

## 💡 Pro Tips

- RTDB viewport data auto-cleans on disconnect
- localStorage fallback ensures instant restore even if RTDB fails
- Debounce cancels on re-pan (only writes when user stops)

---

For detailed implementation notes, see `docs/rtdb-panning-implementation-summary.md`

