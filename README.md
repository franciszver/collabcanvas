# CollabCanvas

[![Version](https://img.shields.io/badge/version-0.0.71-blue.svg)](https://github.com/yourusername/collabcanvas)
[![Test Coverage](https://img.shields.io/badge/coverage-44%25-yellow.svg)](https://github.com/yourusername/collabcanvas)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange.svg)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://react.dev/)

> Real-time collaborative canvas with AI-powered shape generation and natural language commands

[**Live Demo →**](https://collabcanvas-aac98.firebaseapp.com/) | [Documentation](docs/) | [Keyboard Shortcuts](#keyboard-shortcuts)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Development](#development)
- [AI Agent Setup](#ai-agent-setup)
- [Testing](#testing)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

## Features

### Core Collaboration
- **Real-time multi-user editing** - See changes instantly across all connected users
- **Live cursor tracking** - View collaborators' cursors with name labels (<50ms latency)
- **Presence awareness** - See who's online and actively editing
- **Shape locking** - Lock shapes to prevent conflicts, auto-unlock on disconnect
- **Conflict resolution** - Last-write-wins strategy with visual feedback

### Shape Creation & Editing
- **6 shape types** - Rectangle, Circle, Triangle, Star, Arrow, Text
- **Multi-shape selection** - Box selection (Space+Drag), shift-click, select all
- **Bulk operations** - Edit color, stroke, size, position for multiple shapes
- **Layer management** - Bring to front, send to back, z-index control
- **Grouping** - Create, rename, and manage permanent shape groups
- **Precise positioning** - Nudge shapes with arrow keys (1px or 10px)

### AI-Powered Commands
- **Natural language interface** - Chat with AI to create and manipulate shapes
- **Smart shape generation** - "Create a 3x3 grid of blue circles"
- **Layout commands** - "Arrange shapes in a row with 50px spacing"
- **Form templates** - Generate login, signup, and contact forms
- **Template generation** - Create navbars, cards, and UI components

### Canvas Controls
- **Pan & zoom** - Smooth navigation with mouse/trackpad (60 FPS)
- **Viewport persistence** - Canvas state saved across sessions
- **Responsive design** - Adapts to different screen sizes
- **Keyboard shortcuts** - 30+ shortcuts for power users (press `?` for help)

### Developer Features
- **TypeScript** - Full type safety across the codebase
- **Comprehensive testing** - 320 tests with Jest and React Testing Library
- **Firebase integration** - Firestore + Realtime Database + Authentication + Hosting
- **Vite build system** - Fast development with HMR
- **ESLint configured** - Code quality and consistency

## Tech Stack

**Frontend**
- [React 18.3.1](https://react.dev/) - UI framework
- [TypeScript 5.9.3](https://www.typescriptlang.org/) - Type safety
- [Konva 9.3.16](https://konvajs.org/) - Canvas rendering library
- [React Konva 18.2.10](https://konvajs.org/docs/react/) - React bindings for Konva
- [Vite 7.1.14](https://vitejs.dev/) - Build tool and dev server

**Backend & Services**
- [Firebase 11.10.0](https://firebase.google.com/) - Backend platform
  - Firestore - Real-time database for shapes and state
  - Realtime Database - Cursor position and presence tracking
  - Authentication - Google OAuth sign-in
  - Hosting - Static site hosting
  - Functions - Serverless AI agent backend
- [OpenAI API](https://openai.com/) - AI agent for natural language commands (GPT-3.5-turbo)

**Testing & Quality**
- [Jest 29.7.0](https://jestjs.io/) - Test runner
- [React Testing Library 16.0.1](https://testing-library.com/react) - Component testing
- [ESLint 9.36.0](https://eslint.org/) - Code linting
- [TypeScript ESLint 8.45.0](https://typescript-eslint.io/) - TS-specific linting rules

**State Management**
- React Context API - Global state management
- Custom hooks - Encapsulated business logic

## Dependencies

### System Requirements

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x or higher | JavaScript runtime |
| **npm** | 9.x or higher | Package manager |
| **Git** | Latest | Version control |

### Core Dependencies (Production)

These packages are required to run the application:

```json
{
  "firebase": "^11.10.0",           // Backend platform (Auth, Firestore, RTDB, Functions)
  "firebase-functions": "^6.5.0",   // Cloud Functions for AI agent
  "konva": "^9.3.16",               // Canvas rendering engine
  "react": "^18.3.1",               // UI framework
  "react-dom": "^18.3.1",           // React DOM renderer
  "react-konva": "^18.2.10"         // React bindings for Konva
}
```

**Why these dependencies?**

- **Firebase 11.10.0**: Provides real-time database, authentication, cloud functions, and hosting. The all-in-one backend eliminates need for custom server infrastructure.
- **Konva 9.3.16**: High-performance canvas library optimized for shape manipulation and rendering. Handles 60 FPS animations smoothly.
- **React 18.3.1**: Latest stable React with concurrent features, hooks, and optimized rendering.
- **React Konva 18.2.10**: Declarative React wrapper for Konva, enabling React-style component composition for canvas elements.

### Development Dependencies

These packages are used during development and testing:

```json
{
  "@eslint/js": "^9.36.0",                          // ESLint core
  "@testing-library/jest-dom": "^6.6.3",            // Custom Jest matchers for DOM
  "@testing-library/react": "^16.0.1",              // React testing utilities
  "@testing-library/user-event": "^14.6.1",         // User interaction simulation
  "@types/jest": "^29.5.14",                        // TypeScript types for Jest
  "@types/node": "^24.6.0",                         // Node.js TypeScript types
  "@types/react": "^18.3.8",                        // React TypeScript types
  "@types/react-dom": "^18.3.0",                    // React DOM TypeScript types
  "@types/testing-library__jest-dom": "^5.14.9",   // Jest DOM TypeScript types
  "@vitejs/plugin-react": "^5.0.4",                // Vite plugin for React
  "eslint": "^9.36.0",                              // Code linting
  "eslint-plugin-react-hooks": "^5.2.0",           // React Hooks linting rules
  "eslint-plugin-react-refresh": "^0.4.22",        // React Refresh linting
  "globals": "^16.4.0",                             // Global variables definitions
  "jest": "^29.7.0",                                // Testing framework
  "jest-environment-jsdom": "^29.7.0",             // JSDOM environment for Jest
  "ts-jest": "^29.2.5",                            // TypeScript support for Jest
  "typescript": "~5.9.3",                           // TypeScript compiler
  "typescript-eslint": "^8.45.0",                   // TypeScript ESLint rules
  "vite": "npm:rolldown-vite@7.1.14"               // Build tool (Rolldown variant)
}
```

**Development tooling breakdown:**

- **Testing**: Jest + React Testing Library for comprehensive unit/integration tests
- **Type Safety**: TypeScript 5.9.3 with strict mode enabled
- **Linting**: ESLint with TypeScript and React-specific rules
- **Build Tool**: Vite (Rolldown variant) for fast development and optimized production builds
- **Type Definitions**: Complete TypeScript types for all major libraries

### Optional Dependencies

For full functionality, you'll also need:

| Service | Purpose | Required For |
|---------|---------|--------------|
| **Firebase Account** | Backend services | ✅ Core functionality |
| **Google OAuth** | User authentication | ✅ Sign-in |
| **OpenAI API Key** | AI agent commands | ⚠️ Optional (AI features only) |

### Dependency Installation

Install all dependencies:

```bash
# Install main dependencies
npm install

# Install Firebase Functions dependencies (for AI features)
cd functions && npm install && cd ..
```

### Checking Installed Versions

Verify your dependencies:

```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Check npm version
npm --version   # Should be 9.x or higher

# List installed packages
npm list --depth=0

# Check for outdated packages
npm outdated
```

### Updating Dependencies

Keep dependencies up to date:

```bash
# Update to latest compatible versions
npm update

# Check for major version updates
npm outdated

# Update a specific package
npm install <package-name>@latest
```

### Security Considerations

- All dependencies are pinned to specific versions for stability
- Regular security audits recommended: `npm audit`
- Firebase provides automatic security updates
- OpenAI API key should be stored in Firebase Functions secrets (never in client code)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account with project created
- OpenAI API key (for AI agent features)
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/collabcanvas.git
cd collabcanvas
```

2. Install dependencies
```bash
npm install
```

3. Install Firebase Functions dependencies
```bash
cd functions
npm install
cd ..
```

### Environment Setup

Create a `.env.local` file in the project root with your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

See `.env.example` for a complete template.

**Get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Navigate to Project Settings > General
4. Under "Your apps", create a web app
5. Copy the config values to `.env.local`

## Running Locally

Follow these steps to run CollabCanvas on your local machine:

### Step 1: Verify Prerequisites

Ensure you have the required software installed:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

### Step 2: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enable the following services:
   - **Authentication** → Enable Google sign-in provider
   - **Firestore Database** → Create database in production mode
   - **Realtime Database** → Create database
   - **Hosting** → Set up hosting (optional for local dev)

### Step 3: Get Your Firebase Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **web icon** (`</>`) to create a web app
4. Register your app (name it "CollabCanvas Local" or similar)
5. Copy the Firebase configuration object

### Step 4: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/collabcanvas.git

# Navigate to the project directory
cd collabcanvas

# Install frontend dependencies
npm install

# Install Firebase Functions dependencies (optional, only needed for AI features)
cd functions
npm install
cd ..
```

### Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Create the file
touch .env.local

# Or copy from example
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials:

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> **Note:** The AI agent features require additional setup (see [AI Agent Setup](#ai-agent-setup) section below). You can skip this for basic local development.

### Step 6: Start the Development Server

```bash
npm run dev
```

You should see output like:

```
  VITE v7.1.14  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 7: Open the Application

1. Open your browser to `http://localhost:5173`
2. You should see the CollabCanvas welcome screen
3. Click "Sign in with Google" to authenticate
4. Grant permissions when prompted
5. You're ready to start creating!

### Step 8: Verify Everything Works

Test these core features:

- ✅ **Authentication**: Sign in with Google works
- ✅ **Canvas**: Canvas loads and you can pan/zoom
- ✅ **Shapes**: Click the shape selector to create shapes
- ✅ **Real-time**: Open a second browser window (incognito) and verify shapes sync

### Common Issues

#### Port Already in Use

If port 5173 is occupied:

```bash
# Kill the process using the port (Unix/Mac)
lsof -ti:5173 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3000
```

#### Firebase Configuration Error

```
Error: Firebase configuration is invalid
```

**Solution:** Double-check your `.env.local` file:
- All variables start with `VITE_`
- No quotes around values
- No trailing spaces
- File is in the project root (not in `src/`)

#### Authentication Fails

```
Error: This domain is not authorized
```

**Solution:** Add `localhost` to authorized domains:
1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add `localhost`

#### Shapes Not Syncing

**Solution:** 
1. Check Firestore security rules allow authenticated reads/writes
2. Verify you're signed in
3. Check browser console for errors
4. Ensure Firestore Database is created (not in "locked mode")

### Development Scripts

Once running locally, you can use these commands:

```bash
# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (great for TDD)
npm run test:watch

# Lint your code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Hot Reload

The development server supports Hot Module Replacement (HMR):

- **JavaScript/TypeScript changes**: Instant updates without page refresh
- **CSS changes**: Updates instantly
- **React component changes**: Preserves component state when possible

### Working with Multiple Users

To test real-time collaboration locally:

1. Open `http://localhost:5173` in your primary browser
2. Open `http://localhost:5173` in an incognito/private window
3. Sign in with different Google accounts (or the same account)
4. Create shapes in one window and watch them appear in the other!

### Next Steps

- **Enable AI features**: See [AI Agent Setup](#ai-agent-setup) below
- **Explore keyboard shortcuts**: Press `?` in the app
- **Read the architecture**: Check out [ARCHITECTURE.md](ARCHITECTURE.md)
- **Run the tests**: `npm test` to verify everything works

---

## Development

**Quick reference for developers:**

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
npm run lint            # Check code quality
npm run build           # Create production build
```

**Available scripts:**
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

## AI Agent Setup

The AI agent enables natural language commands for canvas manipulation.

### Prerequisites
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Firebase Functions deployed

### Configuration

1. Add OpenAI API key to Firebase Functions secrets:
```bash
firebase functions:secrets:set OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

2. Deploy Firebase Functions:
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Usage Examples

Once configured, use the chat interface to:

- **Create shapes**: "Create a red circle at position 100,200"
- **Generate grids**: "Make a 3x3 grid of blue rectangles"
- **Create forms**: "Generate a login form"
- **Arrange shapes**: "Arrange all shapes in a row with 50px spacing"
- **Smart manipulation**: "Make all blue shapes bigger"

The AI agent validates commands against a JSON schema and executes them safely.

**Note:** AI commands require an active internet connection and consume OpenAI API credits.

## Testing

Run the test suite:

```bash
npm test
```

**Test Coverage:**
- Total tests: 320
- Current coverage: 44%
- Test framework: Jest + React Testing Library

**Run with coverage:**
```bash
npm run test:coverage
```

**Watch mode (for development):**
```bash
npm run test:watch
```

**Test Organization:**
- `src/__tests__/components/` - Component tests
- `src/__tests__/hooks/` - Custom hook tests
- `src/__tests__/services/` - Service layer tests
- `src/__tests__/integration/` - Integration tests
- `src/__tests__/utils/` - Utility function tests

## Keyboard Shortcuts

Press `?` in the app to see the full shortcuts help dialog.

### Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Select all shapes |
| `Space+Drag` | Box selection |
| `Shift+Click` | Toggle shape selection |
| `Delete` | Delete selected shapes |
| `Ctrl+D` | Duplicate selected shapes |
| `Ctrl+G` | Group selected shapes |
| `Ctrl+L` | Lock selected shapes |
| `Arrow Keys` | Nudge shapes (1px) |
| `Shift+Arrow` | Nudge shapes (10px) |
| `Ctrl+]` | Bring to front |
| `Ctrl+[` | Send to back |
| `?` | Show keyboard shortcuts help |

**7 categories available:**
- Selection (5 shortcuts)
- Editing (4 shortcuts)
- Smart Selection (3 shortcuts)
- Layer Management (2 shortcuts)
- Movement (2 shortcuts)
- Grouping (2 shortcuts)
- Canvas Navigation (3 shortcuts)

See `src/components/KeyboardShortcutsHelp.tsx` for the complete list.

## Architecture

CollabCanvas uses a modern React architecture with Firebase for real-time collaboration.

### 📖 Comprehensive Architecture Documentation

**[View Full Architecture Document →](ARCHITECTURE.md)**

The architecture document includes:
- High-level system architecture diagrams
- Component hierarchy with Mermaid diagrams
- State management patterns
- Real-time collaboration strategies
- Firebase data structure (Firestore + Realtime DB)
- AI agent architecture
- Authentication flow
- Performance optimizations
- Design patterns and best practices

### Quick Overview

- **Frontend**: React 18 + TypeScript + Konva for canvas rendering
- **State Management**: React Context API with custom hooks
- **Real-time Sync**: Firestore for persistent shapes, Realtime Database for ephemeral data (cursors, live drag)
- **AI Backend**: Firebase Functions + OpenAI GPT-3.5-turbo
- **Authentication**: Firebase Auth with Google OAuth

**Key Design Patterns:**
- Context providers for global state
- Custom hooks for business logic encapsulation
- Service layer for Firebase operations
- Optimistic updates for responsive UX
- Last-write-wins conflict resolution

**Related Documentation:**
- [Architecture Details](ARCHITECTURE.md) - Complete architecture with diagrams
- [Firestore Schema](docs/firestore-schema.md) - Database structure
- [Product Requirements](docs/prd.md) - Original MVP requirements
- [AI Integration](docs/ai-integration-prd.md) - AI agent design

## Deployment

**Live Application:** [https://collabcanvas-aac98.firebaseapp.com/](https://collabcanvas-aac98.firebaseapp.com/)

### Deploy to Firebase Hosting

1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy --only hosting
```

**Note:** The predeploy hook automatically:
- Builds the application
- Bumps the version number (`APP_VERSION`)
- Rebuilds with the new version

### Deploy Functions (AI Agent)

Deploy Firebase Functions for AI agent:
```bash
cd functions
npm run build
firebase deploy --only functions
cd ..
```

### Full Deployment

Deploy everything (hosting + functions):
```bash
npm run build
firebase deploy
```

**Deployment checklist:**
- [ ] Environment variables configured
- [ ] Firebase project created
- [ ] OpenAI API key set in Functions secrets
- [ ] Firestore indexes deployed
- [ ] Security rules configured
- [ ] Build succeeds locally
- [ ] Tests passing

See [Deployment Guide](docs/deployment/) for detailed instructions.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Guidelines:**
- Write tests for new features
- Follow the existing code style (ESLint configured)
- Update documentation as needed
- Ensure all tests pass before submitting PR

**Areas for Contribution:**
- Test coverage improvement (target: 70%+)
- Performance optimizations
- New shape types
- Additional AI command capabilities
- Accessibility improvements
- Mobile responsiveness

## Documentation

### Main Documentation
- [Product Requirements (PRD)](docs/prd.md) - Original MVP requirements
- [Architecture Overview](docs/architecture.md) - System architecture diagram
- [Firestore Schema](docs/firestore-schema.md) - Database structure
- [AI Integration PRD](docs/ai-integration-prd.md) - AI agent design

### Implementation Guides
- [Multi-Selection Implementation](MULTI_SELECTION_IMPLEMENTATION_SUMMARY.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Quick Reference](QUICK_REFERENCE.md)

### Component Documentation
- Keyboard shortcuts: `src/components/KeyboardShortcutsHelp.tsx`
- Shape selector: `src/components/Header/ShapeSelector.tsx`
- Canvas component: `src/components/Canvas/Canvas.tsx`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://react.dev/) and [Konva](https://konvajs.org/)
- Real-time collaboration powered by [Firebase](https://firebase.google.com/)
- AI capabilities via [OpenAI](https://openai.com/)
- Testing with [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/)

## Project Status

**Version:** 0.0.71  
**Status:** Active Development  
**Test Coverage:** 44%  
**Tests Passing:** 301/320

---

Made with ❤️ by the CollabCanvas team
