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
import { getPhotoUrl, uploadEditedPhoto, uploadStudentPhoto } from './firebase/storageService.js'

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

  const photoMetadata = {
    studentId,
    schoolYearId,
    strandId,
    sectionId,
    source,
    status,
    originalPath: uploadedOriginal.path,
    editedPath: '',
    originalFileName: uploadedOriginal.fileName,
    mimeType: uploadedOriginal.mimeType,
  }

  const photoIdFromFirestore = await createPhotoRecord(photoMetadata)

  return {
    ...photoMetadata,
    id: photoIdFromFirestore,
    photoId,
    originalUrl: uploadedOriginal.url,
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
  if (!student?.photoId) return null

  try {
    const photoDoc = await getPhoto(student.photoId)
    if (!photoDoc || photoDoc.status !== 'approved') return null

    const imageUrl = photoDoc.downloadUrl || photoDoc.imageUrl || (photoDoc.editedPath ? await getPhotoUrl(photoDoc.editedPath) : null) || (photoDoc.originalPath ? await getPhotoUrl(photoDoc.originalPath) : null)

    return {
      ...photoDoc,
      imageUrl,
    }
  } catch (error) {
    console.error('getApprovedPhotoForStudent error:', error)
    return null
  }
}
