import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EditorialLink({ children, className = '', to = '/login?mode=signup' }) {
  return <Link className={className} to={to}>{children} <ArrowRight size={14} /></Link>
}
