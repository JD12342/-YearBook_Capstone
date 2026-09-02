import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../services/firebase/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginAdmin = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      loginAdmin,
      logout,
    }),
    [user, loading],
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
