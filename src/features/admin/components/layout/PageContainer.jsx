export function PageContainer({ children, className = '' }) {
  return <div className={`page-shell ${className}`.trim()}>{children}</div>
}
