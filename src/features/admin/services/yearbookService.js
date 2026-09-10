import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase/firestore.js'
import { DEFAULT_YEARBOOK_THEME, createDefaultYearbookPages } from '../../yearbook/data/yearbookDefaults.js'

const yearbooksCollection = collection(db, 'yearbooks')

export const getYearbooks = async ({ schoolYearId } = {}) => {
  try {
    const snapshot = await getDocs(yearbooksCollection)
    const records = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((left, right) => (left.title ?? '').localeCompare(right.title ?? ''))

    if (!schoolYearId) return records
    return records.filter((yearbook) => yearbook.schoolYearId === schoolYearId)
  } catch (error) {
    throw new Error('Unable to load yearbooks.')
  }
}

export const getYearbookById = async (yearbookId) => {
  try {
    const snap = await getDoc(doc(db, 'yearbooks', yearbookId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    throw new Error('Unable to load yearbook details.')
  }
}

export const createYearbook = async (payload) => {
  try {
    const existing = await getDocs(query(yearbooksCollection, where('schoolYearId', '==', payload.schoolYearId), limit(1)))
    if (!existing.empty) return existing.docs[0].id

    const ref = doc(yearbooksCollection, payload.schoolYearId)
    await setDoc(ref, {
      ...DEFAULT_YEARBOOK_THEME,
      ...payload,
      title: payload.title?.trim(),
      status: payload.status || 'draft',
      coverTitle: payload.coverTitle || 'GRAD BOOK',
      coverSubtitle: payload.coverSubtitle || payload.schoolYearName || '',
      pages: payload.pages || createDefaultYearbookPages(payload.schoolYearName),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to create yearbook.')
  }
}

export const updateYearbook = async (yearbookId, updates) => {
  try {
    await updateDoc(doc(db, 'yearbooks', yearbookId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to update yearbook.')
  }
}

export const archiveYearbook = async (yearbookId) => {
  try {
    await updateDoc(doc(db, 'yearbooks', yearbookId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to archive yearbook.')
  }
}

export const deleteYearbook = async (yearbookId) => {
  try {
    await deleteDoc(doc(db, 'yearbooks', yearbookId))
  } catch {
    throw new Error('Unable to delete yearbook.')
  }
}
