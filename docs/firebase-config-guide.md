# Firebase Configuration Guide

This guide covers all the options available for configuring Firebase in your CollabCanvas application.

## Current Configuration

Your Firebase is currently configured in `src/services/firebase.ts` with basic settings. Here's what you can customize:

## 1. Environment-Specific Configurations

### Setup Multiple Environments

Create different `.env` files for different environments:

**`.env.local`** (Development)
```bash
VITE_FIREBASE_API_KEY=dev_api_key
VITE_FIREBASE_PROJECT_ID=dev-project-id
VITE_FIREBASE_AUTH_DOMAIN=dev-project.firebaseapp.com
# ... other dev config
```

**`.env.staging`** (Staging)
```bash
VITE_FIREBASE_API_KEY=staging_api_key
VITE_FIREBASE_PROJECT_ID=staging-project-id
# ... staging config
```

**`.env.production`** (Production)
```bash
VITE_FIREBASE_API_KEY=prod_api_key
VITE_FIREBASE_PROJECT_ID=prod-project-id
# ... production config
```

### Enhanced Configuration with Environment Detection

You can enhance `src/services/firebase.ts` to automatically detect the environment:

```typescript
// Detect environment
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD
const env = import.meta.env.MODE // 'development', 'production', 'staging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}
```

## 2. Firebase Emulator Suite

### Setup Emulators for Local Development

1. **Install Firebase Tools** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Initialize Emulators**:
```bash
firebase init emulators
```

3. **Configure `firebase.json`** to include emulators:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "database": {
      "port": 9000
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

4. **Update `src/services/firebase.ts`** to connect to emulators in development:

```typescript
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  // ... your config
}

let app: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig)
    
    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      const auth = getAuth(app)
      const db = getFirestore(app)
      const rtdb = getDatabase(app)
      const functions = getFunctions(app)
      
      // Only connect if not already connected
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        connectFirestoreEmulator(db, 'localhost', 8080)
        connectDatabaseEmulator(rtdb, 'localhost', 9000)
        connectFunctionsEmulator(functions, 'localhost', 5001)
        console.log('🔥 Connected to Firebase Emulators')
      } catch (error) {
        // Already connected or emulator not running
        console.warn('Emulator connection failed:', error)
      }
    }
    
    // Initialize services
    getDatabase(app)
    getFirestore(app)
    getAuth(app)
  }
  return app
}
```

5. **Add to `.env.local`**:
```bash
VITE_USE_EMULATOR=true
```

6. **Start Emulators**:
```bash
firebase emulators:start
```

## 3. Performance Settings

### Firestore Performance Configuration

```typescript
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'

export function getFirestoreDB() {
  const db = getFirestore(getFirebaseApp())
  
  // Enable offline persistence (caches data locally)
  if (import.meta.env.DEV) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab
        console.warn('Firestore persistence already enabled in another tab')
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support persistence
        console.warn('Firestore persistence not supported in this browser')
      }
    })
  }
  
  return db
}
```

### Realtime Database Performance

```typescript
import { getDatabase, goOnline, goOffline } from 'firebase/database'

export function getRealtimeDB() {
  const db = getDatabase(getFirebaseApp())
  
  // Configure connection settings
  // goOnline(db) // Explicitly connect
  // goOffline(db) // Disconnect
  
  return db
}
```

## 4. Security Rules Configuration

### Firestore Rules (`firestore.rules`)

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
  }
  
  function hasDocumentAccess(documentId) {
    return exists(/databases/$(database)/documents/documents/$(documentId)) &&
      (get(/databases/$(database)/documents/documents/$(documentId)).data.ownerId == request.auth.uid ||
       request.auth.uid in get(/databases/$(database)/documents/documents/$(documentId)).data.collaborators);
  }
}
```

### Realtime Database Rules (`database.rules.json`)

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "cursors": {
      "$documentId": {
        "$uid": {
          ".read": true,
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}
```

## 5. Multiple Firebase Projects

### Support Multiple Projects in Same App

```typescript
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

// Primary app (default)
let primaryApp: FirebaseApp | undefined

// Secondary app (e.g., for analytics)
let secondaryApp: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!primaryApp) {
    primaryApp = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      // ... primary config
    }, 'primary')
  }
  return primaryApp
}

export function getSecondaryFirebaseApp(): FirebaseApp {
  if (!secondaryApp) {
    secondaryApp = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_SECONDARY_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_SECONDARY_PROJECT_ID,
      // ... secondary config
    }, 'secondary')
  }
  return secondaryApp
}
```

## 6. Custom Initialization with Error Handling

### Enhanced Configuration with Validation

```typescript
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

function validateFirebaseConfig(config: Record<string, string | undefined>): void {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]
  
  const missing = required.filter(key => !config[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    )
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    // Validate configuration
    if (import.meta.env.PROD) {
      validateFirebaseConfig(firebaseConfig)
    }
    
    try {
      app = initializeApp(firebaseConfig)
      
      // Initialize services with error handling
      try {
        getDatabase(app)
        getFirestore(app)
        getAuth(app)
      } catch (serviceError) {
        console.error('Error initializing Firebase services:', serviceError)
        throw serviceError
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Firebase initialized successfully')
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error)
      throw error
    }
  }
  return app
}
```

## 7. Analytics Configuration

### Enable Firebase Analytics

```typescript
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'

export async function initializeAnalytics() {
  const supported = await isSupported()
  
  if (supported) {
    const app = getFirebaseApp()
    const analytics = getAnalytics(app)
    
    // Log custom events
    logEvent(analytics, 'app_initialized')
    
    return analytics
  }
  
  return null
}
```

## 8. Storage Configuration

### Firebase Storage Setup

```typescript
import { getStorage } from 'firebase/storage'

export function getStorageService() {
  const app = getFirebaseApp()
  return getStorage(app, `gs://${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}`)
}
```

## 9. Functions Configuration

### Custom Functions Region

```typescript
import { getFunctions } from 'firebase/functions'

export function getFunctionsService(region: string = 'us-central1') {
  const app = getFirebaseApp()
  return getFunctions(app, region)
}
```

## Quick Reference: Common Configurations

### Development Mode
- Use emulators for local testing
- Enable verbose logging
- Disable analytics
- Use development Firebase project

### Production Mode
- Connect to production Firebase
- Enable analytics
- Optimize performance settings
- Use production security rules

### Staging Mode
- Use staging Firebase project
- Enable emulators for testing
- Use production-like security rules
- Enable analytics for testing

## Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use different projects** for dev/staging/prod
3. **Validate configuration** before initialization
4. **Use emulators** for local development
5. **Enable offline persistence** for better UX
6. **Configure security rules** properly
7. **Monitor Firebase usage** in console
8. **Set up error tracking** for Firebase errors

## Troubleshooting

### Configuration Not Loading
- Check `.env.local` file exists
- Verify all variables start with `VITE_`
- Restart dev server after changing `.env.local`

### Emulator Connection Issues
- Ensure emulators are running: `firebase emulators:start`
- Check ports aren't already in use
- Verify `VITE_USE_EMULATOR=true` in `.env.local`

### Authentication Errors
- Check authorized domains in Firebase Console
- Verify OAuth credentials are configured
- Ensure API keys are correct


