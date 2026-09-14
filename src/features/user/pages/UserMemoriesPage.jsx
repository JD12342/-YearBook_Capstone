import { useEffect, useMemo, useState } from 'react'
import { Camera, Heart, Images } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'

const batchLabel = (memory) => memory.schoolYearName || memory.batch || 'School memories'

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
  const featureMemory = selected?.memories?.[0]
  const accentColor = featureMemory?.themeColor || '#d17c87'
  const heroImage = featureMemory?.images?.[0]?.url

  return <div className="user-route-page user-memories-page" style={{ '--memory-accent': accentColor }}>
    <header className="memories-hero memories-gallery-hero" data-reveal style={{ '--memory-hero-image': heroImage ? `url(${JSON.stringify(heroImage)})` : 'none' }}>
      <div><span className="user-eyebrow"><Heart size={14} /> THE MOMENTS WE KEEP</span><h1>Little memories,<br /><em>kept forever.</em></h1></div>
      <p>One defining picture from every section, selected by the school and kept together by graduating batch.</p>
    </header>

    {batches.length ? <>
      <nav className="memory-batch-picker" aria-label="Choose a graduating batch" data-reveal>
        {batches.map((batch) => <button type="button" key={batch.label} className={batch.label === selected?.label ? 'is-active' : ''} onClick={() => setActiveBatch(batch.label)}><small>BATCH</small><strong>{batch.label}</strong><span>{batch.memories.length} section{batch.memories.length === 1 ? '' : 's'}</span></button>)}
      </nav>
      <main className="memory-section-list memory-single-list" aria-live="polite">
        {selected.memories.map((memory, index) => <section className="memory-section memory-single-section" key={memory.id} data-reveal style={{ '--memory-delay': `${Math.min(index * 80, 320)}ms` }}>
          {memory.images?.[0]?.url ? <figure className="memory-single-photo"><img src={memory.images[0].url} alt={`${memory.sectionName || memory.title} memory`} loading="lazy" /><figcaption><span>{memory.sectionName || memory.title}</span></figcaption></figure> : <div className="memory-single-missing"><Images size={32} />Picture unavailable</div>}
        </section>)}
      </main>
    </> : <section className="memory-empty" data-reveal><Images size={39} /><div><strong>The first memories are being gathered.</strong><p>When an administrator publishes a picture for a section, its batch gallery will appear here.</p></div><Camera size={22} /></section>}
  </div>
}
