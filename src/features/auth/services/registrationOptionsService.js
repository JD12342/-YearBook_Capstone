import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from '../../../app/firebaseClient.js'

const cacheKey = 'gradbook-registration-academic-options-v1'
const cacheDurationMs = 5 * 60 * 1000

const readCache = () => {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(cacheKey) || 'null')
    return cached?.expiresAt > Date.now() ? cached.data : null
  } catch {
    return null
  }
}

const writeCache = (data) => {
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify({ data, expiresAt: Date.now() + cacheDurationMs }))
  } catch {
    // Registration still works when browser storage is unavailable.
  }
}

export async function getRegistrationAcademicOptions() {
  const cached = readCache()
  if (cached) return cached
  const loadOptions = httpsCallable(getFunctions(firebaseApp, 'asia-southeast1'), 'getRegistrationAcademicOptions')
  const result = await loadOptions()
  const data = {
    schoolYears: Array.isArray(result.data?.schoolYears) ? result.data.schoolYears : [],
    strands: Array.isArray(result.data?.strands) ? result.data.strands : [],
    sections: Array.isArray(result.data?.sections) ? result.data.sections : [],
  }
  writeCache(data)
  return data
}
