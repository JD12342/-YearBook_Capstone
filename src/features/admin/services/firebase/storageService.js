import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage'
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

export async function uploadYearbookAsset({ file, yearbookId, kind, slot = '' }) {
  if (!file) throw new Error('Choose a file to upload.')
  if (!yearbookId) throw new Error('A yearbook is required for this upload.')
  if (!['cover', 'page', 'song'].includes(kind)) throw new Error('Unsupported yearbook asset type.')
  if (kind === 'page' && !slot) throw new Error('A page artwork slot is required.')

  const safeYearbookId = String(yearbookId).replace(/[^a-zA-Z0-9_-]/g, '-')
  const safeSlot = String(slot).replace(/[^a-zA-Z0-9_-]/g, '-')
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : (kind === 'song' ? 'mp3' : 'jpg')
  const assetFolder = kind === 'page' ? `pages/${safeSlot}` : kind
  const path = `yearbooks/${safeYearbookId}/${assetFolder}/${Date.now()}.${extension}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })

  return {
    path,
    url: await getDownloadURL(fileRef),
    fileName: file.name,
    mimeType: file.type,
  }
}

export async function deleteYearbookAssets(yearbookId) {
  if (!yearbookId) return
  const safeYearbookId = String(yearbookId).replace(/[^a-zA-Z0-9_-]/g, '-')

  const removeFolder = async (folderRef) => {
    const contents = await listAll(folderRef)
    await Promise.all(contents.items.map((item) => deleteObject(item)))
    await Promise.all(contents.prefixes.map(removeFolder))
  }

  await removeFolder(ref(storage, `yearbooks/${safeYearbookId}`))
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
