<!-- 6fde1f29-6a09-455c-aae0-32ea8b46dcb0 9861abd0-fdb7-45ca-b291-dab1b094df66 -->
# Multi-Workspace Sharing Feature

## Overview

Implement workspace sharing where users can share their canvas with others using the document ID as a share code. Users can navigate between their workspace and shared workspaces via buttons in the header dropdown menu.

## Key Design Decisions

- **Share Code = Document ID**: Use the existing Firestore document ID (no new code generation needed)
- **Access Model**: Full edit access for anyone with the document ID (like Google Docs link sharing)
- **Navigation**: URL-based routing with documentId parameter
- **Visual Indicator**: Simple banner when viewing someone else's workspace
- **Presence**: Use existing presence system (all collaborators visible)

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

Create a dropdown menu component similar to `TemplatesDropdown.tsx` with two main actions:

**Menu Structure:**

- Dropdown button: "Workspace" or workspace icon
- Two menu items:

  1. "Share This Workspace" - shows modal with current document ID
  2. "Go to a Workspace" - shows modal with input field for document ID

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

## Files to Create

1. `src/components/Header/WorkspaceMenu.tsx` - New workspace dropdown menu component

## Files to Modify

1. `src/App.tsx` - Add URL routing, banner, navigation logic, and WorkspaceMenu
2. `src/contexts/CanvasContext.tsx` - Verify `createIfNotExists: true` (likely already set)

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

## Future Enhancements (Not in Scope)

- Revoke access / disable share codes
- Share code expiration
- View-only permissions
- List of accessible workspaces
- Workspace names/titles
- Share via shorter custom codes

### To-dos

- [ ] Add URL-based document routing in App.tsx with query parameter support
- [ ] Create WorkspaceMenu component with share and navigation modals
- [ ] Add banner to show when viewing shared workspace
- [ ] Add WorkspaceMenu to header and wire up navigation functions
- [ ] Add popstate listener for browser back/forward support