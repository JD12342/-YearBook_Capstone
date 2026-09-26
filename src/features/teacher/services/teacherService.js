import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { deleteObject, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import { db } from '../../admin/services/firebase/firestore.js'
import { firebaseApp } from '../../admin/services/firebase/firebaseConfig.js'
import { storage } from '../../admin/services/firebase/storage.js'

const functions = getFunctions(firebaseApp, 'asia-southeast1')
const callable = (name) => httpsCallable(functions, name)

export async function getTeacherAssignment(uid) {
  if (!uid) return null
  const snapshot = await getDoc(doc(db, 'teacherAssignments', uid))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export function subscribeTeacherAssignment(uid, onValue, onError) {
  if (!uid) return () => {}
  return onSnapshot(doc(db, 'teacherAssignments', uid), (snapshot) => onValue(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError)
}

export function subscribeTeacherMemories(uid, onValue, onError) {
  if (!uid) return () => {}
  return onSnapshot(query(collection(db, 'memories'), where('ownerUid', '==', uid)), (snapshot) => {
    const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((left, right) => Number(right.createdAt?.seconds || 0) - Number(left.createdAt?.seconds || 0))
    onValue(records)
  }, onError)
}

export async function loadAssignmentSections(sectionIds = []) {
  const snapshots = await Promise.all(sectionIds.map((id) => getDoc(doc(db, 'sections', id))))
  return snapshots.filter((snapshot) => snapshot.exists()).map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
}

const uploadOne = (uid, memoryId, file, index, onProgress) => new Promise((resolve, reject) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `teacher-content/${uid}/${memoryId}/${Date.now()}-${index}-${safeName}`
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type })
  task.on('state_changed', (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes), reject, async () => {
    resolve({ path, url: await getDownloadURL(task.snapshot.ref), type: file.type.startsWith('video/') ? 'video' : 'image', mimeType: file.type, fileName: file.name })
  })
})

export async function submitTeacherMemory({ uid, contributorName, title, caption, sectionId, files, onProgress }) {
  const photos = files.filter((file) => file.type.startsWith('image/')).length
  const videos = files.filter((file) => file.type.startsWith('video/')).length
  const reservation = await callable('reserveTeacherMemory')({ title, caption, sectionId, contributorName, photoCount: photos, videoCount: videos })
  const memoryId = reservation.data.id
  const uploaded = []
  try {
    for (let index = 0; index < files.length; index += 1) {
      uploaded.push(await uploadOne(uid, memoryId, files[index], index, (part) => onProgress?.((index + part) / files.length)))
    }
    await updateDoc(doc(db, 'memories', memoryId), { media: uploaded, images: uploaded.filter((item) => item.type === 'image'), updatedAt: serverTimestamp() })
    return memoryId
  } catch (error) {
    await Promise.all(uploaded.map((item) => deleteObject(ref(storage, item.path)).catch(() => {})))
    await callable('cancelTeacherMemoryReservation')({ memoryId }).catch(() => {})
    throw error
  }
}

export async function manageTeacher(payload) {
  const result = await callable('manageTeacherAccess')(payload)
  return result.data
}

export async function getTeachers() {
  const snapshot = await getDocs(query(collection(db, 'users'), where('profileType', '==', 'Teacher')))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function uploadTeacherPortrait({ uid, file }) {
  if (!uid || !file?.type?.startsWith('image/')) throw new Error('Choose a valid teacher portrait.')
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a portrait smaller than 15 MB.')
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg'
  const path = `teacher-portraits/${uid}/approved/${Date.now()}.${extension}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  const url = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'users', uid), { portraitUrl: url, portraitPath: path, portraitApprovedAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { path, url }
}
