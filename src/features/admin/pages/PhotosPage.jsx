import { CameraCapturePanel } from '../components/CameraCapturePanel.jsx'
import { PhotoEditorPanel } from '../components/PhotoEditorPanel.jsx'
import { ReviewPanel } from '../components/ReviewPanel.jsx'
import { StudentProfileCard } from '../components/StudentProfileCard.jsx'

export function PhotosPage({
  selectedStudent,
  selectedSchoolYear,
  selectedStrand,
  handleStartCamera,
  handleUploadExisting,
  cameraOpen,
  cameraError,
  stopCamera,
  handleCaptureFrame,
  cameraPreviewRef,
  review,
  handleRetake,
  handleKeepReview,
  currentPhoto,
  editorSettings,
  applyEditorValue,
  handleUndo,
  handleRedo,
  handleReset,
  handleApprove,
  handleRequestRetake,
}) {
  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="section-kicker">Photos</span>
          <h2>Capture and review</h2>
        </div>
      </div>

      <StudentProfileCard
        selectedStudent={selectedStudent}
        selectedSchoolYear={selectedSchoolYear}
        selectedStrand={selectedStrand}
        handleStartCamera={handleStartCamera}
        handleUploadExisting={handleUploadExisting}
      />

      <div className="page-stack compact-stack">
        <CameraCapturePanel
          cameraOpen={cameraOpen}
          cameraError={cameraError}
          stopCamera={stopCamera}
          handleCaptureFrame={handleCaptureFrame}
          cameraPreviewRef={cameraPreviewRef}
        />

        <ReviewPanel review={review} handleRetake={handleRetake} handleKeepReview={handleKeepReview} />
      </div>

      {currentPhoto && (
        <PhotoEditorPanel
          currentPhoto={currentPhoto}
          editorSettings={editorSettings}
          applyEditorValue={applyEditorValue}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          handleReset={handleReset}
          handleApprove={handleApprove}
          handleRequestRetake={handleRequestRetake}
        />
      )}
    </section>
  )
}
