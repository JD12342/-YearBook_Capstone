import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../../admin/services/firebase/firestore.js'
import { firebaseApp } from '../../admin/services/firebase/firebaseConfig.js'

const toggleHeart = httpsCallable(getFunctions(firebaseApp, 'asia-southeast1'), 'toggleMemoryHeart')

export async function toggleMemoryReaction(memoryId) {
  const result = await toggleHeart({ memoryId })
  return result.data
}

export async function getMyHeart(memoryId, uid) {
  if (!memoryId || !uid) return false
  return (await getDoc(doc(db, 'memories', memoryId, 'reactions', uid))).exists()
}

export function subscribeMemoryComments(memoryId, onValue, onError) {
  return onSnapshot(query(collection(db, 'memories', memoryId, 'comments'), orderBy('createdAt', 'asc')), (snapshot) => {
    onValue(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  }, onError)
}

export async function addMemoryComment(memoryId, { uid, authorName, text }) {
  const body = String(text || '').trim()
  if (!body) throw new Error('Write a comment first.')
  if (body.length > 500) throw new Error('Comments can contain up to 500 characters.')
  await addDoc(collection(db, 'memories', memoryId, 'comments'), { ownerUid: uid, authorName, text: body, status: 'visible', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function deleteMemoryComment(memoryId, commentId) {
  await deleteDoc(doc(db, 'memories', memoryId, 'comments', commentId))
}
