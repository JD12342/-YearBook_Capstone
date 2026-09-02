const statusColors = {
  pending: 'badge-neutral',
  captured: 'badge-success',
  editing: 'badge-warning',
  approved: 'badge-success',
  'retake needed': 'badge-danger',
  active: 'badge-success',
  archived: 'badge-neutral',
}

export function Badge({ children, status = 'pending', className = '' }) {
  const tone = statusColors[status.toLowerCase()] ?? 'badge-neutral'
  return <span className={`badge ${tone} ${className}`.trim()}>{children}</span>
}
