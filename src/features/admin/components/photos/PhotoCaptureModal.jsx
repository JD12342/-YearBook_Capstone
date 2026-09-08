import { useEffect, useRef, useState } from 'react'
import { Camera, ImageUp, RefreshCw, VideoOff } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

export function PhotoCaptureModal({ isOpen, student, onClose, onSave, saving = false }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [capturedFile, setCapturedFile] = useState(null)
  const [cameraError, setCameraError] = useState('')

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startCamera = async () => {
    setCameraError('')
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError('Camera access is unavailable. You can still upload a photo from this device.')
    }
  }

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl('')
      setCapturedFile(null)
      startCamera()
    } else {
      stopCamera()
    }
    return stopCamera
  }, [isOpen])

  const selectPhotoFile = (file) => {
    if (!file) return
    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    stopCamera()
  }

  const captureFrame = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) selectPhotoFile(new File([blob], `graduation-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  const studentName = [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ')

  return (
    <Modal isOpen={isOpen} title="Capture graduation photo" onClose={handleClose}>
      <div className="capture-studio">
        <div className="capture-student-summary"><span>Capturing for</span><strong>{studentName || 'Selected student'}</strong><small>{student?.studentNumber || ''}</small></div>
        <div className="capture-preview">
          {previewUrl ? <img src={previewUrl} alt="Captured graduation portrait" /> : <video ref={videoRef} autoPlay playsInline muted />}
          {!previewUrl && cameraError && <div className="capture-camera-error"><VideoOff size={19} /><span>{cameraError}</span></div>}
        </div>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png" onChange={(event) => selectPhotoFile(event.target.files?.[0])} />
        <div className="capture-actions">
          {previewUrl ? <Button type="button" variant="secondary" onClick={startCamera}><RefreshCw size={16} /> Retake</Button> : <Button type="button" onClick={captureFrame} disabled={Boolean(cameraError)}><Camera size={16} /> Take photo</Button>}
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}><ImageUp size={16} /> Upload photo</Button>
          {previewUrl && <Button type="button" onClick={() => onSave(capturedFile)} disabled={saving}>{saving ? 'Saving...' : 'Open editor'}</Button>}
        </div>
      </div>
    </Modal>
  )
}
