import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../../app/firebaseClient.js'

const PORTAL_CACHE_TTL = 2 * 60 * 1000
let portalContentCache = null
let portalContentCachedAt = 0
let portalContentRequest = null
const activeYearbookCache = new Map()

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
  if (activeYearbookCache.has(yearbookId)) return activeYearbookCache.get(yearbookId)
  const snapshot = await getDoc(doc(db, 'yearbooks', yearbookId))
  if (!snapshot.exists() || (snapshot.data().status !== 'active' || snapshot.data().recordsVersion !== 1)) return null
  const yearbook = { id: snapshot.id, ...snapshot.data() }
  activeYearbookCache.set(yearbookId, yearbook)
  return yearbook
}

export const getCachedUserPortalContent = () => portalContentCache

export const loadUserPortalContent = async ({ forceRefresh = false } = {}) => {
  if (!isFirebaseConfigured) {
    return { announcements: [], yearbooks: [], stories: [], memories: [], hasLiveContent: false }
  }

  if (!forceRefresh && portalContentCache && Date.now() - portalContentCachedAt < PORTAL_CACHE_TTL) return portalContentCache
  if (portalContentRequest) return portalContentRequest

  portalContentRequest = Promise.allSettled([
    readPublishedRecords('announcements', 'published'),
    readPublishedRecords('yearbooks', 'active', 24),
    readPublishedRecords('schoolContent', 'published'),
    readPublishedRecords('memories', 'published', 48),
  ]).then(([announcements, yearbooks, stories, memories]) => {
    const records = (result) => result.status === 'fulfilled' ? result.value : []
    const content = {
      announcements: records(announcements),
      yearbooks: records(yearbooks).filter(book => book.recordsVersion === 1 && book.schoolYearId && book.schoolYearName),
      stories: records(stories),
      memories: records(memories),
    }

    portalContentCache = {
      ...content,
      hasLiveContent: Object.values(content).some((items) => items.length > 0),
    }
    portalContentCachedAt = Date.now()
    return portalContentCache
  }).finally(() => { portalContentRequest = null })

  return portalContentRequest
}
