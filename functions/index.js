const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const { FieldValue } = require('firebase-admin/firestore')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions')
const { GoogleAuth } = require('google-auth-library')

initializeApp()

const db = getFirestore()
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId
const defaultAdministratorUid = 'iVLZld9fcpcPQXbat8jdlmN6AsC3'

const metricTypes = {
  reads: 'firestore.googleapis.com/document/read_ops_count',
  writes: 'firestore.googleapis.com/document/write_ops_count',
  deletes: 'firestore.googleapis.com/document/delete_ops_count',
  storageBytes: 'firestore.googleapis.com/storage/data_and_index_storage_bytes',
  activeConnections: 'firestore.googleapis.com/network/active_connections',
  snapshotListeners: 'firestore.googleapis.com/network/snapshot_listeners',
}

const numberValue = (point) => Number(point?.value?.int64Value ?? point?.value?.doubleValue ?? 0) || 0

async function accessToken() {
  const token = await auth.getAccessToken()
  if (!token) throw new Error('Unable to obtain a Google Cloud access token.')
  return token
}

async function cloudJson(url, options = {}) {
  const token = await accessToken()
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error?.message || `Google Cloud request failed with ${response.status}.`)
  return payload
}

async function assertAdministrator(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before opening infrastructure reports.')

  const token = request.auth.token || {}
  const configuredUids = String(process.env.ADMIN_UIDS || '').split(',').map((uid) => uid.trim()).filter(Boolean)
  if (request.auth.uid === defaultAdministratorUid || configuredUids.includes(request.auth.uid) || token.admin === true || token.role === 'Administrator') return

  const profile = await db.doc(`users/${request.auth.uid}`).get()
  if (!profile.exists || profile.data()?.status !== 'active' || profile.data()?.role !== 'Administrator') {
    throw new HttpsError('permission-denied', 'Administrator access is required.')
  }
}

async function activeRole(uid) {
  const profile = await db.doc(`users/${uid}`).get()
  return profile.exists && profile.data()?.status === 'active' ? profile.data()?.role : ''
}

async function assertTeacher(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before using the teacher workspace.')
  const profileRole = await activeRole(request.auth.uid)
  if (profileRole !== 'Teacher') throw new HttpsError('permission-denied', 'An active teacher account is required.')
}

const cleanIds = (value) => [...new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean))]
const clampLimit = (value, fallback, maximum) => Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), maximum)
exports.approveAccountAccess = onCall({ region: 'asia-southeast1' }, async (request) => {
  await assertAdministrator(request)
  const requestId = String(request.data?.requestId || '').trim()
  if (!requestId) throw new HttpsError('invalid-argument', 'An account request is required.')

  const requestRef = db.doc(`accountRequests/${requestId}`)
  const snapshot = await requestRef.get()
  if (!snapshot.exists) throw new HttpsError('not-found', 'The account request no longer exists.')
  const accountRequest = snapshot.data()
  const uid = String(accountRequest.uid || '').trim()
  if (!uid) throw new HttpsError('failed-precondition', 'The request has no Firebase user id.')
  const role = accountRequest.profileType === 'Teacher' ? 'Teacher' : 'User'
  const now = FieldValue.serverTimestamp()
  const batch = db.batch()
  let linkedRecordId = ''

  if (role === 'User') {
    const referenceId = String(accountRequest.referenceId || '').trim()
    let existingStudent = referenceId
      ? await db.collection('students').where('studentNumber', '==', referenceId).limit(1).get()
      : null
    if (referenceId && existingStudent?.empty) existingStudent = await db.collection('students').where('lrn', '==', referenceId).limit(1).get()
    const hasStudentRecord = existingStudent && !existingStudent.empty
    if (hasStudentRecord) {
      const studentRef = existingStudent.docs[0].ref
      linkedRecordId = studentRef.id
      batch.set(studentRef, {
        accountUid: uid,
        accountStatus: 'active',
        updatedAt: now,
      }, { merge: true })
    }
  }

  batch.update(requestRef, { role, status: 'approved', reviewedBy: request.auth.uid, reviewedAt: now, updatedAt: now })
  batch.set(db.doc(`users/${uid}`), {
    uid,
    email: accountRequest.email || '',
    fullName: accountRequest.fullName || accountRequest.name || '',
    role,
    profileType: accountRequest.profileType || 'Student',
    referenceId: accountRequest.referenceId || '',
    linkedRecordId,
    status: 'active',
    updatedAt: now,
    createdAt: accountRequest.createdAt || now,
  }, { merge: true })

  if (role === 'Teacher') {
    batch.set(db.doc(`teacherAssignments/${uid}`), {
      teacherUid: uid,
      active: true,
      sectionIds: cleanIds(request.data?.sectionIds),
      schoolYearId: String(request.data?.schoolYearId || ''),
      photoLimit: clampLimit(request.data?.photoLimit, 5, 500),
      videoLimit: clampLimit(request.data?.videoLimit, 2, 100),
      videoDurationLimitSeconds: clampLimit(request.data?.videoDurationLimitSeconds, 120, 3600),
      photosSubmitted: 0,
      videosSubmitted: 0,
      pendingPostLimit: clampLimit(request.data?.pendingPostLimit, 10, 100),
      updatedAt: now,
    }, { merge: true })
  }

  await batch.commit()
  const existingClaims = (await getAuth().getUser(uid)).customClaims || {}
  await getAuth().setCustomUserClaims(uid, { ...existingClaims, role, admin: role === 'Administrator' })
  return { uid, role }
})

exports.manageTeacherAccess = onCall({ region: 'asia-southeast1' }, async (request) => {
  await assertAdministrator(request)
  const uid = String(request.data?.uid || '').trim()
  if (!uid) throw new HttpsError('invalid-argument', 'Choose a teacher account.')
  const active = request.data?.active !== false
  const role = request.data?.role === 'User' ? 'User' : 'Teacher'
  const now = FieldValue.serverTimestamp()
  const sectionIds = cleanIds(request.data?.sectionIds)
  const batch = db.batch()
  batch.set(db.doc(`users/${uid}`), { role, status: active ? 'active' : 'disabled', updatedAt: now }, { merge: true })
  const assignmentUpdate = {
    teacherUid: uid,
    active: active && role === 'Teacher',
    sectionIds,
    schoolYearId: String(request.data?.schoolYearId || ''),
    position: String(request.data?.position || 'Teacher').trim(),
    photoLimit: clampLimit(request.data?.photoLimit, 5, 500),
    videoLimit: clampLimit(request.data?.videoLimit, 2, 100),
    videoDurationLimitSeconds: clampLimit(request.data?.videoDurationLimitSeconds, 120, 3600),
    pendingPostLimit: clampLimit(request.data?.pendingPostLimit, 10, 100),
    updatedAt: now,
  }
  if (request.data?.resetUsage === true) {
    assignmentUpdate.photosSubmitted = 0
    assignmentUpdate.videosSubmitted = 0
    assignmentUpdate.usageResetAt = now
    assignmentUpdate.usageResetBy = request.auth.uid
  }
  batch.set(db.doc(`teacherAssignments/${uid}`), assignmentUpdate, { merge: true })
  const userProfile = await db.doc(`users/${uid}`).get()
  if (!userProfile.exists || userProfile.data()?.profileType !== 'Teacher') throw new HttpsError('failed-precondition', 'Only an approved teacher account can be assigned to sections.')
  await batch.commit()
  const user = await getAuth().getUser(uid)
  await getAuth().setCustomUserClaims(uid, { ...(user.customClaims || {}), role: active ? role : 'Disabled', admin: false })
  return { uid, role, active, sectionIds }
})

exports.manageStudentAccess = onCall({ region: 'asia-southeast1' }, async (request) => {
  await assertAdministrator(request)
  const uid = String(request.data?.uid || '').trim()
  if (!uid) throw new HttpsError('invalid-argument', 'Choose a student account.')
  const profileSnapshot = await db.doc(`users/${uid}`).get()
  if (!profileSnapshot.exists || profileSnapshot.data()?.profileType !== 'Student') throw new HttpsError('failed-precondition', 'Only an approved student account can be managed here.')
  const profile = profileSnapshot.data()
  const active = request.data?.active !== false
  const referenceId = String(profile.referenceId || '').trim()
  let studentId = String(profile.linkedRecordId || '').trim()
  if (studentId) {
    const linkedStudent = await db.doc(`students/${studentId}`).get()
    if (!linkedStudent.exists) studentId = ''
  }
  if (!studentId && referenceId) {
    let matchingStudent = await db.collection('students').where('studentNumber', '==', referenceId).limit(1).get()
    if (matchingStudent.empty) matchingStudent = await db.collection('students').where('lrn', '==', referenceId).limit(1).get()
    if (!matchingStudent.empty) studentId = matchingStudent.docs[0].id
  }
  const now = FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(db.doc(`users/${uid}`), {
    role: 'User',
    status: active ? 'active' : 'disabled',
    schoolYearId: String(request.data?.schoolYearId || ''),
    strandId: String(request.data?.strandId || ''),
    sectionId: String(request.data?.sectionId || ''),
    linkedRecordId: studentId,
    updatedAt: now,
  }, { merge: true })
  if (studentId) {
    batch.set(db.doc(`students/${studentId}`), {
      accountUid: uid,
      accountStatus: active ? 'active' : 'disabled',
      updatedAt: now,
    }, { merge: true })
  }
  await batch.commit()
  const user = await getAuth().getUser(uid)
  await getAuth().setCustomUserClaims(uid, { ...(user.customClaims || {}), role: active ? 'User' : 'Disabled', admin: false })
  return { uid, studentId, active }
})

exports.reserveTeacherMemory = onCall({ region: 'asia-southeast1' }, async (request) => {
  await assertTeacher(request)
  const uid = request.auth.uid
  const title = String(request.data?.title || '').trim()
  const sectionId = String(request.data?.sectionId || '').trim()
  const photoCount = Math.max(Number(request.data?.photoCount) || 0, 0)
  const videoCount = Math.max(Number(request.data?.videoCount) || 0, 0)
  const videoDurationsSeconds = (Array.isArray(request.data?.videoDurationsSeconds) ? request.data.videoDurationsSeconds : [])
    .map((duration) => Math.max(Math.ceil(Number(duration) || 0), 0))
    .filter(Boolean)
  const assignmentRef = db.doc(`teacherAssignments/${uid}`)
  const memoryRef = db.collection('memories').doc()
  const limits = await db.runTransaction(async (transaction) => {
    const assignmentSnapshot = await transaction.get(assignmentRef)
    const assignment = assignmentSnapshot.data()
    if (!assignmentSnapshot.exists || assignment?.active !== true) throw new HttpsError('permission-denied', 'Your teaching assignment is not active.')
    if (!title) throw new HttpsError('invalid-argument', 'Add a title for this memory.')
    if (!sectionId || !cleanIds(assignment.sectionIds).includes(sectionId)) throw new HttpsError('permission-denied', 'Choose one of your assigned sections.')
    if (!photoCount && !videoCount) throw new HttpsError('invalid-argument', 'Add at least one photo or video.')
    if (videoCount !== videoDurationsSeconds.length) throw new HttpsError('invalid-argument', 'GradBook could not verify every video duration. Choose the videos again.')

    const usesLegacyDefaults = Number(assignment.photoLimit) === 40 && Number(assignment.videoLimit) === 5
    const photoLimit = clampLimit(usesLegacyDefaults ? 5 : assignment.photoLimit, 5, 500)
    const videoLimit = clampLimit(usesLegacyDefaults ? 2 : assignment.videoLimit, 2, 100)
    const videoDurationLimitSeconds = clampLimit(assignment.videoDurationLimitSeconds, 120, 3600)
    const pendingPostLimit = clampLimit(assignment.pendingPostLimit, 10, 100)
    const photosSubmitted = Math.max(Number(assignment.photosSubmitted) || 0, 0)
    const videosSubmitted = Math.max(Number(assignment.videosSubmitted) || 0, 0)
    if (photosSubmitted + photoCount > photoLimit) throw new HttpsError('resource-exhausted', `Only ${Math.max(photoLimit - photosSubmitted, 0)} photo uploads remain in your allowance.`)
    if (videosSubmitted + videoCount > videoLimit) throw new HttpsError('resource-exhausted', `Only ${Math.max(videoLimit - videosSubmitted, 0)} video uploads remain in your allowance.`)
    if (videoDurationsSeconds.some((duration) => duration > videoDurationLimitSeconds)) throw new HttpsError('invalid-argument', `Each video must be ${Math.ceil(videoDurationLimitSeconds / 60)} minutes or shorter.`)

    const pendingQuery = db.collection('memories').where('ownerUid', '==', uid).where('status', '==', 'pending').limit(pendingPostLimit)
    const pending = await transaction.get(pendingQuery)
    if (pending.size >= pendingPostLimit) throw new HttpsError('resource-exhausted', 'Your pending approval limit has been reached.')

    const now = FieldValue.serverTimestamp()
    transaction.set(memoryRef, {
      title,
      caption: String(request.data?.caption || '').trim(),
      sectionId,
      ownerUid: uid,
      contributorName: String(request.data?.contributorName || '').trim(),
      source: assignment.contributorType === 'alumniLeader' ? 'alumniLeader' : 'teacher',
      contributorType: assignment.contributorType === 'alumniLeader' ? 'alumniLeader' : 'teacher',
      status: 'pending',
      media: [],
      images: [],
      expectedPhotoCount: photoCount,
      expectedVideoCount: videoCount,
      expectedVideoDurationsSeconds: videoDurationsSeconds,
      videoDurationLimitSeconds,
      createdAt: now,
      updatedAt: now,
    })
    transaction.update(assignmentRef, {
      photosSubmitted: photosSubmitted + photoCount,
      videosSubmitted: videosSubmitted + videoCount,
      lastSubmissionAt: now,
      updatedAt: now,
    })
    return { photoLimit, videoLimit, videoDurationLimitSeconds, pendingPostLimit, photosSubmitted: photosSubmitted + photoCount, videosSubmitted: videosSubmitted + videoCount }
  })
  return { id: memoryRef.id, ...limits }
})

exports.cancelTeacherMemoryReservation = onCall({ region: 'asia-southeast1' }, async (request) => {
  await assertTeacher(request)
  const uid = request.auth.uid
  const memoryId = String(request.data?.memoryId || '').trim()
  if (!memoryId) throw new HttpsError('invalid-argument', 'A reserved memory is required.')
  const memoryRef = db.doc(`memories/${memoryId}`)
  const assignmentRef = db.doc(`teacherAssignments/${uid}`)
  await db.runTransaction(async (transaction) => {
    const [memorySnapshot, assignmentSnapshot] = await Promise.all([transaction.get(memoryRef), transaction.get(assignmentRef)])
    if (!memorySnapshot.exists) return
    const memory = memorySnapshot.data()
    if (memory.ownerUid !== uid || memory.status !== 'pending' || (memory.media || []).length) throw new HttpsError('failed-precondition', 'This submission can no longer be cancelled automatically.')
    const assignment = assignmentSnapshot.data() || {}
    transaction.delete(memoryRef)
    if (assignmentSnapshot.exists) transaction.update(assignmentRef, {
      photosSubmitted: Math.max((Number(assignment.photosSubmitted) || 0) - (Number(memory.expectedPhotoCount) || 0), 0),
      videosSubmitted: Math.max((Number(assignment.videosSubmitted) || 0) - (Number(memory.expectedVideoCount) || 0), 0),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  return { cancelled: true }
})

exports.toggleMemoryHeart = onCall({ region: 'asia-southeast1' }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to react to a memory.')
  const role = await activeRole(request.auth.uid)
  if (!['User', 'Teacher', 'Administrator'].includes(role) && request.auth.uid !== defaultAdministratorUid) throw new HttpsError('permission-denied', 'An active GradBook account is required.')
  const memoryId = String(request.data?.memoryId || '').trim()
  if (!memoryId) throw new HttpsError('invalid-argument', 'Choose a memory.')
  const memoryRef = db.doc(`memories/${memoryId}`)
  const reactionRef = memoryRef.collection('reactions').doc(request.auth.uid)
  return db.runTransaction(async (transaction) => {
    const [memory, reaction] = await Promise.all([transaction.get(memoryRef), transaction.get(reactionRef)])
    if (!memory.exists || memory.data()?.status !== 'published') throw new HttpsError('not-found', 'This memory is not available.')
    const currentCount = Math.max(Number(memory.data()?.heartCount) || 0, 0)
    if (reaction.exists) {
      transaction.delete(reactionRef)
      transaction.update(memoryRef, { heartCount: Math.max(currentCount - 1, 0), updatedAt: FieldValue.serverTimestamp() })
      return { hearted: false, heartCount: Math.max(currentCount - 1, 0) }
    }
    transaction.set(reactionRef, { ownerUid: request.auth.uid, createdAt: FieldValue.serverTimestamp() })
    transaction.update(memoryRef, { heartCount: currentCount + 1, updatedAt: FieldValue.serverTimestamp() })
    return { hearted: true, heartCount: currentCount + 1 }
  })
})

async function monitoringSeries(metricType, periodDays, gauge = false) {
  const end = new Date()
  const start = new Date(end.getTime() - periodDays * 24 * 60 * 60 * 1000)
  const parameters = new URLSearchParams({
    filter: `metric.type="${metricType}"`,
    'interval.startTime': start.toISOString(),
    'interval.endTime': end.toISOString(),
    'aggregation.alignmentPeriod': '86400s',
    'aggregation.perSeriesAligner': gauge ? 'ALIGN_MAX' : 'ALIGN_SUM',
    'aggregation.crossSeriesReducer': 'REDUCE_SUM',
    view: 'FULL',
  })
  const payload = await cloudJson(`https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?${parameters}`)
  return (payload.timeSeries || []).flatMap((series) => series.points || [])
}

async function loadDatabaseUsage(periodDays) {
  const entries = await Promise.all(Object.entries(metricTypes).map(async ([key, metricType]) => {
    const gauge = key === 'storageBytes' || key === 'activeConnections' || key === 'snapshotListeners'
    return [key, await monitoringSeries(metricType, periodDays, gauge)]
  }))
  const points = Object.fromEntries(entries)
  const daily = new Map()

  for (const key of ['reads', 'writes', 'deletes']) {
    for (const point of points[key]) {
      const date = String(point?.interval?.endTime || '').slice(0, 10)
      if (!date) continue
      const record = daily.get(date) || { date, reads: 0, writes: 0, deletes: 0 }
      record[key] += numberValue(point)
      daily.set(date, record)
    }
  }

  const newestGauge = (records) => [...records]
    .sort((left, right) => String(right?.interval?.endTime || '').localeCompare(String(left?.interval?.endTime || '')))
    .map(numberValue)[0] || 0

  return {
    status: 'ready',
    reads: points.reads.reduce((sum, point) => sum + numberValue(point), 0),
    writes: points.writes.reduce((sum, point) => sum + numberValue(point), 0),
    deletes: points.deletes.reduce((sum, point) => sum + numberValue(point), 0),
    storageBytes: newestGauge(points.storageBytes),
    activeConnections: newestGauge(points.activeConnections),
    snapshotListeners: newestGauge(points.snapshotListeners),
    dailyUsage: [...daily.values()].sort((left, right) => left.date.localeCompare(right.date)),
  }
}

exports.getDatabaseAnalytics = onCall({ region: 'asia-southeast1', timeoutSeconds: 60, memory: '256MiB' }, async (request) => {
  await assertAdministrator(request)
  const requestedDays = Number(request.data?.periodDays)
  const periodDays = [7, 30, 90].includes(requestedDays) ? requestedDays : 30

  const [databaseResult] = await Promise.allSettled([loadDatabaseUsage(periodDays)])

  if (databaseResult.status === 'rejected') logger.error('Unable to load Cloud Monitoring data.', databaseResult.reason)

  return {
    projectId,
    periodDays,
    generatedAt: new Date().toISOString(),
    database: databaseResult.status === 'fulfilled'
      ? databaseResult.value
      : { status: 'error', message: 'Cloud Monitoring is unavailable. Confirm that its API and service-account permissions are enabled.', reads: 0, writes: 0, deletes: 0, storageBytes: 0, activeConnections: 0, snapshotListeners: 0, dailyUsage: [] },
  }
})
