import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const initialFields = (isSigningUp) => ({
  fullName: '',
  email: '',
  password: '',
  rememberMe: false,
  role: isSigningUp ? 'Student' : 'Administrator',
})

export function useLoginForm() {
  const { login, register, isAuthenticated, loading, role: authenticatedRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSigningUp = searchParams.get('mode') === 'signup'
  const [fields, setFields] = useState(() => initialFields(isSigningUp))
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectPath = location.state?.from || (authenticatedRole === 'Administrator' || authenticatedRole === 'Staff' ? '/dashboard' : '/community')
  const updateField = (name, value) => setFields((current) => ({ ...current, [name]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isSigningUp) {
        await register({ fullName: fields.fullName.trim(), email: fields.email.trim(), password: fields.password, role: fields.role })
        navigate('/community', { replace: true })
      } else {
        const result = await login(fields.email.trim(), fields.password, fields.role)
        navigate(result.role === 'Administrator' || result.role === 'Staff' ? '/dashboard' : '/community', { replace: true })
      }
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in. Please check your Firebase credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setError('')
    setFields((current) => ({ ...current, role: isSigningUp ? 'Administrator' : 'Student' }))
    setSearchParams(isSigningUp ? {} : { mode: 'signup' })
  }

  return {
    error,
    fields,
    handleSubmit,
    isAuthenticated,
    isSigningUp,
    loading,
    passwordVisible,
    redirectPath,
    setPasswordVisible,
    submitting,
    toggleMode,
    updateField,
  }
}
