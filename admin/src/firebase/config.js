import { getApp, getApps, initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-admin-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-admin-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-admin-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-admin-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-admin-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-XXXXXXXXXX',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export default firebaseApp;
