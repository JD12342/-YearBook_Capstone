import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth } from '../../admin/services/firebase/auth.js'
import { db } from '../../admin/services/firebase/firestore.js'

const AuthContext = createContext(null)
const roleKey = 'gradbook.auth.role'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(() => window.localStorage.getItem(roleKey) || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      if (!nextUser) setRole('')
      else setRole((currentRole) => {
        const nextRole = currentRole || window.localStorage.getItem(roleKey) || 'Administrator'
        window.localStorage.setItem(roleKey, nextRole)
        return nextRole
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password, selectedRole) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const nextRole = selectedRole || 'Student'
    window.localStorage.setItem(roleKey, nextRole)
    setRole(nextRole)
    return { user: credential.user, role: nextRole }
  }

  const register = async ({ fullName, email, password, role: requestedRole }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    window.localStorage.setItem(roleKey, requestedRole)
    setRole(requestedRole)
    await addDoc(collection(db, 'accountRequests'), {
      uid: credential.user.uid,
      fullName,
      email,
      role: requestedRole,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { user: credential.user, role: requestedRole }
  }

  const logout = async () => {
    await signOut(auth)
    window.localStorage.removeItem(roleKey)
    setRole('')
  }

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginAdmin: login,
      register,
      logout,
    }),
    [user, role, loading],
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
