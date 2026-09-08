import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { firebaseApp } from './firebaseConfig.js'

export const auth = getAuth(firebaseApp)

export const reauthenticateAdmin = async (password) => {
  const currentUser = auth.currentUser

  if (!currentUser || !currentUser.email) {
    throw new Error('No active admin session found.')
  }

  const credential = EmailAuthProvider.credential(currentUser.email, password)
  await reauthenticateWithCredential(currentUser, credential)
  return currentUser
}

export const loginAdmin = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export const registerAdmin = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export const logoutAdmin = async () => {
  await signOut(auth)
}

export const getCurrentUser = () => auth.currentUser

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback)
