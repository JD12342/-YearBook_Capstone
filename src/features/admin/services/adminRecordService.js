import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase/firestore.js'
import { isFirebaseConfigured } from './firebase/firebaseConfig.js'

const collectionNames = new Set(['accountRequests', 'announcements', 'alumni', 'schoolContent'])
const approvableProfileTypes = new Set(['Student', 'Teacher', 'Staff', 'Alumni'])

const getProfileType = (request) => {
  const requestedType = String(request?.profileType || request?.accountType || request?.role || '').trim()
  return approvableProfileTypes.has(requestedType) ? requestedType : ''
}

const getCollection = (name) => {
  if (!collectionNames.has(name)) throw new Error('Unsupported admin record type.')
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured. Add the admin Firebase values before using this feature.')
  return collection(db, name)
}

const adminAccessError = (error) => {
  if (error?.code === 'permission-denied') {
    return new Error('Firebase access is not yet enabled for this admin feature. Publish the updated Firestore rules, then reload the page.')
  }
  if (error?.code === 'unauthenticated') {
    return new Error('Your admin session has expired. Please sign in again.')
  }
  return null
}

export const getAdminRecords = async (collectionName) => {
  try {
    const snapshot = await getDocs(getCollection(collectionName))
    return snapshot.docs
      .map((record) => ({ id: record.id, ...record.data() }))
      .sort((left, right) => Number(right.updatedAt?.seconds ?? right.createdAt?.seconds ?? 0) - Number(left.updatedAt?.seconds ?? left.createdAt?.seconds ?? 0))
  } catch (error) {
    throw adminAccessError(error) || new Error('Unable to load these records from Firebase.')
  }
}

const sortRecords = (records) => records.sort((left, right) => Number(right.updatedAt?.seconds ?? right.createdAt?.seconds ?? 0) - Number(left.updatedAt?.seconds ?? left.createdAt?.seconds ?? 0))

export const subscribeAdminRecords = (collectionName, onRecords, onError) => {
  let recordsCollection
  try {
    recordsCollection = getCollection(collectionName)
  } catch (error) {
    onError?.(error)
    return () => {}
  }

  return onSnapshot(recordsCollection, (snapshot) => {
    onRecords(sortRecords(snapshot.docs.map((record) => ({ id: record.id, ...record.data() }))))
  }, (error) => onError?.(adminAccessError(error) || new Error('Unable to keep these records synchronized.')))
}

export const createAdminRecord = async (collectionName, payload) => {
  try {
    const record = await addDoc(getCollection(collectionName), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return record.id
  } catch (error) {
    throw adminAccessError(error) || new Error('Unable to create this record.')
  }
}

export const updateAdminRecord = async (collectionName, recordId, payload) => {
  try {
    await updateDoc(doc(db, collectionName, recordId), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw adminAccessError(error) || new Error('Unable to update this record.')
  }
}

export const updateAdminRecordStatus = async (collectionName, recordId, status) => {
  const publicationStatus = status === 'published' || status === 'active'
  return updateAdminRecord(collectionName, recordId, {
    status,
    ...(publicationStatus ? { publishedAt: serverTimestamp() } : {}),
  })
}

export const deleteAdminRecord = async (collectionName, recordId) => {
  try {
    await deleteDoc(doc(db, collectionName, recordId))
  } catch (error) {
    throw adminAccessError(error) || new Error('Unable to delete this record.')
  }
}

export const approveAccountRequest = async (request) => {
  const profileType = getProfileType(request)
  if (!request?.id || !request?.uid) throw new Error('This request is missing its Firebase account identifier.')
  if (!profileType) throw new Error('This request contains an unsupported school profile type.')

  try {
    const batch = writeBatch(db)
    const reviewedAt = serverTimestamp()
    batch.update(doc(db, 'accountRequests', request.id), {
      status: 'approved',
      reviewedAt,
      updatedAt: reviewedAt,
    })
    batch.set(doc(db, 'users', request.uid), {
      uid: request.uid,
      email: request.email || '',
      fullName: request.fullName || request.name || '',
      role: 'User',
      profileType,
      referenceId: request.referenceId || request.studentNumber || request.employeeNumber || '',
      status: 'active',
      updatedAt: reviewedAt,
      createdAt: request.createdAt || reviewedAt,
    }, { merge: true })
    await batch.commit()
  } catch (error) {
    throw adminAccessError(error) || new Error('Unable to approve this account request.')
  }
}
