# 🖼️ AI Canvas Agent Integration Plan

> **Implementation Status:** PRs 1-5 are completed. The AI agent is fully functional with chat interface, shape creation, manipulation commands, layout commands, and complex template generation (forms, navbars). See `docs/features.md` for complete feature documentation.

## Overview
We are extending the existing **React + Vite + Firebase (Auth, Firestore, RTDB)** collaborative canvas application with an **AI Canvas Agent**. The agent will live inside an interactable chatbot text box and allow users to issue natural language commands that create, manipulate, and arrange shapes on the shared canvas.

The rollout will be incremental, with each feature introduced in a separate pull request (PR). The order minimizes risk: start with scaffolding, then expand command breadth, then optimize for performance and security.

---

## Goals
- **Command Breadth & Capability**  
  - 8+ distinct command types across creation, manipulation, layout, and complex categories.  
  - Multi-step plans for complex layouts.  
  - Smart positioning and styling.  
  - Handles ambiguity gracefully.  

- **Performance & UX**  
  - Sub-2 second responses.  
  - 90%+ accuracy.  
  - Natural UX with feedback.  
  - Shared state works flawlessly across users.  

- **Security**  
  - Restrict AI to **canvas-related commands only**.  
  - Prevent abuse, prompt injection, or arbitrary chat.  
  - Enforce schema validation and execution budgets.  

---

## PR Roadmap

### PR 1: Chatbox & Agent Scaffolding ✅ COMPLETED
- ✅ Add chatbot UI component.  
- ✅ Integrate **OpenAI Agents SDK** via Firebase Functions (server-side key injection).  
- ✅ Store chat messages in Firestore for multi-user visibility.  
- ✅ Add typing indicator + streaming responses.  
- **Security:**  
  - ✅ Route all OpenAI calls through Firebase Functions.  
  - ✅ Apply a strict system prompt: *"Only output JSON commands for canvas actions."*  
  - ✅ Reject free-form text.

---

### PR 2: Command Parsing & Shape Creation ✅ COMPLETED
- ✅ Implement interpreter for **Creation Commands**:  
  - ✅ `"Create a red circle at position 100,200"`  
  - ✅ `"Add a text layer that says 'Hello World'"`  
  - ✅ `"Make a 200x300 rectangle"`  
  - ✅ Support for all shape types (rectangle, circle, triangle, star, arrow, text)
  - ✅ Multi-shape creation with count parameter
  - ✅ Grid layout creation (3x3, 4x2, etc.)
- ✅ Update Firestore shared state so all users see new shapes.  
- **Security:**  
  - ✅ Validate AI output against JSON schema.  
  - ✅ Reject malformed or unrelated responses.  
  - ✅ Log invalid attempts.

---

### PR 3: Manipulation Commands ✅ COMPLETED
- ✅ Extend interpreter for **Manipulation Commands**:  
  - ✅ Move, resize, rotate.  
  - ✅ Shape selection by number (#1, #2, etc.)
  - ✅ Relative and absolute rotation
  - ✅ Position commands (center, top, etc.)
- ✅ Add feedback in chat: "✅ Resized circle to 200px radius."  
- **Security:**  
  - ✅ Enforce shape ownership rules.  
  - ✅ Add per-user rate limiting.

---

### PR 4: Layout Commands ✅ COMPLETED
- ✅ Implement **Layout Commands**:  
  - ✅ `"Arrange these shapes in a horizontal row"`  
  - ✅ `"Create a grid of 3x3 squares"`  
  - ✅ `"Space these elements evenly"`  
  - ✅ Row, column, and grid arrangements
- ✅ Add layout utilities (grid, spacing).  
- **Security:**  
  - ✅ Cap maximum number of shapes per command.  
  - ✅ Sanitize layout parameters.

---

### PR 5: Complex Commands ✅ COMPLETED
- ✅ Implement **Complex Commands**:  
  - ✅ `"Create a login form with username and password fields"`  
  - ✅ `"Build a navigation bar with 4 menu items"`  
  - ✅ Login, signup, and contact form templates
  - ✅ Navbar templates with custom button labels
- ✅ Multi-step orchestration with template generation.  
- **Security:**  
  - ✅ Execution budget (max 10 sub-steps).  
  - ✅ Require confirmation for large batch creations.

---

### PR 6: Performance & Accuracy
- Optimize prompts for **sub-2s responses**.  
- Add caching for repeated commands.  
- Build test suite of sample prompts to validate 90%+ accuracy.  
- **Security:**  
  - Detect and block prompt injection attempts.  
  - Strip commands that try to escape canvas domain.

---

### PR 7: Multi-User Synchronization
- Ensure multiple users can issue AI commands simultaneously.  
- Add Firestore transaction safety for conflicting updates.  
- Attribute commands to user IDs in chat.  
- **Security:**  
  - Audit logs of AI actions per user.  
  - Role-based permissions (e.g., only admins can run layout/complex commands).

---

### PR 8: UX Polish & Feedback
- Add natural UX feedback:  
  - Loading indicators.  
  - Inline confirmations.  
  - Error recovery (“Couldn’t parse command, try again”).  
- Add command history + undo/redo.  
- **Security:**  
  - User-facing error messages when commands are blocked.  
  - Clear feedback: “This command isn’t supported outside the canvas context.”

---

## 🔑 Manual Setup (Firebase Console Method)

1. **Go to Firebase Console**  
   - Navigate to your project in [Firebase Console](https://console.firebase.google.com/).

2. **Open Project Settings**  
   - Gear icon → **Project settings**.

3. **Add Environment Variables**  
   - Left sidebar → **Build → Functions → Variables**.  
   - Click **Add variable**.  
   - Key: `OPENAI_API_KEY`  
   - Value: `your-openai-key-here`  
   - Save changes.

4. **Access in Cloud Functions**
   ```js
   const OPENAI_KEY = process.env.OPENAI_API_KEY;