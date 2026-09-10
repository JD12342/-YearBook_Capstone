import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore'
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
  if (!snapshot.exists() || (snapshot.data().status !== 'active' || snapshot.data().recordsVersion !== 1)) return null
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
    yearbooks: records(yearbooks).filter(book => book.recordsVersion === 1 && book.schoolYearId && book.schoolYearName),
    stories: records(stories),
    alumni: records(alumni),
  }

  return {
    ...content,
    hasLiveContent: Object.values(content).some((items) => items.length > 0),
  }
}

export const subscribeUserPortalContent = (onContent, onReady) => {
  if (!isFirebaseConfigured) {
    onContent({ announcements: [], yearbooks: [], stories: [], alumni: [], hasLiveContent: false })
    onReady?.()
    return () => {}
  }

  const definitions = [
    ['announcements', 'announcements', 'published'],
    ['yearbooks', 'yearbooks', 'active'],
    ['stories', 'schoolContent', 'published'],
    ['alumni', 'alumni', 'active'],
  ]
  const content = { announcements: [], yearbooks: [], stories: [], alumni: [] }
  const initialized = new Set()
  let readySent = false

  const emit = () => onContent({
    ...content,
    yearbooks: content.yearbooks.filter((book) => book.recordsVersion === 1 && book.schoolYearId && book.schoolYearName),
    hasLiveContent: Object.values(content).some((items) => items.length > 0),
  })

  const unsubscribers = definitions.map(([key, collectionName, status]) => onSnapshot(
    query(collection(db, collectionName), where('status', '==', status)),
    (snapshot) => {
      content[key] = snapshot.docs.map((record) => ({ id: record.id, ...record.data() })).sort(newestFirst)
      initialized.add(key)
      emit()
      if (initialized.size === definitions.length && !readySent) { readySent = true; onReady?.() }
    },
    () => {
      initialized.add(key)
      if (initialized.size === definitions.length && !readySent) { readySent = true; onReady?.() }
    },
  ))

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}
