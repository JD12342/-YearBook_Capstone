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
import { DEFAULT_YEARBOOK_THEME, getYearbookPresentation } from '../../../yearbook/data/yearbookDefaults.js'
import { YearbookArtworkUpload } from './yearbook/YearbookArtworkUpload.jsx'
import { YearbookPageEditor } from './yearbook/YearbookPageEditor.jsx'

const pageArtworkKey = (pageId, side) => `${pageId}:${side}`

const createEditorForm = (yearbook, schoolYearName = '') => {
  const presentation = getYearbookPresentation(yearbook, schoolYearName)
  return {
    title: presentation.title,
    schoolYearId: yearbook.schoolYearId,
    schoolYearName,
    status: yearbook.status || 'draft',
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
    if (!normalized) return yearbooks
    return yearbooks.filter((yearbook) => `${yearbook.title} ${yearbook.status} ${yearbook.schoolYearName}`.toLowerCase().includes(normalized))
  }, [yearbooks, searchTerm])

  const availableSchoolYears = useMemo(
    () => schoolYears.filter((year) => !yearbooks.some((yearbook) => yearbook.schoolYearId === year.id)),
    [schoolYears, yearbooks],
  )

  const schoolYearNameFor = (yearbook) => (
    schoolYears.find((year) => year.id === yearbook.schoolYearId)?.name
    || yearbook.schoolYearName
    || yearbook.schoolYearId
    || '—'
  )

  const beginEditing = (yearbook) => {
    const schoolYearName = schoolYearNameFor(yearbook)
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
      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isCreateOpen} title="Create yearbook" onClose={() => { if (!saving) setIsCreateOpen(false) }}>
        <form className="student-form" onSubmit={handleCreate}>
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
          <form className="yearbook-editor-form" onSubmit={handleSubmit}>
            <section className="yearbook-editor-section">
              <div className="yearbook-editor-section-heading"><BookOpen size={18} /><div><strong>Edition details</strong><span>Only Active editions appear in the community yearbook room.</span></div></div>
              <div className="field-grid">
                <label className="form-field span-2"><span>Yearbook title</span><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label className="form-field"><span>School year</span><Input value={form.schoolYearName} disabled /></label>
                <label className="form-field"><span>Visibility</span><Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></Select></label>
              </div>
            </section>

            <section className="yearbook-editor-section">
              <div className="yearbook-editor-section-heading"><Palette size={18} /><div><strong>Default cover design</strong><span>The emerald-and-beige GradBook design remains the default.</span></div></div>
              <div className="yearbook-cover-editor-grid">
                <div className={`yearbook-admin-cover ${form.coverImageUrl ? 'has-custom-artwork' : ''}`} style={{ '--admin-cover': form.coverColor, '--admin-accent': form.accentColor, backgroundImage: form.coverImageUrl ? `url(${form.coverImageUrl})` : undefined }}>
                  <img src="/snhs-seal.png" alt="" /><small>SORSOGON NATIONAL HIGH SCHOOL</small><strong>{form.coverTitle || 'GRAD BOOK'}</strong><span>{form.coverSubtitle || form.schoolYearName}</span>
                </div>
                <div className="field-grid">
                  <label className="form-field span-2"><span>Cover title</span><Input value={form.coverTitle} onChange={(event) => setForm((current) => ({ ...current, coverTitle: event.target.value }))} required /></label>
                  <label className="form-field span-2"><span>Cover subtitle</span><Input value={form.coverSubtitle} onChange={(event) => setForm((current) => ({ ...current, coverSubtitle: event.target.value }))} /></label>
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
              <p className="yearbook-artwork-note">When uploaded, this image fills the physical front cover and replaces the default archival design.</p>
            </section>

            <section className="yearbook-editor-section">
              <div className="yearbook-editor-section-heading"><BookOpen size={18} /><div><strong>Default page spreads</strong><span>Revise the starter copy now; student portraits and school records can fill later editions.</span></div></div>
              <div className="yearbook-admin-pages">
                {form.pages.map((page, index) => (
                  <YearbookPageEditor
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

            <section className="yearbook-editor-section">
              <div className="yearbook-editor-section-heading"><Music2 size={18} /><div><strong>Graduation song</strong><span>The song plays only after the reader opens the yearbook or presses Play.</span></div></div>
              <div className="field-grid"><label className="form-field span-2"><span>Song title</span><Input value={form.graduationSongName} onChange={(event) => setForm((current) => ({ ...current, graduationSongName: event.target.value }))} placeholder="Batch graduation song" /></label></div>
              <label className="yearbook-upload-field"><Music2 size={18} /><span><strong>Upload audio</strong><small>{songFile?.name || (form.graduationSongUrl ? `Current: ${form.graduationSongName || 'graduation song'}` : 'MP3, M4A, WAV, or OGG · up to 25 MB')}</small></span><input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg" onChange={(event) => setSongFile(event.target.files?.[0] || null)} /></label>
            </section>

            <div className="form-actions yearbook-editor-actions"><Button type="button" variant="secondary" onClick={() => { setEditingYearbook(null); setForm(null); setPageArtworkFiles({}) }} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving yearbook…' : 'Save yearbook design'}</Button></div>
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
                  <td><span className="yearbook-table-cover" style={{ background: yearbook.coverColor || DEFAULT_YEARBOOK_THEME.coverColor, borderColor: yearbook.accentColor || DEFAULT_YEARBOOK_THEME.accentColor }}>GB</span></td>
                  <td><strong>{yearbook.title}</strong><div className="table-subtext">{yearbook.coverTitle || 'GRAD BOOK'}</div></td>
                  <td>{schoolYearNameFor(yearbook)}</td>
                  <td><Badge status={yearbook.status === 'active' ? 'active' : yearbook.status === 'archived' ? 'archived' : 'pending'}>{yearbook.status || 'draft'}</Badge></td>
                  <td><span className="yearbook-asset-summary"><ImagePlus size={14} />{yearbook.coverImageUrl ? 'Custom cover' : 'Default cover'} · {yearbook.pages?.some((page) => page.leftPageImageUrl || page.rightPageImageUrl) ? 'Page artwork' : 'Generated pages'} <Music2 size={14} />{yearbook.graduationSongUrl ? 'Song' : 'No song'}</span></td>
                  <td><div className="inline-actions"><Button variant="secondary" size="sm" onClick={() => beginEditing(yearbook)}>Customize</Button><Button variant="danger" size="sm" onClick={() => setPendingDelete({ id: yearbook.id, title: yearbook.title })}><Trash2 size={14} /> Delete</Button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty-state">No yearbooks yet. Create one when an edition is ready.</div>}
      </Card>
    </div>
  )
}
