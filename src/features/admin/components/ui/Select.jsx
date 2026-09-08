export function Select({ className = '', children, ...props }) {
  return (
    <select className={`field ${className}`.trim()} {...props}>
      {children}
    </select>
  )
}
