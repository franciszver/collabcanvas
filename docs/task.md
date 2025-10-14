# CollabCanvas MVP - Development Task List

## Project File Structure
```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Canvas.module.css
│   │   │   └── CanvasToolbar.tsx
│   │   ├── Auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── SignInButton.tsx
│   │   ├── Presence/
│   │   │   ├── UserCursor.tsx
│   │   │   └── OnlineUsersList.tsx
│   │   └── Layout/
│   │       └── AppLayout.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── CanvasContext.tsx
│   │   └── PresenceContext.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── firestore.ts
│   │   ├── auth.ts
│   │   └── presence.ts
│   ├── types/
│   │   ├── canvas.types.ts
│   │   ├── user.types.ts
│   │   └── presence.types.ts
│   ├── hooks/
│   │   ├── useCanvas.ts
│   │   ├── usePresence.ts
│   │   └── useCursorSync.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── __tests__/
│   │   ├── setup.ts
│   │   ├── utils/
│   │   │   └── helpers.test.ts
│   │   ├── services/
│   │   │   ├── auth.test.ts
│   │   │   ├── firestore.test.ts
│   │   │   └── presence.test.ts
│   │   ├── components/
│   │   │   ├── Canvas.test.tsx
│   │   │   └── SignInButton.test.tsx
│   │   └── integration/
│   │       ├── rectangle-sync.test.ts
│   │       ├── cursor-sync.test.ts
│   │       └── persistence.test.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── .env.local
├── .env.test
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── firebase.json
└── README.md
```

---

## PR #1: Project Setup & Initial Deployment
**Goal:** Bootstrap React + TypeScript project, configure Firebase, deploy "Hello World"

### Tasks:
- [x] **1.1** Initialize React + TypeScript project with Create React App or Vite
  - **Files:** `package.json`, `tsconfig.json`, `.gitignore`
  
- [x] **1.2** Install core dependencies
  - **Dependencies:** `react`, `react-dom`, `typescript`, `firebase`, `react-konva`, `konva`
  - **Dev Dependencies:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest`, `@types/jest`, `jest-environment-jsdom`
  - **Files:** `package.json`
  
- [ ] **1.3** Set up Firebase project in Firebase Console
  - Create new Firebase project
  - Enable Firestore Database
  - Enable Authentication (Google provider)
  - Get Firebase config credentials
  
- [x] **1.4** Create Firebase configuration files
  - **Files:** 
    - `src/services/firebase.ts` (Firebase initialization)
    - `.env.local` (Firebase credentials - DO NOT COMMIT)
    - `.env.example` (Template for environment variables)
  
- [x] **1.5** Create basic App structure with "Hello World"
  - **Files:**
    - `src/App.tsx` (Main app component)
    - `src/index.tsx` (React entry point)
    - `src/App.css`
    - `public/index.html`
  
- [x] **1.6** Configure deployment (Vercel or Firebase Hosting)
  - **Files:** `vercel.json` OR `firebase.json`, `.firebaserc`
  
- [x] **1.7** Deploy "Hello World" and verify public URL works
  - Test deployment pipeline
  - Document deployment URL in README
  - **Files:** `README.md`

- [x] **1.8** Set up testing infrastructure
  - **Files:** 
    - `jest.config.js` (Jest configuration)
    - `src/__tests__/setup.ts` (Test setup with Firebase mocks)
    - `.env.test` (Test environment variables)
  - Configure Jest for TypeScript and React
  - Set up Firebase mocks for testing
  - Create test utilities and helpers

---

## PR #2: Authentication System
**Goal:** Implement Firebase Auth with Google Sign-In

### Tasks:
- [x] **2.1** Create TypeScript types for user data
  - **Files:** `src/types/user.types.ts`
  
- [x] **2.2** Build authentication service
  - **Files:** `src/services/auth.ts`
  - Functions: `signInWithGoogle()`, `signOut()`, `onAuthStateChanged()`
  
- [x] **2.3** Create AuthContext for global auth state
  - **Files:** `src/contexts/AuthContext.tsx`
  - Exports: `AuthProvider`, `useAuth` hook
  
- [x] **2.4** Build SignInButton component
  - **Files:** `src/components/Auth/SignInButton.tsx`
  - Show "Sign in with Google" when logged out
  - Show user info + sign out when logged in
  
- [x] **2.5** Create AuthProvider wrapper component
  - **Files:** `src/components/Auth/AuthProvider.tsx`
  
- [x] **2.6** Update App.tsx to use authentication
  - **Files:** `src/App.tsx`
  - Show sign-in screen if not authenticated
  - Show canvas if authenticated
  
 - [x] **2.7** Test authentication flow
  - Sign in with Google account
  - Verify user display name appears
  - Test sign out
  - Verify persistence across page refresh

- [x] **2.8** Write unit tests for authentication service
  - **Files:** `src/__tests__/services/auth.test.ts`
  - **Tests to write:**
    - Mock Firebase Auth methods
    - Test `signInWithGoogle()` returns user object
    - Test `signOut()` clears user state
    - Test `onAuthStateChanged()` callback fires correctly
  - **Verification:** Run `npm test` - all auth tests should pass

---

## PR #3: Canvas Foundation & Pan/Zoom
**Goal:** Integrate Konva.js and implement basic canvas navigation

### Tasks:
- [x] **3.1** Create canvas type definitions
  - **Files:** `src/types/canvas.types.ts`
  - Define: `Rectangle`, `CanvasState`, `ViewportTransform`
  
- [x] **3.2** Create constants file
  - **Files:** `src/utils/constants.ts`
  - Define: `DEFAULT_RECT_WIDTH = 200`, `DEFAULT_RECT_HEIGHT = 100`, `CANVAS_SIZE`, etc.
  
- [x] **3.3** Build base Canvas component with Konva
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Set up `Stage` and `Layer` from react-konva
  - Implement pan (drag stage)
  - Implement zoom (mouse wheel)
  
- [x] **3.4** Add canvas styling
  - **Files:** `src/components/Canvas/Canvas.module.css`
  
- [x] **3.5** Create CanvasContext for local state management
  - **Files:** `src/contexts/CanvasContext.tsx`
  - Manage: rectangles array, viewport transform, selected tool
  - Exports: `CanvasProvider`, `useCanvas` hook
  
- [x] **3.6** Integrate Canvas into App layout
  - **Files:** 
    - `src/App.tsx`
    - `src/components/Layout/AppLayout.tsx`
  
- [x] **3.7** Test pan and zoom functionality
  - Verify smooth 60 FPS performance
  - Test with trackpad and mouse
  - Check zoom centered on cursor position
  - Persist viewport to localStorage between sessions

---

## PR #4: Rectangle Creation (Local Only)
**Goal:** Click to place 200x100px rectangles on canvas and resize them (no sync yet)

### Tasks:
- [x] **4.1** Add click handler to Canvas component
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - On stage click: create rectangle at cursor position
  - Only create when clicking empty canvas background (not on existing rectangles)
  
- [x] **4.2** Implement rectangle rendering
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Map rectangles array to Konva `<Rect>` components
  - Apply default size: 200x100px
  - Apply random colors (hardcode 4-5 colors)
  
- [x] **4.3** Add rectangle to local state
  - **Files:** `src/contexts/CanvasContext.tsx`
  - Update context with `addRectangle()` function
  - Generate unique IDs (use `crypto.randomUUID()`)
  
- [x] **4.4** Implement rectangle dragging
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Enable `draggable` prop on Konva Rect
  - Update rectangle position in state on drag end
  
- [x] **4.5** Add helper utilities
  - **Files:** `src/utils/helpers.ts`
  - Functions: `generateRectId()`, `getRandomColor()`, `transformCanvasCoordinates()`
  
- [x] **4.6** Write unit tests for helper utilities
  - **Files:** `src/__tests__/utils/helpers.test.ts`
  - **Tests to write:**
    - Test `generateRectId()` returns unique IDs
    - Test `getRandomColor()` returns valid hex colors
    - Test `transformCanvasCoordinates()` with various viewport transforms
    - Test coordinate transformation edge cases (negative values, zoom levels)
  - **Verification:** Run `npm test` - all helper tests should pass
  
- [x] **4.7** Test rectangle creation and movement
  - Click to place multiple rectangles
  - Drag rectangles to move them
  - Verify no lag or visual glitches
  - Test with 20+ rectangles for performance
  - Verify clicking an existing rectangle does not create a new one
  - Verify selected rectangle is brought to the front (z-order)
 
- [x] **4.8** Implement rectangle resizing
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Use Konva `Transformer` to allow resizing of a selected rectangle
  - Update width/height while preserving position during resize
  - Clicking a rectangle selects it and attaches the `Transformer`
  - Bring selected rectangle to front (z-order) when selected

- [x] **4.9** Update context to handle size updates
  - **Files:** `src/contexts/CanvasContext.tsx`
  - Add method to update rectangle width/height on resize end

- [x] **4.10** Write component test for resizing
  - **Files:** `src/__tests__/components/Canvas.test.tsx`
  - **Tests to write:**
    - Resize interaction updates rectangle size in state
    - Transformer appears only for selected rectangle
  - **Verification:** Run `npm test` - Canvas component tests should pass

---

## PR #5: Firestore Database Structure
**Goal:** Set up Firestore collections and write operations (read operations in next PR)

### Tasks:
- [x] **5.1** Create Firestore service layer
  - **Files:** `src/services/firestore.ts`
  - Initialize Firestore instance
  - Export database reference
  
- [x] **5.2** Define Firestore collection structure
  - **Files:** `src/services/firestore.ts`
  - Collections: `objects` (rectangles), `presence` (user cursors), `users`
  - Document structure for each collection
  
- [x] **5.3** Implement write operations for rectangles
  - **Files:** `src/services/firestore.ts`
  - Functions: `createRectangle()`, `updateRectangle()`, `deleteRectangle()`
  - Use Firestore `setDoc()`, `updateDoc()`, `deleteDoc()`
  
- [x] **5.4** Update CanvasContext to write to Firestore
  - **Files:** `src/contexts/CanvasContext.tsx`
  - On rectangle create: write to Firestore
  - On rectangle move: update Firestore
  - Use optimistic updates (update local state immediately)
  
- [x] **5.5** Add error handling for Firestore operations
  - **Files:** `src/services/firestore.ts`, `src/contexts/CanvasContext.tsx`
  - Try/catch blocks
  - Log errors to console
  
- [x] **5.6** Write unit tests for Firestore service
  - **Files:** `src/__tests__/services/firestore.test.ts`
  - **Tests to write:**
    - Mock Firestore methods (`setDoc`, `updateDoc`, `deleteDoc`)
    - Test `createRectangle()` calls Firestore with correct data structure
    - Test `updateRectangle()` updates only changed fields
    - Test `deleteRectangle()` removes document
    - Test error handling when Firestore operations fail
  - **Verification:** Run `npm test` - all Firestore tests should pass
  
- [x] **5.7** Test write operations
  - Create rectangles and verify in Firebase Console
  - Move rectangles and verify updates in Firebase Console
  - Check for any write errors in console

---

## PR #6: Real-Time Rectangle Sync
**Goal:** Listen to Firestore changes and sync rectangles across users

### Tasks:
- [x] **6.1** Implement Firestore real-time listeners
  - **Files:** `src/services/firestore.ts`
  - Function: `subscribeToRectangles(callback)`
  - Use Firestore `onSnapshot()`
  
- [x] **6.2** Create useCanvas hook for data fetching
  - **Files:** `src/hooks/useCanvas.ts`
  - Subscribe to rectangles on mount
  - Unsubscribe on unmount
  - Sync Firestore data to CanvasContext
  
- [x] **6.3** Handle incoming rectangle updates
  - **Files:** `src/contexts/CanvasContext.tsx`
  - Merge remote changes with local state
  - Distinguish between local and remote updates (prevent echo)
  
- [x] **6.4** Implement "last write wins" conflict resolution
  - **Files:** `src/services/firestore.ts`, `src/contexts/CanvasContext.tsx`
  - Document strategy in code comments
  - Use Firestore server timestamps
  
- [x] **6.5** Test multi-user rectangle sync
  - Open 2-3 browser windows with different Google accounts
  - Create rectangles in one window, verify they appear in others
  - Move rectangles and verify sync <100ms
  - Test rapid concurrent edits
  
- [x] **6.6** Write integration test for rectangle sync
  - **Files:** `src/__tests__/integration/rectangle-sync.test.ts`
  - **Tests to write:**
    - Mock Firestore snapshot listeners
    - Test rectangle creation propagates to all listeners
    - Test rectangle update propagates correctly
    - Test concurrent updates use last-write-wins strategy
    - Test sync latency is within acceptable range (<100ms)
    - Test no duplicate rectangles appear
    - Test no infinite update loops occur
  - **Verification:** Run `npm test` - integration tests should pass
  
- [x] **6.7** Debug any sync issues
  - Check for duplicate rectangles
  - Verify no infinite update loops
  - Test network throttling (Chrome DevTools)

---

## PR #7: Cursor Presence System
**Goal:** Show other users' cursors in real-time with name labels

### Tasks:
- [x] **7.1** Create presence type definitions
  - **Files:** `src/types/presence.types.ts`
  - Define: `CursorPosition`, `UserPresence`
  
- [x] **7.2** Build presence service
  - **Files:** `src/services/presence.ts`
  - Functions: `updateCursorPosition()`, `subscribeToCursors()`, `setUserOnline()`, `setUserOffline()`
  
- [x] **7.3** Create PresenceContext
  - **Files:** `src/contexts/PresenceContext.tsx`
  - Manage: online users, cursor positions
  - Exports: `PresenceProvider`, `usePresence` hook
  
- [x] **7.4** Build UserCursor component
  - **Files:** `src/components/Presence/UserCursor.tsx`
  - Render cursor icon/dot at position
  - Show user's display name label
  - Style with CSS for visibility
  
- [x] **7.5** Implement cursor tracking in Canvas
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Track mouse movement on stage
  - Throttle cursor updates (every 50ms max)
  - Send to Firestore via presence service
  
- [x] **7.6** Create useCursorSync hook
  - **Files:** `src/hooks/useCursorSync.ts`
  - Subscribe to other users' cursor positions
  - Update PresenceContext with cursor data
  
- [x] **7.7** Render all user cursors on canvas
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Map over presence data
  - Render UserCursor component for each user
  - Filter out current user's cursor
  
- [x] **7.8** Write unit tests for presence service
  - **Files:** `src/__tests__/services/presence.test.ts`
  - **Tests to write:**
    - Mock Firestore presence updates
    - Test `updateCursorPosition()` throttles updates correctly (max 50ms)
    - Test `setUserOnline()` writes correct presence data
    - Test `setUserOffline()` removes presence data
    - Test cursor position coordinates are valid numbers
  - **Verification:** Run `npm test` - presence tests should pass
  
- [x] **7.9** Write integration test for cursor sync
  - **Files:** `src/__tests__/integration/cursor-sync.test.ts`
  - **Tests to write:**
    - Mock multiple user cursor positions
    - Test cursor updates propagate to all users
    - Test cursor sync latency (<50ms)
    - Test throttling prevents too many updates
    - Test current user's cursor is filtered out
    - Test cursor positions update in real-time
  - **Verification:** Run `npm test` - cursor sync integration tests should pass
  
- [x] **7.10** Test cursor sync manually
  - Open 2-3 browser windows
  - Move mouse and verify cursors appear in other windows
  - Verify <50ms latency
  - Check name labels are correct

---

## PR #8: Online Users List & Presence Awareness
**Goal:** Show list of currently online users

### Tasks:
- [x] **8.1** Update presence service for online status
  - **Files:** `src/services/presence.ts`
  - Set user as online on auth
  - Set user as offline on disconnect/tab close
  - Use Firestore `onDisconnect()` for cleanup
  
- [x] **8.2** Build OnlineUsersList component
  - **Files:** `src/components/Presence/OnlineUsersList.tsx`
  - Display list of online users with names
  - Show count of online users
  - Style as sidebar or overlay (implemented as header dropdown)
  
- [x] **8.3** Create usePresence hook
  - **Files:** `src/hooks/usePresence.ts`
  - Subscribe to online users
  - Update when users join/leave
  
- [x] **8.4** Integrate OnlineUsersList into layout
  - **Files:** `src/components/Layout/AppLayout.tsx`
  - Position in UI (top right corner or sidebar)
  
- [x] **8.5** Handle user connection/disconnection
  - **Files:** `src/contexts/PresenceContext.tsx`
  - Update online users list in real-time
  - Clean up presence data on user disconnect
  
- [x] **8.6** Test presence awareness
  - Open multiple browsers with different users
  - Verify all users appear in online list
  - Close browser and verify user disappears from list
  - Refresh page and verify user reappears

---

## PR #9: State Persistence & Reconnection
**Goal:** Persist canvas state and handle user reconnections

### Tasks:
- [x] **9.1** Verify Firestore persistence is working
  - **Files:** Review `src/services/firestore.ts`
  - Rectangles should already persist (from PR #5-6)
  
- [x] **9.2** Handle page refresh gracefully
  - **Files:** `src/contexts/CanvasContext.tsx`
  - On mount: load all rectangles from Firestore
  - Show loading state while fetching
  
- [x] **9.3** Implement reconnection logic
  - **Files:** `src/contexts/PresenceContext.tsx`
  - Detect when user reconnects (auth state change)
  - Re-establish presence
  - Re-subscribe to real-time listeners
  
- [x] **9.4** Add loading states to UI
  - **Files:** `src/App.tsx`, `src/components/Canvas/Canvas.tsx`
  - Show spinner while loading initial data
  - Show "Reconnecting..." message on connection loss
  
- [x] **9.5** Test persistence scenarios
  - Create rectangles, refresh page, verify they persist
  - Disconnect internet, reconnect, verify data syncs
  - Close tab, reopen, verify canvas state is restored
  
- [x] **9.6** Write integration test for state persistence
  - **Files:** `src/__tests__/integration/persistence.test.ts`
  - **Tests to write:**
    - Mock Firestore persistence layer
    - Test rectangles are loaded on component mount
    - Test rectangle state persists after unmount/remount
    - Test reconnection re-establishes listeners
    - Test no data loss during reconnection
    - Test loading states appear correctly
  - **Verification:** Run `npm test` - persistence tests should pass
  
- [x] **9.7** Test multi-user persistence
  - User A creates rectangles
  - User A disconnects
  - User B joins and sees User A's rectangles
  - User A reconnects and sees all changes

---

## PR #10: Performance Optimization & Polish
**Goal:** Ensure 60 FPS performance and fix any remaining issues

### Tasks:
- [x] **10.1** Profile canvas performance
  - Use Chrome DevTools Performance tab
  - Verify 60 FPS during pan/zoom/drag
  - Identify any bottlenecks
  
- [x] **10.2** Optimize Konva rendering
  - **Files:** `src/components/Canvas/Canvas.tsx`
  - Use `listening={false}` on non-interactive elements
  - Batch updates where possible
  - Add `perfectDrawEnabled={false}` for performance
  
- [x] **10.3** Throttle cursor position updates
  - **Files:** `src/components/Canvas/Canvas.tsx`, `src/services/presence.ts`
  - Ensure cursor updates max every 50ms
  - Use `lodash.throttle` or custom throttle
  
- [x] **10.4** Optimize Firestore queries
  - **Files:** `src/services/firestore.ts`
  - Add indexes if needed (check Firebase Console)
  - Limit query results if canvas grows large
  
- [x] **10.5** Add error boundaries
  - **Files:** `src/components/Layout/ErrorBoundary.tsx`, `src/App.tsx`
  - Catch and display React errors gracefully
  
- [x] **10.6** Improve visual feedback
  - **Files:** `src/components/Canvas/Canvas.tsx`, CSS files
  - Hover states on rectangles
  - Visual indication of selected/dragging rectangle
  - Smooth transitions
  
- [x] **10.7** Write performance tests
  - **Files:** `src/__tests__/components/Canvas.test.tsx`
  - **Tests to write:**
    - Test Canvas component renders without crashing
    - Test pan operation updates viewport transform
    - Test zoom operation updates viewport scale
    - Test rectangle drag updates position
    - Mock performance metrics (frame rate validation)
    - Test throttling functions work correctly
  - **Verification:** Run `npm test` - Canvas component tests should pass
  
- [x] **10.8** Test performance under load
  - Create 50+ rectangles
  - Test with 3-4 simultaneous users
  - Verify no lag or frame drops

---

## PR #11: Further Testing and Documentation
**Goal:** Comprehensive testing and documentation for MVP launch

### Tasks:
 - [x] **11.1** Run complete test suite
  - **Command:** `npm test -- --coverage`
  - **Verification:** 
    - All unit tests pass (auth, firestore, presence, helpers)
    - All integration tests pass (rectangle-sync, cursor-sync, persistence)
    - All component tests pass (Canvas, SignInButton)
    - Code coverage report generated
  - **Target Coverage:** Aim for >70% coverage on critical paths
  
- [x] **11.2** Run full MVP testing checklist
  - **Testing Scenarios:**
    - ✅ Two users can edit simultaneously in different browsers
    - ✅ Changes sync in <100ms
    - ✅ Cursors sync in <50ms
    - ✅ Canvas persists after refresh
    - ✅ User sees who else is online
    - ✅ 60 FPS during pan/zoom
    - ✅ Users have authentication/names
  
- [x] **11.3** Performance under load
  - Support 500+ simple objects without FPS drops
  - Support 5+ concurrent users without degradation
  
- [x] **11.4** Update README with complete documentation
  - **Files:** `README.md`
  - Project description
  - Setup instructions
  - Firebase configuration guide
  - Environment variables template
  - Deployment instructions
  - **Testing instructions** (how to run tests, coverage reports)
  - Known limitations (last-write-wins, etc.)
  - Future roadmap
  
- [x] **11.5** Add code comments and documentation
  - **Files:** All service files, complex components
  - Document Firestore structure
  - Document conflict resolution strategy
  - Add JSDoc comments to key functions

---

## PR #12: Shape Creation Menu & Concurrent Load Testing
**Goal:** Allow creating multiple shape types with deterministic placement and validate performance under higher concurrency

### Tasks:
- [x] **12.1** Add header shape selector
  - Options: Rectangle, Circle, Triangle, Star
  - Selector appears in the pinned header; choosing a shape creates it immediately

- [x] **12.2** Implement deterministic placement rules
  - First shape appears at top-left of canvas
  - Each subsequent shape appears +50px right and +50px down from the previous
  - After 10 shapes, restart placement back at top-left

- [x] **12.3** Test performance with 5+ concurrent users
  - Validate no degradation in interaction latency
  - Verify shapes create/sync reliably under load

---

## PR #13: Bug Fixes & Enhancements
**Goal:** Address known issues and polish the workspace experience

### Tasks:
- [x] **13.1** Fix cursor sync positions
  - Ensure remote user cursors render at accurate positions relative to viewport/scale, window size, and display resolution

- [x] **13.2** Add Arrow shape
  - Include an Arrow option in the shape selector
  - Support drag and position updates; random color selection

- [x] **13.3** Widen canvas workspace grid
  - Increase spacing/scale of the grid to feel more spacious
  - Keep grid performance-friendly

- [x] **13.4** Add white border around Konva presentation area
  - Apply a subtle white border around the Konva Stage presentation area to clearly delineate the drawing surface

 - [x] **13.5** Add color picker for shapes
  - Provide UI to choose shape color (create and update)
  - Persist color choice and sync in real-time

 - [x] **13.6** Enable shape rotation
  - Allow rotating shapes with Transformer; persist and sync rotation

 - [x] **13.7** Prevent background color change during color pick
  - Ensure only the selected shape color changes, not the canvas background

 - [x] **13.8** Add z-index control in color panel
  - Allow setting a shape's z layer and nudging up/down

 - [x] **13.9** Move delete into color panel
  - Relocate the delete icon into the selected shape's color selector UI

 - [x] **13.10** Add copy/duplicate shape action
  - Duplicate a shape preserving color/size; position via deterministic placement logic

 - [ ] **13.11** Enable multi-select and group move
  - Select multiple shapes and drag them together

 - [ ] **13.12** Link shape movement with cursor refresh movement
  - Couple shape movement updates with the cursor refresh cadence for synchronized visual feedback

 - [ ] **13.13** Workspace size menu
  - Add menu to define workspace size; if too small, auto-handle object cluttering

 - [ ] **13.14** Revert workspace size change
  - Add menu action to revert workspace size to previous setting

 
 - [x] **13.15** Convert color panel to Properties panel floating at top of canvas
  - Show only when a shape is selected; render as a horizontal bar at the top of the canvas; allow editing color, z-layer up/down, and deleting the selected object

 - [x] **13.16** Update header shape buttons to icons
  - Replace text labels with shape icons; remove "Create shape" wording; move color selector to the end of the header controls

- [ ] **13.17** Review and remove slop
  - Audit and remove unused code, redundant comments, and cruft across `src/`

---

## PR #14: Performance and Realtime Improvements
**Goal:** Improve realtime responsiveness and UI performance under interaction

### Tasks:
- [ ] **14.1** Realtime cursors via Firebase
  - Use Firebase Realtime Database to track and render cursors of other users

- [ ] **14.2** Realtime drag via Firebase
  - Track and broadcast in-progress drag positions using Firebase Realtime Database; render peers' movement smoothly

- [ ] **14.3** Optimize bundle size and code-splitting
  - Reduce main chunk size; split heavy modules; lazy-load non-critical UI

- [ ] **14.4** Tune Konva layers and redraw strategy
  - Minimize layer redraws; leverage caching where safe; throttle non-essential updates

- [ ] **14.5** Remove dead code and AI slop
  - Delete unused imports, variables, and functions across `src/`
  - Remove redundant code/comments; tighten obvious types and simplify props

---

***

## Success Checklist - MVP Complete ✅

### Core Functionality
- [ ] Basic canvas with pan/zoom
- [ ] At least one shape type (rectangle, circle, or text)
- [ ] Ability to create and move objects
- [ ] Real-time sync between 2+ users
- [ ] Multiplayer cursors with name labels
- [ ] Presence awareness (who’s online)
- [ ] User authentication (users have accounts/names)
- [ ] Deployed and publicly accessible

### Performance Metrics
- [ ] 60 FPS maintained during all interactions
- [ ] Object sync latency < 100ms
- [ ] Cursor sync latency < 50ms
- [ ] No visual lag with 500+ simple objects
- [ ] Handles 5+ concurrent users without degradation

 

---

