import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

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
    // TODO: Ensure environment variables are set in .env.local before initializing in production
    app = initializeApp(firebaseConfig)
    // Initialize services side-effects to ensure modules are bundled
    getDatabase(app)
    getFirestore(app)
    getAuth(app)
  }
  return app
}

// Export individual service getters
export function getFirestoreDB() {
  return getFirestore(getFirebaseApp())
}

export function getRealtimeDB() {
  return getDatabase(getFirebaseApp())
}

export function getAuthService() {
  return getAuth(getFirebaseApp())
}


