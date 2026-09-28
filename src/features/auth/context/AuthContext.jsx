import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../../app/firebaseClient.js'

const AuthContext = createContext(null)
const supportedRoles = new Set(['User', 'Teacher', 'Administrator'])
const requestableProfileTypes = new Set(['Student', 'Teacher'])
const bootstrapAdministratorUids = new Set(['iVLZld9fcpcPQXbat8jdlmN6AsC3'])

const isBootstrapAdministrator = (firebaseUser) => bootstrapAdministratorUids.has(firebaseUser?.uid)

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'administrator') return 'Administrator'
  if (normalized === 'teacher') return 'Teacher'
  if (['user', 'student', 'staff', 'alumni', 'alumnus'].includes(normalized)) return 'User'
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

const firebaseErrorMessages = {
  'auth/email-already-in-use': 'An account already exists for this email. Sign in instead or use a different email.',
  'auth/invalid-credential': 'The email or password is incorrect. Please check both and try again.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/network-request-failed': 'We could not connect to GradBook. Check your internet connection and try again.',
  'auth/operation-not-allowed': 'Account access is temporarily unavailable. Please contact the school.',
  'auth/too-many-requests': 'Too many attempts were made. Please wait a few minutes before trying again.',
  'auth/user-disabled': 'This account has been disabled. Please contact the school.',
  'auth/user-not-found': 'The email or password is incorrect. Please check both and try again.',
  'auth/weak-password': 'Use a stronger password with at least 6 characters.',
  'auth/wrong-password': 'The email or password is incorrect. Please check both and try again.',
  'permission-denied': 'GradBook could not complete this request. Please contact the school if the problem continues.',
  unavailable: 'GradBook is temporarily unavailable. Check your connection and try again.',
}

const getFriendlyAuthError = (error, fallback) => {
  if (error?.code && firebaseErrorMessages[error.code]) return firebaseErrorMessages[error.code]
  return fallback
}

const buildProfile = (firebaseUser, source = {}) => ({
  uid: firebaseUser.uid,
  fullName: source.fullName || source.name || firebaseUser.displayName || '',
  email: source.email || firebaseUser.email || '',
  profileType: normalizeProfileType(source.profileType || source.accountType || source.role),
  referenceId: source.referenceId || source.studentNumber || source.employeeNumber || '',
  status: source.status || '',
  contributorType: source.contributorType || '',
  position: source.position || '',
  phone: source.phone || '',
  bio: source.bio || '',
  preferences: source.preferences || null,
})

async function resolveAuthorizedAccount(firebaseUser) {
  let roleLookupFailed = false
  let claimRole = ''
  let storedProfile = null

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
    if (profileSnapshot.exists()) storedProfile = profile
    const profileRole = normalizeRole(profile?.role)
    if (profileSnapshot.exists() && isActiveProfile(profile)) {
      const assignedRole = claimRole === 'Administrator' ? claimRole : profileRole || claimRole
      if (supportedRoles.has(assignedRole)) return { role: assignedRole, profile: buildProfile(firebaseUser, profile) }
    }
  } catch {
    roleLookupFailed = true
  }

  if (storedProfile && !isActiveProfile(storedProfile)) {
    return { role: '', profile: buildProfile(firebaseUser, storedProfile) }
  }

  if (!storedProfile && supportedRoles.has(claimRole)) {
    return { role: claimRole, profile: buildProfile(firebaseUser, { role: claimRole, status: 'active' }) }
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
      } catch {
        if (!active || auth.currentUser?.uid !== sessionUid) return
        setUser(nextUser)
        setRole('')
        setProfile(buildProfile(nextUser))
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
    let credential

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      credential = await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw createAccessError(error?.code || 'auth/sign-in-failed', getFriendlyAuthError(error, 'We could not sign you in. Please try again.'))
    }

    try {
      const account = await resolveAuthorizedAccount(credential.user)
      if (!account.role) {
        throw createAccessError('auth/access-not-approved', 'Your account is awaiting approval.')
      }
      setUser(credential.user)
      setRole(account.role)
      setProfile(account.profile)
      return { user: credential.user, role: account.role, profile: account.profile }
    } catch (error) {
      await signOut(auth).catch(() => {})
      setUser(null)
      setRole('')
      setProfile(null)
      const message = getFriendlyAuthError(error, 'We could not finish signing you in. Please try again.')
      throw createAccessError(error?.code || 'auth/sign-in-failed', message)
    }
  }

  const register = async ({ fullName, email, password, profileType, referenceId }) => {
    const normalizedProfileType = normalizeProfileType(profileType)
    if (!requestableProfileTypes.has(normalizedProfileType)) {
      throw createAccessError('auth/invalid-profile-type', 'Choose Student or Teacher for your school profile.')
    }
    if (!String(referenceId || '').trim()) {
      throw createAccessError('auth/missing-reference-id', normalizedProfileType === 'Teacher' ? 'Enter your Teacher ID.' : 'Enter your LRN.')
    }

    let credential
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw createAccessError(error?.code || 'auth/registration-failed', getFriendlyAuthError(error, 'We could not create your account. Please try again.'))
    }

    try {
      await addDoc(collection(db, 'accountRequests'), {
        uid: credential.user.uid,
        fullName,
        email: credential.user.email,
        role: normalizedProfileType === 'Teacher' ? 'Teacher' : 'User',
        profileType: normalizedProfileType,
        referenceId: String(referenceId).trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      await deleteUser(credential.user).catch(() => {})
      throw createAccessError(error?.code || 'auth/request-failed', getFriendlyAuthError(error, 'Your access request could not be submitted. Please try again.'))
    } finally {
      await signOut(auth).catch(() => {})
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
  }

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return null
    const account = await resolveAuthorizedAccount(currentUser)
    setUser(currentUser)
    setRole(account.role)
    setProfile(account.profile)
    return account.profile
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      loading,
      isAuthenticated: Boolean(user && role),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, role, profile, loading, refreshProfile],
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
