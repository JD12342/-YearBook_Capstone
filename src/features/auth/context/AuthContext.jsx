import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore'
import { auth } from '../../admin/services/firebase/auth.js'
import { db } from '../../admin/services/firebase/firestore.js'

const AuthContext = createContext(null)
const supportedRoles = new Set(['Student', 'Alumni', 'Staff', 'Administrator'])
const requestableRoles = new Set(['Student', 'Alumni', 'Staff'])

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'administrator') return 'Administrator'
  if (normalized === 'staff') return 'Staff'
  if (normalized === 'student') return 'Student'
  if (normalized === 'alumni' || normalized === 'alumnus') return 'Alumni'
  return ''
}

const isActiveProfile = (profile) => {
  const status = String(profile?.status || '').toLowerCase()
  return status === 'active' || status === 'approved'
}

const createAccessError = (code, message) => {
  const error = new Error(message)
  error.code = code
  return error
}

async function resolveAuthorizedRole(firebaseUser) {
  let roleLookupFailed = false

  try {
    const tokenResult = await getIdTokenResult(firebaseUser, true)
    const claimRole = normalizeRole(tokenResult.claims.role || (tokenResult.claims.admin ? 'Administrator' : ''))
    if (supportedRoles.has(claimRole)) return claimRole
  } catch {
    roleLookupFailed = true
  }

  try {
    const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
    const profile = profileSnapshot.data()
    const profileRole = normalizeRole(profile?.role)
    if (profileSnapshot.exists() && isActiveProfile(profile) && supportedRoles.has(profileRole)) return profileRole
  } catch {
    roleLookupFailed = true
  }

  try {
    const approvedRequests = await getDocs(query(
      collection(db, 'accountRequests'),
      where('uid', '==', firebaseUser.uid),
      where('status', '==', 'approved'),
      limit(1),
    ))
    const approvedRole = normalizeRole(approvedRequests.docs[0]?.data()?.role)
    if (supportedRoles.has(approvedRole)) return approvedRole
  } catch {
    roleLookupFailed = true
  }

  if (roleLookupFailed) {
    throw createAccessError('auth/role-check-failed', 'GradBook could not verify your account role. Check your connection and try again.')
  }

  return ''
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('')
  const [authorizationError, setAuthorizationError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return
      setLoading(true)

      if (!nextUser) {
        setUser(null)
        setRole('')
        setLoading(false)
        return
      }

      try {
        const assignedRole = await resolveAuthorizedRole(nextUser)
        if (!active) return
        setUser(nextUser)
        setRole(assignedRole)
        setAuthorizationError(assignedRole ? '' : 'Your account is awaiting approval or does not have a GradBook role yet.')
      } catch (error) {
        if (!active) return
        setUser(nextUser)
        setRole('')
        setAuthorizationError(error.message)
      } finally {
        if (active) setLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const login = async ({ email, password, rememberMe = false }) => {
    setAuthorizationError('')
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    const credential = await signInWithEmailAndPassword(auth, email, password)

    try {
      const assignedRole = await resolveAuthorizedRole(credential.user)
      if (!assignedRole) {
        throw createAccessError('auth/access-not-approved', 'Your account is awaiting approval or does not have a GradBook role yet.')
      }
      setUser(credential.user)
      setRole(assignedRole)
      return { user: credential.user, role: assignedRole }
    } catch (error) {
      await signOut(auth)
      setUser(null)
      setRole('')
      setAuthorizationError(error.message)
      throw error
    }
  }

  const register = async ({ fullName, email, password, role: requestedRole }) => {
    const normalizedRole = normalizeRole(requestedRole)
    if (!requestableRoles.has(normalizedRole)) {
      throw createAccessError('auth/invalid-role', 'Choose a valid account type to request access.')
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await addDoc(collection(db, 'accountRequests'), {
        uid: credential.user.uid,
        fullName,
        email: credential.user.email,
        role: normalizedRole,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } finally {
      await signOut(auth)
      setUser(null)
      setRole('')
    }

    return { status: 'pending' }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole('')
    setAuthorizationError('')
  }

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      authorizationError,
      isAuthenticated: Boolean(user && role),
      clearAuthorizationError: () => setAuthorizationError(''),
      login,
      register,
      logout,
    }),
    [user, role, loading, authorizationError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
