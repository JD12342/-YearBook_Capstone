import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../admin/services/firebase/firestore.js'
import { isFirebaseConfigured } from '../../admin/services/firebase/firebaseConfig.js'

const LandingContentContext = createContext({})

export function LandingContentProvider({ children }) {
  const [sections, setSections] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    return onSnapshot(query(collection(db, 'landingContent'), where('status', '==', 'published')), (snapshot) => {
      const next = {}
      snapshot.docs.forEach((entry) => {
        const item = entry.data()
        if (item.section) next[item.section] = item
      })
      setSections(next)
    }, () => setSections({}))
  }, [])

  const value = useMemo(() => sections, [sections])
  return createElement(LandingContentContext.Provider, { value }, children)
}

export function useLandingSection(section, fallback) {
  const sections = useContext(LandingContentContext)
  const override = sections[section]
  if (!override) return fallback
  return { ...fallback, ...override, description: override.body || fallback.description }
}
