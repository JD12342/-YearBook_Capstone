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
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { auth } from '../../admin/services/firebase/auth.js'
import { db } from '../../admin/services/firebase/firestore.js'

const AuthContext = createContext(null)
const supportedRoles = new Set(['User', 'Administrator'])
const requestableProfileTypes = new Set(['Student', 'Teacher', 'Staff'])
const bootstrapAdministratorUids = new Set(['iVLZld9fcpcPQXbat8jdlmN6AsC3'])

const isBootstrapAdministrator = (firebaseUser) => bootstrapAdministratorUids.has(firebaseUser?.uid)

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'administrator') return 'Administrator'
  if (['user', 'student', 'teacher', 'staff', 'alumni', 'alumnus'].includes(normalized)) return 'User'
  return ''
}

const normalizeProfileType = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'student') return 'Student'
  if (normalized === 'teacher') return 'Teacher'
  if (normalized === 'staff') return 'Staff'
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

const buildProfile = (firebaseUser, source = {}) => ({
  uid: firebaseUser.uid,
  fullName: source.fullName || source.name || firebaseUser.displayName || '',
  email: source.email || firebaseUser.email || '',
  profileType: normalizeProfileType(source.profileType || source.accountType || source.role),
  referenceId: source.referenceId || source.studentNumber || source.employeeNumber || '',
  status: source.status || '',
})

async function resolveAuthorizedAccount(firebaseUser) {
  let roleLookupFailed = false
  let claimRole = ''

  if (isBootstrapAdministrator(firebaseUser)) {
    const administratorProfile = buildProfile(firebaseUser, {
      fullName: firebaseUser.displayName || 'GradBook Administrator',
      role: 'Administrator',
      status: 'active',
    })

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...administratorProfile,
        role: 'Administrator',
        status: 'active',
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch {
      // The UID still resolves locally. Publishing the matching rules enables
      // the one-time trusted profile bootstrap in Firestore.
    }

    return { role: 'Administrator', profile: administratorProfile }
  }

  try {
    const tokenResult = await getIdTokenResult(firebaseUser, true)
    claimRole = normalizeRole(tokenResult.claims.role || (tokenResult.claims.admin ? 'Administrator' : ''))
  } catch {
    roleLookupFailed = true
  }

  try {
    const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
    const profile = profileSnapshot.data()
    const profileRole = normalizeRole(profile?.role)
    if (profileSnapshot.exists() && isActiveProfile(profile)) {
      const assignedRole = claimRole === 'Administrator' ? claimRole : profileRole || claimRole
      if (supportedRoles.has(assignedRole)) return { role: assignedRole, profile: buildProfile(firebaseUser, profile) }
    }
  } catch {
    roleLookupFailed = true
  }

  if (supportedRoles.has(claimRole)) {
    return { role: claimRole, profile: buildProfile(firebaseUser, { role: claimRole, status: 'active' }) }
  }

  try {
    const approvedRequests = await getDocs(query(
      collection(db, 'accountRequests'),
      where('uid', '==', firebaseUser.uid),
      limit(10),
    ))
    const approvedRequest = approvedRequests.docs
      .map((requestDocument) => requestDocument.data())
      .find((requestData) => String(requestData.status || '').toLowerCase() === 'approved')
    const approvedRole = normalizeRole(approvedRequest?.role)
    if (supportedRoles.has(approvedRole)) return { role: approvedRole, profile: buildProfile(firebaseUser, approvedRequest) }
  } catch {
    roleLookupFailed = true
  }

  if (roleLookupFailed) {
    throw createAccessError('auth/role-check-failed', 'GradBook could not verify your account role. Check your connection and try again.')
  }

  return { role: '', profile: buildProfile(firebaseUser) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('')
  const [profile, setProfile] = useState(null)
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
        setProfile(null)
        setLoading(false)
        return
      }

      const sessionUid = nextUser.uid
      try {
        const account = await resolveAuthorizedAccount(nextUser)
        if (!active || auth.currentUser?.uid !== sessionUid) return
        setUser(nextUser)
        setRole(account.role)
        setProfile(account.profile)
        setAuthorizationError(account.role ? '' : 'Your account is awaiting approval or does not have a GradBook role yet.')
      } catch (error) {
        if (!active || auth.currentUser?.uid !== sessionUid) return
        setUser(nextUser)
        setRole('')
        setProfile(buildProfile(nextUser))
        setAuthorizationError(error.message)
      } finally {
        if (active && auth.currentUser?.uid === sessionUid) setLoading(false)
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
      const account = await resolveAuthorizedAccount(credential.user)
      if (!account.role) {
        throw createAccessError('auth/access-not-approved', 'Your account is awaiting approval or does not have a GradBook role yet.')
      }
      setUser(credential.user)
      setRole(account.role)
      setProfile(account.profile)
      return { user: credential.user, role: account.role, profile: account.profile }
    } catch (error) {
      await signOut(auth)
      setUser(null)
      setRole('')
      setProfile(null)
      setAuthorizationError(error.message)
      throw error
    }
  }

  const register = async ({ fullName, email, password, profileType, referenceId }) => {
    const normalizedProfileType = normalizeProfileType(profileType)
    if (!requestableProfileTypes.has(normalizedProfileType)) {
      throw createAccessError('auth/invalid-profile-type', 'Choose Student, Teacher, or Staff for your school profile.')
    }
    if (!String(referenceId || '').trim()) {
      throw createAccessError('auth/missing-reference-id', 'Enter your student, LRN, or employee number.')
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await addDoc(collection(db, 'accountRequests'), {
        uid: credential.user.uid,
        fullName,
        email: credential.user.email,
        role: 'User',
        profileType: normalizedProfileType,
        referenceId: String(referenceId).trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } finally {
      await signOut(auth)
      setUser(null)
      setRole('')
      setProfile(null)
    }

    return { status: 'pending' }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole('')
    setProfile(null)
    setAuthorizationError('')
  }

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      loading,
      authorizationError,
      isAuthenticated: Boolean(user && role),
      clearAuthorizationError: () => setAuthorizationError(''),
      login,
      register,
      logout,
    }),
    [user, role, profile, loading, authorizationError],
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
