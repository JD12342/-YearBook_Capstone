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

const strandsCollection = collection(db, 'strands')

export const getStrands = async (schoolYearId) => {
  try {
    const snapshot = await getDocs(strandsCollection)
    const records = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''))

    if (!schoolYearId) return records
    return records.filter((strand) => strand.schoolYearId === schoolYearId)
  } catch (error) {
    throw new Error('Unable to load strands.')
  }
}

export const getStrand = async (strandId) => {
  try {
    const snap = await getDoc(doc(db, 'strands', strandId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    throw new Error('Unable to load strand details.')
  }
}

export const createStrand = async (payload) => {
  try {
    const ref = await addDoc(strandsCollection, {
      ...payload,
      status: payload.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to create strand.')
  }
}

export const updateStrand = async (strandId, updates) => {
  try {
    await updateDoc(doc(db, 'strands', strandId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to update strand.')
  }
}

export const archiveStrand = async (strandId) => {
  try {
    await updateDoc(doc(db, 'strands', strandId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to archive strand.')
  }
}

export const deleteStrand = async (strandId) => {
  try {
    await deleteDoc(doc(db, 'strands', strandId))
  } catch (error) {
    throw new Error('Unable to delete strand.')
  }
}
