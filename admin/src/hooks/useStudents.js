import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSchoolYears, getStrands, getSections } from '../services/schoolYearService.js'
import { getApprovedPhotoForStudent } from '../services/photoService.js'
import {
  archiveStudent as archiveStudentRecord,
  bulkCreateStudents,
  createStudent,
  deleteStudent,
  getStudents,
  restoreStudent as restoreStudentRecord,
  updateStudent,
} from '../services/studentService.js'
import { isFirebaseConfigured } from '../services/firebase/firebaseConfig.js'

const normalizeSchoolYear = (schoolYear) => ({ ...schoolYear, label: schoolYear.name })
const normalizeStrand = (strand) => ({ ...strand, sections: Array.isArray(strand.sections) ? strand.sections : [] })

export function useStudents() {
  const location = useLocation()
  const [schoolYears, setSchoolYears] = useState([])
  const [strands, setStrands] = useState([])
  const [sections, setSections] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [selectedStrandId, setSelectedStrandId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [error, setError] = useState('')

  const selectedSchoolYear = useMemo(
    () => schoolYears.find((schoolYear) => schoolYear.id === selectedSchoolYearId) ?? schoolYears[0] ?? null,
    [schoolYears, selectedSchoolYearId],
  )

  const selectedStrand = useMemo(
    () => strands.find((strand) => strand.id === selectedStrandId) ?? strands[0] ?? null,
    [strands, selectedStrandId],
  )

  const refreshStudents = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setStudents([])
      setError('Firebase is not configured. Please configure the Firebase environment variables.')
      return []
    }

    setLoading(true)
    setError('')

    try {
      const records = await getStudents({
        schoolYearId: selectedSchoolYearId || undefined,
        strandId: selectedStrandId || undefined,
        sectionId: selectedSectionId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
      })

      const enriched = await Promise.all(
        records.map(async (student) => {
          const photo = await getApprovedPhotoForStudent(student)
          return {
            ...student,
            approvedPhotoUrl: photo?.imageUrl || '',
            photoStatus: photo ? 'approved' : 'No approved photo',
          }
        }),
      )

      setStudents(enriched)
      if (!enriched.some((student) => student.id === selectedStudentId)) {
        setSelectedStudentId(enriched[0]?.id ?? '')
      }
      return enriched
    } catch (loadError) {
      setStudents([])
      setError(loadError.message || 'Unable to load students from Firebase.')
      console.error('loadStudents error:', loadError)
      return []
    } finally {
      setLoading(false)
    }
  }, [selectedSchoolYearId, selectedStrandId, selectedSectionId, statusFilter, searchTerm, selectedStudentId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const schoolYearParam = params.get('schoolYearId') || ''
    const strandParam = params.get('strandId') || ''
    const sectionParam = params.get('sectionId') || ''

    if (schoolYearParam) setSelectedSchoolYearId(schoolYearParam)
    if (strandParam) setSelectedStrandId(strandParam)
    if (sectionParam) setSelectedSectionId(sectionParam)
  }, [location.search])

  useEffect(() => {
    let ignore = false

    const loadSchoolYears = async () => {
      if (!isFirebaseConfigured) {
        if (!ignore) {
          setSchoolYears([])
          setSelectedSchoolYearId('')
          setError('Firebase is not configured. Please configure the Firebase environment variables.')
        }
        return
      }

      try {
        const records = await getSchoolYears()
        if (ignore) return

        const yearList = records.map(normalizeSchoolYear)
        setSchoolYears(yearList)
        setSelectedSchoolYearId((current) => {
          if (current && yearList.some((year) => year.id === current)) return current
          const urlValue = new URLSearchParams(location.search).get('schoolYearId')
          if (urlValue && yearList.some((year) => year.id === urlValue)) return urlValue
          return yearList[0]?.id ?? ''
        })
      } catch (loadError) {
        if (!ignore) {
          setSchoolYears([])
          setError(loadError.message || 'Unable to load school years.')
        }
      }
    }

    loadSchoolYears()
    return () => { ignore = true }
  }, [location.search])

  useEffect(() => {
    let ignore = false

    const loadStrands = async () => {
      if (!selectedSchoolYearId) {
        if (!ignore) {
          setStrands([])
          setSelectedStrandId('')
          setSelectedSectionId('')
        }
        return
      }

      try {
        const records = await getStrands(selectedSchoolYearId)
        if (ignore) return
        const nextStrands = records.map(normalizeStrand)
        setStrands(nextStrands)
        setSelectedStrandId((current) => {
          if (current && nextStrands.some((strand) => strand.id === current)) return current
          const urlValue = new URLSearchParams(location.search).get('strandId')
          if (urlValue && nextStrands.some((strand) => strand.id === urlValue)) return urlValue
          return nextStrands[0]?.id ?? ''
        })
      } catch (loadError) {
        if (!ignore) {
          setStrands([])
          setSelectedStrandId('')
          setError(loadError.message || 'Unable to load strands.')
        }
      }
    }

    loadStrands()
    return () => { ignore = true }
  }, [selectedSchoolYearId, location.search])

  useEffect(() => {
    let ignore = false

    const loadSections = async () => {
      if (!selectedSchoolYearId || !selectedStrandId) {
        if (!ignore) {
          setSections([])
          setSelectedSectionId('')
        }
        return
      }

      try {
        const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
        if (ignore) return
        setSections(records)
        setSelectedSectionId((current) => {
          if (current && records.some((section) => section.id === current)) return current
          const urlValue = new URLSearchParams(location.search).get('sectionId')
          if (urlValue && records.some((section) => section.id === urlValue)) return urlValue
          return records[0]?.id ?? ''
        })
      } catch (loadError) {
        if (!ignore) {
          setSections([])
          setSelectedSectionId('')
        }
      }
    }

    loadSections()
    return () => { ignore = true }
  }, [selectedSchoolYearId, selectedStrandId, location.search])

  useEffect(() => {
    refreshStudents()
  }, [selectedSchoolYearId, selectedStrandId, selectedSectionId, statusFilter, searchTerm])

  const addStudent = useCallback(async (payload) => {
    const studentId = await createStudent(payload)
    await refreshStudents()
    return studentId
  }, [refreshStudents])

  const updateStudentRecord = useCallback(async (studentId, payload) => {
    await updateStudent(studentId, payload)
    await refreshStudents()
  }, [refreshStudents])

  const removeStudent = useCallback(async (studentId) => {
    await deleteStudent(studentId)
    await refreshStudents()
  }, [refreshStudents])

  const archiveStudent = useCallback(async (studentId) => {
    await archiveStudentRecord(studentId)
    await refreshStudents()
  }, [refreshStudents])

  const restoreStudent = useCallback(async (studentId) => {
    await restoreStudentRecord(studentId)
    await refreshStudents()
  }, [refreshStudents])

  const bulkImportStudents = useCallback(async ({ schoolYearId, strandId, sectionId, rows }) => {
    const records = rows.map((row) => ({
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
      suffix: row.suffix,
      studentNumber: row.studentNumber,
      schoolYearId,
      strandId,
      sectionId,
      status: 'active',
      photoId: '',
    }))

    await bulkCreateStudents(records)
    setSelectedSchoolYearId(schoolYearId)
    setSelectedStrandId(strandId)
    setSelectedSectionId(sectionId)
    await refreshStudents()
    return records.length
  }, [refreshStudents])

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? students[0] ?? null,
    [students, selectedStudentId],
  )

  const selectedSectionOptions = useMemo(
    () => sections.map((section) => section.name || section.sectionName || section.label).filter(Boolean),
    [sections],
  )

  const visibleStudents = useMemo(() => students, [students])

  return {
    schoolYears,
    strands,
    sections,
    students,
    visibleStudents,
    selectedSchoolYear,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    selectedStrand,
    selectedStrandId,
    setSelectedStrandId,
    selectedSectionId,
    setSelectedSectionId,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    selectedStudent,
    setSelectedStudentId,
    selectedSectionOptions,
    loading,
    error,
    addStudent,
    updateStudent: updateStudentRecord,
    removeStudent,
    archiveStudent,
    restoreStudent,
    refreshStudents,
    bulkImportStudents,
  }
}
