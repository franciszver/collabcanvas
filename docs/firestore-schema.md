# Firestore Schema Design

## Collections

### `/shapes/{shapeId}`
Persistent shape data - the source of truth for all shape properties.

```typescript
interface ShapeDocument {
  // Core properties
  id: string
  type: 'rect' | 'circle' | 'line' | 'text'
  
  // Position & dimensions
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z: number // z-index for layering
  
  // Visual properties
  fill: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  
  // Text properties (for text shapes)
  text?: string
  fontSize?: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  
  // Metadata
  createdBy: string // userId
  createdAt: Timestamp
  updatedBy: string // userId
  updatedAt: Timestamp
  
  // Document association
  documentId: string
  
  // Collaboration
  isLocked?: boolean
  lockedBy?: string // userId
  lockedAt?: Timestamp
  
  // Comments and Activity Tracking
  comment?: string // Current comment text
  commentBy?: string // userId who added comment
  commentByName?: string // Display name of commenter
  commentAt?: number // Timestamp of last comment update
  history?: Array<{
    type: 'comment' | 'edit'
    // For comments
    text?: string
    // For edits
    action?: string // e.g., "changed fill color", "moved shape"
    details?: string // e.g., "from #FF0000 to #00FF00"
    // Common fields
    by: string // userId
    byName: string // Display name
    at: number // Timestamp
  }> // Limited to last 10 entries
}
```

**Activity Tracking Behavior:**
- Manual comments are added via `comment` field and create a "comment" history entry
- Shape edits automatically create "edit" history entries when properties change
- History is limited to the 10 most recent entries (newest first)
- Tracked changes include: position, size, rotation, fill, stroke, text, fontSize, opacity, z-index

### `/documents/{documentId}`
Document-level metadata and settings.

```typescript
interface DocumentDocument {
  id: string
  title: string
  description?: string
  
  // Canvas settings
  viewport: {
    x: number
    y: number
    scale: number
  }
  
  // Permissions
  ownerId: string
  collaborators: string[] // userIds
  isPublic: boolean
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  lastAccessedAt: Timestamp
  
  // Statistics
  shapeCount: number
  lastShapeId?: string
}
```

### `/workspaces/{workspaceId}`
Workspace-level settings and permissions.

```typescript
interface WorkspaceDocument {
  id: string
  name: string
  description?: string
  
  // Members
  ownerId: string
  members: {
    [userId: string]: {
      role: 'owner' | 'editor' | 'viewer'
      joinedAt: Timestamp
    }
  }
  
  // Settings
  settings: {
    allowPublicDocuments: boolean
    maxCollaborators: number
    defaultPermissions: 'private' | 'workspace' | 'public'
  }
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## Indexes

### Composite Indexes for `/shapes`
- `(documentId, z)` - for layering shapes within a document
- `(documentId, type)` - for filtering shapes by type
- `(documentId, updatedAt)` - for recent changes
- `(createdBy, createdAt)` - for user's shapes

### Composite Indexes for `/documents`
- `(ownerId, updatedAt)` - for user's documents
- `(collaborators, updatedAt)` - for shared documents
- `(isPublic, updatedAt)` - for public documents

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Shapes: users can read/write shapes in documents they have access to
    match /shapes/{shapeId} {
      allow read, write: if request.auth != null && 
        hasDocumentAccess(resource.data.documentId);
    }
    
    // Documents: users can read/write documents they own or collaborate on
    match /documents/{documentId} {
      allow read, write: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         request.auth.uid in resource.data.collaborators);
    }
    
    // Workspaces: users can read/write workspaces they're members of
    match /workspaces/{workspaceId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
  }
  
  // Helper function to check document access
  function hasDocumentAccess(documentId) {
    return exists(/databases/$(database)/documents/documents/$(documentId)) &&
      (get(/databases/$(database)/documents/documents/$(documentId)).data.ownerId == request.auth.uid ||
       request.auth.uid in get(/databases/$(database)/documents/documents/$(documentId)).data.collaborators);
  }
}
```
