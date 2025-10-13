import { initializeApp, type FirebaseApp } from 'firebase/app'
// TODO: Replace with real imports where used: getAuth, getFirestore, etc.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
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
  }
  return app
}


