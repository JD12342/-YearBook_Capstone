import { updatePassword, updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, reauthenticateAdmin } from './firebase/auth.js'
import { db } from './firebase/firestore.js'

export const adminPreferencesKey = 'gradbook-admin-preferences'

export const defaultAdminPreferences = {
  density: 'comfortable',
  sidebarDefault: 'expanded',
  defaultReportPeriod: 30,
  reduceMotion: false,
  showPageHelp: true,
}

const normalizePreferences = (source = {}) => ({
  density: source.density === 'compact' ? 'compact' : 'comfortable',
  sidebarDefault: source.sidebarDefault === 'collapsed' ? 'collapsed' : 'expanded',
  defaultReportPeriod: [7, 30, 90].includes(Number(source.defaultReportPeriod)) ? Number(source.defaultReportPeriod) : 30,
  reduceMotion: Boolean(source.reduceMotion),
  showPageHelp: source.showPageHelp !== false,
})

export const loadLocalAdminPreferences = () => {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(adminPreferencesKey) || '{}'))
  } catch {
    return { ...defaultAdminPreferences }
  }
}

export const applyAdminPreferences = (preferences) => {
  const normalized = normalizePreferences(preferences)
  localStorage.setItem(adminPreferencesKey, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('gradbook-preferences-changed', { detail: normalized }))
  return normalized
}

export const loadAdminPreferences = async (userId) => {
  const local = loadLocalAdminPreferences()
  if (!userId) return local
  try {
    const snapshot = await getDoc(doc(db, 'users', userId))
    const remote = snapshot.data()?.preferences
    return remote ? normalizePreferences({ ...local, ...remote }) : local
  } catch {
    return local
  }
}

export const saveAdminPreferences = async (userId, preferences) => {
  const normalized = normalizePreferences(preferences)
  if (!userId) throw new Error('No active administrator account was found.')
  await setDoc(doc(db, 'users', userId), {
    preferences: normalized,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return applyAdminPreferences(normalized)
}

export const restoreDefaultAdminPreferences = async (userId) => saveAdminPreferences(userId, defaultAdminPreferences)

export const loadAdminAccount = async (userId) => {
  if (!userId) throw new Error('No active administrator account was found.')
  const snapshot = await getDoc(doc(db, 'users', userId))
  return snapshot.exists() ? snapshot.data() : {}
}

export const saveAdminAccount = async (userId, values) => {
  const currentUser = auth.currentUser
  if (!currentUser || currentUser.uid !== userId) throw new Error('Your administrator session has expired.')

  const account = {
    fullName: String(values.fullName || '').trim(),
    position: String(values.position || '').trim(),
    phone: String(values.phone || '').trim(),
    bio: String(values.bio || '').trim(),
    updatedAt: serverTimestamp(),
  }
  if (!account.fullName) throw new Error('Enter your full name.')

  await Promise.all([
    updateProfile(currentUser, { displayName: account.fullName }),
    setDoc(doc(db, 'users', userId), account, { merge: true }),
  ])
  return account
}

export const changeAdminPassword = async (currentPassword, newPassword) => {
  if (String(newPassword || '').length < 8) throw new Error('Use at least 8 characters for the new password.')
  const currentUser = await reauthenticateAdmin(currentPassword)
  await updatePassword(currentUser, newPassword)
}
