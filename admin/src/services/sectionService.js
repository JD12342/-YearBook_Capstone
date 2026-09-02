import {
  addDoc,
  collection,
  deleteDoc,
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

const sectionsCollection = collection(db, 'sections')

export const getSections = async ({ schoolYearId, strandId } = {}) => {
  try {
    const snapshot = await getDocs(sectionsCollection)
    const records = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''))

    return records.filter((section) => {
      if (schoolYearId && section.schoolYearId !== schoolYearId) return false
      if (strandId && section.strandId !== strandId) return false
      return true
    })
  } catch (error) {
    throw new Error('Unable to load sections.')
  }
}

export const getSectionsByStrand = async (schoolYearId, strandId) => {
  return getSections({ schoolYearId, strandId })
}

export const getSectionById = async (sectionId) => {
  try {
    const snap = await getDoc(doc(db, 'sections', sectionId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    throw new Error('Unable to load section details.')
  }
}

export const createSection = async (payload) => {
  try {
    const ref = await addDoc(sectionsCollection, {
      ...payload,
      name: payload.name?.trim(),
      status: payload.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to create section.')
  }
}

export const updateSection = async (sectionId, updates) => {
  try {
    await updateDoc(doc(db, 'sections', sectionId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to update section.')
  }
}

export const archiveSection = async (sectionId) => {
  try {
    await updateDoc(doc(db, 'sections', sectionId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to archive section.')
  }
}

export const deleteSection = async (sectionId) => {
  try {
    await deleteDoc(doc(db, 'sections', sectionId))
  } catch (error) {
    throw new Error('Unable to delete section.')
  }
}
