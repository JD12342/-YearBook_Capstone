import { ImagePlus } from 'lucide-react'

export function YearbookArtworkUpload({
  title,
  helpText,
  currentUrl,
  selectedFile,
  onChange,
}) {
  const status = selectedFile?.name
    || (currentUrl ? 'Custom artwork saved' : helpText)

  return (
    <label className="yearbook-upload-field yearbook-artwork-upload">
      <ImagePlus size={18} />
      <span>
        <strong>{title}</strong>
        <small>{status}</small>
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  )
}
