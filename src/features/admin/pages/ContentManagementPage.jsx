import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { createAdminRecord, getAdminRecords, updateAdminRecord } from '../services/adminRecordService.js'

const recordTypes = {
  announcements: { label: 'Announcements', collection: 'announcements', kicker: 'School updates', fields: ['title', 'body', 'status'], defaults: { status: 'draft' } },
  alumni: { label: 'Alumni records', collection: 'alumni', kicker: 'Alumni engagement', fields: ['fullName', 'graduationYear', 'email', 'occupation', 'status'], defaults: { status: 'active' } },
  content: { label: 'School content', collection: 'schoolContent', kicker: 'Content management', fields: ['title', 'category', 'body', 'status'], defaults: { category: 'School Information', status: 'draft' } },
}

const emptyRecord = (type) => ({ ...recordTypes[type].defaults })

export function ContentManagementPage() {
  const [activeType, setActiveType] = useState('announcements')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form, setForm] = useState(emptyRecord('announcements'))

  const config = recordTypes[activeType]
  const loadRecords = async (type = activeType) => {
    setLoading(true); setError('')
    try { setRecords(await getAdminRecords(recordTypes[type].collection)) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => { loadRecords(activeType) }, [activeType])

  const openForm = (record = null) => { setEditingRecord(record); setForm(record ? { ...record } : emptyRecord(activeType)); setIsFormOpen(true) }
  const changeType = (type) => { setActiveType(type); setEditingRecord(null); setIsFormOpen(false) }
  const setValue = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const title = form.title || form.fullName || ''

  const handleSubmit = async (event) => {
    event.preventDefault(); setError('')
    if (!title.trim()) { setError(activeType === 'alumni' ? 'Alumni name is required.' : 'Title is required.'); return }
    setSaving(true)
    const payload = Object.fromEntries(config.fields.map((field) => [field, String(form[field] || '').trim()]))
    try {
      if (editingRecord) await updateAdminRecord(config.collection, editingRecord.id, payload)
      else await createAdminRecord(config.collection, payload)
      setIsFormOpen(false); setEditingRecord(null); await loadRecords()
    } catch (submitError) { setError(submitError.message) } finally { setSaving(false) }
  }

  const columns = useMemo(() => activeType === 'alumni' ? ['Name', 'Graduation year', 'Contact', 'Status'] : activeType === 'announcements' ? ['Title', 'Status', 'Updated'] : ['Title', 'Category', 'Status', 'Updated'], [activeType])

  return <div className="page-stack">
    <div className="page-header-row"><div><div className="page-kicker">{config.kicker}</div><h2>{config.label}</h2><p className="page-description">Create, review, publish, and maintain the information shared through GradBook.</p></div><Button onClick={() => openForm()}>Add {activeType === 'alumni' ? 'alumni record' : activeType === 'content' ? 'content' : 'announcement'}</Button></div>
    <div className="academic-tabs">{Object.entries(recordTypes).map(([type, item]) => <button key={type} type="button" className={`academic-tab ${activeType === type ? 'active' : ''}`} onClick={() => changeType(type)}>{item.label}</button>)}</div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <Card className="panel-card">{loading ? <div className="empty-state">Loading {config.label.toLowerCase()}...</div> : records.length ? <div className="table-wrapper"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Action</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.title || record.fullName || 'Untitled'}</strong>{record.body && <small className="table-subtext">{record.body}</small>}</td>{activeType === 'alumni' ? <><td>{record.graduationYear || '—'}</td><td>{record.email || record.occupation || '—'}</td></> : activeType === 'content' ? <td>{record.category || 'School Information'}</td> : null}<td><Badge variant={record.status === 'published' || record.status === 'active' ? 'success' : 'neutral'}>{record.status || 'draft'}</Badge></td>{activeType !== 'alumni' && <td>{record.updatedAt?.toDate?.().toLocaleDateString?.() || 'Recently updated'}</td>}<td><Button size="sm" variant="secondary" onClick={() => openForm(record)}>Edit</Button></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-state-title">No {config.label.toLowerCase()} yet</div><div>Use the button above to add the first record.</div></div>}</Card>
    <Modal isOpen={isFormOpen} title={editingRecord ? `Edit ${activeType === 'alumni' ? 'alumni record' : activeType.slice(0, -1)}` : `Add ${activeType === 'alumni' ? 'alumni record' : activeType.slice(0, -1)}`} onClose={() => setIsFormOpen(false)}><form className="student-form" onSubmit={handleSubmit}><div className="field-grid">{config.fields.map((field) => field === 'body' ? <label key={field} className="form-field span-2"><span>Details</span><textarea className="field content-textarea" value={form[field] || ''} onChange={(event) => setValue(field, event.target.value)} placeholder="Write the information to publish" /></label> : <label key={field} className={`form-field ${field === 'title' || field === 'fullName' ? 'span-2' : ''}`}><span>{field === 'fullName' ? 'Full name' : field === 'graduationYear' ? 'Graduation year' : field}</span>{field === 'status' ? <Select value={form[field] || ''} onChange={(event) => setValue(field, event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="active">Active</option><option value="archived">Archived</option></Select> : field === 'category' ? <Select value={form[field] || ''} onChange={(event) => setValue(field, event.target.value)}><option>School Information</option><option>School History</option><option>School Story</option><option>Alumni Gathering</option></Select> : <Input type={field === 'email' ? 'email' : 'text'} value={form[field] || ''} onChange={(event) => setValue(field, event.target.value)} required={field === 'title' || field === 'fullName'} />}</label>)}</div><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save record'}</Button></div></form></Modal>
  </div>
}
