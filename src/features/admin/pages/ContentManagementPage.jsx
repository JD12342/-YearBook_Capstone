import { useEffect, useMemo, useState } from 'react'
import { Archive, CheckCircle2, Eye, FilePenLine, ImagePlus, Images, Inbox, LayoutTemplate, Megaphone, Search, Trash2 } from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { createAdminRecord, deleteAdminRecord, getCachedAdminRecords, subscribeAdminRecords, updateAdminRecord, updateAdminRecordStatus } from '../services/adminRecordService.js'
import { deleteContentImage, uploadContentImage } from '../services/firebase/storageService.js'
import { accessContent, campusFilmContent, featuredStoriesContent, heroContent, landingMedia, legacyContent, livingLegacyContent, mosaicContent, schoolStoryContent } from '../../public/data/landingContent.js'

const builtInLandingRecords = [
  { id: 'default-hero', section: 'hero', eyebrow: heroContent.eyebrow, title: heroContent.title, body: heroContent.description, ctaLabel: 'Become part of the story', imageUrl: landingMedia.school },
  { id: 'default-legacy', section: 'legacy', eyebrow: legacyContent.kicker, title: legacyContent.title, body: legacyContent.description, ctaLabel: 'ENTER GRADBOOK', imageUrl: landingMedia.school },
  { id: 'default-explore', section: 'explore', eyebrow: schoolStoryContent.kicker, title: schoolStoryContent.title, body: schoolStoryContent.notes.map((note) => note.body).join(' '), ctaLabel: 'DISCOVER MORE', imageUrl: landingMedia.school },
  { id: 'default-overview', section: 'overview', eyebrow: livingLegacyContent.kicker, title: livingLegacyContent.title, body: livingLegacyContent.description, imageUrl: landingMedia.school },
  { id: 'default-collection', section: 'collection', eyebrow: mosaicContent.kicker, title: mosaicContent.title, body: 'Explore yearbooks, portraits, stories, and school memories.', ctaLabel: 'OPEN THE ARCHIVE', imageUrl: landingMedia.school },
  { id: 'default-highlights', section: 'highlights', eyebrow: featuredStoriesContent.kicker, title: featuredStoriesContent.title, body: featuredStoriesContent.description, imageUrl: landingMedia.school },
  { id: 'default-access', section: 'access', eyebrow: accessContent.kicker, title: accessContent.title, body: accessContent.description, ctaLabel: 'REQUEST ACCESS', imageUrl: landingMedia.seal },
  { id: 'default-film', section: 'film', eyebrow: campusFilmContent.kicker, title: campusFilmContent.title, body: campusFilmContent.description, ctaLabel: 'BECOME PART OF THE STORY', imageUrl: landingMedia.school },
].map((record) => ({ ...record, status: 'published', isDefault: true }))

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
  landing: {
    label: 'Landing page', singular: 'landing section', collection: 'landingContent', icon: LayoutTemplate,
    description: 'Control the Hero, Overview, Explore, Collection, Highlights, Access, and closing landing-page copy.',
    defaults: { section: 'hero', eyebrow: '', title: '', body: '', ctaLabel: '', status: 'draft' }, statuses: ['draft', 'published', 'archived'], publicStatus: 'published',
  },
  memories: {
    label: 'Memories', singular: 'memory gallery', collection: 'memories', icon: Images,
    description: 'Publish captioned photos for classes, clubs, events, and the wider school community.',
    defaults: { title: '', caption: '', themeColor: '#d17c87', status: 'draft', images: [] }, statuses: ['pending', 'draft', 'published', 'rejected', 'archived'], publicStatus: 'published',
  },
}

const emptyRecord = (type) => ({ ...recordTypes[type].defaults })
const text = (value) => String(value || '').trim()
const isContributorSubmission = (record) => record?.source === 'teacher' || record?.source === 'alumniLeader'
const contributorRoleLabel = (record) => record?.source === 'alumniLeader' ? 'Alumni leader' : 'Teacher'
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
  const [memoryFiles, setMemoryFiles] = useState([null, null, null, null])
  const [memoryImages, setMemoryImages] = useState([null, null, null, null])
  const [memoryPreviews, setMemoryPreviews] = useState(['', '', '', ''])
  const config = recordTypes[activeType]
  const ActiveIcon = config.icon

  useEffect(() => {
    const cachedRecords = getCachedAdminRecords(config.collection)
    if (cachedRecords) setRecords(cachedRecords)
    else setRecords([])
    setLoading(!cachedRecords)
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

  const displayRecords = useMemo(() => activeType === 'landing' ? [...records, ...builtInLandingRecords.filter((fallback) => !records.some((record) => record.section === fallback.section))] : records, [activeType, records])
  const visibleRecords = useMemo(() => displayRecords.filter((record) => {
    const haystack = [record.title, record.fullName, record.body, record.biography, record.category, record.section, record.caption, record.graduationYear, record.occupation, record.schoolYearName, record.sectionName].join(' ').toLowerCase()
    return (statusFilter === 'all' || record.status === statusFilter) && haystack.includes(query.trim().toLowerCase())
  }), [displayRecords, query, statusFilter])

  const publicCount = displayRecords.filter((record) => record.status === config.publicStatus).length
  const draftCount = displayRecords.filter((record) => record.status === 'draft').length
  const pendingMemoryRecords = activeType === 'memories' ? displayRecords.filter((record) => isContributorSubmission(record) && record.status === 'pending') : []

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
    setImageFile(null)
    setImagePreview('')
    setRemoveImage(false)
    memoryPreviews.forEach((url) => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) })
    setMemoryFiles([null, null, null, null])
    setMemoryImages([null, null, null, null])
    setMemoryPreviews(['', '', '', ''])
    setError('')
  }

  const openForm = (record = null) => {
    setEditingRecord(record)
    setForm(record ? { ...config.defaults, ...record } : emptyRecord(activeType))
    setImageFile(null)
    setImagePreview(record?.imageUrl || '')
    setRemoveImage(false)
    const savedImages = Array.from({ length: 4 }, (_, index) => record?.images?.[index] || null)
    setMemoryFiles([null, null, null, null])
    setMemoryImages(savedImages)
    setMemoryPreviews(savedImages.map((image) => image?.url || ''))
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

  const chooseMemoryImage = (index, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose a valid image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return }
    const url = URL.createObjectURL(file)
    setMemoryFiles((current) => current.map((value, slot) => slot === index ? file : value))
    setMemoryPreviews((current) => current.map((value, slot) => { if (slot === index && value.startsWith('blob:')) URL.revokeObjectURL(value); return slot === index ? url : value }))
    setError('')
  }

  const removeMemoryImage = (index) => {
    if (memoryPreviews[index]?.startsWith('blob:')) URL.revokeObjectURL(memoryPreviews[index])
    setMemoryFiles((current) => current.map((value, slot) => slot === index ? null : value))
    setMemoryImages((current) => current.map((value, slot) => slot === index ? null : value))
    setMemoryPreviews((current) => current.map((value, slot) => slot === index ? '' : value))
  }

  const buildPayload = () => activeType === 'announcements' ? {
    title: text(form.title), body: text(form.body), status: form.status,
  } : activeType === 'content' ? {
    title: text(form.title), category: text(form.category), body: text(form.body), status: form.status,
  } : activeType === 'landing' ? {
    section: text(form.section), eyebrow: text(form.eyebrow), title: text(form.title), body: text(form.body), ctaLabel: text(form.ctaLabel), status: form.status,
  } : {
    title: text(form.title), caption: text(form.caption), themeColor: form.themeColor || '#d17c87', status: form.status,
  }

  const validate = (payload) => {
    if (activeType === 'landing') {
      if (!payload.section) return 'Choose a landing-page section.'
      const duplicate = records.some((record) => record.id !== editingRecord?.id && record.section === payload.section)
      if (duplicate) return 'That landing-page section already has a record. Edit the existing record instead.'
    }
    if (activeType === 'memories') {
      if (!payload.title) return 'Add a gallery title such as STEM-A, Science Club, or Foundation Day.'
      if (!memoryPreviews.some(Boolean)) return 'Add at least one memory picture.'
      return ''
    }
    if (!payload.title) return 'Title is required.'
    if (!payload.body) return 'Details are required before this record can be saved.'
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
      let recordId = editingRecord?.isDefault ? '' : editingRecord?.id
      if (!recordId) recordId = await createAdminRecord(config.collection, (imageFile || memoryFiles.some(Boolean)) ? { ...payload, status: 'draft' } : payload)
      if (activeType === 'memories') {
        const nextImages = []
        for (let index = 0; index < 4; index += 1) {
          const uploaded = memoryFiles[index] ? await uploadContentImage({ file: memoryFiles[index], collectionName: config.collection, recordId, slot: `highlight-${index + 1}` }) : memoryImages[index]
          if (uploaded) nextImages.push(uploaded)
        }
        const legacyImages = (editingRecord?.images || []).slice(4)
        await updateAdminRecord(config.collection, recordId, { ...payload, images: [...nextImages, ...legacyImages] })
      } else {
        let image = null
        if (imageFile) image = await uploadContentImage({ file: imageFile, collectionName: config.collection, recordId })
        await updateAdminRecord(config.collection, recordId, {
          ...payload,
          ...(image ? { imageUrl: image.url, imagePath: image.path } : {}),
          ...(removeImage ? { imageUrl: '', imagePath: '' } : {}),
        })
        if ((image || removeImage) && editingRecord?.imagePath) await deleteContentImage(editingRecord.imagePath).catch(() => {})
      }
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
      setSuccess(status === config.publicStatus ? `${record.title} is now visible to authorized users.` : `${record.title} moved to ${status}.`)
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
      await Promise.all((pendingDelete.images || []).filter((image) => image?.path).map((image) => deleteContentImage(image.path).catch(() => {})))
      if (pendingDelete.backgroundImagePath) await deleteContentImage(pendingDelete.backgroundImagePath).catch(() => {})
      setSuccess(`${pendingDelete.title} was deleted.`)
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
      <Card className="mini-stat-card"><span className="mini-stat-label">Total records</span><strong className="mini-stat-value">{displayRecords.length}</strong></Card>
      <Card className="mini-stat-card"><span className="mini-stat-label">Visible to users</span><strong className="mini-stat-value">{publicCount}</strong></Card>
      <Card className="mini-stat-card"><span className="mini-stat-label">{activeType === 'memories' ? 'Waiting for approval' : 'Drafts'}</span><strong className="mini-stat-value">{activeType === 'memories' ? pendingMemoryRecords.length : draftCount}</strong></Card>
    </div>

    {success && <div className="form-success" role="status"><CheckCircle2 size={17} /> {success}</div>}
    {error && !isFormOpen && <div className="form-error" role="alert">{error}</div>}

    {activeType === 'memories' && <Card className="memory-submission-bin">
      <header><div><span><Inbox size={17} /> Submission bin</span><h3>Memories waiting for your approval</h3><p>Teacher and alumni-leader submissions are stored in Firebase and remain private until you publish them.</p></div><Badge status={pendingMemoryRecords.length ? 'editing' : 'approved'}>{pendingMemoryRecords.length} pending</Badge></header>
      {pendingMemoryRecords.length ? <div className="memory-submission-list">{pendingMemoryRecords.map((record) => <article key={record.id}>
        <div className="memory-submission-preview">{record.media?.[0]?.type === 'video' ? <video src={record.media[0].url} muted preload="metadata" /> : record.media?.[0]?.url || record.images?.[0]?.url ? <img src={record.media?.[0]?.url || record.images?.[0]?.url} alt="" /> : <Images size={22} />}</div>
        <div><span>{contributorRoleLabel(record)} · {record.contributorName || 'Contributor'}</span><h4>{record.title || 'Untitled memory'}</h4><p>{record.caption || 'No caption provided.'}</p><small>{record.sectionId ? `Section record: ${record.sectionId} · ` : ''}{record.media?.length || 0} media file{(record.media?.length || 0) === 1 ? '' : 's'}</small></div>
        <div className="inline-actions"><Button size="sm" disabled={workingId === record.id} onClick={() => changeStatus(record, 'published')}><Eye size={14} /> Publish</Button><Button size="sm" variant="secondary" disabled={workingId === record.id} onClick={() => changeStatus(record, 'rejected')}>Reject</Button></div>
      </article>)}</div> : <div className="empty-state"><CheckCircle2 size={26} /><div className="empty-state-title">Submission bin is clear</div><div>No teacher or alumni-leader memories are waiting for approval.</div></div>}
    </Card>}

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
          <div className="content-record-image">{record.media?.[0]?.type === 'video' ? <video src={record.media[0].url} muted preload="metadata" /> : (record.imageUrl || record.media?.[0]?.url || record.images?.[0]?.url) ? <img src={record.imageUrl || record.media?.[0]?.url || record.images[0].url} alt="" /> : <ActiveIcon size={28} />}</div>
          <div className="content-record-copy">
            <div><Badge variant={record.status === config.publicStatus ? 'success' : record.status === 'archived' ? 'neutral' : 'warning'}>{record.status || 'draft'}</Badge><span>{formatDate(record)}</span></div>
            <h4>{record.title || 'Untitled'}</h4>
            <p>{record.body || record.caption || 'No details added yet.'}</p>
            <small>{activeType === 'memories' ? [record.caption, `${record.media?.length || record.images?.length || 0} media`, isContributorSubmission(record) ? `${contributorRoleLabel(record)}: ${record.contributorName || 'Contributor'}` : ''].filter(Boolean).join(' · ') : activeType === 'landing' ? `${record.section} section${record.isDefault ? ' · built-in content' : ''}` : activeType === 'content' ? record.category || 'School Story' : 'Community announcement'}</small>
          </div>
          <div className="content-record-actions">
            {!isContributorSubmission(record) && <Button size="sm" variant="secondary" onClick={() => openForm(record)}>Edit</Button>}
            {!record.isDefault && record.status !== config.publicStatus && <Button size="sm" disabled={workingId === record.id} onClick={() => changeStatus(record, config.publicStatus)}><Eye size={14} /> Publish</Button>}
            {!record.isDefault && record.status === config.publicStatus && <Button size="sm" variant="ghost" disabled={workingId === record.id} onClick={() => changeStatus(record, 'draft')}>Unpublish</Button>}
            {activeType === 'memories' && record.status === 'pending' && <Button size="sm" variant="secondary" disabled={workingId === record.id} onClick={() => changeStatus(record, 'rejected')}>Reject</Button>}
            {!record.isDefault && record.status !== 'archived' && <Button size="sm" variant="ghost" disabled={workingId === record.id} onClick={() => changeStatus(record, 'archived')}><Archive size={14} /> Archive</Button>}
            {!record.isDefault && <Button size="sm" variant="danger" disabled={workingId === record.id} onClick={() => setPendingDelete(record)}><Trash2 size={14} /> Delete</Button>}
          </div>
        </article>)}
      </div> : <div className="empty-state"><div className="empty-state-title">No matching {config.label.toLowerCase()}</div><div>{displayRecords.length ? 'Adjust the search or status filter.' : `Add the first ${config.singular} to begin.`}</div></div>}
    </Card>

    <Modal isOpen={isFormOpen} title={`${editingRecord ? 'Edit' : 'Add'} ${config.singular}`} panelClassName="content-editor-modal" onClose={closeForm}>
      <form className="student-form content-editor-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field-grid">
          {activeType === 'memories' ? <>
            <label className="form-field"><span>Gallery title</span><Input value={form.title || ''} onChange={(event) => setValue('title', event.target.value)} placeholder="STEM-A, Science Club, Foundation Day…" required /></label>
            <label className="form-field"><span>Caption or group</span><Input value={form.caption || ''} onChange={(event) => setValue('caption', event.target.value)} placeholder="Optional context shown with the photos" /></label>
            <label className="form-field memory-color-field"><span>Gallery accent color</span><div><input type="color" value={form.themeColor || '#d17c87'} onChange={(event) => setValue('themeColor', event.target.value)} /><Input value={form.themeColor || '#d17c87'} onChange={(event) => setValue('themeColor', event.target.value)} aria-label="Gallery accent color value" /></div></label>
            <label className="form-field"><span>Status</span><Select value={form.status || ''} onChange={(event) => setValue('status', event.target.value)}>{config.statuses.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</Select></label>
            <div className="memory-admin-highlights span-2"><div><strong>Memory photos</strong><span>Add one to four portrait or landscape pictures. Their natural shapes are preserved.</span></div><div className="memory-admin-slots">{[0, 1, 2, 3].map((index) => <label className={memoryPreviews[index] ? 'has-image' : ''} key={index}><input type="file" accept="image/*" onChange={(event) => chooseMemoryImage(index, event.target.files?.[0])} /><span>{memoryPreviews[index] ? <img src={memoryPreviews[index]} alt="Memory preview" /> : <><ImagePlus size={23} /><strong>Choose picture</strong></>}</span>{memoryPreviews[index] && <button type="button" onClick={(event) => { event.preventDefault(); removeMemoryImage(index) }}>Remove</button>}</label>)}</div></div>
          </> : <>
            <label className="form-field span-2"><span>Title</span><Input value={form.title || ''} onChange={(event) => setValue('title', event.target.value)} required /></label>
            {activeType === 'content' && <label className="form-field span-2"><span>Where this appears</span><Select value={form.category || ''} onChange={(event) => setValue('category', event.target.value)}><option>School Story</option><option>School History</option><option>School Information</option></Select></label>}
            {activeType === 'landing' && <><label className="form-field"><span>Landing section</span><Select value={form.section || 'hero'} onChange={(event) => setValue('section', event.target.value)}><option value="hero">Hero</option><option value="legacy">Story opening</option><option value="explore">Explore</option><option value="overview">Overview</option><option value="collection">Collection</option><option value="highlights">Featured chapters</option><option value="access">Access</option><option value="film">Closing film</option></Select></label><label className="form-field"><span>Eyebrow</span><Input value={form.eyebrow || ''} onChange={(event) => setValue('eyebrow', event.target.value)} placeholder="Small label above title" /></label><label className="form-field span-2"><span>Call-to-action label</span><Input value={form.ctaLabel || ''} onChange={(event) => setValue('ctaLabel', event.target.value)} placeholder="Optional button label" /></label></>}
            <label className="form-field span-2"><span>Details</span><textarea className="field content-textarea" value={form.body || ''} onChange={(event) => setValue('body', event.target.value)} placeholder="Write the complete information users should see" required /></label>
          </>}
          {activeType !== 'memories' && <label className="form-field"><span>Status</span><Select value={form.status || ''} onChange={(event) => setValue('status', event.target.value)}>{config.statuses.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</Select></label>}
          {activeType !== 'memories' && <label className="form-field"><span>Feature image</span><input className="field content-image-input" type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0])} /></label>}
          {activeType !== 'memories' && imagePreview && !removeImage && <div className="content-image-preview span-2"><img src={imagePreview} alt="Selected content preview" /><Button type="button" size="sm" variant="danger" onClick={() => { setImageFile(null); setImagePreview(''); setRemoveImage(true) }}>Remove image</Button></div>}
        </div>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving and syncing…' : editingRecord ? 'Save changes' : 'Create record'}</Button></div>
      </form>
    </Modal>

    <Modal isOpen={Boolean(pendingDelete)} title="Delete this record?" onClose={() => { if (!workingId) setPendingDelete(null) }}>
      <div className="content-delete-confirm"><p><strong>{pendingDelete?.title || pendingDelete?.fullName}</strong> will be permanently removed from Firebase and from the community view.</p><div className="form-actions"><Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={Boolean(workingId)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={Boolean(workingId)}>{workingId ? 'Deleting…' : 'Delete permanently'}</Button></div></div>
    </Modal>
  </div>
}
