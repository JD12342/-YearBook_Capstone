// Only fields intended for the yearbook leave the administrator's student records.
export function buildStudentPages(pages, profiles) {
  const template = pages.find(page => page.layout === 'profiles' || page.id === 'portraits') || { id: 'portraits', layout: 'profiles', eyebrow: 'THE GRADUATING CLASS' }
  // A profile belongs to one physical page. This keeps the reading order natural:
  // first student on the left, second on the right, and third on the next left page.
  const count = Math.max(1, Math.ceil(profiles.length / 2))
  const generated = Array.from({ length: count }, (_, index) => ({
    ...template, id: index ? 'portraits-' + (index + 1) : 'portraits', layout: 'profiles',
    // Student records always use the generated layout, so old artwork cannot conceal stale names.
    leftPageImageUrl: '', rightPageImageUrl: '', leftPageImagePath: '', rightPageImagePath: '',
    profiles: profiles.slice(index * 2, index * 2 + 2),
  }))
  const result = []
  let inserted = false
  for (const page of pages) {
    if (page.layout === 'profiles' || page.id === 'portraits') {
      if (!inserted) { result.push(...generated); inserted = true }
    } else { const { profiles: _unused, ...editorial } = page; result.push(editorial) }
  }
  if (!inserted) result.push(...generated)
  return result
}
