import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, CheckCircle2, Download, Image as ImageIcon, Printer, ShieldCheck, Users } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Select } from '../components/ui/Select.jsx'
import { buildReport, subscribeReportData } from '../services/reportService.js'

const emptyData = {
  students: [], photos: [], schoolYears: [], strands: [], sections: [], yearbooks: [],
  accountRequests: [], announcements: [], schoolContent: [], alumni: [],
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
const title = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())

function Metric({ icon: Icon, label, value, detail, tone = '' }) {
  return <Card className={`report-metric ${tone}`}>
    <span className="report-metric-icon"><Icon size={21} /></span>
    <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
  </Card>
}

function CoverageList({ records, emptyMessage }) {
  if (!records.length) return <div className="empty-state">{emptyMessage}</div>
  return <div className="report-coverage-list">{records.map((record) => <div className="report-coverage-row" key={record.id || record.label}>
    <div><strong>{record.label}</strong><span>{record.approved} of {record.students} approved</span></div>
    <div className="report-coverage-meter"><span style={{ width: `${record.completion}%` }} /></div>
    <b>{record.completion}%</b>
  </div>)}</div>
}

export function ReportsPage() {
  const [data, setData] = useState(emptyData)
  const [filters, setFilters] = useState({ schoolYearId: '', strandId: '', sectionId: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => subscribeReportData((nextData) => {
    setData(nextData)
    setUpdatedAt(new Date())
    setLoading(false)
    setError('')
  }, (loadError) => {
    setError(loadError.message)
    setLoading(false)
  }), [])

  const schoolYears = useMemo(() => [...data.schoolYears].sort((left, right) => String(right.name || '').localeCompare(String(left.name || ''))), [data.schoolYears])
  const strands = useMemo(() => data.strands.filter((strand) => !filters.schoolYearId || strand.schoolYearId === filters.schoolYearId || data.students.some((student) => student.schoolYearId === filters.schoolYearId && student.strandId === strand.id)), [data.strands, data.students, filters.schoolYearId])
  const sections = useMemo(() => data.sections.filter((section) => (!filters.schoolYearId || section.schoolYearId === filters.schoolYearId || data.students.some((student) => student.schoolYearId === filters.schoolYearId && student.sectionId === section.id)) && (!filters.strandId || section.strandId === filters.strandId || data.students.some((student) => student.strandId === filters.strandId && student.sectionId === section.id))), [data.sections, data.students, filters.schoolYearId, filters.strandId])
  const report = useMemo(() => buildReport(data, filters), [data, filters])

  useEffect(() => {
    if (filters.strandId && !strands.some((strand) => strand.id === filters.strandId)) setFilters((current) => ({ ...current, strandId: '', sectionId: '' }))
  }, [filters.strandId, strands])
  useEffect(() => {
    if (filters.sectionId && !sections.some((section) => section.id === filters.sectionId)) setFilters((current) => ({ ...current, sectionId: '' }))
  }, [filters.sectionId, sections])

  const setFilter = (field, value) => setFilters((current) => ({
    ...current,
    [field]: value,
    ...(field === 'schoolYearId' ? { strandId: '', sectionId: '' } : {}),
    ...(field === 'strandId' ? { sectionId: '' } : {}),
  }))

  const exportCsv = () => {
    const headings = ['Student number', 'Student name', 'School year', 'Strand', 'Section', 'Student status', 'Portrait status']
    const rows = report.studentRows.map((student) => [student.studentNumber, student.name, student.schoolYear, student.strand, student.section, student.studentStatus, student.photoStatus])
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `gradbook-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const photoWorkflow = [
    ['Approved', report.photoCounts.approved],
    ['Captured', report.photoCounts.captured],
    ['Editing', report.photoCounts.editing],
    ['Retake needed', report.photoCounts.retake],
    ['No portrait', report.photoCounts.missing],
  ]
  const largestPhotoCount = Math.max(...photoWorkflow.map(([, value]) => value), 1)

  return <div className="page-stack reports-page">
    <div className="page-header-row reports-heading">
      <div><div className="page-kicker">Insights</div><h2>Reports</h2><p className="page-description">Track student records, portrait readiness, publishing, and access activity from live Firebase data.</p></div>
      <div className="reports-actions"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print</Button><Button onClick={exportCsv} disabled={!report.studentRows.length}><Download size={16} /> Export CSV</Button></div>
    </div>

    {error && <div className="form-error" role="alert">{error}</div>}

    <Card className="toolbar-card reports-filter-card">
      <div className="filter-row reports-filter-row">
        <label className="filter-field"><span>School year</span><Select value={filters.schoolYearId} onChange={(event) => setFilter('schoolYearId', event.target.value)}><option value="">All school years</option>{schoolYears.map((record) => <option key={record.id} value={record.id}>{record.name || 'Unnamed school year'}</option>)}</Select></label>
        <label className="filter-field"><span>Strand</span><Select value={filters.strandId} onChange={(event) => setFilter('strandId', event.target.value)}><option value="">All strands</option>{strands.map((record) => <option key={record.id} value={record.id}>{record.code || record.name || 'Unnamed strand'}</option>)}</Select></label>
        <label className="filter-field"><span>Section</span><Select value={filters.sectionId} onChange={(event) => setFilter('sectionId', event.target.value)}><option value="">All sections</option>{sections.map((record) => <option key={record.id} value={record.id}>{record.code || record.name || 'Unnamed section'}</option>)}</Select></label>
        <div className="report-live-status"><span className={error ? 'has-error' : ''} /> <div><strong>{loading ? 'Synchronizing…' : error ? 'Sync interrupted' : 'Live report'}</strong><small>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for Firebase'}</small></div></div>
      </div>
    </Card>

    {loading ? <Card className="panel-card"><div className="empty-state">Building the live report…</div></Card> : <>
      <div className="reports-metric-grid">
        <Metric icon={Users} label="Students" value={report.totals.students} detail={`${report.totals.activeStudents} active · ${report.totals.archivedStudents} archived`} />
        <Metric icon={ImageIcon} label="Portrait completion" value={`${report.totals.portraitCompletion}%`} detail={`${report.totals.approvedPortraits} approved portraits`} tone="is-green" />
        <Metric icon={BookOpenText} label="Yearbooks" value={report.totals.yearbooks} detail={`${report.totals.publishedYearbooks} active`} tone="is-gold" />
        <Metric icon={ShieldCheck} label="Pending verification" value={report.totals.pendingVerification} detail="Requests needing review" tone={report.totals.pendingVerification ? 'is-alert' : ''} />
      </div>

      <div className="reports-overview-grid">
        <Card className="panel-card report-panel">
          <div className="section-title-row"><div><h3>Portrait workflow</h3><span className="panel-caption">Latest photo record for every student in this view</span></div><CheckCircle2 size={20} className="report-panel-icon" /></div>
          <div className="report-workflow-list">{photoWorkflow.map(([label, value]) => <div className="report-workflow-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div><span style={{ width: `${(value / largestPhotoCount) * 100}%` }} /></div></div>)}</div>
        </Card>
        <Card className="panel-card report-panel">
          <div className="section-title-row"><div><h3>Community publishing</h3><span className="panel-caption">Current records available across the system</span></div></div>
          <div className="report-publishing-list">
            <div><span>Published school content</span><strong>{report.totals.publishedContent}</strong></div>
            <div><span>Active alumni profiles</span><strong>{report.totals.activeAlumni}</strong></div>
            <div><span>Active yearbooks</span><strong>{report.totals.publishedYearbooks}</strong></div>
          </div>
        </Card>
      </div>

      <div className="reports-coverage-grid">
        <Card className="panel-card report-panel"><div className="section-title-row"><div><h3>Strand coverage</h3><span className="panel-caption">Approved portraits by strand</span></div></div><CoverageList records={report.strandCoverage} emptyMessage="No strand records match these filters." /></Card>
        <Card className="panel-card report-panel"><div className="section-title-row"><div><h3>Section coverage</h3><span className="panel-caption">Approved portraits by section</span></div></div><CoverageList records={report.sectionCoverage} emptyMessage="No section records match these filters." /></Card>
      </div>

      <Card className="panel-card report-roster-panel">
        <div className="section-title-row"><div><h3>Report roster</h3><span className="panel-caption">{report.studentRows.length} student record{report.studentRows.length === 1 ? '' : 's'} included in the export</span></div></div>
        {report.studentRows.length ? <div className="table-wrapper"><table className="data-table"><thead><tr><th>Student</th><th>School year</th><th>Class</th><th>Record</th><th>Portrait</th></tr></thead><tbody>{report.studentRows.map((student) => <tr key={student.id}><td><strong>{student.name}</strong><small className="table-subtext">{student.studentNumber || 'No student number'}</small></td><td>{student.schoolYear}</td><td>{student.strand} · {student.section}</td><td><span className={`report-status report-status-${student.studentStatus}`}>{title(student.studentStatus)}</span></td><td><span className={`report-status report-status-${student.photoStatus}`}>{title(student.photoStatus)}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-state-title">No students match this report</div><div>Change the school year, strand, or section filter.</div></div>}
      </Card>
    </>}
  </div>
}
