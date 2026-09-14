import { useEffect, useMemo, useState } from 'react'
import { Camera, Images } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'

const batchLabel = (memory) => memory.schoolYearName || memory.batch || 'School memories'
const normalizeLayout = (layout) => ({ mosaic: 'gallery-wall', filmstrip: 'cinema' }[layout] || layout || 'gallery-wall')

function MemoryPhoto({ image, alt, index }) {
  const [orientation, setOrientation] = useState('unknown')
  const detectOrientation = (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget
    setOrientation(width > height * 1.12 ? 'landscape' : height > width * 1.12 ? 'portrait' : 'square')
  }
  return <figure className={`memory-photo is-${orientation}`}><img src={image.url} alt={alt} loading="lazy" onLoad={detectOrientation} /><span>{String(index + 1).padStart(2, '0')}</span></figure>
}

export function UserMemoriesPage() {
  const { content } = useOutletContext()
  const batches = useMemo(() => {
    const grouped = new Map()
    content.memories.forEach((memory) => {
      const label = batchLabel(memory)
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label).push(memory)
    })
    return [...grouped.entries()]
      .map(([label, memories]) => ({ label, memories: memories.sort((a, b) => String(a.sectionName || '').localeCompare(String(b.sectionName || ''))) }))
      .sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true }))
  }, [content.memories])
  const [activeBatch, setActiveBatch] = useState('')

  useEffect(() => {
    if (!batches.length) setActiveBatch('')
    else if (!batches.some((batch) => batch.label === activeBatch)) setActiveBatch(batches[0].label)
  }, [activeBatch, batches])

  useScrollReveal('.user-memories-page [data-reveal]')
  const selected = batches.find((batch) => batch.label === activeBatch) || batches[0]

  return <div className="user-route-page user-memories-page">
    {batches.length ? <>
      <header className="memory-gallery-toolbar" data-reveal>
        <div><span>MEMORIES BY BATCH</span><h1>{selected.label}</h1></div>
        <nav className="memory-batch-picker" aria-label="Choose a graduating batch">
          {batches.map((batch) => <button type="button" key={batch.label} className={batch.label === selected?.label ? 'is-active' : ''} onClick={() => setActiveBatch(batch.label)}>{batch.label}</button>)}
        </nav>
      </header>
      <main className="memory-section-list" aria-live="polite">
        {selected.memories.map((memory, index) => <section className={`memory-section memory-layout-${normalizeLayout(memory.layout)}`} key={memory.id} data-reveal style={{ '--memory-delay': `${Math.min(index * 80, 320)}ms`, '--memory-bg': memory.backgroundColor || '#f2e7d5', '--memory-bg-image': memory.backgroundMode === 'image' && memory.backgroundImageUrl ? `url(${JSON.stringify(memory.backgroundImageUrl)})` : 'none' }}>
          <div className="memory-section-plaque"><span>{memory.sectionName || memory.title}</span></div>
          <div className="memory-triptych">
            {(memory.images || []).slice(0, 3).map((image, imageIndex) => <MemoryPhoto key={image.path || image.url || imageIndex} image={image} index={imageIndex} alt={`${memory.sectionName || memory.title} memory ${imageIndex + 1}`} />)}
          </div>
        </section>)}
      </main>
    </> : <section className="memory-empty" data-reveal><Images size={39} /><div><strong>The first memories are being gathered.</strong><p>When an administrator publishes three highlights for a section, its batch gallery will appear here.</p></div><Camera size={22} /></section>}
  </div>
}
