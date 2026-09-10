import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../../admin/services/firebase/firestore.js'
import { isFirebaseConfigured } from '../../admin/services/firebase/firebaseConfig.js'

const newestFirst = (left, right) => {
  const leftTime = Number(left.updatedAt?.seconds ?? left.createdAt?.seconds ?? 0)
  const rightTime = Number(right.updatedAt?.seconds ?? right.createdAt?.seconds ?? 0)
  return rightTime - leftTime
}

const readPublishedRecords = async (collectionName, status, recordLimit = 8) => {
  const snapshot = await getDocs(query(
    collection(db, collectionName),
    where('status', '==', status),
    limit(recordLimit),
  ))

  return snapshot.docs
    .map((record) => ({ id: record.id, ...record.data() }))
    .sort(newestFirst)
}

export const loadActiveYearbook = async (yearbookId) => {
  if (!isFirebaseConfigured || !yearbookId) return null
  const snapshot = await getDoc(doc(db, 'yearbooks', yearbookId))
  if (!snapshot.exists() || snapshot.data().status !== 'active') return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const loadUserPortalContent = async () => {
  if (!isFirebaseConfigured) {
    return { announcements: [], yearbooks: [], stories: [], alumni: [], hasLiveContent: false }
  }

  const [announcements, yearbooks, stories, alumni] = await Promise.allSettled([
    readPublishedRecords('announcements', 'published'),
    readPublishedRecords('yearbooks', 'active', 50),
    readPublishedRecords('schoolContent', 'published'),
    readPublishedRecords('alumni', 'active'),
  ])

  const records = (result) => result.status === 'fulfilled' ? result.value : []
  const content = {
    announcements: records(announcements),
    yearbooks: records(yearbooks),
    stories: records(stories),
    alumni: records(alumni),
  }

  return {
    ...content,
    hasLiveContent: Object.values(content).some((items) => items.length > 0),
  }
}
