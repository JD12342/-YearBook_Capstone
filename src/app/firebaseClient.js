import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-XXXXXXXXXX',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
let firestore
try {
  firestore = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
} catch {
  // Reuse an existing Firestore instance when hot reload initialized it first.
  firestore = getFirestore(firebaseApp)
}
export const db = firestore
export const storage = getStorage(firebaseApp)
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_PROJECT_ID
    && !import.meta.env.VITE_FIREBASE_PROJECT_ID.startsWith('demo-')
    && import.meta.env.VITE_FIREBASE_API_KEY
    && !import.meta.env.VITE_FIREBASE_API_KEY.startsWith('demo-'),
)
