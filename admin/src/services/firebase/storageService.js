import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './storage.js'

export const buildStoragePath = ({ schoolYearId, strandId, studentId, type = 'original', photoId }) => {
  const safeSchoolYear = String(schoolYearId || 'unknown-year').replace(/\s+/g, '-')
  const safeStrand = String(strandId || 'unknown-strand').replace(/\s+/g, '-')
  const safeStudentId = String(studentId || 'unknown-student')
  const safePhotoId = String(photoId || Date.now())
  return `photos/${safeSchoolYear}/${safeStrand}/${safeStudentId}/${type}/${safePhotoId}.jpg`
}

export async function uploadStudentPhoto({ file, schoolYearId, strandId, studentId, photoId, type = 'original' }) {
  if (!file) throw new Error('A file is required for upload.')

  const path = buildStoragePath({ schoolYearId, strandId, studentId, type, photoId })
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)

  return {
    path,
    url: await getDownloadURL(fileRef),
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
  }
}

export async function uploadEditedPhoto({ file, schoolYearId, strandId, studentId, photoId }) {
  return uploadStudentPhoto({
    file,
    schoolYearId,
    strandId,
    studentId,
    photoId,
    type: 'edited',
  })
}

export async function getPhotoUrl(storagePath) {
  if (!storagePath) return null
  return getDownloadURL(ref(storage, storagePath))
}

export async function deleteStudentPhoto(storagePath) {
  if (!storagePath) return
  const fileRef = ref(storage, storagePath)
  await deleteObject(fileRef)
}

export async function deleteEditedPhoto(storagePath) {
  return deleteStudentPhoto(storagePath)
}
