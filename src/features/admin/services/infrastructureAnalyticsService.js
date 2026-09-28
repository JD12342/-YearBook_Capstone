import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase/firebaseConfig.js'

const functionsRegion = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-southeast1'
const functions = getFunctions(firebaseApp, functionsRegion)
const getDatabaseAnalytics = httpsCallable(functions, 'getDatabaseAnalytics')

export const loadInfrastructureAnalytics = async (periodDays = 30) => {
  const response = await getDatabaseAnalytics({ periodDays })
  return response.data
}

export const infrastructureConsoleLinks = (projectId) => ({
  firestore: `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/usage`,
  monitoring: `https://console.cloud.google.com/monitoring/dashboards?project=${projectId}`,
})
