import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock3, FileVideo2, ImagePlus, Send, ShieldCheck, UploadCloud, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { loadAssignmentSections, submitTeacherMemory, subscribeTeacherAssignment, subscribeTeacherMemories } from '../services/teacherService.js'

const stateMeta = {
  pending: { icon: Clock3, label: 'Pending approval' },
  published: { icon: CheckCircle2, label: 'Published' },
  rejected: { icon: XCircle, label: 'Needs attention' },
  draft: { icon: Clock3, label: 'Draft' },
}

export function TeacherStudioPage() {
  const { user, profile } = useAuth()
  const inputRef = useRef(null)
  const [assignment, setAssignment] = useState(null)
  const [sections, setSections] = useState([])
  const [memories, setMemories] = useState([])
  const [form, setForm] = useState({ title: '', caption: '', sectionId: '' })
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => subscribeTeacherAssignment(user?.uid, async (next) => {
    setAssignment(next)
    const nextSections = await loadAssignmentSections(next?.sectionIds || [])
    setSections(nextSections)
    setForm((current) => ({ ...current, sectionId: current.sectionId || nextSections[0]?.id || '' }))
  }, () => setError('Unable to load your teaching assignment.')), [user?.uid])

  useEffect(() => subscribeTeacherMemories(user?.uid, setMemories, () => setError('Unable to load your submissions.')), [user?.uid])

  const counts = useMemo(() => memories.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {}), [memories])
  const photoCount = files.filter((file) => file.type.startsWith('image/')).length
  const videoCount = files.filter((file) => file.type.startsWith('video/')).length
  const photoRemaining = Math.max((assignment?.photoLimit || 40) - (assignment?.photosSubmitted || 0), 0)
  const videoRemaining = Math.max((assignment?.videoLimit || 5) - (assignment?.videosSubmitted || 0), 0)

  const chooseFiles = (selected) => {
    const accepted = [...selected].filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    const invalidSize = accepted.find((file) => file.size > (file.type.startsWith('video/') ? 80 : 10) * 1024 * 1024)
    if (invalidSize) { setError(`${invalidSize.name} is too large. Photos can be 10 MB and videos 80 MB.`); return }
    const photos = accepted.filter((file) => file.type.startsWith('image/')).length
    const videos = accepted.filter((file) => file.type.startsWith('video/')).length
    if (photos > photoRemaining || videos > videoRemaining) { setError(`This selection exceeds your remaining allowance: ${photoRemaining} photos and ${videoRemaining} videos.`); return }
    setFiles(accepted)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.sectionId || !files.length || !form.caption.trim()) { setError('Choose an assigned section, add media, and write a caption.'); return }
    setSaving(true); setError(''); setMessage(''); setProgress(0)
    try {
      await submitTeacherMemory({ uid: user.uid, contributorName: profile?.fullName || user.email, ...form, files, onProgress: setProgress })
      setForm((current) => ({ title: '', caption: '', sectionId: current.sectionId }))
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
      setMessage('Submitted for administrator approval. It is not public yet.')
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this memory.')
    } finally { setSaving(false) }
  }

  if (!assignment?.active) return <div className="teacher-studio-page"><section className="teacher-access-card"><ShieldCheck size={30} /><h1>Teacher access is awaiting assignment</h1><p>An administrator needs to assign at least one section before you can upload memories or take graduation portraits.</p></section></div>

  return <div className="teacher-studio-page">
    <section className="teacher-studio-hero">
      <div><span>TEACHER STUDIO</span><h1>Your class stories, ready for review.</h1><p>Upload photos or videos from your assigned sections. Every submission stays private until an administrator approves it.</p></div>
      <div className="teacher-camera-link"><ShieldCheck size={19} /><span><strong>Your yearbook portrait</strong><small>Captured and approved by the administrator for the 3D yearbook</small></span></div>
    </section>

    <section className="teacher-studio-stats">
      <div><strong>{sections.length}</strong><span>Assigned sections</span></div><div><strong>{counts.pending || 0}/{assignment.pendingPostLimit || 10}</strong><span>Pending approval</span></div><div><strong>{photoRemaining}</strong><span>Photos remaining</span></div><div><strong>{videoRemaining}</strong><span>Videos remaining</span></div>
    </section>

    <div className="teacher-studio-grid">
      <form className="teacher-upload-card" onSubmit={submit}>
        <header><div><span>NEW MEMORY</span><h2>Share a class moment</h2></div><UploadCloud size={24} /></header>
        {message && <div className="teacher-message success">{message}</div>}{error && <div className="teacher-message error">{error}</div>}
        <label><span>Assigned section</span><select value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))}>{sections.map((section) => <option key={section.id} value={section.id}>{section.name || section.id}</option>)}</select></label>
        <label><span>Post title</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Science fair, recognition day…" /></label>
        <label><span>Caption</span><textarea value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} placeholder="Tell the story behind this memory and mention a club or event if needed." maxLength={1200} /></label>
        <button className="teacher-media-drop" type="button" onClick={() => inputRef.current?.click()}><ImagePlus size={25} /><strong>Choose photos or videos</strong><span>Photos up to 10 MB · videos up to 80 MB</span></button>
        <input ref={inputRef} hidden type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={(event) => chooseFiles(event.target.files || [])} />
        {files.length > 0 && <div className="teacher-file-summary"><span><ImagePlus size={15} /> {photoCount}/{photoRemaining} remaining photos</span><span><FileVideo2 size={15} /> {videoCount}/{videoRemaining} remaining videos</span><button type="button" onClick={() => { setFiles([]); if (inputRef.current) inputRef.current.value = '' }}>Clear</button></div>}
        {saving && <div className="teacher-upload-progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
        <button className="teacher-submit" type="submit" disabled={saving || !sections.length}><Send size={17} />{saving ? `Uploading ${Math.round(progress * 100)}%` : 'Submit for approval'}</button>
      </form>

      <section className="teacher-submissions">
        <header><span>YOUR SUBMISSIONS</span><h2>Approval activity</h2></header>
        {memories.length ? memories.map((memory) => { const meta = stateMeta[memory.status] || stateMeta.pending; const Icon = meta.icon; return <article key={memory.id} className={`teacher-submission is-${memory.status}`}><div className="teacher-submission-preview">{memory.media?.[0]?.type === 'video' ? <video src={memory.media[0].url} muted preload="metadata" /> : memory.media?.[0]?.url || memory.images?.[0]?.url ? <img src={memory.media?.[0]?.url || memory.images?.[0]?.url} alt="" /> : <ImagePlus size={22} />}</div><div><span><Icon size={13} /> {meta.label}</span><strong>{memory.title || 'Untitled memory'}</strong><p>{memory.caption}</p>{memory.reviewNote && <small>Admin note: {memory.reviewNote}</small>}</div></article> }) : <div className="teacher-empty"><Clock3 size={25} /><strong>No submissions yet</strong><p>Your pending and published memories will appear here.</p></div>}
      </section>
    </div>
  </div>
}
