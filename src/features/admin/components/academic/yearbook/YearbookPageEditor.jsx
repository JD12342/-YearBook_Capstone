import { Input } from '../../ui/Input.jsx'
import { YearbookArtworkUpload } from './YearbookArtworkUpload.jsx'

export function YearbookPageEditor({
  page,
  index,
  selectedArtwork,
  onFieldChange,
  onArtworkChange,
}) {
  return (
    <fieldset>
      <legend>Spread {index + 1}</legend>
      <label className="form-field">
        <span>Section label</span>
        <Input value={page.eyebrow || ''} onChange={(event) => onFieldChange('eyebrow', event.target.value)} />
      </label>
      <label className="form-field">
        <span>Heading</span>
        <Input value={page.title || ''} onChange={(event) => onFieldChange('title', event.target.value)} />
      </label>
      <label className="form-field">
        <span>Story text</span>
        <textarea className="field content-textarea" value={page.body || ''} onChange={(event) => onFieldChange('body', event.target.value)} />
      </label>
      <label className="form-field">
        <span>Feature quote</span>
        <textarea className="field yearbook-quote-field" value={page.quote || ''} onChange={(event) => onFieldChange('quote', event.target.value)} />
      </label>

      <div className="yearbook-page-artwork-grid">
        <YearbookArtworkUpload
          title="Left-page artwork"
          helpText="Optional full-page JPG, PNG, or WebP"
          currentUrl={page.leftPageImageUrl}
          selectedFile={selectedArtwork.left}
          onChange={(file) => onArtworkChange('left', file)}
        />
        <YearbookArtworkUpload
          title="Right-page artwork"
          helpText="Optional full-page JPG, PNG, or WebP"
          currentUrl={page.rightPageImageUrl}
          selectedFile={selectedArtwork.right}
          onChange={(file) => onArtworkChange('right', file)}
        />
      </div>
      <p className="yearbook-artwork-note">Uploaded artwork fills the selected page and replaces its generated layout.</p>
    </fieldset>
  )
}
