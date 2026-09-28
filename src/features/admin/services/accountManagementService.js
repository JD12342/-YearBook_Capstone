import { collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase/firestore.js'

const clean = (value) => String(value || '').trim()
const clampLimit = (value, fallback, maximum) => Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), maximum)

export async function getStudentAccounts() {
  const [snapshot, assignmentsSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('profileType', '==', 'Student'), limit(500))),
    getDocs(query(collection(db, 'teacherAssignments'), limit(500))),
  ])
  const assignments = new Map(assignmentsSnapshot.docs.map((entry) => [entry.id, entry.data()]))
  return snapshot.docs
    .map((entry) => {
      const profile = entry.data()
      const assignment = assignments.get(entry.id) || {}
      const isAlumniLeader = profile.contributorType === 'alumniLeader' || assignment.contributorType === 'alumniLeader'
      const usesLegacyDefaults = Number(assignment.photoLimit) === 40 && Number(assignment.videoLimit) === 5
      return {
        id: entry.id,
        uid: entry.id,
        ...profile,
        fullName: profile.fullName || 'Unnamed student',
        lrn: profile.referenceId || '',
        accountStatus: profile.status || 'disabled',
        schoolYearId: profile.schoolYearId || assignment.schoolYearId || '',
        strandId: profile.strandId || '',
        sectionId: profile.sectionId || assignment.sectionIds?.[0] || '',
        isAlumniLeader,
        leaderSectionId: profile.leaderSectionId || assignment.sectionIds?.[0] || '',
        photoLimit: usesLegacyDefaults ? 5 : assignment.photoLimit || 5,
        videoLimit: usesLegacyDefaults ? 2 : assignment.videoLimit || 2,
        videoDurationLimitSeconds: assignment.videoDurationLimitSeconds || 120,
      }
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
}

async function findStudentRecord(account) {
  if (account.linkedRecordId) {
    const linked = await getDoc(doc(db, 'students', account.linkedRecordId))
    if (linked.exists()) return linked
  }

  const lrn = clean(account.lrn || account.referenceId)
  if (!lrn) return null
  const byStudentNumber = await getDocs(query(collection(db, 'students'), where('studentNumber', '==', lrn), limit(1)))
  if (!byStudentNumber.empty) return byStudentNumber.docs[0]
  const byLrn = await getDocs(query(collection(db, 'students'), where('lrn', '==', lrn), limit(1)))
  return byLrn.empty ? null : byLrn.docs[0]
}

export async function updateStudentAccountAssignment(account) {
  if (!account?.uid) throw new Error('Choose a student account.')
  const uid = clean(account.uid)
  const active = account.accountStatus === 'active'
  const isAlumniLeader = Boolean(account.isAlumniLeader)
  const sectionId = clean(account.sectionId)
  const previousLeaderSectionId = clean(account.leaderSectionId)
  if (isAlumniLeader && !sectionId) throw new Error('Choose the one section this alumni leader will represent.')

  try {
    const studentRecord = await findStudentRecord(account)
    const leaderMappingRef = isAlumniLeader && sectionId ? doc(db, 'alumniLeaderSections', sectionId) : null
    const previousMappingRef = previousLeaderSectionId ? doc(db, 'alumniLeaderSections', previousLeaderSectionId) : null
    await runTransaction(db, async (transaction) => {
      const existingLeader = leaderMappingRef ? await transaction.get(leaderMappingRef) : null
      const isDifferentPreviousMapping = previousMappingRef && (!leaderMappingRef || previousMappingRef.path !== leaderMappingRef.path)
      const previousMapping = isDifferentPreviousMapping ? await transaction.get(previousMappingRef) : existingLeader
      if (existingLeader?.exists() && existingLeader.data()?.uid !== uid) {
        throw new Error('This section already has an alumni leader. Remove the existing leader before assigning another one.')
      }

      transaction.set(doc(db, 'users', uid), {
        role: isAlumniLeader ? 'Teacher' : 'User',
        status: active ? 'active' : 'disabled',
        schoolYearId: clean(account.schoolYearId),
        strandId: clean(account.strandId),
        sectionId,
        contributorType: isAlumniLeader ? 'alumniLeader' : 'student',
        leaderSectionId: isAlumniLeader ? sectionId : '',
        linkedRecordId: studentRecord?.id || clean(account.linkedRecordId),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      if (studentRecord) transaction.set(studentRecord.ref, { accountUid: uid, accountStatus: active ? 'active' : 'disabled', updatedAt: serverTimestamp() }, { merge: true })

      const assignmentRef = doc(db, 'teacherAssignments', uid)
      if (isAlumniLeader) {
        transaction.set(assignmentRef, {
          teacherUid: uid,
          contributorType: 'alumniLeader',
          active,
          schoolYearId: clean(account.schoolYearId),
          sectionIds: [sectionId],
          photoLimit: clampLimit(account.photoLimit, 5, 500),
          videoLimit: clampLimit(account.videoLimit, 2, 100),
          videoDurationLimitSeconds: clampLimit(account.videoDurationLimitSeconds, 120, 3600),
          pendingPostLimit: 10,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        transaction.set(leaderMappingRef, { uid, fullName: clean(account.fullName), schoolYearId: clean(account.schoolYearId), sectionId, updatedAt: serverTimestamp() }, { merge: true })
      } else {
        transaction.delete(assignmentRef)
      }

      if (previousMappingRef && (!isAlumniLeader || previousLeaderSectionId !== sectionId) && previousMapping?.data()?.uid === uid) transaction.delete(previousMappingRef)
    })
    return { uid, active, isAlumniLeader, linkedRecordId: studentRecord?.id || '' }
  } catch (error) {
    if (error?.message?.includes('already has an alumni leader')) throw error
    if (error?.code === 'permission-denied') throw new Error('Only an administrator can manage student accounts.')
    if (error?.code === 'unauthenticated') throw new Error('Your administrator session expired. Sign in again and retry.')
    throw new Error('The student account could not be updated. Please retry.')
  }
}
