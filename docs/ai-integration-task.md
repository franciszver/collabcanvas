# 🧑‍💻 Developer Task List with Directed Prompts

---

## 🤖 AI Agent System Prompt

The AI agent must use this exact system prompt to ensure consistent, structured responses:

```
You are an AI Canvas Agent integrated into a collaborative drawing application. 
Your ONLY purpose is to translate natural language user commands into JSON objects 
that describe canvas actions. 

⚠️ Rules:
- Always respond ONLY with valid JSON.
- Never include explanations, free text, or commentary.
- The JSON must strictly follow the schema below.
- If the user asks for anything unrelated to canvas actions, respond with:
  { "error": "Unsupported command. Only canvas-related actions are allowed." }

📐 JSON Schema:
{
  "action": "create" | "manipulate" | "layout" | "complex",
  "target": "circle" | "rectangle" | "text" | "group" | "form" | "navbar" | "card",
  "parameters": {
    "x": number (optional),
    "y": number (optional),
    "width": number (optional),
    "height": number (optional),
    "radius": number (optional),
    "rotation": number (degrees, optional),
    "color": string (CSS color, optional),
    "text": string (for text shapes, optional),
    "layout": string ("grid" | "row" | "column", optional),
    "count": number (for repeated elements, optional),
    "fields": array of strings (for forms, optional),
    "items": array of strings (for navbars, optional)
  }
}
```

## 📋 AI Response JSON Schema

The AI must respond with JSON matching this exact schema:

```json
{
  "action": "create" | "manipulate" | "layout" | "complex",
  "target": "circle" | "rectangle" | "text" | "group" | "form" | "navbar" | "card",
  "parameters": {
    "x": "number (optional)",
    "y": "number (optional)", 
    "width": "number (optional)",
    "height": "number (optional)",
    "radius": "number (optional)",
    "rotation": "number (degrees, optional)",
    "color": "string (CSS color, optional)",
    "text": "string (for text shapes, optional)",
    "layout": "string (grid|row|column, optional)",
    "count": "number (for repeated elements, optional)",
    "fields": "array of strings (for forms, optional)",
    "items": "array of strings (for navbars, optional)"
  }
}
```

### Schema Rules:
- **action**: Required. Defines the operation type
- **target**: Required. Defines what to create or manipulate
- **parameters**: Required object containing all shape properties
- All parameters are optional but should include relevant properties for the target type
- **x, y**: Position coordinates (default to center of viewport if not provided)
- **width, height**: Dimensions for rectangles and text
- **radius**: Radius for circles (takes precedence over width/height)
- **rotation**: Rotation in degrees (0-360)
- **color**: CSS color value (hex, rgb, named colors)
- **text**: Text content for text shapes
- **layout**: Arrangement type for groups
- **count**: Number of repeated elements to create
- **fields**: Form field names for form targets
- **items**: Menu items for navbar targets

---

## Epic 1: Chatbox & Agent Scaffolding (PR 1) ✅ COMPLETED

- [x] **1. Create chatbot UI component in React.**  
   **Prompt:**  
   *"In my React + Vite project, create a dockable chatbot panel component with a text input and message history list. Use Tailwind for styling. Export it as `<ChatBox />`."*

- [x] **2. Implement Firebase Function proxy to OpenAI (server-side key injection).**  
   **Prompt:**  
   *"Write a Firebase HTTPS Callable Function named `aiCanvasCommand` that takes a user prompt, calls OpenAI with a system prompt, and returns the raw JSON response. Use `process.env.OPENAI_API_KEY` for the key."*

- [x] **3. Apply system prompt restricting AI to JSON schema.**  
   **Prompt:**  
   *"Update the Firebase Function to include a system message that forces OpenAI to only return JSON matching the schema for canvas actions. If the request is unrelated, return `{ \"error\": \"Unsupported command\" }`."*

- [x] **4. Add Firestore collection for chat messages (multi-user visibility).**  
   **Prompt:**  
   *"In Firestore, create a `chatMessages` collection. Each message should include: `userId`, `content`, `role` (user/assistant), and `timestamp`. Write React hooks to subscribe to this collection in real time."*

- [x] **5. Add typing indicator and streaming response support.**  
   **Prompt:**  
   *"Enhance `<ChatBox />` to show a 'typing...' indicator while waiting for Firebase Function responses. Add streaming support so partial responses appear as they arrive."*

---

## Epic 2: Command Parsing & Shape Creation (PR 2)

- [ ] **1. Implement interpreter that maps JSON → canvas actions.**  
   **Prompt:**  
   *"Write a function `applyCanvasCommand(command)` that takes a validated JSON object and applies it to the canvas (create, manipulate, layout, complex). Start with handling `create`."*

- [ ] **2. Support shape creation: circle, rectangle, text.**  
   **Prompt:**  
   *"Extend `applyCanvasCommand` to support creating circles, rectangles, and text elements on the canvas. Each shape should have unique IDs and be stored in Firestore."*

- [ ] **3. Add schema validation middleware.**  
   **Prompt:**  
   *"Integrate AJV in the Firebase Function to validate AI responses against the JSON schema before returning them to the client."*

- [ ] **4. Sync new shapes to Firestore shared state.**  
   **Prompt:**  
   *"Update `applyCanvasCommand` so that when a shape is created, it writes to Firestore under a `shapes` collection. All clients should subscribe to this collection for real-time updates."*

---

## Epic 3: Manipulation Commands (PR 3)

- [ ] **1. Extend interpreter for move, resize, rotate.**  
   **Prompt:**  
   *"Add support in `applyCanvasCommand` for `manipulate` actions: move (update x,y), resize (update width/height or radius), and rotate (update rotation)."*

- [ ] **2. Add shape selection context (by ID or last created).**  
   **Prompt:**  
   *"Modify `applyCanvasCommand` so that if no shape ID is provided, it defaults to the last created shape. Add support for targeting by ID."*

- [ ] **3. Provide chat feedback on success.**  
   **Prompt:**  
   *"Update the Firebase Function to append a confirmation message to Firestore chat after a successful manipulation, e.g., '✅ Resized circle to 200px radius'."*

- [ ] **4. Add per-user rate limiting.**  
   **Prompt:**  
   *"Implement per-user rate limiting in the Firebase Function so that no user can send more than 5 AI commands per 10 seconds."*

---

## Epic 4: Layout Commands (PR 4)

- [ ] **1. Implement layout utilities (row, column, grid).**  
   **Prompt:**  
   *"Write utility functions `arrangeRow(shapes)`, `arrangeColumn(shapes)`, and `arrangeGrid(shapes, rows, cols)` that reposition shapes accordingly."*

- [ ] **2. Add spacing/alignment logic.**  
   **Prompt:**  
   *"Enhance layout utilities to evenly space shapes with configurable padding. Ensure deterministic positioning across clients."*

- [ ] **3. Cap maximum shapes per layout command.**  
   **Prompt:**  
   *"Add a safeguard so that layout commands cannot create or reposition more than 20 shapes at once."*

---

## Epic 5: Complex Commands (PR 5)

- [ ] **1. Implement multi-step orchestration (forms, navbars, cards).**  
   **Prompt:**  
   *"Extend `applyCanvasCommand` to handle `complex` actions. For `form`, create grouped text + input shapes. For `navbar`, create a horizontal row of text items. For `card`, create a rectangle with title, image placeholder, and description."*

- [ ] **2. Add rollback if partial failure occurs.**  
   **Prompt:**  
   *"Wrap multi-step complex commands in a transaction. If any step fails, rollback all created shapes."*

- [ ] **3. Require confirmation for large batch creations.**  
   **Prompt:**  
   *"Modify the Firebase Function so that if a complex command would create more than 10 elements, it first returns a confirmation request instead of executing immediately."*

---

## Epic 6: Performance & Accuracy (PR 6)

- [ ] **1. Optimize prompts for sub-2s responses.**  
   **Prompt:**  
   *"Refine the system prompt and temperature settings in the Firebase Function to prioritize speed and deterministic JSON output. Target <2s latency."*

- [ ] **2. Build automated test suite with sample prompts.**  
   **Prompt:**  
   *"Write Jest tests that send sample prompts to the Firebase Function and assert that the returned JSON matches the schema and expected values."*

- [ ] **3. Add caching for repeated commands.**  
   **Prompt:**  
   *"Implement a cache layer in the Firebase Function that returns the last response for identical prompts within 30 seconds."*

- [ ] **4. Detect and block prompt injection attempts.**  
   **Prompt:**  
   *"Add a middleware that scans user prompts for suspicious phrases like 'ignore previous instructions' or 'tell me a joke' and rejects them."*

---

## Epic 7: Multi-User Synchronization (PR 7)

- [ ] **1. Ensure Firestore transactions prevent conflicts.**  
   **Prompt:**  
   *"Wrap Firestore writes for shape updates in transactions to prevent race conditions when multiple users manipulate the same shape."*

- [ ] **2. Attribute commands to user IDs in chat.**  
   **Prompt:**  
   *"Modify chat messages so each AI action is logged with the initiating user's ID and display name."*

- [ ] **3. Add audit logs of AI actions.**  
   **Prompt:**  
   *"Create a Firestore collection `aiAuditLogs` that records every AI command, its parameters, and the user who triggered it."*

- [ ] **4. Implement role-based permissions.**  
   **Prompt:**  
   *"Add a role field to user profiles in Firestore. Restrict `complex` commands to users with role=admin."*

---

## Epic 8: UX Polish & Feedback (PR 8)

- [ ] **1. Add loading indicators and inline confirmations.**  
   **Prompt:**  
   *"Enhance `<ChatBox />` to show a spinner while waiting for AI responses and display inline confirmations when commands succeed."*

- [ ] **2. Add user-facing error messages for blocked commands.**  
   **Prompt:**  
   *"Update the chat UI to display friendly error messages when a command is rejected, e.g., 'This command exceeds allowed limits'."*

- [ ] **3. Implement undo/redo for AI commands.**  
   **Prompt:**  
   *"Add undo/redo functionality by storing a history of applied commands in Firestore. Implement `undoCommand()` and `redoCommand()`."*

- [ ] **4. Finalize chatbot persona (concise, friendly).**  
   **Prompt:**  
   *"Refine the system prompt so that confirmations are concise, friendly, and always in JSON or short text feedback."*
