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
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase/firestore.js'
import { createYearbook } from './yearbookService.js'

const schoolYearsCollection = collection(db, 'schoolYears')
const strandsCollection = collection(db, 'strands')
const sectionsCollection = collection(db, 'sections')

export const getSchoolYears = async () => {
  try {
    const snapshot = await getDocs(schoolYearsCollection)
    return snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((left, right) => Number(right.startYear ?? 0) - Number(left.startYear ?? 0))
  } catch (error) {
    throw new Error('Unable to load school years.')
  }
}

export const getSchoolYear = async (schoolYearId) => {
  try {
    const snap = await getDoc(doc(db, 'schoolYears', schoolYearId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    throw new Error('Unable to load school year details.')
  }
}

export const createSchoolYear = async (payload) => {
  try {
    const schoolYearName = payload.name?.trim() || `${payload.startYear ?? new Date().getFullYear()}-${payload.endYear ?? new Date().getFullYear() + 1}`

    const ref = await addDoc(schoolYearsCollection, {
      ...payload,
      name: schoolYearName,
      archived: false,
      status: payload.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    try {
      await createYearbook({
        title: `Graduation Yearbook ${schoolYearName}`,
        schoolYearId: ref.id,
        status: 'draft',
      })
    } catch (yearbookError) {
      throw new Error(
        'School year was created successfully, but the corresponding yearbook could not be created. Please verify the school year record and create the yearbook foundation manually if needed.',
      )
    }

    return ref.id
  } catch (error) {
    if (error.message?.startsWith('School year was created successfully')) {
      throw error
    }
    throw new Error('Unable to create school year.')
  }
}

export const updateSchoolYear = async (schoolYearId, updates) => {
  try {
    await updateDoc(doc(db, 'schoolYears', schoolYearId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to update school year.')
  }
}

export const archiveSchoolYear = async (schoolYearId) => {
  try {
    await updateDoc(doc(db, 'schoolYears', schoolYearId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to archive school year.')
  }
}

export const deleteSchoolYear = async (schoolYearId) => {
  try {
    await deleteDoc(doc(db, 'schoolYears', schoolYearId))
  } catch (error) {
    throw new Error('Unable to delete school year.')
  }
}

export const getStrands = async (schoolYearId) => {
  try {
    const q = query(strandsCollection, orderBy('name'))
    const snapshot = await getDocs(q)
    const records = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    if (!schoolYearId) return records
    return records.filter((strand) => strand.schoolYearId === schoolYearId)
  } catch (error) {
    throw new Error('Unable to load strands.')
  }
}

export const createStrand = async (payload) => {
  try {
    const ref = await addDoc(strandsCollection, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to create strand.')
  }
}

export const getSections = async (schoolYearOrFilters, strandIdOverride) => {
  try {
    const q = query(sectionsCollection, orderBy('name'))
    const snapshot = await getDocs(q)
    const records = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    const filters = typeof schoolYearOrFilters === 'object' && schoolYearOrFilters !== null
      ? schoolYearOrFilters
      : { schoolYearId: schoolYearOrFilters, strandId: strandIdOverride }

    return records.filter((section) => {
      if (filters.schoolYearId && section.schoolYearId !== filters.schoolYearId) return false
      if (filters.strandId && section.strandId !== filters.strandId) return false
      return true
    })
  } catch (error) {
    throw new Error('Unable to load sections.')
  }
}

export const createSection = async (payload) => {
  try {
    const ref = await addDoc(sectionsCollection, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to create section.')
  }
}

export const seedDefaultSchoolStructure = async (schoolYears = []) => {
  if (!schoolYears.length) return

  const batch = writeBatch(db)

  schoolYears.forEach((schoolYear) => {
    const schoolYearRef = doc(schoolYearsCollection)
    batch.set(schoolYearRef, {
      ...schoolYear,
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}
