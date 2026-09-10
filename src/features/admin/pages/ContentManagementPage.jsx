import { useEffect, useMemo, useState } from 'react'
import { Archive, CheckCircle2, Eye, FilePenLine, ImagePlus, Megaphone, Search, Trash2, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { createAdminRecord, deleteAdminRecord, subscribeAdminRecords, updateAdminRecord, updateAdminRecordStatus } from '../services/adminRecordService.js'
import { deleteContentImage, uploadContentImage } from '../services/firebase/storageService.js'

const recordTypes = {
  announcements: {
    label: 'Announcements', singular: 'announcement', collection: 'announcements', icon: Megaphone,
    description: 'Publish time-sensitive notices and updates for the verified community.',
    defaults: { title: '', body: '', status: 'draft' }, statuses: ['draft', 'published', 'archived'], publicStatus: 'published',
  },
  content: {
    label: 'School content', singular: 'school story', collection: 'schoolContent', icon: FilePenLine,
    description: 'Manage stories and information displayed in School Story and Updates.',
    defaults: { title: '', category: 'School Story', body: '', status: 'draft' }, statuses: ['draft', 'published', 'archived'], publicStatus: 'published',
  },
  alumni: {
    label: 'Alumni records', singular: 'alumni record', collection: 'alumni', icon: UsersRound,
    description: 'Maintain alumni profiles shown to signed-in community members.',
    defaults: { fullName: '', graduationYear: '', email: '', occupation: '', biography: '', status: 'active' }, statuses: ['active', 'archived'], publicStatus: 'active',
  },
}

const emptyRecord = (type) => ({ ...recordTypes[type].defaults })
const text = (value) => String(value || '').trim()
const formatDate = (record) => {
  const date = record.updatedAt?.toDate?.() || record.createdAt?.toDate?.()
  return date ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'Recently'
}

export function ContentManagementPage() {
  const [activeType, setActiveType] = useState('announcements')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [form, setForm] = useState(emptyRecord('announcements'))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)
  const config = recordTypes[activeType]
  const ActiveIcon = config.icon

  useEffect(() => {
    setLoading(true)
    setError('')
    return subscribeAdminRecords(config.collection, (nextRecords) => {
      setRecords(nextRecords)
      setLoading(false)
    }, (loadError) => {
      setError(loadError.message)
      setLoading(false)
    })
  }, [config.collection])

  useEffect(() => () => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview) }, [imagePreview])

  const visibleRecords = useMemo(() => records.filter((record) => {
    const haystack = [record.title, record.fullName, record.body, record.biography, record.category, record.graduationYear, record.occupation].join(' ').toLowerCase()
    return (statusFilter === 'all' || record.status === statusFilter) && haystack.includes(query.trim().toLowerCase())
  }), [records, query, statusFilter])

  const publicCount = records.filter((record) => record.status === config.publicStatus).length
  const draftCount = records.filter((record) => record.status === 'draft').length

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
    setImageFile(null)
    setImagePreview('')
    setRemoveImage(false)
    setError('')
  }

  const openForm = (record = null) => {
    setEditingRecord(record)
    setForm(record ? { ...config.defaults, ...record } : emptyRecord(activeType))
    setImageFile(null)
    setImagePreview(record?.imageUrl || '')
    setRemoveImage(false)
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  const changeType = (type) => {
    setActiveType(type)
    setQuery('')
    setStatusFilter('all')
    setSuccess('')
    setError('')
    setIsFormOpen(false)
  }

  const setValue = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const chooseImage = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose a valid image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
    setError('')
  }

  const buildPayload = () => activeType === 'announcements' ? {
    title: text(form.title), body: text(form.body), status: form.status,
  } : activeType === 'content' ? {
    title: text(form.title), category: text(form.category), body: text(form.body), status: form.status,
  } : {
    fullName: text(form.fullName), graduationYear: text(form.graduationYear), email: text(form.email), occupation: text(form.occupation), biography: text(form.biography), status: form.status,
  }

  const validate = (payload) => {
    if (!(payload.title || payload.fullName)) return activeType === 'alumni' ? 'Alumni name is required.' : 'Title is required.'
    if (activeType !== 'alumni' && !payload.body) return 'Details are required before this record can be saved.'
    if (activeType === 'alumni' && payload.graduationYear && !/^\d{4}(?:-\d{4})?$/.test(payload.graduationYear)) return 'Use a graduation year such as 2024 or 2023-2024.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = buildPayload()
    const validationError = validate(payload)
    if (validationError) { setError(validationError); return }
    setSaving(true)
    setError('')
    try {
      let recordId = editingRecord?.id
      if (!recordId) recordId = await createAdminRecord(config.collection, imageFile ? { ...payload, status: 'draft' } : payload)
      let image = null
      if (imageFile) image = await uploadContentImage({ file: imageFile, collectionName: config.collection, recordId })
      await updateAdminRecord(config.collection, recordId, {
        ...payload,
        ...(image ? { imageUrl: image.url, imagePath: image.path } : {}),
        ...(removeImage ? { imageUrl: '', imagePath: '' } : {}),
      })
      if ((image || removeImage) && editingRecord?.imagePath) await deleteContentImage(editingRecord.imagePath).catch(() => {})
      setSuccess(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} saved and synchronized.`)
      closeForm()
    } catch (submitError) {
      setError(submitError.message || 'Unable to save this record.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (record, status) => {
    setWorkingId(record.id)
    setError('')
    try {
      await updateAdminRecordStatus(config.collection, record.id, status)
      setSuccess(status === config.publicStatus ? `${record.title || record.fullName} is now visible to authorized users.` : `${record.title || record.fullName} moved to ${status}.`)
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setWorkingId('')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setWorkingId(pendingDelete.id)
    setError('')
    try {
      await deleteAdminRecord(config.collection, pendingDelete.id)
      if (pendingDelete.imagePath) await deleteContentImage(pendingDelete.imagePath).catch(() => {})
      setSuccess(`${pendingDelete.title || pendingDelete.fullName} was deleted.`)
      setPendingDelete(null)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setWorkingId('')
    }
  }

  return <div className="page-stack content-management-page">
    <div className="page-header-row">
      <div><div className="page-kicker">School content</div><h2>Content Management</h2><p className="page-description">Create and control everything published in the verified GradBook community.</p></div>
      <Button onClick={() => openForm()}><ImagePlus size={17} /> Add {config.singular}</Button>
    </div>

    <div className="content-admin-tabs" role="tablist" aria-label="Content types">
      {Object.entries(recordTypes).map(([type, item]) => {
        const Icon = item.icon
        return <button key={type} type="button" role="tab" aria-selected={activeType === type} className={activeType === type ? 'active' : ''} onClick={() => changeType(type)}><Icon size={18} /><span><strong>{item.label}</strong><small>{item.description}</small></span></button>
      })}
    </div>

    <div className="content-admin-stats">
      <Card className="mini-stat-card"><span className="mini-stat-label">Total records</span><strong className="mini-stat-value">{records.length}</strong></Card>
      <Card className="mini-stat-card"><span className="mini-stat-label">Visible to users</span><strong className="mini-stat-value">{publicCount}</strong></Card>
      <Card className="mini-stat-card"><span className="mini-stat-label">Drafts</span><strong className="mini-stat-value">{draftCount}</strong></Card>
    </div>

    {success && <div className="form-success" role="status"><CheckCircle2 size={17} /> {success}</div>}
    {error && !isFormOpen && <div className="form-error" role="alert">{error}</div>}

    <Card className="panel-card content-admin-panel">
      <div className="content-admin-toolbar">
        <div><h3>{config.label}</h3><span>Changes update signed-in community pages automatically.</span></div>
        <div className="content-admin-filters">
          <label className="search-wrap"><Search size={16} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" aria-label="Search records" /></label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{config.statuses.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</Select>
        </div>
      </div>

      {loading ? <div className="empty-state">Loading {config.label.toLowerCase()}…</div> : visibleRecords.length ? <div className="content-record-grid">
        {visibleRecords.map((record) => <article className="content-record-card" key={record.id}>
          <div className="content-record-image">{record.imageUrl ? <img src={record.imageUrl} alt="" /> : <ActiveIcon size={28} />}</div>
          <div className="content-record-copy">
            <div><Badge variant={record.status === config.publicStatus ? 'success' : record.status === 'archived' ? 'neutral' : 'warning'}>{record.status || 'draft'}</Badge><span>{formatDate(record)}</span></div>
            <h4>{record.title || record.fullName || 'Untitled'}</h4>
            <p>{record.body || record.biography || record.occupation || 'No details added yet.'}</p>
            <small>{activeType === 'content' ? record.category || 'School Story' : activeType === 'alumni' ? [record.graduationYear, record.occupation].filter(Boolean).join(' · ') || 'Alumni profile' : 'Community announcement'}</small>
          </div>
          <div className="content-record-actions">
            <Button size="sm" variant="secondary" onClick={() => openForm(record)}>Edit</Button>
            {record.status !== config.publicStatus && <Button size="sm" disabled={workingId === record.id} onClick={() => changeStatus(record, config.publicStatus)}><Eye size={14} /> {activeType === 'alumni' ? 'Activate' : 'Publish'}</Button>}
            {record.status === config.publicStatus && <Button size="sm" variant="ghost" disabled={workingId === record.id} onClick={() => changeStatus(record, activeType === 'alumni' ? 'archived' : 'draft')}>{activeType === 'alumni' ? 'Archive' : 'Unpublish'}</Button>}
            {record.status !== 'archived' && <Button size="sm" variant="ghost" disabled={workingId === record.id} onClick={() => changeStatus(record, 'archived')}><Archive size={14} /> Archive</Button>}
            <Button size="sm" variant="danger" disabled={workingId === record.id} onClick={() => setPendingDelete(record)}><Trash2 size={14} /> Delete</Button>
          </div>
        </article>)}
      </div> : <div className="empty-state"><div className="empty-state-title">No matching {config.label.toLowerCase()}</div><div>{records.length ? 'Adjust the search or status filter.' : `Add the first ${config.singular} to begin.`}</div></div>}
    </Card>

    <Modal isOpen={isFormOpen} title={`${editingRecord ? 'Edit' : 'Add'} ${config.singular}`} panelClassName="content-editor-modal" onClose={closeForm}>
      <form className="student-form content-editor-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field-grid">
          {activeType === 'alumni' ? <>
            <label className="form-field span-2"><span>Full name</span><Input value={form.fullName || ''} onChange={(event) => setValue('fullName', event.target.value)} required /></label>
            <label className="form-field"><span>Graduation year</span><Input value={form.graduationYear || ''} onChange={(event) => setValue('graduationYear', event.target.value)} placeholder="2024 or 2023-2024" /></label>
            <label className="form-field"><span>Occupation</span><Input value={form.occupation || ''} onChange={(event) => setValue('occupation', event.target.value)} /></label>
            <label className="form-field span-2"><span>Email</span><Input type="email" value={form.email || ''} onChange={(event) => setValue('email', event.target.value)} /></label>
            <label className="form-field span-2"><span>Biography</span><textarea className="field content-textarea" value={form.biography || ''} onChange={(event) => setValue('biography', event.target.value)} placeholder="Share a brief alumni profile" /></label>
          </> : <>
            <label className="form-field span-2"><span>Title</span><Input value={form.title || ''} onChange={(event) => setValue('title', event.target.value)} required /></label>
            {activeType === 'content' && <label className="form-field span-2"><span>Where this appears</span><Select value={form.category || ''} onChange={(event) => setValue('category', event.target.value)}><option>School Story</option><option>School History</option><option>School Information</option><option>Alumni Gathering</option></Select></label>}
            <label className="form-field span-2"><span>Details</span><textarea className="field content-textarea" value={form.body || ''} onChange={(event) => setValue('body', event.target.value)} placeholder="Write the complete information users should see" required /></label>
          </>}
          <label className="form-field"><span>Status</span><Select value={form.status || ''} onChange={(event) => setValue('status', event.target.value)}>{config.statuses.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</Select></label>
          <label className="form-field"><span>Feature image</span><input className="field content-image-input" type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0])} /></label>
          {imagePreview && !removeImage && <div className="content-image-preview span-2"><img src={imagePreview} alt="Selected content preview" /><Button type="button" size="sm" variant="danger" onClick={() => { setImageFile(null); setImagePreview(''); setRemoveImage(true) }}>Remove image</Button></div>}
        </div>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving and syncing…' : editingRecord ? 'Save changes' : 'Create record'}</Button></div>
      </form>
    </Modal>

    <Modal isOpen={Boolean(pendingDelete)} title="Delete this record?" onClose={() => { if (!workingId) setPendingDelete(null) }}>
      <div className="content-delete-confirm"><p><strong>{pendingDelete?.title || pendingDelete?.fullName}</strong> will be permanently removed from Firebase and from the community view.</p><div className="form-actions"><Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={Boolean(workingId)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={Boolean(workingId)}>{workingId ? 'Deleting…' : 'Delete permanently'}</Button></div></div>
    </Modal>
  </div>
}
