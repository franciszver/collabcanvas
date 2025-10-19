# CollabCanvas Architecture

**Version:** 0.0.71  
**Last Updated:** 2025-10-19

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [Real-Time Collaboration](#real-time-collaboration)
- [Firebase Data Structure](#firebase-data-structure)
- [AI Agent Architecture](#ai-agent-architecture)
- [Authentication Flow](#authentication-flow)
- [Key Design Patterns](#key-design-patterns)
- [Data Flow Patterns](#data-flow-patterns)
- [Performance Optimizations](#performance-optimizations)

---

## System Overview

CollabCanvas is a real-time collaborative canvas application built with React, TypeScript, Firebase, and Konva. The architecture emphasizes:

- **Real-time collaboration** via Firestore and Realtime Database
- **Modular component design** with clear separation of concerns
- **Context-based state management** with custom hooks
- **Service layer abstraction** for Firebase operations
- **AI-powered canvas manipulation** via Firebase Functions and OpenAI

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Components]
        CTX[Context Providers]
        HOOKS[Custom Hooks]
        SERVICES[Service Layer]
    end
    
    subgraph "Firebase Backend"
        AUTH[Firebase Auth]
        FIRESTORE[(Firestore Database)]
        RTDB[(Realtime Database)]
        FUNCTIONS[Cloud Functions]
        HOSTING[Firebase Hosting]
    end
    
    subgraph "External Services"
        GOOGLE[Google OAuth]
        OPENAI[OpenAI API]
    end
    
    UI --> CTX
    CTX --> HOOKS
    HOOKS --> SERVICES
    
    SERVICES --> AUTH
    SERVICES --> FIRESTORE
    SERVICES --> RTDB
    SERVICES --> FUNCTIONS
    
    AUTH --> GOOGLE
    FUNCTIONS --> OPENAI
    
    HOSTING -.serves.-> UI
    
    FIRESTORE -.real-time sync.-> SERVICES
    RTDB -.real-time sync.-> SERVICES
    
    style UI fill:#61dafb
    style FIRESTORE fill:#ffa726
    style RTDB fill:#ffa726
    style FUNCTIONS fill:#ffa726
    style OPENAI fill:#10a37f
```

---

## Component Hierarchy

```mermaid
graph TD
    App[App.tsx]
    
    subgraph "Context Providers"
        AuthCtx[AuthProvider]
        PresenceCtx[PresenceProvider]
        CanvasCtx[CanvasProvider]
    end
    
    subgraph "Layout Components"
        AppLayout[AppLayout]
        ErrorBoundary[ErrorBoundary]
    end
    
    subgraph "Header Components"
        Templates[TemplatesDropdown]
        ShapeSelector[ShapeSelector]
        Stats[StatsDropdown]
        UserMenu[UserMenu]
        Details[DetailsDropdown]
    end
    
    subgraph "Canvas Components"
        Canvas[Canvas]
        Selection[SelectionBounds]
        MultiProps[MultiShapeProperties]
        Groups[GroupsPanel]
        LockInd[LockIndicator]
        LockTooltip[LockTooltip]
        UserCursor[UserCursor]
    end
    
    subgraph "Chat Components"
        ChatBox[ChatBox]
        CommandsWin[CommandsWindow]
    end
    
    subgraph "Auth Components"
        SignIn[SignInButton]
    end
    
    App --> AuthCtx
    AuthCtx --> |user auth| PresenceCtx
    PresenceCtx --> |presence tracking| CanvasCtx
    CanvasCtx --> |canvas state| AppLayout
    
    AppLayout --> ErrorBoundary
    ErrorBoundary --> Header
    ErrorBoundary --> Canvas
    ErrorBoundary --> ChatBox
    
    Header[Header] --> Templates
    Header --> ShapeSelector
    Header --> Stats
    Header --> UserMenu
    Header --> Details
    
    Canvas --> Selection
    Canvas --> MultiProps
    Canvas --> Groups
    Canvas --> LockInd
    Canvas --> LockTooltip
    Canvas --> UserCursor
    
    ChatBox --> CommandsWin
    
    App --> |no user| SignIn
    
    style App fill:#61dafb
    style AuthCtx fill:#4caf50
    style PresenceCtx fill:#4caf50
    style CanvasCtx fill:#4caf50
    style Canvas fill:#2196f3
```

---

## State Management

```mermaid
graph LR
    subgraph "React Context API"
        AuthContext[AuthContext<br/>- user<br/>- isLoading<br/>- signIn/signOut]
        PresenceContext[PresenceContext<br/>- onlineUsers<br/>- cursors<br/>- presence data]
        CanvasContext[CanvasContext<br/>- shapes<br/>- viewport<br/>- selection<br/>- locks]
    end
    
    subgraph "Custom Hooks"
        useAuth[useAuth]
        usePresence[usePresence]
        useCanvas[useCanvas]
        useShapes[useShapes]
        useSelection[useSelection]
        useDocument[useDocument]
        useGroups[useGroups]
        useCanvasCommands[useCanvasCommands]
        useCursorSync[useCursorSync]
        useKeyboardShortcuts[useKeyboardShortcuts]
    end
    
    subgraph "Service Layer"
        authService[auth.ts]
        firestoreService[firestore.ts]
        realtimeService[realtime.ts]
        lockingService[locking.ts]
        groupsService[groups.ts]
        aiService[ai.ts]
    end
    
    AuthContext --> useAuth
    PresenceContext --> usePresence
    CanvasContext --> useCanvas
    
    useCanvas --> useShapes
    useCanvas --> useSelection
    useCanvas --> useDocument
    
    useShapes --> firestoreService
    useDocument --> firestoreService
    useSelection --> lockingService
    useGroups --> groupsService
    useCursorSync --> realtimeService
    useCanvasCommands --> aiService
    
    useAuth --> authService
    usePresence --> realtimeService
    
    style AuthContext fill:#4caf50
    style PresenceContext fill:#4caf50
    style CanvasContext fill:#4caf50
    style firestoreService fill:#ffa726
    style realtimeService fill:#ffa726
```

---

## Real-Time Collaboration

### Synchronization Strategy

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant C1 as Client 1
    participant FS as Firestore
    participant RTDB as Realtime DB
    participant C2 as Client 2
    participant U2 as User 2
    
    Note over U1,U2: Shape Operations (Firestore)
    U1->>C1: Create/Move Shape
    C1->>C1: Optimistic Update
    C1->>FS: Write Shape Data
    FS-->>C2: onSnapshot Event
    C2->>C2: Update Local State
    C2->>U2: Render Shape
    
    Note over U1,U2: Cursor Tracking (RTDB)
    U1->>C1: Move Cursor
    C1->>RTDB: Update Position<br/>(throttled 50ms)
    RTDB-->>C2: onValue Event
    C2->>U2: Render Cursor
    
    Note over U1,U2: Live Dragging (RTDB)
    U1->>C1: Start Drag
    C1->>RTDB: Publish Drag Position
    RTDB-->>C2: Real-time Update
    C2->>U2: Show Ghost Shape
    U1->>C1: End Drag
    C1->>FS: Commit Final Position
    C1->>RTDB: Clear Drag Data
    
    Note over U1,U2: Shape Locking
    U1->>C1: Lock Shape
    C1->>FS: Set lockedBy field
    FS-->>C2: Sync Lock State
    U2->>C2: Try to Edit
    C2->>U2: Show "Locked" indicator
```

### Real-Time Data Paths

```mermaid
graph TD
    subgraph "Firestore (Persistent State)"
        Shapes[(shapes collection)]
        Documents[(documents collection)]
        Groups[(groups collection)]
    end
    
    subgraph "Realtime DB (Ephemeral State)"
        Presence[(presence/<br/>userId)]
        Cursors[(cursors/<br/>userId)]
        LiveDrag[(liveDrag/<br/>shapeId)]
        Selections[(selections/<br/>userId)]
    end
    
    subgraph "Client Operations"
        CreateShape[Create Shape]
        MoveShape[Move Shape]
        LockShape[Lock Shape]
        MoveCursor[Move Cursor]
        DragShape[Drag Shape]
        SelectMulti[Multi-Select]
    end
    
    CreateShape --> Shapes
    MoveShape --> Shapes
    LockShape --> Shapes
    
    MoveCursor --> Cursors
    DragShape --> LiveDrag
    SelectMulti --> Selections
    
    CreateShape -.presence.-> Presence
    
    Shapes -.onSnapshot.-> ClientSub[Client Subscribers]
    Documents -.onSnapshot.-> ClientSub
    Groups -.onSnapshot.-> ClientSub
    
    Cursors -.onValue.-> ClientSub
    LiveDrag -.onValue.-> ClientSub
    Selections -.onValue.-> ClientSub
    
    style Shapes fill:#ffa726
    style Documents fill:#ffa726
    style Groups fill:#ffa726
    style Cursors fill:#ff7043
    style LiveDrag fill:#ff7043
    style Selections fill:#ff7043
```

---

## Firebase Data Structure

### Firestore Collections

```mermaid
erDiagram
    DOCUMENTS ||--o{ SHAPES : contains
    DOCUMENTS ||--o{ GROUPS : contains
    GROUPS ||--o{ SHAPES : includes
    
    DOCUMENTS {
        string id PK
        string title
        string ownerId
        object viewport
        timestamp createdAt
        timestamp updatedAt
    }
    
    SHAPES {
        string id PK
        string documentId FK
        string type "rect|circle|text|triangle|star|arrow"
        number x
        number y
        number width
        number height
        number rotation
        number z
        string fill
        string stroke
        number strokeWidth
        string text
        string createdBy
        timestamp createdAt
        string updatedBy
        timestamp updatedAt
        string lockedBy "nullable"
        string lockedByName "nullable"
        timestamp lockedAt "nullable"
        string groupId "nullable"
    }
    
    GROUPS {
        string id PK
        string documentId FK
        string name
        array shapeIds
        string color
        string createdBy
        timestamp createdAt
        timestamp updatedAt
    }
```

### Realtime Database Structure

```json
{
  "presence": {
    "<userId>": {
      "displayName": "John Doe",
      "color": "#3B82F6",
      "isOnline": true,
      "isActive": true,
      "cursor": {
        "x": 100,
        "y": 200
      },
      "updatedAt": 1729350000000
    }
  },
  "liveDrag": {
    "<shapeId>": {
      "<userId>": {
        "x": 150,
        "y": 250,
        "updatedAt": 1729350000000
      }
    }
  },
  "selections": {
    "<userId>": {
      "shapeIds": ["shape1", "shape2"],
      "color": "#3B82F6",
      "updatedAt": 1729350000000
    }
  }
}
```

---

## AI Agent Architecture

```mermaid
sequenceDiagram
    participant User
    participant ChatBox
    participant CloudFunc as Firebase Function
    participant OpenAI
    participant Validator as Schema Validator
    participant Canvas
    participant Firestore
    
    User->>ChatBox: Type Command<br/>"Create 3x3 grid of circles"
    ChatBox->>CloudFunc: aiCanvasCommand(prompt)
    
    CloudFunc->>OpenAI: Chat Completion<br/>with System Prompt
    Note right of OpenAI: System prompt restricts<br/>to canvas-only JSON
    OpenAI-->>CloudFunc: JSON Response<br/>{action, target, parameters}
    
    CloudFunc->>Validator: Validate against<br/>JSON Schema
    alt Invalid Schema
        Validator-->>CloudFunc: Validation Error
        CloudFunc-->>ChatBox: Error Response
        ChatBox->>User: Show Error
    else Valid Schema
        Validator-->>CloudFunc: Valid
        CloudFunc-->>ChatBox: Command JSON
        ChatBox->>Canvas: Execute Command
        Canvas->>Canvas: Generate Shapes
        Canvas->>Firestore: Batch Write Shapes
        Firestore-->>User: Real-time Sync
        Canvas->>User: Show Success
    end
```

### AI Command Types

```mermaid
graph TD
    AICommands[AI Commands]
    
    AICommands --> Create[Create Actions]
    AICommands --> Manipulate[Manipulate Actions]
    AICommands --> Layout[Layout Actions]
    AICommands --> Complex[Complex Actions]
    
    Create --> CreateShape[Create Shape<br/>- type, color, position]
    Create --> CreateMultiple[Create Multiple<br/>- count, layout]
    
    Manipulate --> SelectShapes[Select Shapes<br/>- by color, type, number]
    Manipulate --> ModifyShapes[Modify Shapes<br/>- color, size, position]
    Manipulate --> RotateShapes[Rotate Shapes<br/>- degrees, direction]
    
    Layout --> GridLayout[Grid Layout<br/>- rows, cols, spacing]
    Layout --> RowLayout[Row Layout<br/>- spacing, alignment]
    Layout --> ColumnLayout[Column Layout<br/>- spacing, alignment]
    
    Complex --> FormGen[Form Generation<br/>- login, signup, contact]
    Complex --> NavbarGen[Navbar Generation<br/>- buttons, items]
    Complex --> TemplateGen[Template Generation<br/>- cards, layouts]
    
    style Create fill:#4caf50
    style Manipulate fill:#2196f3
    style Layout fill:#ff9800
    style Complex fill:#9c27b0
```

---

## Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> AuthLoading: App Starts
    AuthLoading --> Unauthenticated: No Saved Session
    AuthLoading --> Authenticated: Saved Session Found
    
    Unauthenticated --> GoogleOAuth: Click Sign In
    GoogleOAuth --> Redirecting: OAuth Flow
    Redirecting --> Authenticated: Success
    Redirecting --> Unauthenticated: Error/Cancel
    
    Authenticated --> PresenceTracking: Set Online Status
    PresenceTracking --> CleanupService: Start Background Tasks
    
    Authenticated --> SigningOut: Click Sign Out
    SigningOut --> CleanupShapes: Unlock All Shapes
    CleanupShapes --> SetOffline: Set Offline Status
    SetOffline --> Unauthenticated: Complete
    
    Authenticated --> BeforeUnload: Window Close
    BeforeUnload --> CleanupShapes
    
    note right of Authenticated
        User has access to:
        - Canvas operations
        - Real-time collaboration
        - AI commands
        - Shape locking
    end note
```

---

## Key Design Patterns

### 1. Context Provider Pattern

```mermaid
graph TD
    App[App Root]
    
    App --> AuthProvider
    AuthProvider --> PresenceProvider
    PresenceProvider --> CanvasProvider
    CanvasProvider --> Components[Child Components]
    
    AuthProvider -.provides.-> AuthContext[user, isLoading, signIn, signOut]
    PresenceProvider -.provides.-> PresenceContext[onlineUsers, cursors]
    CanvasProvider -.provides.-> CanvasContext[shapes, viewport, selection, locks]
    
    Components --> useAuth[useAuth hook]
    Components --> usePresence[usePresence hook]
    Components --> useCanvas[useCanvas hook]
    
    useAuth -.consumes.-> AuthContext
    usePresence -.consumes.-> PresenceContext
    useCanvas -.consumes.-> CanvasContext
    
    style AuthProvider fill:#4caf50
    style PresenceProvider fill:#4caf50
    style CanvasProvider fill:#4caf50
```

### 2. Service Layer Pattern

```mermaid
graph LR
    subgraph "Components & Hooks"
        Comp[React Components]
        Hook[Custom Hooks]
    end
    
    subgraph "Service Layer"
        AuthSvc[auth.ts]
        FSSvc[firestore.ts]
        RTSvc[realtime.ts]
        LockSvc[locking.ts]
        GroupSvc[groups.ts]
        AISvc[ai.ts]
    end
    
    subgraph "Firebase SDK"
        FirebaseAuth[Firebase Auth]
        Firestore[Firestore SDK]
        RealtimeDB[RTDB SDK]
        Functions[Functions SDK]
    end
    
    Comp --> Hook
    Hook --> AuthSvc
    Hook --> FSSvc
    Hook --> RTSvc
    Hook --> LockSvc
    Hook --> GroupSvc
    Hook --> AISvc
    
    AuthSvc --> FirebaseAuth
    FSSvc --> Firestore
    RTSvc --> RealtimeDB
    LockSvc --> Firestore
    GroupSvc --> Firestore
    AISvc --> Functions
    
    style AuthSvc fill:#42a5f5
    style FSSvc fill:#42a5f5
    style RTSvc fill:#42a5f5
    style LockSvc fill:#42a5f5
    style GroupSvc fill:#42a5f5
    style AISvc fill:#42a5f5
```

### 3. Optimistic Updates Pattern

```mermaid
sequenceDiagram
    participant UI
    participant LocalState
    participant Service
    participant Firebase
    participant OtherClients
    
    UI->>LocalState: User Action<br/>(e.g., move shape)
    LocalState->>LocalState: Update Immediately<br/>(Optimistic)
    LocalState->>UI: Re-render with new state
    
    par Background Sync
        LocalState->>Service: Persist to Backend
        Service->>Firebase: Write Data
        Firebase-->>Service: Success
        Service-->>LocalState: Confirm
    and Real-time Propagation
        Firebase-->>OtherClients: Real-time Update
        OtherClients->>OtherClients: Apply Changes
    end
    
    alt Write Fails
        Firebase-->>Service: Error
        Service-->>LocalState: Revert Change
        LocalState->>UI: Re-render<br/>(back to previous state)
    end
```

### 4. Custom Hooks Pattern

Custom hooks encapsulate business logic and Firebase interactions:

- **useShapes**: Shape CRUD operations + real-time sync
- **useSelection**: Multi-shape selection logic
- **useDocument**: Document metadata management
- **useGroups**: Group operations + subscriptions
- **useCursorSync**: Cursor position broadcasting
- **useCanvasCommands**: AI command execution
- **useKeyboardShortcuts**: Global keyboard event handling

---

## Data Flow Patterns

### Shape Creation Flow

```mermaid
flowchart TD
    User[User Action] --> UI[UI Component]
    UI --> Context[Canvas Context]
    Context --> Hook[useShapes Hook]
    Hook --> Service[Firestore Service]
    Service --> Firebase[(Firestore)]
    
    Firebase --> Snapshot[onSnapshot Listener]
    Snapshot --> Hook2[useShapes Hook<br/>Other Clients]
    Hook2 --> Context2[Canvas Context<br/>Other Clients]
    Context2 --> UI2[UI Re-render<br/>Other Clients]
    
    Hook --> LocalState[Update Local State]
    LocalState --> UI
    
    style User fill:#64b5f6
    style Firebase fill:#ffa726
    style Snapshot fill:#66bb6a
```

### Multi-Selection Flow

```mermaid
flowchart TD
    Input[Keyboard/Mouse Input] --> Selection[useSelection Hook]
    
    Selection --> BoxSelect{Box Selection?}
    BoxSelect -->|Yes| CalcIntersect[Calculate Intersections]
    BoxSelect -->|No| Toggle[Toggle Individual Shape]
    
    CalcIntersect --> FilterLocked[Filter Locked Shapes]
    Toggle --> CheckLocked{Shape Locked?}
    
    CheckLocked -->|Yes| ShowTooltip[Show Lock Tooltip]
    CheckLocked -->|No| UpdateSet[Update selectedIds Set]
    
    FilterLocked --> UpdateSet
    UpdateSet --> Context[Canvas Context]
    Context --> Components[Selected Components]
    
    Components --> SelectionBounds[Selection Bounds Overlay]
    Components --> MultiProps[Multi-Shape Properties Panel]
    
    style Selection fill:#4caf50
    style Context fill:#4caf50
```

---

## Performance Optimizations

### 1. Throttling & Debouncing

```mermaid
graph LR
    subgraph "User Input"
        MouseMove[Mouse Move<br/>~100 events/sec]
        CursorMove[Cursor Update]
        ShapeDrag[Shape Drag]
    end
    
    subgraph "Throttling Layer"
        ThrottleCursor[Throttle 50ms<br/>~20 updates/sec]
        ThrottleDrag[Throttle 16ms<br/>~60 FPS]
    end
    
    subgraph "Network Layer"
        RTDB[Realtime DB Update]
    end
    
    MouseMove --> ThrottleCursor
    CursorMove --> ThrottleCursor
    ShapeDrag --> ThrottleDrag
    
    ThrottleCursor --> RTDB
    ThrottleDrag --> RTDB
    
    style ThrottleCursor fill:#66bb6a
    style ThrottleDrag fill:#66bb6a
```

### 2. Memoization Strategy

- **useMemo**: Expensive calculations (shape intersections, bounds)
- **useCallback**: Event handlers passed to child components
- **React.memo**: Expensive components (UserCursor, LockIndicator)
- **Computed properties**: Selection count, shape statistics

### 3. Batch Operations

- Multiple shape updates batched in single Firestore write
- AI-generated shapes written in batches
- Group operations execute as transactions

### 4. Lazy Loading

- Components load on-demand (ChatBox, GroupsPanel)
- Test utilities separated from production bundle
- Firebase Functions cold start optimization

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18.3.1 | UI framework |
| **Language** | TypeScript 5.9.3 | Type safety |
| **Canvas** | Konva 9.3.16 | Shape rendering |
| **Build Tool** | Vite 7.1.14 | Development & bundling |
| **State** | React Context API | Global state management |
| **Backend** | Firebase 11.10.0 | Platform as a Service |
| **Database** | Firestore | Persistent shape data |
| **Real-time** | Realtime Database | Ephemeral presence data |
| **Auth** | Firebase Auth | Google OAuth |
| **Functions** | Cloud Functions | AI agent backend |
| **AI** | OpenAI GPT-3.5 | Natural language processing |
| **Testing** | Jest 29.7.0 | Unit & integration tests |
| **Linting** | ESLint 9.36.0 | Code quality |

---

## Architecture Principles

### 1. **Separation of Concerns**
- Components focus on presentation
- Hooks encapsulate business logic
- Services handle external integrations
- Contexts manage shared state

### 2. **Single Source of Truth**
- Firebase is the authoritative data source
- Local state mirrors backend state
- Optimistic updates for responsiveness

### 3. **Real-Time First**
- All data changes propagate via subscriptions
- Minimal polling, maximum push notifications
- Presence awareness built-in

### 4. **Type Safety**
- TypeScript throughout
- Strict type checking enabled
- Interface definitions for all data structures

### 5. **Scalability**
- Horizontal scaling via Firebase
- Firestore auto-sharding
- Cloud Functions auto-scaling
- Client-side performance optimizations

### 6. **Security**
- Firebase Security Rules enforce access control
- Authentication required for all operations
- AI agent restricted to canvas commands only
- Input validation at multiple layers

---

## Future Architecture Considerations

### Potential Enhancements

1. **WebRTC for P2P Communication**
   - Direct peer-to-peer cursor sync
   - Reduced latency for real-time updates

2. **CRDT Implementation**
   - Conflict-free replicated data types
   - Better offline support
   - Eventual consistency guarantees

3. **WebSocket Fallback**
   - Custom WebSocket server for specialized use cases
   - Fine-grained control over real-time updates

4. **Edge Functions**
   - Move AI processing closer to users
   - Reduced latency for global users

5. **Service Workers**
   - Offline capability
   - Background sync
   - Push notifications

6. **GraphQL API**
   - More flexible data fetching
   - Reduced over-fetching
   - Better caching strategies

---

## Related Documentation

- [Product Requirements (PRD)](docs/prd.md)
- [Firestore Schema](docs/firestore-schema.md)
- [AI Integration PRD](docs/ai-integration-prd.md)
- [Multi-Selection Implementation](MULTI_SELECTION_IMPLEMENTATION_SUMMARY.md)
- [README](README.md)

---

**Maintained by:** CollabCanvas Team  
**Architecture Version:** 1.0.0  
**Application Version:** 0.0.71

