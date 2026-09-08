export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }

  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
  }

  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
