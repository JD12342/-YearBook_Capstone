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
import { findStudentPhotoUrl, getPhotoUrl, uploadEditedPhoto, uploadStudentPhoto } from './firebase/storageService.js'

const photosCollection = collection(db, 'photos')

export const getPhotos = async ({ studentId, schoolYearId, status } = {}) => {
  try {
    const constraints = []

    if (studentId) constraints.push(where('studentId', '==', studentId))
    if (schoolYearId) constraints.push(where('schoolYearId', '==', schoolYearId))
    if (status) constraints.push(where('status', '==', status))

    constraints.push(orderBy('createdAt', 'desc'))

    const q = query(photosCollection, ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (error) {
    throw new Error('Unable to load photo records.')
  }
}

export const getPhoto = async (photoId) => {
  try {
    const photoSnap = await getDoc(doc(db, 'photos', photoId))
    return photoSnap.exists() ? { id: photoSnap.id, ...photoSnap.data() } : null
  } catch (error) {
    throw new Error('Unable to load photo details.')
  }
}

const photoTimestamp = (photo) => Number(photo?.updatedAt?.seconds ?? photo?.createdAt?.seconds ?? 0)

export const getPhotoImageUrl = async (photo) => {
  if (!photo) return ''
  return photo.downloadUrl
    || photo.imageUrl
    || (photo.editedPath ? await getPhotoUrl(photo.editedPath) : '')
    || (photo.originalPath ? await getPhotoUrl(photo.originalPath) : '')
    || ''
}

// A few older captures were written to `photos` but their id was not copied
// to the student document. Look up the ownership record as a safe fallback.
export const getPhotoForStudent = async (student, { approvedOnly = false } = {}) => {
  if (!student?.id) return null

  try {
    const linked = student.photoId ? await getPhoto(student.photoId) : null
    const records = linked?.studentId === student.id ? [linked] : await getDocs(query(photosCollection, where('studentId', '==', student.id)))
      .then((snapshot) => snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    const matching = records
      .filter((photo) => !student.schoolYearId || !photo.schoolYearId || photo.schoolYearId === student.schoolYearId)
      .filter((photo) => !approvedOnly || photo.status === 'approved')
      .sort((left, right) => photoTimestamp(right) - photoTimestamp(left))
    // Legacy photo records sometimes stored a display year instead of the school-year id.
    // Student ownership remains the source of truth, so use that portrait as a fallback.
    const fallback = records
      .filter((photo) => !approvedOnly || photo.status === 'approved')
      .sort((left, right) => photoTimestamp(right) - photoTimestamp(left))
    const photo = matching[0] || fallback[0]
    const imageUrl = await getPhotoImageUrl(photo)
    if (photo && imageUrl) return { ...photo, imageUrl }

    // A raw Storage capture without an approval record must never reach readers.
    const storedImageUrl = approvedOnly ? '' : await findStudentPhotoUrl(student)
    return storedImageUrl ? {
      id: `storage-${student.id}`,
      studentId: student.id,
      schoolYearId: student.schoolYearId,
      strandId: student.strandId,
      status: 'captured',
      source: 'storage',
      storageOnly: true,
      imageUrl: storedImageUrl,
    } : null
  } catch (error) {
    console.error('getPhotoForStudent error:', error)
    return null
  }
}

export const createPhotoRecord = async (photoData) => {
  try {
    const ref = await addDoc(photosCollection, {
      ...photoData,
      source: photoData.source || 'camera',
      status: photoData.status || 'captured',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw new Error('Unable to save photo record.')
  }
}

export const updatePhotoRecord = async (photoId, updates) => {
  try {
    await updateDoc(doc(db, 'photos', photoId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to update photo record.')
  }
}

export const uploadStudentPhotoRecord = async ({
  file,
  studentId,
  schoolYearId,
  strandId,
  sectionId,
  source = 'camera',
  status = 'captured',
}) => {
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const uploadedOriginal = await uploadStudentPhoto({
    file,
    schoolYearId,
    strandId,
    studentId,
    photoId,
    type: 'original',
  })

  // A direct "Approve" from the camera must publish a separate final file.
  // The original capture always stays private, even when it becomes approved.
  const uploadedApproved = status === 'approved' ? await uploadEditedPhoto({
    file,
    schoolYearId,
    strandId,
    studentId,
    photoId,
  }) : null

  const photoMetadata = {
    studentId,
    schoolYearId,
    strandId,
    sectionId,
    source,
    status,
    originalPath: uploadedOriginal.path,
    editedPath: uploadedApproved?.path || '',
    originalFileName: uploadedOriginal.fileName,
    mimeType: uploadedOriginal.mimeType,
  }

  const photoIdFromFirestore = await createPhotoRecord(photoMetadata)

  return {
    ...photoMetadata,
    id: photoIdFromFirestore,
    photoId,
    originalUrl: uploadedOriginal.url,
    approvedUrl: uploadedApproved?.url || '',
  }
}

export const uploadEditedPhotoRecord = async ({
  file,
  studentId,
  schoolYearId,
  strandId,
  sectionId,
  photoId,
}) => {
  const uploadedEdited = await uploadEditedPhoto({
    file,
    schoolYearId,
    strandId,
    studentId,
    photoId,
  })

  await updatePhotoRecord(photoId, {
    editedPath: uploadedEdited.path,
    status: 'approved',
    sectionId,
    schoolYearId,
    strandId,
    updatedAt: serverTimestamp(),
  })

  return {
    path: uploadedEdited.path,
    url: uploadedEdited.url,
  }
}

export const getApprovedPhotoForStudent = async (student) => {
  return getPhotoForStudent(student, { approvedOnly: true })
}
