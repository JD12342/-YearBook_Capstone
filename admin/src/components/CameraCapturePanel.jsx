export function CameraCapturePanel({ cameraOpen, cameraError, stopCamera, handleCaptureFrame, cameraPreviewRef }) {
  if (!cameraOpen) return null

  return (
    <div className="camera-box panel-card">
      <div className="camera-header">
        <h3>Camera Capture</h3>
        <button className="secondary-btn" onClick={stopCamera}>Close</button>
      </div>

      {cameraError ? (
        <div className="camera-error">{cameraError}</div>
      ) : (
        <video ref={cameraPreviewRef} autoPlay playsInline muted className="camera-video" />
      )}

      {!cameraError && (
        <div className="action-row">
          <button className="secondary-btn" onClick={stopCamera}>Cancel</button>
          <button className="primary-btn" onClick={handleCaptureFrame}>Capture</button>
        </div>
      )}
    </div>
  )
}
