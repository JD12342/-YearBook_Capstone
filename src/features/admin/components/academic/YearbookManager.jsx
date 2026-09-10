import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ImagePlus, Music2, Palette, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal.jsx'
import { Select } from '../ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createYearbook, deleteYearbook, getYearbooks, updateYearbook } from '../../services/yearbookService.js'
import { deleteYearbookAssets, uploadYearbookAsset } from '../../services/firebase/storageService.js'
import { reauthenticateAdmin } from '../../services/firebase/auth.js'
import { getYearbookPresentation } from '../../../yearbook/data/yearbookDefaults.js'
import { YearbookArtworkUpload } from './yearbook/YearbookArtworkUpload.jsx'
import { YearbookPageEditor } from './yearbook/YearbookPageEditor.jsx'

import { YearbookCover } from '../../../yearbook/components/YearbookCover.jsx'
import { ThreeYearbook } from '../../../user/components/ThreeYearbook.jsx'

const pageArtworkKey = (pageId, side) => `${pageId}:${side}`

const createEditorForm = (yearbook, schoolYearName = '') => {
  const presentation = getYearbookPresentation(yearbook, schoolYearName)
  return {
    title: presentation.title,
    schoolYearId: yearbook.schoolYearId,
    schoolYearName,
    status: yearbook.status || 'draft',
    includeArchivedStudents: yearbook.includeArchivedStudents === true,
    coverTitle: presentation.coverTitle,
    coverSubtitle: presentation.coverSubtitle || schoolYearName,
    coverColor: presentation.coverColor,
    accentColor: presentation.accentColor,
    pageColor: presentation.pageColor,
    inkColor: presentation.inkColor,
    coverImageUrl: presentation.coverImageUrl || '',
    coverImagePath: presentation.coverImagePath || '',
    graduationSongUrl: presentation.graduationSongUrl || '',
    graduationSongPath: presentation.graduationSongPath || '',
    graduationSongName: presentation.graduationSongName || '',
    pages: presentation.pages,
  }
}

export function YearbookManager() {
  const [editorTab, setEditorTab] = useState('cover')
  const [preview3d, setPreview3d] = useState(false)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')
  const [showUnlinked, setShowUnlinked] = useState(false)
  const [schoolYears, setSchoolYears] = useState([])
  const [yearbooks, setYearbooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingYearbook, setEditingYearbook] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', schoolYearId: '', status: 'draft' })
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [form, setForm] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [songFile, setSongFile] = useState(null)
  const [pageArtworkFiles, setPageArtworkFiles] = useState({})

  useEffect(() => {
    if (!coverFile) { setCoverPreviewUrl(''); return undefined }
    const url = URL.createObjectURL(coverFile)
    setCoverPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])
  const preview = useMemo(() => form ? getYearbookPresentation({ ...form, coverImageUrl: coverPreviewUrl || form.coverImageUrl }, form.schoolYearName) : null, [form, coverPreviewUrl])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [years, records] = await Promise.all([getSchoolYears(), getYearbooks()])
      setSchoolYears(years)
      setYearbooks(records)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load yearbooks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredYearbooks = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const visible = yearbooks.filter(book => showUnlinked ? !book.schoolYearExists : book.schoolYearExists)
    if (!normalized) return visible
    return visible.filter((yearbook) => `${yearbook.title} ${yearbook.status} ${yearbook.schoolYearName}`.toLowerCase().includes(normalized))
  }, [yearbooks, searchTerm, showUnlinked])

  const availableSchoolYears = useMemo(
    () => schoolYears.filter((year) => !yearbooks.some((yearbook) => yearbook.schoolYearId === year.id)),
    [schoolYears, yearbooks],
  )

  const schoolYearNameFor = (yearbook) => (
    schoolYears.find((year) => year.id === yearbook.schoolYearId)?.name
    || 'School year no longer exists'
  )

  const beginEditing = (yearbook) => {
    const schoolYearName = schoolYearNameFor(yearbook)
    setEditorTab('cover')
    setPreview3d(false)
    setError('')
    setEditingYearbook(yearbook)
    setForm(createEditorForm(yearbook, schoolYearName))
    setCoverFile(null)
    setSongFile(null)
    setPageArtworkFiles({})
  }

  const setPageValue = (index, field, value) => {
    setForm((current) => ({
      ...current,
      pages: current.pages.map((page, pageIndex) => pageIndex === index ? { ...page, [field]: value } : page),
    }))
  }

  const setPageArtworkFile = (pageId, side, file) => {
    setPageArtworkFiles((current) => ({
      ...current,
      [pageArtworkKey(pageId, side)]: file,
    }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    const schoolYear = schoolYears.find((year) => year.id === createForm.schoolYearId)
    if (!schoolYear || !createForm.title.trim()) {
      setError('Choose a school year and enter a yearbook title.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createYearbook({
        title: createForm.title.trim(),
        schoolYearId: schoolYear.id,
        schoolYearName: schoolYear.name,
        coverSubtitle: schoolYear.name,
        status: createForm.status,
      })
      setCreateForm({ title: '', schoolYearId: '', status: 'draft' })
      setIsCreateOpen(false)
      await loadData()
    } catch (createError) {
      setError(createError.message || 'Unable to create yearbook.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async (password) => {
    if (!pendingDelete) return
    setDeleteLoading(true)
    setError('')
    try {
      await reauthenticateAdmin(password)
      await deleteYearbookAssets(pendingDelete.id)
      await deleteYearbook(pendingDelete.id)
      setPendingDelete(null)
      await loadData()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete yearbook.')
      throw deleteError
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!editingYearbook || !form) return
    if (!form.title.trim() || !form.coverTitle.trim()) { setError('Enter an edition title and cover title in the Details and Cover tabs.'); return }
    setSaving(true)
    setError('')
    try {
      const pages = await Promise.all(form.pages.map(async (page, index) => {
        const pageId = page.id || `spread-${index + 1}`
        const nextPage = {
          ...page,
          id: pageId,
          eyebrow: String(page.eyebrow || '').trim(),
          title: String(page.title || '').trim(),
          body: String(page.body || '').trim(),
          quote: String(page.quote || '').trim(),
        }

        await Promise.all(['left', 'right'].map(async (side) => {
          const artworkFile = pageArtworkFiles[pageArtworkKey(pageId, side)]
          if (!artworkFile) return
          const uploadedArtwork = await uploadYearbookAsset({
            file: artworkFile,
            yearbookId: editingYearbook.id,
            kind: 'page',
            slot: `${pageId}-${side}`,
          })
          nextPage[`${side}PageImageUrl`] = uploadedArtwork.url
          nextPage[`${side}PageImagePath`] = uploadedArtwork.path
        }))

        return nextPage
      }))

      const payload = {
        ...form,
        title: form.title.trim(),
        coverTitle: form.coverTitle.trim(),
        coverSubtitle: form.coverSubtitle.trim(),
        pages,
      }
      if (coverFile) {
        const uploadedCover = await uploadYearbookAsset({ file: coverFile, yearbookId: editingYearbook.id, kind: 'cover' })
        payload.coverImageUrl = uploadedCover.url
        payload.coverImagePath = uploadedCover.path
      }
      if (songFile) {
        const uploadedSong = await uploadYearbookAsset({ file: songFile, yearbookId: editingYearbook.id, kind: 'song' })
        payload.graduationSongUrl = uploadedSong.url
        payload.graduationSongPath = uploadedSong.path
        payload.graduationSongName = form.graduationSongName.trim() || songFile.name
      }
      await updateYearbook(editingYearbook.id, payload)
      setEditingYearbook(null)
      setForm(null)
      setPageArtworkFiles({})
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'Unable to save the yearbook design.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">Yearbook Studio</div>
          <h3>One yearbook for every school year</h3>
          <p className="page-description">Customize the cover, starter pages, graduation song, and visibility of each edition.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!availableSchoolYears.length}><Plus size={16} /> Create Yearbook</Button>
      </div>

      <div className="toolbar-card"><div className="toolbar-search"><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search yearbooks..." /></div></div>
      {error && !editingYearbook && !isCreateOpen && <div className="form-error" role="alert">{error}</div>}
      <p className="yearbook-studio-note">{schoolYears.length} school year{schoolYears.length === 1 ? '' : 's'} · {yearbooks.filter(book => book.schoolYearExists).length} linked yearbook{yearbooks.filter(book => book.schoolYearExists).length === 1 ? '' : 's'}. Each school year has one edition.</p>
      {yearbooks.some(book => !book.schoolYearExists) && <div className="yearbook-record-notice"><div><strong>Some older editions have no school year</strong><p>These records are kept for review and cannot be published. No records have been deleted.</p></div><Button variant="secondary" onClick={() => setShowUnlinked(value => !value)}>{showUnlinked ? 'Show linked editions' : 'Review unlinked editions'}</Button></div>}
      {yearbooks.some(book => book.schoolYearExists && book.recordsVersion !== 1) && <p className="yearbook-studio-note">Open Customize and save each existing edition once to sync real student records and make active editions available to readers.</p>}

      <Modal isOpen={isCreateOpen} title="Create yearbook" onClose={() => { if (!saving) setIsCreateOpen(false) }}>
        <form className="student-form" onSubmit={handleCreate}>
          <p className="yearbook-studio-note">Choose a school year already in your directory. Drafts stay private; active editions are visible to the community.</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="field-grid">
            <label className="form-field span-2"><span>School year</span><Select value={createForm.schoolYearId} onChange={(event) => { const schoolYear = schoolYears.find((year) => year.id === event.target.value); setCreateForm((current) => ({ ...current, schoolYearId: event.target.value, title: schoolYear ? `Graduation Yearbook ${schoolYear.name}` : '' })) }} required><option value="">Select school year</option>{availableSchoolYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select></label>
            <label className="form-field span-2"><span>Yearbook title</span><Input value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} placeholder="Graduation Yearbook 2026–2027" required /></label>
            <label className="form-field span-2"><span>Initial visibility</span><Select value={createForm.status} onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}><option value="draft">Draft</option><option value="active">Active</option></Select></label>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create yearbook'}</Button></div>
        </form>
      </Modal>

      <DeleteConfirmationModal isOpen={Boolean(pendingDelete)} title="Delete yearbook" message={`This permanently removes ${pendingDelete?.title || 'this yearbook'} and its uploaded cover, page artwork, and song. Enter your admin password to continue.`} onClose={() => setPendingDelete(null)} onConfirm={handleDeleteConfirm} loading={deleteLoading} />

      <Modal isOpen={Boolean(editingYearbook && form)} title={`Customize ${form?.schoolYearName || 'yearbook'}`} onClose={() => { if (!saving) { setEditingYearbook(null); setForm(null); setPageArtworkFiles({}) } }} panelClassName="yearbook-editor-modal">
        {form && (
          <form className="yearbook-editor-form" onSubmit={handleSubmit} noValidate>
            <nav className="yearbook-editor-tabs" aria-label="Customization sections">{[['cover', 'Cover design'], ['details', 'Edition details'], ['pages', 'Inside pages'], ['song', 'Music']].map(([id, label]) => <button type="button" key={id} aria-pressed={editorTab === id} onClick={() => setEditorTab(id)}>{label}</button>)}</nav>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="yearbook-editor-scroll">
            <section className="yearbook-editor-section" hidden={editorTab !== 'details'}>
              <div className="yearbook-editor-section-heading"><BookOpen size={18} /><div><strong>Edition details</strong><span>Draft editions stay private. Active editions appear in the community yearbook room.</span></div></div>
              <label className="yearbook-include-archived"><input type="checkbox" checked={form.includeArchivedStudents} onChange={event => setForm(current => ({ ...current, includeArchivedStudents: event.target.checked }))} /><span><strong>Include archived students</strong><small>Use this for a historical edition that should include students archived in the directory. Only records from this school year are included.</small></span></label>
              <div className="field-grid">
                <label className="form-field span-2"><span>Yearbook title</span><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label className="form-field"><span>School year</span><Input value={form.schoolYearName} disabled /></label>
                <label className="form-field"><span>Visibility</span><Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></Select></label>
              </div>
            </section>

            <section className="yearbook-editor-section" hidden={editorTab !== 'cover'}>
              <div className="yearbook-editor-section-heading"><Palette size={18} /><div><strong>Make this cover yours</strong><span>Change the title, colors, or upload your own artwork. The shelf and 3D reader use this same design.</span></div></div>
              <div className="yearbook-cover-editor-grid">
                <div className="yearbook-live-preview">
                  <span className="yearbook-preview-label">LIVE COVER PREVIEW</span>
                  <div className="yearbook-preview-art">{preview3d ? <ThreeYearbook presentation={preview} isOpen={false} pageIndex={0} /> : <YearbookCover presentation={preview} />}</div>
                  <Button type="button" variant="secondary" onClick={() => setPreview3d(value => !value)}>{preview3d ? 'View flat cover' : 'View 3D cover'}</Button>
                  <small>Your changes appear here before you save.</small>
                </div>
                <div className="field-grid">
                  <label className="form-field span-2"><span>Cover title</span><Input maxLength={80} value={form.coverTitle} onChange={(event) => setForm((current) => ({ ...current, coverTitle: event.target.value }))} required /></label>
                  <label className="form-field span-2"><span>Cover subtitle</span><Input maxLength={100} value={form.coverSubtitle} onChange={(event) => setForm((current) => ({ ...current, coverSubtitle: event.target.value }))} /></label>
                  <label className="form-field"><span>Cover color</span><input className="yearbook-color-field" type="color" value={form.coverColor} onChange={(event) => setForm((current) => ({ ...current, coverColor: event.target.value }))} /></label>
                  <label className="form-field"><span>Accent color</span><input className="yearbook-color-field" type="color" value={form.accentColor} onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))} /></label>
                  <label className="form-field"><span>Page color</span><input className="yearbook-color-field" type="color" value={form.pageColor} onChange={(event) => setForm((current) => ({ ...current, pageColor: event.target.value }))} /></label>
                  <label className="form-field"><span>Page text</span><input className="yearbook-color-field" type="color" value={form.inkColor} onChange={(event) => setForm((current) => ({ ...current, inkColor: event.target.value }))} /></label>
                </div>
              </div>
              <YearbookArtworkUpload
                title="Full cover artwork"
                helpText="Optional JPG, PNG, or WebP · up to 15 MB"
                currentUrl={form.coverImageUrl}
                selectedFile={coverFile}
                onChange={setCoverFile}
              />
              {(coverFile || form.coverImageUrl) && <Button type="button" variant="secondary" onClick={() => { setCoverFile(null); setForm(current => ({ ...current, coverImageUrl: '', coverImagePath: '' })) }}>Use designed cover instead</Button>}
              <p className="yearbook-artwork-note">Use portrait artwork with a 3:4 ratio for the best fit. When uploaded, this image fills the physical front cover and replaces the default archival design.</p>
            </section>

            <section className="yearbook-editor-section" hidden={editorTab !== 'pages'}>
              <div className="yearbook-editor-section-heading"><BookOpen size={18} /><div><strong>Stories and class records</strong><span>Saving refreshes eligible student names, strands, sections, awards, and approved portraits from this school year. Missing portraits are labeled clearly. Student details are edited in the student directory.</span></div></div>
              <div className="yearbook-admin-pages">
                {form.pages.map((page, index) => (
                  (page.layout === 'profiles' || page.id === 'portraits') ? <div className="yearbook-record-notice" key={page.id}><div><strong>Class records · spread {index + 1}</strong><p>{page.profiles?.length || 0} saved students on this spread. Student records are refreshed when you save. Archived students are excluded unless you include them in Edition details.</p></div></div> : <YearbookPageEditor
                    key={page.id}
                    page={page}
                    index={index}
                    selectedArtwork={{
                      left: pageArtworkFiles[pageArtworkKey(page.id, 'left')],
                      right: pageArtworkFiles[pageArtworkKey(page.id, 'right')],
                    }}
                    onFieldChange={(field, value) => setPageValue(index, field, value)}
                    onArtworkChange={(side, file) => setPageArtworkFile(page.id, side, file)}
                  />
                ))}
              </div>
            </section>

            <section className="yearbook-editor-section" hidden={editorTab !== 'song'}>
              <div className="yearbook-editor-section-heading"><Music2 size={18} /><div><strong>Graduation song</strong><span>Readers can press Play when they want to hear the graduation song.</span></div></div>
              <div className="field-grid"><label className="form-field span-2"><span>Song title</span><Input value={form.graduationSongName} onChange={(event) => setForm((current) => ({ ...current, graduationSongName: event.target.value }))} placeholder="Batch graduation song" /></label></div>
              <label className="yearbook-upload-field"><Music2 size={18} /><span><strong>Upload audio</strong><small>{songFile?.name || (form.graduationSongUrl ? `Current: ${form.graduationSongName || 'graduation song'}` : 'MP3, M4A, WAV, or OGG · up to 25 MB')}</small></span><input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg" onChange={(event) => setSongFile(event.target.files?.[0] || null)} /></label>
            </section>

            </div>
            <div className="form-actions yearbook-editor-actions"><span>Save to update the cover and class records.</span><Button type="button" variant="secondary" onClick={() => { setEditingYearbook(null); setForm(null); setPageArtworkFiles({}) }} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving yearbook…' : 'Save yearbook design'}</Button></div>
          </form>
        )}
      </Modal>

      <Card className="panel-card">
        {loading ? <div className="empty-state">Preparing the yearbook studio…</div> : filteredYearbooks.length ? (
          <div className="data-table-wrap">
            <table className="data-table yearbook-admin-table">
              <thead><tr><th>Cover</th><th>Edition</th><th>School Year</th><th>Status</th><th>Custom assets</th><th>Actions</th></tr></thead>
              <tbody>{filteredYearbooks.map((yearbook) => (
                <tr key={yearbook.id}>
                  <td><div className="yearbook-table-art"><YearbookCover presentation={getYearbookPresentation(yearbook, schoolYearNameFor(yearbook))} /></div></td>
                  <td><strong>{yearbook.title}</strong><div className="table-subtext">{yearbook.coverTitle || 'GRAD BOOK'}</div></td>
                  <td>{schoolYearNameFor(yearbook)}</td>
                  <td><Badge status={yearbook.status === 'active' ? 'active' : yearbook.status === 'archived' ? 'archived' : 'pending'}>{yearbook.status || 'draft'}</Badge></td>
                  <td><span className="yearbook-asset-summary"><ImagePlus size={14} />{yearbook.coverImageUrl ? 'Custom cover' : 'Default cover'} · {yearbook.pages?.some((page) => page.leftPageImageUrl || page.rightPageImageUrl) ? 'Page artwork' : 'Generated pages'} <Music2 size={14} />{yearbook.graduationSongUrl ? 'Song' : 'No song'}</span></td>
                  <td><div className="inline-actions"><Button variant="secondary" size="sm" disabled={!yearbook.schoolYearExists} onClick={() => beginEditing(yearbook)}>Customize</Button><Button variant="danger" size="sm" onClick={() => setPendingDelete({ id: yearbook.id, title: yearbook.title })}><Trash2 size={14} /> Delete</Button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty-state">No matching editions. Choose an existing school year when creating a yearbook.</div>}
      </Card>
    </div>
  )
}
