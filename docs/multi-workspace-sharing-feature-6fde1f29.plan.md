<!-- 6fde1f29-6a09-455c-aae0-32ea8b46dcb0 f1519d2c-cfa8-4338-900f-814d887f7d87 -->
# Multi-Workspace Sharing Feature

## Overview

Implement workspace sharing where users can share their canvas with others using the document ID as a share code. Users can navigate between their workspace and shared workspaces via buttons in the header dropdown menu. Additionally, users can save/load workspaces as JSON files and export the viewport as an image.

## Key Design Decisions

- **Share Code = Document ID**: Use the existing Firestore document ID (no new code generation needed)
- **Access Model**: Full edit access for anyone with the document ID (like Google Docs link sharing)
- **Navigation**: URL-based routing with documentId parameter
- **Visual Indicator**: Simple banner when viewing someone else's workspace
- **Presence**: Use existing presence system (all collaborators visible)
- **Save/Load**: Export all shapes + groups to JSON (no metadata); ask user to replace or merge on load
- **Image Export**: Export viewport at current zoom with white background

## Implementation Steps

### 1. Add URL-based Document Routing

**File: `src/App.tsx`**

Currently, documentId is hardcoded to `'default-document'`. Change to use URL parameters:

```typescript
// Replace line 23:
const documentId = 'default-document'

// With:
const [currentDocumentId, setCurrentDocumentId] = useState(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('doc') || `${user?.id || 'default'}-workspace`
})
```

- Use URL query parameter `?doc=<documentId>` to track current workspace
- Default to user's own workspace: `userId-workspace`
- Update URL when switching workspaces using `window.history.pushState()`

### 2. Create WorkspaceMenu Component

**New File: `src/components/Header/WorkspaceMenu.tsx`**

Create a dropdown menu component similar to `TemplatesDropdown.tsx` with five main actions:

**Menu Structure:**

- Dropdown button: "Workspace" or workspace icon
- Five menu items:
  1. "Share This Workspace" - shows modal with current document ID
  2. "Go to a Workspace" - shows modal with input field for document ID
  3. "Save Workspace" - exports workspace to JSON file
  4. "Load Workspace" - imports workspace from JSON file
  5. "Export Viewport as Image" - downloads visible canvas area as PNG

**Share Modal:**

```typescript
- Display current documentId in a read-only input field
- "Copy" button to copy to clipboard
- Shows message: "Share this code with others to collaborate"
```

**Go To Workspace Modal:**

```typescript
- Input field for entering document ID
- "Go" button to navigate
- Validation: non-empty string
- On submit: navigate to ?doc=<enteredId>
```

### 3. Add Visual Indicator for Shared Workspaces

**File: `src/App.tsx`**

Add a banner above the header when viewing someone else's workspace:

```typescript
// Check if current workspace belongs to current user
const isOwnWorkspace = currentDocumentId.startsWith(user?.id || '')

// Render banner conditionally
{!isOwnWorkspace && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#FEF3C7',
    color: '#92400E',
    padding: '8px',
    textAlign: 'center',
    zIndex: 101,
    fontSize: '14px',
  }}>
    Viewing a shared workspace
  </div>
)}
```

Adjust header top position when banner is visible.

### 4. Update Header to Include WorkspaceMenu

**File: `src/App.tsx`** (Header section, around line 182)

Add the new WorkspaceMenu component:

```typescript
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <WorkspaceMenu 
    currentDocumentId={currentDocumentId}
    onNavigate={setCurrentDocumentId}
  />
  <TemplatesDropdown documentId={documentId} />
  <ShapeSelector />
  <StatsDropdown />
  <UserMenu />
</div>
```

### 5. Ensure Document Auto-Creation

**File: `src/contexts/CanvasContext.tsx`**

Verify that `createIfNotExists` is set to `true` in the `useDocument` hook call so that accessing a non-existent document ID creates it automatically.

Current call around line 88:

```typescript
const { document, isLoading: isDocLoading } = useDocument({
  documentId,
  createIfNotExists: true, // Ensure this is true
})
```

### 6. Add Navigation Helper Functions

**File: `src/App.tsx`**

Add helper functions for workspace navigation:

```typescript
const navigateToWorkspace = (docId: string) => {
  setCurrentDocumentId(docId)
  window.history.pushState({}, '', `?doc=${docId}`)
}

const navigateToMyWorkspace = () => {
  const myWorkspaceId = `${user?.id}-workspace`
  navigateToWorkspace(myWorkspaceId)
}
```

### 7. Handle Browser Back/Forward

**File: `src/App.tsx`**

Add popstate event listener to handle browser navigation:

```typescript
useEffect(() => {
  const handlePopState = () => {
    const params = new URLSearchParams(window.location.search)
    const docId = params.get('doc') || `${user?.id}-workspace`
    setCurrentDocumentId(docId)
  }
  
  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [user])
```

### 8. Implement Save Workspace Feature

**File: `src/components/Header/WorkspaceMenu.tsx`**

Add "Save Workspace" button that exports all shapes and groups to a JSON file.

**Design:**
- Save ALL shapes in the document
- Include groups data
- Do NOT include metadata (timestamps, user IDs)
- JSON format: `{ version, shapes, groups, exportedAt }`

**Implementation:**
```typescript
const handleSaveWorkspace = async () => {
  const shapesQuery = query(collection(db, 'shapes'), where('documentId', '==', currentDocumentId))
  const shapesSnapshot = await getDocs(shapesQuery)
  const shapes = shapesSnapshot.docs.map(doc => doc.data())
  
  const groupsQuery = query(collection(db, 'groups'), where('documentId', '==', currentDocumentId))
  const groupsSnapshot = await getDocs(groupsQuery)
  const groups = groupsSnapshot.docs.map(doc => doc.data())
  
  const saveData = { version: '1.0', shapes, groups, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workspace-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

### 9. Implement Load Workspace Feature

**File: `src/components/Header/WorkspaceMenu.tsx`**

Add "Load Workspace" button that imports shapes and groups from a JSON file.

**Design:**
- Ask user: "Replace all shapes?" or "Add to existing?"
- If replace: delete all current shapes and groups first
- If merge: generate new IDs to avoid conflicts
- Import shapes with current documentId and user metadata

**Implementation:**
```typescript
const handleLoadWorkspace = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (!data.shapes || !Array.isArray(data.shapes)) {
      alert('Invalid workspace file')
      return
    }
    
    const shouldReplace = window.confirm(
      'Replace all existing shapes?\n\nOK = Replace everything\nCancel = Add to existing'
    )
    
    if (shouldReplace) {
      const currentShapes = await getDocs(query(collection(db, 'shapes'), where('documentId', '==', currentDocumentId)))
      await Promise.all(currentShapes.docs.map(doc => deleteDoc(doc.ref)))
      
      const currentGroups = await getDocs(query(collection(db, 'groups'), where('documentId', '==', currentDocumentId)))
      await Promise.all(currentGroups.docs.map(doc => deleteDoc(doc.ref)))
    }
    
    for (const shape of data.shapes) {
      const newId = shouldReplace ? shape.id : `${shape.id}-${Date.now()}`
      await createShape({ ...shape, id: newId, documentId: currentDocumentId, createdBy: user.id, updatedBy: user.id })
    }
    
    if (data.groups) {
      for (const group of data.groups) {
        await createGroup(currentDocumentId, group.shapeIds, user.id, user.displayName)
      }
    }
    
    alert('Workspace loaded!')
  }
  
  input.click()
}
```

### 10. Implement Export Viewport as Image

**File: `src/components/Canvas/Canvas.tsx` and `src/contexts/CanvasContext.tsx`**

Add image export functionality that captures the visible canvas area.

**Design:**
- Export at current zoom level (what user sees)
- White background
- PNG format

**Implementation Steps:**

1. Add to CanvasContext interface:
```typescript
exportViewportImage: () => void
```

2. Implement in Canvas component:
```typescript
const handleExportImage = useCallback(() => {
  if (!stageRef.current) return
  
  const stage = stageRef.current
  const dataURL = stage.toDataURL({ pixelRatio: 1 })
  
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = stage.width()
    canvas.height = stage.height()
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    
    const link = document.createElement('a')
    link.download = `viewport-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = dataURL
}, [])
```

3. Expose via Context and call from WorkspaceMenu

## Files to Create

1. `src/components/Header/WorkspaceMenu.tsx` - New workspace dropdown menu component

## Files to Modify

1. `src/App.tsx` - Add URL routing, banner, navigation logic, and WorkspaceMenu
2. `src/contexts/CanvasContext.tsx` - Verify `createIfNotExists: true`; add `exportViewportImage` to context
3. `src/components/Canvas/Canvas.tsx` - Implement image export functionality

## Testing Checklist

- [ ] User can view their share code in WorkspaceMenu
- [ ] Copy button successfully copies document ID to clipboard
- [ ] User can enter a valid document ID and navigate to it
- [ ] Banner appears when viewing someone else's workspace
- [ ] Banner does not appear when viewing own workspace
- [ ] Browser back/forward buttons work correctly
- [ ] URL updates when switching workspaces
- [ ] Direct URL access works (e.g., `?doc=abc123`)
- [ ] Default workspace is user-specific (userId-workspace)
- [ ] Presence shows all collaborators correctly
- [ ] Both users can edit shapes simultaneously
- [ ] Save workspace exports JSON with shapes and groups
- [ ] Load workspace shows replace/merge dialog
- [ ] Load workspace (replace) clears existing shapes
- [ ] Load workspace (merge) adds to existing shapes
- [ ] Export viewport downloads PNG with white background
- [ ] Exported image matches current zoom level

## Future Enhancements (Not in Scope)

- Revoke access / disable share codes
- Share code expiration
- View-only permissions
- List of accessible workspaces
- Workspace names/titles
- Share via shorter custom codes
- Export at different resolutions
- Export with transparent background option
- Batch workspace operations

### To-dos

- [ ] Add URL-based document routing in App.tsx with query parameter support
- [ ] Create WorkspaceMenu component with share, navigation, save, load, and export modals
- [ ] Add banner to show when viewing shared workspace
- [ ] Add WorkspaceMenu to header and wire up navigation functions
- [ ] Add popstate listener for browser back/forward support
- [ ] Implement save workspace to JSON file functionality
- [ ] Implement load workspace from JSON file with replace/merge dialog
- [ ] Implement export viewport as PNG image with white background