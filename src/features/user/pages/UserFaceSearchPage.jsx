import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Camera, ImagePlus, Images, LockKeyhole, ScanFace, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { collectPublishedPortraits, loadFaceSearchModels, searchPublishedFaces, searchPublishedImages } from '../services/faceSearchService.js'

const initialProgress = { completed: 0, total: 0 }

export function UserFaceSearchPage() {
  const { content } = useOutletContext()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [searchMode, setSearchMode] = useState('face')
  const [previewUrl, setPreviewUrl] = useState('')
  const [status, setStatus] = useState('ready')
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [progress, setProgress] = useState(initialProgress)
  const portraitCount = useMemo(() => collectPublishedPortraits(content.yearbooks).length, [content.yearbooks])

  useEffect(() => {
    loadFaceSearchModels().catch(() => {})
  }, [])

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const chooseFile = (nextFile) => {
    if (!nextFile) return
    if (!nextFile.type.startsWith('image/')) {
      setError('Choose a JPG, PNG, or other image file.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Choose an image smaller than 10 MB.')
      return
    }
    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
    setResults(null)
    setProgress(initialProgress)
    setError('')
  }

  const clearPhoto = () => {
    setFile(null)
    setPreviewUrl('')
    setResults(null)
    setProgress(initialProgress)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const runSearch = async () => {
    if (!file || status === 'searching') return
    setStatus('searching')
    setError('')
    setResults(null)
    try {
      const search = searchMode === 'face' ? searchPublishedFaces : searchPublishedImages
      setResults(await search({ file, yearbooks: content.yearbooks, onProgress: setProgress }))
      setStatus('ready')
    } catch (searchError) {
      setError(searchError.message || 'The archive could not be searched. Try another photo.')
      setStatus('ready')
    }
  }

  const progressPercent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0
  const isFaceMode = searchMode === 'face'

  const changeMode = (mode) => {
    setSearchMode(mode)
    setResults(null)
    setProgress(initialProgress)
    setError('')
  }

  return (
    <div className="user-route-page user-face-search-page">
      <section className="face-search-hero">
        <div className="face-search-heading">
          <span className="user-eyebrow">AUTHORIZED ARCHIVE SEARCH</span>
          <h1>Search the <em>yearbook archive.</em></h1>
          <p>Choose facial matching or whole-image similarity, then select a photo. GradBook compares it only with portraits an administrator approved for active yearbooks.</p>
          <div className="face-search-trust"><span><LockKeyhole size={15} /> Search photo is not uploaded or saved</span><span><ShieldCheck size={15} /> Results remain read-only</span></div>
        </div>
        <div className="face-search-count"><ScanFace size={29} /><strong>{portraitCount}</strong><span>approved portrait{portraitCount === 1 ? '' : 's'} available</span></div>
      </section>

      <section className="face-search-workspace" aria-labelledby="face-search-title">
        <div className="face-search-upload-panel">
          <div className="face-search-mode" aria-label="Choose a search type">
            <button type="button" className={isFaceMode ? 'is-active' : ''} aria-pressed={isFaceMode} disabled={status === 'searching'} onClick={() => changeMode('face')}><ScanFace size={18} /><span><strong>Face search</strong><small>Match facial features</small></span></button>
            <button type="button" className={!isFaceMode ? 'is-active' : ''} aria-pressed={!isFaceMode} disabled={status === 'searching'} onClick={() => changeMode('image')}><Images size={18} /><span><strong>Image search</strong><small>Match the whole picture</small></span></button>
          </div>
          <div className="face-search-panel-title"><span><Camera size={18} /> STEP 1</span><h2 id="face-search-title">Choose a search photo</h2><p>{isFaceMode ? 'Use a front-facing image with one person, even lighting, and a visible face.' : 'Choose the full image you want to compare by pose, colors, lighting, and background.'}</p></div>
          <input ref={inputRef} type="file" accept="image/*" capture="user" hidden onChange={(event) => chooseFile(event.target.files?.[0])} />
          {previewUrl ? (
            <div className="face-search-preview">
              <img src={previewUrl} alt="Photo selected for face search" />
              <button type="button" onClick={clearPhoto} aria-label="Remove selected photo"><X size={18} /></button>
            </div>
          ) : (
            <button className="face-search-dropzone" type="button" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={34} /><strong>Select or take a photo</strong><span>JPG or PNG · up to 10 MB</span>
            </button>
          )}
          <div className="face-search-actions">
            {file && <button className="face-search-secondary" type="button" onClick={() => inputRef.current?.click()}>Choose another</button>}
            <button className="face-search-primary" type="button" disabled={!file || status === 'loading' || status === 'searching' || !portraitCount} onClick={runSearch}>
              {isFaceMode ? <ScanFace size={18} /> : <Images size={18} />}{status === 'loading' ? 'Preparing secure search…' : status === 'searching' ? `Comparing ${progressPercent}%` : isFaceMode ? 'Search by face' : 'Search by image'}
            </button>
          </div>
          {status === 'searching' && <div className="face-search-progress" aria-label={`${progressPercent}% complete`}><span style={{ width: `${progressPercent}%` }} /></div>}
          {error && <div className="face-search-error" role="alert">{error}</div>}
        </div>

        <div className="face-search-results-panel">
          <div className="face-search-panel-title"><span><Sparkles size={18} /> STEP 2</span><h2>{isFaceMode ? 'Possible face matches' : 'Similar images'}</h2><p>{isFaceMode ? 'Face similarity is a search aid. Check the portrait and yearbook details before deciding it is the same person.' : 'Image search compares the full picture, including pose, colors, lighting, and background.'}</p></div>
          {!results && <div className="face-search-empty"><ScanFace size={43} /><strong>Your closest matches will appear here.</strong><span>No profile is changed or approved by this search.</span></div>}
          {results && !results.matches.length && <div className="face-search-empty"><ScanFace size={43} /><strong>No close match was found.</strong><span>{results.readableCount} of {results.searchedCount} approved portraits could be compared. Try a clearer or more recent photo.</span></div>}
          {results?.matches.length > 0 && <div className="face-search-results">
            {results.matches.map((match, index) => <article key={`${match.yearbookId}-${match.id || match.name}`} className="face-search-result">
              <img src={match.photoUrl} alt={`Published portrait of ${match.name}`} />
              <div><span>{index === 0 ? (isFaceMode ? 'CLOSEST POSSIBLE MATCH' : 'MOST SIMILAR IMAGE') : (isFaceMode ? 'OTHER POSSIBLE MATCH' : 'SIMILAR IMAGE')}</span><h3>{match.name}</h3><p>{[match.strand, match.section, match.schoolYear].filter(Boolean).join(' · ')}</p><small>Similarity score {match.similarity}/100</small><Link to={`/community/yearbooks/${match.yearbookId}`}>Open published yearbook <ArrowUpRight size={14} /></Link></div>
            </article>)}
          </div>}
        </div>
      </section>

      <p className="face-search-footnote">Results can be affected by lighting, angle, age differences, image quality, obstructions, and missing yearbook records.</p>
    </div>
  )
}
