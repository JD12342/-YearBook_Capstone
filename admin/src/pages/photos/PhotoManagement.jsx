import { Camera, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { getSchoolYears, getStrands, getSections } from '../../services/schoolYearService.js'
import { getStudents } from '../../services/studentService.js'
import { isFirebaseConfigured } from '../../services/firebase/firebaseConfig.js'

const photoManagementStateKey = 'gradbook-admin-photo-management-state'

const readPhotoManagementState = () => {
  try {
    return JSON.parse(localStorage.getItem(photoManagementStateKey) || '{}')
  } catch {
    return {}
  }
}

export function PhotoManagement() {
  const navigate = useNavigate()
  const [savedState] = useState(readPhotoManagementState)
  const [schoolYears, setSchoolYears] = useState([])
  const [strands, setStrands] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(() => savedState.schoolYearId || '')
  const [selectedStrandId, setSelectedStrandId] = useState(() => savedState.strandId || '')
  const [selectedSectionId, setSelectedSectionId] = useState(() => savedState.sectionId || '')
  const [searchTerm, setSearchTerm] = useState(() => savedState.searchTerm || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadData = async () => {
      if (!isFirebaseConfigured) {
        if (!ignore) {
          setError('Firebase is not configured. Please configure the Admin .env file.')
          setSchoolYears([])
          setStrands([])
          setSections([])
          setStudents([])
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const [years, activeStudents] = await Promise.all([
          getSchoolYears(),
          getStudents(),
        ])

        if (ignore) return

        setSchoolYears(years)
        setSelectedSchoolYearId((current) => current || years[0]?.id || '')
        setStudents(activeStudents)
      } catch (loadError) {
        if (!ignore) setError(loadError.message || 'Unable to load photo data.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadStrands = async () => {
      if (!selectedSchoolYearId || !isFirebaseConfigured) {
        if (!ignore) setStrands([])
        return
      }

      try {
        const records = await getStrands(selectedSchoolYearId)
        if (!ignore) {
          setStrands(records)
          setSelectedStrandId((current) => {
            if (current && records.some((strand) => strand.id === current)) return current
            return records[0]?.id ?? ''
          })
        }
      } catch (error) {
        if (!ignore) setStrands([])
      }
    }

    loadStrands()

    return () => {
      ignore = true
    }
  }, [selectedSchoolYearId])

  useEffect(() => {
    let ignore = false

    const loadSections = async () => {
      if (!selectedSchoolYearId || !selectedStrandId || !isFirebaseConfigured) {
        if (!ignore) setSections([])
        return
      }

      try {
        const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
        if (!ignore) {
          setSections(records)
          setSelectedSectionId((current) => (current && records.some((section) => section.id === current) ? current : ''))
        }
      } catch (error) {
        if (!ignore) setSections([])
      }
    }

    loadSections()

    return () => {
      ignore = true
    }
  }, [selectedSchoolYearId, selectedStrandId])

  useEffect(() => {
    let ignore = false

    const loadStudents = async () => {
      if (!isFirebaseConfigured) {
        if (!ignore) setStudents([])
        return
      }

      try {
        const records = await getStudents({
          schoolYearId: selectedSchoolYearId || undefined,
          strandId: selectedStrandId || undefined,
          sectionId: selectedSectionId || undefined,
          search: searchTerm || undefined,
        })

        if (!ignore) setStudents(records)
      } catch (error) {
        if (!ignore) setStudents([])
      }
    }

    loadStudents()

    return () => {
      ignore = true
    }
  }, [selectedSchoolYearId, selectedStrandId, selectedSectionId, searchTerm])

  useEffect(() => {
    localStorage.setItem(photoManagementStateKey, JSON.stringify({
      schoolYearId: selectedSchoolYearId,
      strandId: selectedStrandId,
      sectionId: selectedSectionId,
      searchTerm,
    }))
  }, [selectedSchoolYearId, selectedStrandId, selectedSectionId, searchTerm])

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true
    const haystack = [student.firstName, student.middleName, student.lastName, student.studentNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  const openCapture = (student) => {
    navigate(`/photos/camera?studentId=${encodeURIComponent(student.id)}`)
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Photos</div>
          <h2>Photo Management</h2>
        </div>
      </div>

      <p className="page-description">Capture, review, edit, and approve student photos.</p>
      {error && <div className="form-error">{error}</div>}

      <Card className="toolbar-card">
        <div className="filter-row">
          <div className="filter-field">
            <label>School Year</label>
            <Select value={selectedSchoolYearId} onChange={(event) => setSelectedSchoolYearId(event.target.value)}>
              <option value="">All</option>
              {schoolYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </Select>
          </div>
          <div className="filter-field">
            <label>Strand</label>
            <Select value={selectedStrandId} onChange={(event) => setSelectedStrandId(event.target.value)}>
              <option value="">All</option>
              {strands.map((strand) => (
                <option key={strand.id} value={strand.id}>{strand.code || strand.name}</option>
              ))}
            </Select>
          </div>
          <div className="filter-field">
            <label>Section</label>
            <Select value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)}>
              <option value="">All</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.code || section.name}</option>
              ))}
            </Select>
          </div>
          <div className="filter-field search-field">
            <label>Search Student</label>
            <div className="search-wrap">
              <Search size={14} />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search..." />
            </div>
          </div>
        </div>
      </Card>

      <div className="stats-grid compact-grid">
        <div className="mini-stat-card"><div className="mini-stat-label">Total Students</div><div className="mini-stat-value">{students.length}</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Captured</div><div className="mini-stat-value">{students.filter((student) => student.status === 'captured').length}</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Pending</div><div className="mini-stat-value">{students.filter((student) => student.status === 'pending').length}</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Editing</div><div className="mini-stat-value">{students.filter((student) => student.status === 'editing').length}</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Approved</div><div className="mini-stat-value">{students.filter((student) => student.status === 'approved').length}</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Retake Needed</div><div className="mini-stat-value">{students.filter((student) => student.status === 'retake_needed').length}</div></div>
      </div>

      <Card className="panel-card">
        <div className="section-title-row">
          <div><h3>Photo sessions</h3><span className="panel-caption">Start a fast, consistent capture session or open an existing photo for detailed editing.</span></div>
          <Button type="button" disabled={!filteredStudents.length} onClick={() => openCapture(filteredStudents[0])}>
            <Camera size={16} />
            Start photo session
          </Button>
        </div>

        {loading ? (
          <div className="empty-state">Loading students...</div>
        ) : filteredStudents.length ? (
          <div className="queue-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Strand</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || student.name || 'Unnamed student'}</td>
                    <td>{strands.find((strand) => strand.id === student.strandId)?.code || '—'}</td>
                    <td>{sections.find((section) => section.id === student.sectionId)?.code || '—'}</td>
                    <td><span className="badge badge-neutral">{student.status || 'active'}</span></td>
                    <td>{student.photoId ? 'Captured' : 'Not captured'}</td>
                    <td><div className="inline-actions"><button type="button" className="table-action-button" onClick={() => openCapture(student)}>Capture</button>{student.photoId && <button type="button" className="table-action-button alt" onClick={() => navigate(`/photos/edit/${student.photoId}`)}>Edit</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No students found.</div>
        )}
      </Card>

    </div>
  )
}
