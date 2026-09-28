import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Camera, Check, ImageUp, Power, RefreshCw, SlidersHorizontal, VideoOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { PORTRAIT_MAX_EDGE } from '../../services/imageOptimizationService.js'
import { getStudentById, getStudents, updateStudent } from '../../services/studentService.js'
import { getTeacherById, getTeachers, teacherDisplayName, uploadTeacherPortrait } from '../../services/teacherDirectoryService.js'
import { updatePhotoRecord, uploadStudentPhotoRecord } from '../../services/photoService.js'

const standardSettings = { exposure: 2, contrast: 4, saturation: 3, vibrance: 1, clarity: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, sharpness: 0, retouch: 0, spotlight: 0, zoom: 100, aspectRatio: '4:5', mirror: false, grayscale: false }
const controlsByTab = {
  light: [['exposure', 'Exposure', -30, 30, ''], ['contrast', 'Contrast', -30, 30, ''], ['highlights', 'Highlights', -100, 100, ''], ['shadows', 'Shadows', -100, 100, ''], ['whites', 'Whites', -100, 100, ''], ['blacks', 'Blacks', -100, 100, '']],
  colors: [['saturation', 'Saturation', -60, 80, ''], ['vibrance', 'Vibrance', -60, 80, ''], ['temperature', 'Warmth', -30, 30, ''], ['tint', 'Tint', -20, 20, '°']],
  detail: [['clarity', 'Clarity', -50, 50, ''], ['sharpness', 'Sharpness', 0, 100, '']],
  retouch: [['retouch', 'Soft retouch', 0, 100, '%'], ['spotlight', 'Face spotlight', 0, 100, '%']],
}
const photoManagementStateKey = 'gradbook-admin-photo-management-state'
const photoSessionStateKey = 'gradbook-admin-camera-session-state'

const readStoredState = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}

const cropRatios = { '4:5': 4 / 5, '3:2': 3 / 2, '1:1': 1 }

const getCameraDimensions = (aspectRatio) => {
  if (aspectRatio === '4:5') return { width: { ideal: 1440 }, height: { ideal: 1800 } }
  if (aspectRatio === '3:2') return { width: { ideal: 1280 }, height: { ideal: 854 } }
  if (aspectRatio === '1:1') return { width: { ideal: 1000 }, height: { ideal: 1000 } }
  return { width: { ideal: 1280 }, height: { ideal: 960 } }
}

const getCropRectangle = (width, height, settings) => {
  const ratio = cropRatios[settings.aspectRatio]
  let cropWidth = width
  let cropHeight = height
  if (ratio) {
    if (width / height > ratio) cropWidth = height * ratio
    else cropHeight = width / ratio
  }
  const zoom = Math.max(1, (Number(settings.zoom) || 100) / 100)
  cropWidth /= zoom
  cropHeight /= zoom
  return {
    x: Math.max(0, (width - cropWidth) / 2),
    y: Math.max(0, (height - cropHeight) / 2),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  }
}

const applyToneAdjustments = (context, width, height, settings) => {
  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData
  for (let index = 0; index < data.length; index += 4) {
    const luminance = (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255
    let adjustment = 0
    if (luminance > 0.52) adjustment += settings.highlights * (luminance - 0.52) * 1.8
    if (luminance < 0.48) adjustment += settings.shadows * (0.48 - luminance) * 1.8
    if (luminance > 0.76) adjustment += settings.whites * (luminance - 0.76) * 3
    if (luminance < 0.24) adjustment += settings.blacks * (0.24 - luminance) * 3
    if (adjustment) {
      data[index] = Math.max(0, Math.min(255, data[index] + adjustment))
      data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + adjustment))
      data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + adjustment))
    }
  }
  context.putImageData(imageData, 0, 0)
}

const applySpotlight = (context, width, height, amount) => {
  if (!amount) return
  const strength = Math.min(0.38, amount / 260)
  const gradient = context.createRadialGradient(width * 0.5, height * 0.38, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.55)
  gradient.addColorStop(0, `rgba(255, 250, 225, ${strength})`)
  gradient.addColorStop(0.55, `rgba(255, 250, 225, ${strength * 0.34})`)
  gradient.addColorStop(1, 'rgba(255, 250, 225, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

const createPortraitCorrectedSource = (image, rotation) => {
  if (!rotation) return image
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  const canvas = document.createElement('canvas')
  canvas.width = height
  canvas.height = width
  const context = canvas.getContext('2d')
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, -width / 2, -height / 2, width, height)
  return canvas
}

const createAdjustedCanvas = (image, settings, filterValue, sourceRotation = 0) => {
  const source = createPortraitCorrectedSource(image, sourceRotation)
  const sourceWidth = source.naturalWidth || source.width
  const sourceHeight = source.naturalHeight || source.height
  const crop = getCropRectangle(sourceWidth, sourceHeight, settings)
  const outputScale = Math.min(1, PORTRAIT_MAX_EDGE / Math.max(crop.width, crop.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(crop.width * outputScale))
  canvas.height = Math.max(1, Math.round(crop.height * outputScale))
  const context = canvas.getContext('2d')
  context.filter = `${filterValue} brightness(${100 + settings.retouch / 28}%) contrast(${100 - settings.retouch / 18}%) saturate(${100 - settings.retouch / 25}%) blur(${settings.retouch / 42}px)`
  context.translate(canvas.width / 2, canvas.height / 2)
  context.scale(settings.mirror ? -1 : 1, 1)
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
  context.setTransform(1, 0, 0, 1, 0, 0)
  applyToneAdjustments(context, canvas.width, canvas.height, settings)
  applySpotlight(context, canvas.width, canvas.height, settings.spotlight)
  return canvas
}

export function PhotoCapturePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isTeacherSession = searchParams.get('subject') === 'teacher' || Boolean(searchParams.get('teacherId'))
  const studentId = isTeacherSession ? searchParams.get('teacherId') : searchParams.get('studentId')
  const sessionSchoolYearId = searchParams.get('schoolYearId') || ''
  const [savedSession] = useState(() => readStoredState(photoSessionStateKey))
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const cameraRequestRef = useRef(0)
  const fileInputRef = useRef(null)
  const [student, setStudent] = useState(null)
  const [sessionStudents, setSessionStudents] = useState([])
  const [activeStudentId, setActiveStudentId] = useState(() => studentId || savedSession.studentId || '')
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('')
  const [adjustedPreviewUrl, setAdjustedPreviewUrl] = useState('')
  const [capturedFile, setCapturedFile] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [sourceRotation, setSourceRotation] = useState(0)
  const [cameraZoom, setCameraZoom] = useState(null)
  const [cameraEnabled, setCameraEnabled] = useState(() => savedSession.cameraEnabled !== false)
  const [cameraDevices, setCameraDevices] = useState([])
  const [cameraDeviceId, setCameraDeviceId] = useState(() => savedSession.cameraDeviceId || '')
  const [settings, setSettings] = useState(() => ({ ...standardSettings, ...(savedSession.settings || {}), zoom: 100 }))
  const [controlTab, setControlTab] = useState('light')
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')

  const filterValue = useMemo(() => (
    `brightness(${100 + settings.exposure + settings.spotlight / 10}%) contrast(${100 + settings.contrast + settings.clarity / 2 + settings.sharpness / 5}%) saturate(${100 + settings.saturation + settings.vibrance / 2}%) sepia(${Math.max(0, settings.temperature)}%) hue-rotate(${settings.tint}deg) grayscale(${settings.grayscale ? 1 : 0})`
  ), [settings])
  const previewStyle = useMemo(() => ({
    filter: filterValue,
    transform: `rotate(${sourceRotation}deg) scaleX(${settings.mirror ? -1 : 1})`,
    aspectRatio: settings.aspectRatio === 'original' ? undefined : settings.aspectRatio.replace(':', ' / '),
    objectFit: settings.aspectRatio === 'original' ? 'contain' : 'cover',
  }), [filterValue, settings, sourceRotation])
  const capturedPreviewStyle = useMemo(() => ({
    objectFit: settings.aspectRatio === 'original' ? 'contain' : 'cover',
  }), [settings.aspectRatio])
  const photoFrameStyle = useMemo(() => settings.aspectRatio === 'original'
    ? { width: '100%', height: '100%' }
    : { aspectRatio: settings.aspectRatio.replace(':', ' / ') }, [settings.aspectRatio])

  const stopCamera = () => {
    cameraRequestRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraZoom(null)
  }

  const attachVideo = useCallback((node) => {
    videoRef.current = node
    if (node && streamRef.current) {
      node.srcObject = streamRef.current
      node.play?.().catch(() => {})
    }
  }, [])

  const changeStudent = (nextStudentId) => {
    if (!nextStudentId || nextStudentId === activeStudentId) return
    stopCamera()
    setPreviewUrl('')
    setAdjustedPreviewUrl('')
    setCapturedFile(null)
    setCameraError('')
    setActiveStudentId(nextStudentId)
    navigate(isTeacherSession
      ? `/photos/camera?subject=teacher&teacherId=${encodeURIComponent(nextStudentId)}&schoolYearId=${encodeURIComponent(sessionSchoolYearId)}`
      : `/photos/camera?studentId=${encodeURIComponent(nextStudentId)}`)
  }

  const startCamera = async () => {
    setCameraError('')
    stopCamera()
    const requestId = cameraRequestRef.current
    setCameraEnabled(true)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access. You can upload a photo instead.')
      return
    }
    try {
      const standardVideo = getCameraDimensions(settings.aspectRatio)
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: cameraDeviceId ? { ...standardVideo, deviceId: { exact: cameraDeviceId } } : standardVideo,
          audio: false,
        })
      } catch (deviceError) {
        if (!cameraDeviceId) throw deviceError
        setCameraDeviceId('')
        stream = await navigator.mediaDevices.getUserMedia({ video: standardVideo, audio: false })
      }
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const activeTrack = stream.getVideoTracks()[0]
      const activeTrackSettings = activeTrack?.getSettings?.() || {}
      const virtualPhoneCamera = /pixel|phone|virtual/i.test(activeTrack?.label || '')
      setSourceRotation(settings.aspectRatio === '4:5' && virtualPhoneCamera && Number(activeTrackSettings.width) > Number(activeTrackSettings.height) ? 90 : 0)
      const zoomCapability = (activeTrack?.getCapabilities?.() || {}).zoom
      if (zoomCapability && Number(zoomCapability.max) > Number(zoomCapability.min)) {
        setCameraZoom({ min: Number(zoomCapability.min), max: Number(zoomCapability.max), step: Number(zoomCapability.step) || 1, value: Number(activeTrackSettings.zoom ?? zoomCapability.min) })
      } else {
        setCameraZoom(null)
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play?.().catch(() => {})
      }
    } catch {
      setCameraError('Camera access is unavailable. Allow camera access or upload a photo from this device.')
    }
  }

  useEffect(() => {
    const fromUrl = isTeacherSession ? searchParams.get('teacherId') : searchParams.get('studentId')
    if (fromUrl && fromUrl !== activeStudentId) changeStudent(fromUrl)
  }, [searchParams])

  useEffect(() => {
    let ignore = false
    const loadQueue = async () => {
      const savedFilters = readStoredState(photoManagementStateKey)
      try {
        const records = isTeacherSession
          ? await getTeachers({ schoolYearId: sessionSchoolYearId || undefined, status: 'active' })
          : await getStudents({
            schoolYearId: savedFilters.schoolYearId || undefined,
            strandId: savedFilters.strandId || undefined,
            sectionId: savedFilters.sectionId || undefined,
            search: savedFilters.searchTerm || undefined,
          })
        if (ignore) return
        setSessionStudents(records)
        setActiveStudentId((current) => (!current || !records.some((item) => item.id === current)) ? records[0]?.id || '' : current)
      } catch {
        if (!ignore) setSessionStudents([])
      }
    }
    loadQueue()
    return () => { ignore = true }
  }, [isTeacherSession, sessionSchoolYearId])

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return undefined
    const refreshCameraDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')
      setCameraDevices(videoDevices)
      setCameraDeviceId((current) => current && !videoDevices.some((device) => device.deviceId === current) ? '' : current)
    }
    refreshCameraDevices().catch(() => {})
    navigator.mediaDevices.addEventListener?.('devicechange', refreshCameraDevices)
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', refreshCameraDevices)
  }, [])

  useEffect(() => {
    let ignore = false
    const loadStudent = async () => {
      if (!activeStudentId) {
        setStudent(null)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const record = isTeacherSession ? await getTeacherById(activeStudentId) : await getStudentById(activeStudentId)
        if (!record) throw new Error(`The selected ${isTeacherSession ? 'teacher' : 'student'} could not be found.`)
        if (!ignore) {
          setStudent(record)
          setSessionStudents((current) => current.some((item) => item.id === record.id) ? current : [record, ...current])
        }
      } catch (loadError) {
        if (!ignore) setError(loadError.message || `Unable to load this ${isTeacherSession ? 'teacher' : 'student'}.`)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadStudent()
    return () => { ignore = true }
  }, [activeStudentId, isTeacherSession])

  useEffect(() => {
    if (!previewUrl && cameraEnabled) startCamera()
    return stopCamera
  }, [activeStudentId, cameraEnabled, cameraDeviceId, settings.aspectRatio])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    let cancelled = false
    if (!previewUrl || !capturedFile) {
      setAdjustedPreviewUrl('')
      return undefined
    }
    const image = new Image()
    image.onload = () => {
      const canvas = createAdjustedCanvas(image, settings, filterValue, sourceRotation)
      if (!cancelled) setAdjustedPreviewUrl(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.src = previewUrl
    return () => { cancelled = true }
  }, [previewUrl, capturedFile, settings, filterValue, sourceRotation])

  useEffect(() => {
    localStorage.setItem(photoSessionStateKey, JSON.stringify({ studentId: isTeacherSession ? '' : activeStudentId, settings, cameraEnabled, cameraDeviceId }))
  }, [activeStudentId, settings, cameraEnabled, cameraDeviceId, isTeacherSession])

  const selectPhotoFile = (file) => {
    if (!file) return
    setCapturedFile(file)
    setAdjustedPreviewUrl('')
    setPreviewUrl(URL.createObjectURL(file))
    stopCamera()
  }

  const captureFrame = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) selectPhotoFile(new File([blob], `graduation-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.94)
  }

  const changeCameraZoom = async (value) => {
    const nextValue = Number(value)
    const track = streamRef.current?.getVideoTracks?.()[0]
    if (!track || !cameraZoom) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: nextValue }] })
      setCameraZoom((current) => current ? { ...current, value: nextValue } : current)
    } catch {
      setCameraError('This camera does not allow zoom changes in the browser.')
    }
  }

  const createAdjustedFile = () => new Promise((resolve, reject) => {
    if (!previewUrl || !capturedFile) {
      reject(new Error('Take or upload a photo before saving.'))
      return
    }
    const image = new Image()
    image.onload = () => {
      const canvas = createAdjustedCanvas(image, settings, filterValue, sourceRotation)
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], capturedFile.name.replace(/\.[^.]+$/, '') + '-session.jpg', { type: 'image/jpeg' }))
        else reject(new Error('Unable to prepare the adjusted photo.'))
      }, 'image/jpeg', 0.94)
    }
    image.onerror = () => reject(new Error('Unable to prepare the selected photo.'))
    image.src = previewUrl
  })

  const applyAutoEnhance = () => {
    setSettings((current) => ({ ...current, exposure: 4, contrast: 7, saturation: 5, vibrance: 10, highlights: -8, shadows: 10, sharpness: 18, retouch: 4, spotlight: 10 }))
  }

  const savePhoto = async (mode = 'draft') => {
    if (!student || !capturedFile) return
    const isApproval = isTeacherSession || mode === 'approved'
    setSaving(isApproval ? 'approve' : 'draft')
    setError('')
    try {
      const file = await createAdjustedFile()
      if (isTeacherSession) {
        await uploadTeacherPortrait({ teacherId: student.id, file })
      } else {
        const photo = await uploadStudentPhotoRecord({
          file,
          studentId: student.id,
          schoolYearId: student.schoolYearId,
          strandId: student.strandId,
          sectionId: student.sectionId,
          source: 'camera',
          status: isApproval ? 'approved' : 'editing',
        })
        await updatePhotoRecord(photo.id, { sessionEdits: settings, edits: settings })
        await updateStudent(student.id, { ...student, photoId: photo.id })
      }
      if (isApproval) {
        const currentIndex = sessionStudents.findIndex((item) => item.id === student.id)
        const nextStudent = sessionStudents[currentIndex + 1]
        if (nextStudent) changeStudent(nextStudent.id)
        else navigate(isTeacherSession ? '/graduation-directory?type=teachers' : '/photos')
      } else {
        navigate('/photos')
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the photo. Check access and try again.')
    } finally {
      setSaving('')
    }
  }

  const studentName = isTeacherSession ? teacherDisplayName(student) : [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ')
  const updateSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }))

  if (loading) return <div className="capture-page-shell"><div className="photo-editor-empty">Preparing camera session...</div></div>

  return (
    <div className="capture-page-shell">
      <div className="capture-page-topbar">
        <div><span>{isTeacherSession ? 'TEACHER PORTRAIT SESSION' : 'CAMERA SESSION'}</span><h2>Consistent graduation portraits</h2><p>{studentName ? `${studentName}${(isTeacherSession ? student?.teacherNumber : student?.studentNumber) ? ` • ${isTeacherSession ? student.teacherNumber : student.studentNumber}` : ''}` : `Preview mode — choose a ${isTeacherSession ? 'teacher' : 'student'} when you are ready to save a portrait.`}</p></div>
        <Button variant="secondary" onClick={() => navigate(isTeacherSession ? '/graduation-directory?type=teachers' : '/photos')}><ArrowLeft size={16} /> Back to {isTeacherSession ? 'teacher records' : 'photos'}</Button>
      </div>
      {error && <div className="form-error capture-page-error">{error}</div>}
      <div className="capture-page-workbench">
        <main className="capture-page-stage">
          <div className="capture-stage-label"><span>{previewUrl ? 'Captured portrait' : 'Live camera'}</span><span>{sessionStudents.length ? `${sessionStudents.findIndex((item) => item.id === activeStudentId) + 1} of ${sessionStudents.length}` : `No selected ${isTeacherSession ? 'teachers' : 'students'}`}</span></div>
          <div className="camera-student-switcher">
            <label htmlFor="camera-student">{isTeacherSession ? 'Teacher' : 'Student'}</label>
            <select id="camera-student" value={activeStudentId} onChange={(event) => changeStudent(event.target.value)}>
              <option value="">Choose a {isTeacherSession ? 'teacher' : 'student'}</option>
              {sessionStudents.map((item) => <option key={item.id} value={item.id}>{[item.lastName, item.firstName].filter(Boolean).join(', ') || (isTeacherSession ? item.teacherNumber : item.studentNumber)}</option>)}
            </select>
            <Button type="button" size="sm" variant="secondary" disabled={sessionStudents.findIndex((item) => item.id === activeStudentId) <= 0} onClick={() => changeStudent(sessionStudents[sessionStudents.findIndex((item) => item.id === activeStudentId) - 1]?.id)}>Previous</Button>
            <Button type="button" size="sm" variant="secondary" disabled={sessionStudents.findIndex((item) => item.id === activeStudentId) < 0 || sessionStudents.findIndex((item) => item.id === activeStudentId) >= sessionStudents.length - 1} onClick={() => changeStudent(sessionStudents[sessionStudents.findIndex((item) => item.id === activeStudentId) + 1]?.id)}>Next</Button>
          </div>
          <div className="camera-source-switcher">
            <label htmlFor="camera-source">Camera source</label>
            <select id="camera-source" value={cameraDeviceId} onChange={(event) => setCameraDeviceId(event.target.value)}>
              <option value="">System camera (Chrome default)</option>
              {cameraDevices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
            </select>
          </div>
          <div className="capture-page-preview">
            <div className="camera-photo-frame" style={photoFrameStyle}>
              {previewUrl ? <img src={adjustedPreviewUrl || previewUrl} alt="Captured graduation portrait" style={capturedPreviewStyle} /> : cameraEnabled ? <video ref={attachVideo} autoPlay playsInline muted style={previewStyle} /> : <div className="capture-camera-error"><VideoOff size={20} /><span>Camera is off. Turn it on when you are ready to take a photo.</span></div>}
              {!previewUrl && cameraEnabled && settings.aspectRatio === '4:5' && <div className="portrait-frame-guide" aria-hidden="true"><span>Keep the cap near this line</span></div>}
              {!previewUrl && cameraError && <div className="capture-camera-error"><VideoOff size={20} /><span>{cameraError}</span></div>}
            </div>
          </div>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png" onChange={(event) => selectPhotoFile(event.target.files?.[0])} />
          <div className="capture-page-actions">
            {previewUrl ? <Button type="button" variant="secondary" onClick={() => { setPreviewUrl(''); setAdjustedPreviewUrl(''); setCapturedFile(null); startCamera() }}><RefreshCw size={16} /> Retake</Button> : <Button type="button" onClick={captureFrame} disabled={Boolean(cameraError) || !cameraEnabled}><Camera size={16} /> Take photo</Button>}
            {!previewUrl && (cameraEnabled ? <Button type="button" variant="secondary" onClick={() => { stopCamera(); setCameraEnabled(false); setCameraError('') }}><Power size={16} /> Turn camera off</Button> : <Button type="button" variant="secondary" onClick={startCamera}><Power size={16} /> Turn camera on</Button>)}
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}><ImageUp size={16} /> Upload photo</Button>
          </div>
          <p className="portrait-optimization-note">Large graduation photos are automatically saved as print-ready, high-quality portraits before upload.</p>
        </main>
        <aside className="capture-page-sidebar">
          <div className="editor-side-heading"><span><SlidersHorizontal size={13} /> SESSION ADJUSTMENTS</span><h3>Consistency controls</h3><p>These controls start from the same portrait standard for every {isTeacherSession ? 'teacher' : 'student'}.</p></div>
          <button type="button" className="session-preset" onClick={() => setSettings(standardSettings)}><span>Standard graduation preset</span><strong>Reset</strong></button>
          <label className="aspect-ratio-picker"><span>Photo size</span><select value={settings.aspectRatio} onChange={(event) => updateSetting('aspectRatio', event.target.value)}><option value="4:5">Portrait — 4:5</option><option value="3:2">Landscape — 3:2</option><option value="1:1">Square — 1:1</option><option value="original">Original camera size</option></select></label>
          <div className="session-control-list camera-framing-control">{cameraZoom ? <label><span>Camera zoom<strong>{Number.isInteger(cameraZoom.value) ? cameraZoom.value : cameraZoom.value.toFixed(1)}×</strong></span><input type="range" min={cameraZoom.min} max={cameraZoom.max} step={cameraZoom.step} value={cameraZoom.value} onChange={(event) => changeCameraZoom(event.target.value)} /></label> : <p className="camera-zoom-note">This camera has no browser-controlled hardware zoom. Move the camera farther away for a wider portrait.</p>}</div>
          <div className="session-editor-tabs"><button type="button" className={controlTab === 'light' ? 'active' : ''} onClick={() => setControlTab('light')}>Light</button><button type="button" className={controlTab === 'colors' ? 'active' : ''} onClick={() => setControlTab('colors')}>Colors</button><button type="button" className={controlTab === 'detail' ? 'active' : ''} onClick={() => setControlTab('detail')}>Detail</button><button type="button" className={controlTab === 'retouch' ? 'active' : ''} onClick={() => setControlTab('retouch')}>Retouch</button></div>
          <button type="button" className="auto-correct-button" onClick={applyAutoEnhance}>Auto enhance</button>
          <div className="session-control-list">
            {controlsByTab[controlTab].map(([key, label, min, max, suffix]) => <label key={key}><span>{label}<strong>{settings[key]}{suffix}</strong></span><input type="range" min={min} max={max} value={settings[key]} onChange={(event) => updateSetting(key, Number(event.target.value))} /></label>)}
          </div>
          {controlTab === 'retouch' && <p className="retouch-note">Soft retouch smooths texture, gently brightens skin, and lowers contrast. Use 10–25 for a natural graduation portrait.</p>}
          <label className="editor-toggle session-toggle"><input type="checkbox" checked={settings.mirror} onChange={(event) => updateSetting('mirror', event.target.checked)} /><span>Mirror image</span></label>
          <label className="editor-toggle"><input type="checkbox" checked={settings.grayscale} onChange={(event) => updateSetting('grayscale', event.target.checked)} /><span>Black and white</span></label>
          <div className="capture-save-actions">
            {!isTeacherSession && <Button type="button" variant="secondary" disabled={!student || !capturedFile || Boolean(saving)} onClick={() => savePhoto('draft')}>{saving === 'draft' ? 'Saving...' : 'Save for later'}</Button>}
            <Button type="button" disabled={!student || !capturedFile || Boolean(saving)} onClick={() => savePhoto('approved')}><Check size={16} /> {saving === 'approve' ? 'Saving...' : 'Save & approve'}</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
