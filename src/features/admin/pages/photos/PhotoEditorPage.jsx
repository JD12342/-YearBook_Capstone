import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, RotateCcw, SlidersHorizontal, Undo2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { getPhoto, updatePhotoRecord, uploadEditedPhotoRecord } from '../../services/photoService.js'
import { getPhotoUrl } from '../../services/firebase/storageService.js'
import { syncYearbookForSchoolYear } from '../../services/yearbookService.js'

const standardControls = {
  exposure: 2, contrast: 4, saturation: 3, vibrance: 1, clarity: 0,
  temperature: 0, tint: 0, highlights: 0, shadows: 0, whites: 0,
  blacks: 0, sharpness: 0, retouch: 0, spotlight: 0, aspectRatio: '4:5',
  mirror: false, grayscale: false,
}

const controlsByTab = {
  main: [['exposure', 'Exposure', -30, 30, ''], ['contrast', 'Contrast', -30, 30, ''], ['highlights', 'Highlights', -100, 100, ''], ['shadows', 'Shadows', -100, 100, ''], ['whites', 'Whites', -100, 100, ''], ['blacks', 'Blacks', -100, 100, '']],
  colors: [['saturation', 'Saturation', -60, 80, ''], ['vibrance', 'Vibrance', -60, 80, ''], ['clarity', 'Clarity', -50, 50, ''], ['temperature', 'Temperature', 0, 30, ''], ['tint', 'Tint', -20, 20, '°']],
  sharpness: [['clarity', 'Clarity', -50, 50, ''], ['sharpness', 'Sharpness', 0, 100, '']],
  retouch: [['retouch', 'Soft retouch', 0, 100, '%'], ['spotlight', 'Face spotlight', 0, 100, '%']],
}

export function PhotoEditorPage() {
  const { photoId } = useParams()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [settings, setSettings] = useState(standardControls)
  const [history, setHistory] = useState([standardControls])
  const [step, setStep] = useState(0)
  const [controlTab, setControlTab] = useState('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    const loadPhoto = async () => {
      setLoading(true); setError('')
      try {
        const record = await getPhoto(photoId)
        if (!record) throw new Error('This photo could not be found.')
        const url = record.downloadUrl || record.imageUrl || (record.editedPath ? await getPhotoUrl(record.editedPath) : '') || (record.originalPath ? await getPhotoUrl(record.originalPath) : '')
        if (!url) throw new Error('The source image is unavailable.')
        if (!ignore) {
          const savedEdits = record.edits || record.sessionEdits || {}
          const initialSettings = { ...standardControls, ...savedEdits }
          setPhoto(record)
          setImageUrl(url)
          setSettings(initialSettings)
          setHistory([initialSettings])
          setStep(0)
        }
      } catch (loadError) {
        if (!ignore) setError(loadError.message || 'Unable to load this photo.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadPhoto()
    return () => { ignore = true }
  }, [photoId])

  const imageStyle = useMemo(() => ({
    filter: `brightness(${100 + settings.exposure + settings.spotlight / 10 + settings.highlights / 12 + settings.whites / 16 + settings.shadows / 20 + settings.blacks / 25}%) contrast(${100 + settings.contrast + settings.clarity / 2 + settings.sharpness / 5}%) saturate(${100 + settings.saturation + settings.vibrance / 2}%) sepia(${Math.max(0, settings.temperature)}%) hue-rotate(${settings.tint}deg) grayscale(${settings.grayscale ? 1 : 0}) blur(${settings.retouch / 85}px)`,
    transform: `scaleX(${settings.mirror ? -1 : 1})`,
  }), [settings])
  const photoFrameStyle = useMemo(() => settings.aspectRatio === 'original'
    ? { width: '100%', height: '100%' }
    : { aspectRatio: settings.aspectRatio.replace(':', ' / ') }, [settings.aspectRatio])

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value }
    const nextHistory = [...history.slice(0, step + 1), next]
    setSettings(next)
    setHistory(nextHistory)
    setStep(nextHistory.length - 1)
  }
  const undo = () => {
    if (!step) return
    const nextStep = step - 1
    setStep(nextStep)
    setSettings(history[nextStep])
  }
  const reset = () => { setSettings(standardControls); setHistory([standardControls]); setStep(0) }
  const createApprovedFile = async () => {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('The source portrait could not be prepared for publishing.')
    const blob = await response.blob()
    if (!blob.size) throw new Error('The source portrait is empty.')
    return new File([blob], `approved-${photo.id}.jpg`, { type: blob.type?.startsWith('image/') ? blob.type : 'image/jpeg' })
  }
  const approve = async () => {
    if (!photo) return
    setSaving(true); setError('')
    try {
      const file = await createApprovedFile()
      await uploadEditedPhotoRecord({
        file,
        studentId: photo.studentId,
        schoolYearId: photo.schoolYearId,
        strandId: photo.strandId,
        sectionId: photo.sectionId,
        photoId: photo.id,
      })
      await updatePhotoRecord(photo.id, { status: 'approved', edits: settings })
      await syncYearbookForSchoolYear(photo.schoolYearId)
      navigate('/photos')
    } catch {
      setError('Unable to approve this photo. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="photo-editor-shell"><div className="photo-editor-empty">Loading photo editor...</div></div>
  if (error) return <div className="photo-editor-shell"><div className="photo-editor-empty"><p>{error}</p><Button onClick={() => navigate('/photos')}>Back to photos</Button></div></div>

  return (
    <div className="photo-editor-shell">
      <div className="photo-editor-topbar">
        <div><span>PHOTO EDITOR</span><h2>Graduation photo editor</h2><p>Use the same portrait controls as the camera session.</p></div>
        <div className="photo-editor-top-actions"><Button variant="secondary" onClick={() => navigate('/photos')}><ArrowLeft size={16} /> Back</Button><Button onClick={approve} disabled={saving}><Check size={16} /> {saving ? 'Approving...' : 'Approve photo'}</Button></div>
      </div>
      <div className="photo-editor-workbench">
        <main className="photo-editor-canvas">
          <div className="photo-editor-canvas-label"><span>Saved portrait</span><span>Live preview</span></div>
          <div className="photo-editor-image-stage">
            <div className="photo-editor-photo-frame" style={photoFrameStyle}>
              <img src={imageUrl} alt="Graduation portrait being edited" style={imageStyle} />
              {settings.spotlight > 0 && <div className="photo-editor-spotlight" style={{ opacity: Math.min(0.38, settings.spotlight / 260) }} aria-hidden="true" />}
            </div>
          </div>
          <div className="photo-editor-bottom-actions"><Button size="sm" variant="secondary" onClick={undo} disabled={!step}><Undo2 size={15} /> Undo</Button><Button size="sm" variant="secondary" onClick={reset}><RotateCcw size={15} /> Reset</Button></div>
        </main>
        <aside className="photo-editor-sidebar">
          <div className="editor-side-heading"><span><SlidersHorizontal size={13} /> PHOTO ADJUSTMENTS</span><h3>Consistency controls</h3><p>These are the same portrait controls used in the Camera session.</p></div>
          <button type="button" className="session-preset" onClick={reset}><span>Standard graduation preset</span><strong>Reset</strong></button>
          <label className="aspect-ratio-picker"><span>Photo size</span><select value={settings.aspectRatio} onChange={(event) => updateSetting('aspectRatio', event.target.value)}><option value="4:5">Portrait — 4:5</option><option value="3:2">Landscape — 3:2</option><option value="1:1">Square — 1:1</option><option value="original">Original photo size</option></select></label>
          <div className="session-editor-tabs"><button type="button" className={controlTab === 'main' ? 'active' : ''} onClick={() => setControlTab('main')}>Main</button><button type="button" className={controlTab === 'colors' ? 'active' : ''} onClick={() => setControlTab('colors')}>Colors</button><button type="button" className={controlTab === 'sharpness' ? 'active' : ''} onClick={() => setControlTab('sharpness')}>Sharpness</button><button type="button" className={controlTab === 'retouch' ? 'active' : ''} onClick={() => setControlTab('retouch')}>Retouch</button></div>
          <button type="button" className="auto-correct-button" onClick={reset}>Auto correction</button>
          <div className="session-control-list">{controlsByTab[controlTab].map(([key, label, min, max, suffix]) => <label key={key}><span>{label}<strong>{settings[key]}{suffix}</strong></span><input type="range" min={min} max={max} value={settings[key]} onChange={(event) => updateSetting(key, Number(event.target.value))} /></label>)}</div>
          {controlTab === 'retouch' && <p className="retouch-note">Use low values for a natural graduation portrait. Spotlight is centered on the face area.</p>}
          <label className="editor-toggle session-toggle"><input type="checkbox" checked={settings.mirror} onChange={(event) => updateSetting('mirror', event.target.checked)} /><span>Mirror image</span></label>
          <label className="editor-toggle"><input type="checkbox" checked={settings.grayscale} onChange={(event) => updateSetting('grayscale', event.target.checked)} /><span>Black and white</span></label>
          <div className="editor-photo-meta"><span>Source</span><strong>{photo.source || 'Camera'}</strong><span>Status</span><strong>{photo.status || 'editing'}</strong></div>
        </aside>
      </div>
    </div>
  )
}
