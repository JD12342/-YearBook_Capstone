import { getApp, getApps, initializeApp } from 'firebase/app'
import { firebaseConfig } from '../../firebase/config.js'

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your-admin-project-id' &&
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'your-admin-api-key',
)

export default firebaseApp
