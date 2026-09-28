import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db, firebaseApp } from '../../../app/firebaseClient.js'

const toggleHeart = httpsCallable(getFunctions(firebaseApp, 'asia-southeast1'), 'toggleMemoryHeart')
const heartCache = new Map()
const heartRequests = new Map()
const heartKey = (memoryId, uid) => `${uid}:${memoryId}`

export async function toggleMemoryReaction(memoryId) {
  const result = await toggleHeart({ memoryId })
  return result.data
}

export async function getMyHeart(memoryId, uid) {
  if (!memoryId || !uid) return false
  const key = heartKey(memoryId, uid)
  if (heartCache.has(key)) return heartCache.get(key)
  if (heartRequests.has(key)) return heartRequests.get(key)

  const request = getDoc(doc(db, 'memories', memoryId, 'reactions', uid))
    .then((snapshot) => {
      const hearted = snapshot.exists()
      heartCache.set(key, hearted)
      return hearted
    })
    .finally(() => heartRequests.delete(key))
  heartRequests.set(key, request)
  return request
}

export const getCachedHeart = (memoryId, uid) => heartCache.get(heartKey(memoryId, uid))

export const setCachedHeart = (memoryId, uid, hearted) => {
  if (memoryId && uid) heartCache.set(heartKey(memoryId, uid), Boolean(hearted))
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
