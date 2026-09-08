export function PhotoEditorPanel({
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
    <div className="editor-panel panel-card">
      <div className="queue-header">
        <h3>Photo Editor</h3>
        <button className="small-btn" onClick={handleApprove}>Save Approved Photo</button>
      </div>

      <div className="editor-layout">
        <div className="editor-preview-wrap">
          <div className="comparison-header">
            <span>Original</span>
            <span>Edited</span>
          </div>
          <div className="comparison-grid">
            <img src={currentPhoto?.originalPhoto} alt="Original" className="editor-preview" />
            <img
              src={currentPhoto?.approvedPhoto}
              alt="Edited"
              className="editor-preview"
              style={{
                filter: `brightness(${editorSettings.brightness}%) contrast(${editorSettings.contrast}%) saturate(${editorSettings.saturation}%) ${editorSettings.grayscale ? 'grayscale(1)' : 'grayscale(0)'} brightness(${editorSettings.exposure}%)`,
                transform: `rotate(${editorSettings.rotate + editorSettings.straighten}deg) scale(${1 + editorSettings.crop / 100})`,
              }}
            />
          </div>
        </div>

        <div className="controls-panel">
          <label>
            <span>Brightness</span>
            <input type="range" min="0" max="200" value={editorSettings.brightness} onChange={(event) => applyEditorValue('brightness', Number(event.target.value))} />
          </label>
          <label>
            <span>Contrast</span>
            <input type="range" min="0" max="200" value={editorSettings.contrast} onChange={(event) => applyEditorValue('contrast', Number(event.target.value))} />
          </label>
          <label>
            <span>Exposure</span>
            <input type="range" min="0" max="200" value={editorSettings.exposure} onChange={(event) => applyEditorValue('exposure', Number(event.target.value))} />
          </label>
          <label>
            <span>Saturation</span>
            <input type="range" min="0" max="200" value={editorSettings.saturation} onChange={(event) => applyEditorValue('saturation', Number(event.target.value))} />
          </label>
          <label>
            <span>Temperature</span>
            <input type="range" min="-50" max="50" value={editorSettings.temperature} onChange={(event) => applyEditorValue('temperature', Number(event.target.value))} />
          </label>
          <label>
            <span>Sharpness</span>
            <input type="range" min="0" max="100" value={editorSettings.sharpness} onChange={(event) => applyEditorValue('sharpness', Number(event.target.value))} />
          </label>
          <label>
            <span>Crop</span>
            <input type="range" min="0" max="30" value={editorSettings.crop} onChange={(event) => applyEditorValue('crop', Number(event.target.value))} />
          </label>
          <label>
            <span>Straighten</span>
            <input type="range" min="-45" max="45" value={editorSettings.straighten} onChange={(event) => applyEditorValue('straighten', Number(event.target.value))} />
          </label>

          <div className="tools-row">
            <button className="secondary-btn" onClick={() => applyEditorValue('rotate', editorSettings.rotate - 90)}>Rotate Left</button>
            <button className="secondary-btn" onClick={() => applyEditorValue('rotate', editorSettings.rotate + 90)}>Rotate Right</button>
            <button className="secondary-btn" onClick={() => applyEditorValue('grayscale', !editorSettings.grayscale)}>{editorSettings.grayscale ? 'Color' : 'Grayscale'}</button>
          </div>

          <div className="tools-row">
            <button className="secondary-btn" onClick={handleUndo}>Undo</button>
            <button className="secondary-btn" onClick={handleRedo}>Redo</button>
            <button className="secondary-btn" onClick={handleReset}>Reset</button>
          </div>

          <div className="tools-row">
            <button className="small-btn" onClick={() => applyEditorValue('rotate', 0)}>Apply Yearbook Standard</button>
            <button className="small-btn danger" onClick={handleRequestRetake}>Request Retake</button>
          </div>
        </div>
      </div>
    </div>
  )
}
