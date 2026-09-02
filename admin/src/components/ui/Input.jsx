export function Input({ className = '', ...props }) {
  return <input className={`field ${className}`.trim()} {...props} />
}
