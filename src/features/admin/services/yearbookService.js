import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase/firestore.js'

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
    const ref = await addDoc(yearbooksCollection, {
      ...payload,
      title: payload.title?.trim(),
      status: payload.status || 'draft',
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
