export function ReviewPanel({ review, handleRetake, handleKeepReview }) {
  if (!review) return null

  return (
    <div className="review-box panel-card">
      <div className="review-header">
        <h3>Quick Photo Review</h3>
        <span>Source: {review.source === 'camera' ? 'Camera' : 'Existing Upload'}</span>
      </div>
      <img src={review.url} alt="Review" className="review-image" />
      <div className="review-checklist">
        <span>Face visible</span>
        <span>Eyes open</span>
        <span>Looking at camera</span>
        <span>No major blur</span>
      </div>
      <div className="action-row">
        <button className="secondary-btn" onClick={handleRetake}>Retake Photo</button>
        <button className="primary-btn" onClick={handleKeepReview}>Keep Photo</button>
      </div>
    </div>
  )
}
