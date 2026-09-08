import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from './firebaseConfig.js'

export const db = getFirestore(firebaseApp)
