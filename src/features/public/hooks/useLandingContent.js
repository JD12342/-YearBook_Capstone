import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../../app/firebaseClient.js'

const LandingContentContext = createContext({})

export function LandingContentProvider({ children }) {
  const [sections, setSections] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let active = true
    getDocs(query(collection(db, 'landingContent'), where('status', '==', 'published'), limit(8))).then((snapshot) => {
      const next = {}
      snapshot.docs.forEach((entry) => {
        const item = entry.data()
        if (item.section) next[item.section] = item
      })
      if (active) setSections(next)
    }).catch(() => { if (active) setSections({}) })
    return () => { active = false }
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
