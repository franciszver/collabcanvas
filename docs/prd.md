CollabCanvas MVP - Product Requirements Document
Project Overview
Build a real-time collaborative canvas where multiple users can create, move, and manipulate shapes simultaneously. This
MVP focuses on proving the collaborative infrastructure works flawlessly before adding advanced features.
Timeline: 24 hours to MVP checkpoint
Success Criteria: Bulletproof multiplayer sync > feature richness
User Stories
Primary User: Designer/Collaborator
As a designer, I want to create shapes on a canvas so that I can start building designs
As a designer, I want to move and resize objects so that I can arrange my layout
As a designer, I want to see other users' cursors in real-time so that I know where they're working
As a designer, I want to see changes made by others instantly so that we can collaborate seamlessly
As a designer, I want my work to persist when I refresh so that I don't lose progress
As a designer, I want to pan and zoom the canvas so that I can navigate a larger workspace
Secondary User: Collaborator
As a collaborator, I want to see who else is online so that I know who I'm working with
As a collaborator, I want to join an existing canvas so that I can work with my team
As a collaborator, I want to authenticate with a name/account so that others can identify me
MVP Key Features
1. Canvas Infrastructure
Pan & Zoom: Smooth navigation with mouse/trackpad
Workspace: Large canvas area (doesn't need to be infinite, but should feel spacious)
60 FPS Performance: No lag during interactions
2. Shape Creation & Manipulation
Shape Type: Rectangles only
Create: Click to place a fixed-size rectangle (200x100px default)
Move: Drag rectangles to reposition
Basic Properties: Position (x, y), size (width, height), color
Canvas Scope: Single shared canvas for all users
3. Real-Time Collaboration (CRITICAL)
Multiplayer Cursors: See other users' cursor positions with name labels
Live Sync: Changes appear instantly for all users (<100ms for objects)
Cursor Sync: <50ms latency for cursor movement
Presence Awareness: List of online users
Conflict Resolution: Last-write-wins strategy (document this choice)
4. Persistence & State Management
Save State: Canvas persists when users disconnect
Reconnection: Users can rejoin and see their previous work
Refresh Tolerance: No data loss on page refresh
5. Authentication
User Accounts: Firebase Auth with Google Sign-In
Named Users: Display name from Google account for cursors/presence
Flow: Simple "Sign in with Google" button
6. Deployment
Public URL: Accessible for testing
Multi-User Support: Handle 2+ concurrent users without degradation
Recommended Tech Stack
Frontend
React + TypeScript ✅ SELECTED
Why: Fast development, great ecosystem, TypeScript safety
Canvas Library: Konva.js (easiest, good docs, React bindings)
State Management: React Context API (no extra dependencies, built-in)
Backend & Real-Time Sync
Firebase ✅ SELECTED
Firestore: Real-time database with live listeners
Firebase Auth: Drop-in authentication
Firebase Hosting: Easy deployment
Why This Choice:
Fastest to set up (< 1 hour)
Built-in real-time sync
Free tier sufficient for MVP
No server management
Focus on features, not infrastructure
Deployment
Frontend: Vercel or Firebase Hosting (auto-deploy from GitHub)
Backend: Firebase (all-in-one solution)
Tech Stack Recommendation & Pitfalls
🎯 Confirmed Tech Stack
Frontend: React + TypeScript + Konva.js
Backend: Firebase (Firestore + Auth + Hosting)
State: React Context API (no extra dependencies)
Deployment: Vercel or Firebase Hosting
Authentication: Firebase Auth with Google Sign-In
Canvas: Single shared canvas (no rooms/IDs)
Shape Type: Rectangles only (fixed-size: 200x100px)
Rectangle Creation: Click to place (no drag-to-size)
⚠️ Key Pitfalls & Considerations
1. Real-Time Sync is the Hardest Part
Pitfall: Underestimating sync complexity
Solution: Use Firebase or Supabase - don't build custom WebSockets unless you're very experienced
Time Save: 4-6 hours by using managed real-time DB
2. Canvas Performance
Pitfall: Canvas libraries have different performance characteristics
Konva.js: Best for shapes and interactions (good for MVP)
PixiJS: Overkill for MVP, WebGL-based (use if you need 1000+ objects)
Fabric.js: Good but heavier than Konva
Warning: Don't use raw HTML5 Canvas API - too low-level for 24 hours
3. State Management Complexity
Pitfall: Over-engineering state management
Solution: Use React Context API (built-in, zero dependencies)
Warning: Don't use Redux for MVP - too much boilerplate
Pattern: Local state + Firebase sync (optimistic updates)
4. Conflict Resolution
Pitfall: Trying to build sophisticated CRDT/OT algorithms
Solution: Use "last write wins" for MVP
Document: Make it clear in your code/README this is the strategy
Future: Can upgrade to CRDTs later (Yjs, Automerge)
5. Authentication Scope
Pitfall: Building complex auth flows
Solution: Firebase Auth with Google Sign-In (one-click authentication)
MVP Need: Just user ID + display name from Google account
Skip: Email/password, password reset, email verification, multiple providers
6. Deployment Delays
Pitfall: Leaving deployment to the end
Solution: Deploy "Hello World" in first 2 hours
Reason: Catch CORS, environment, build issues early
Recommendation: Use Vercel (auto-deploy on git push)
7. Database Structure
javascript
// GOOD - Flat structure for Firebase
collections/
 canvases/{canvasId}
 objects/{objectId} - individual shape docs
 presence/{userId} - cursor position
 users/{userId} - user metadata
// BAD - Nested arrays (Firebase sync issues)
canvases/{canvasId}
 objects: [] // Don't store as array!
8. Testing Multiplayer
Pitfall: Only testing in one browser
Solution: Open 3-4 incognito windows from hour 1
Test: Network throttling, rapid edits, disconnects
Tools: Chrome DevTools Network tab (slow 3G simulation)
NOT Included in MVP
Features to Skip (Add Post-MVP)
❌ Multiple shape types (rectangles only for MVP)
❌ Selection boxes (shift-click, drag-to-select)
❌ Resize/rotate shapes (only move for MVP)
❌ Layer management / z-index control
❌ Delete/duplicate operations
❌ Color picker UI (can hardcode a few colors)
❌ Text layers or text formatting
❌ Undo/redo
❌ Export/save features
❌ Permissions (edit/view access)
❌ Multiple canvases per user
❌AI agent (this is Phase 2)
Technical Features to Skip
❌ Operational Transformation (OT) or CRDTs
❌ Custom WebSocket server (use managed service)
❌Advanced conflict resolution
❌ Offline mode / service workers
❌ Performance optimizations (virtualization, etc.)
❌ Mobile responsiveness
❌ Keyboard shortcuts
❌ Canvas history/versioning
Success Metrics
MVP Pass Criteria
✅ Two users can edit simultaneously in different browsers
✅ Changes sync in <100ms
✅ Cursors sync in <50ms
✅ Canvas persists after refresh
✅ User sees who else is online
✅ 60 FPS during pan/zoom
✅ Deployed and publicly accessible
✅ Users have authentication/names
Testing Checklist
 Open 2+ browser windows, different users
 Create shapes, see them appear for all users instantly
 Refresh one browser mid-edit, confirm state persists
 Move shapes rapidly, check for lag or desyncs
 Disconnect/reconnect, verify rejoining works
Test with network throttling (Chrome DevTools)
Development Timeline (24 Hours)
Phase 1: Setup & Deploy
Set up React + TypeScript project
Add Firebase config (Firestore + Auth)
Deploy "Hello World" to prove deployment pipeline works
Set up basic authentication flow
Phase 2: Canvas Basics
Integrate Konva.js
Implement pan & zoom
Create fixed-size rectangle placement (click to place 200x100px rectangles)
Local state management with React Context API
Phase 3: Real-Time Sync (CRITICAL - Most Time Intensive)
Connect to Firestore
Implement cursor position sync
Implement rectangle object sync
Test with 2+ users in different browsers
Debug sync issues
Phase 4: Persistence & Polish
Save canvas state to Firestore
Handle user reconnections gracefully
Add presence awareness (online users list)
Fix any remaining sync bugs
Phase 5: Testing & Deployment
Multi-user scenario testing
Disconnect/reconnect testing
Performance testing (60 FPS verification)
Network throttling tests
Final deployment and documentation
Risk Assessment
High Risk
🔴 Real-time sync complexity - Allocate 6+ hours, test early
🔴 Performance under load - Test with multiple users from hour 12
🔴 State persistence bugs - Test refresh scenarios continuously
Medium Risk
🟡 Canvas library learning curve - Budget 2 hours for Konva.js docs
🟡 Deployment issues - Deploy early to catch problems
🟡 Authentication setup - Use Firebase Auth to minimize time
Low Risk
🟢 UI/UX polish - Not critical for MVP, skip if time-constrained
🟢 Single shape type - Rectangles are straightforward
Next Steps
1. Review this PRD - Confirm tech stack choices
2. Set up development environment - React + Firebase
3. Deploy "Hello World" - Prove deployment pipeline works
4. Build vertically - Cursor sync → Object sync → Persistence
5. Test continuously - Multiple browsers from hour 1
Remember: A simple canvas with bulletproof multiplayer beats a feature-rich canvas with broken sync.