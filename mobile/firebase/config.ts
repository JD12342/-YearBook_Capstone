import { getApp, getApps, initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-mobile-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-mobile-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-mobile-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-mobile-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1234567890',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'demo-mobile-app-id',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-XXXXXXXXXX',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export default firebaseApp;
