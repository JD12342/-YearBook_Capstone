import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const initialFields = () => ({
  fullName: '',
  email: '',
  password: '',
  rememberMe: false,
  profileType: 'Student',
  referenceId: '',
})

export function useLoginForm() {
  const { authorizationError, clearAuthorizationError, login, register, isAuthenticated, loading, role: authenticatedRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSigningUp = searchParams.get('mode') === 'signup'
  const [fields, setFields] = useState(initialFields)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(location.state?.error || '')
  const [notice, setNotice] = useState('')

  const redirectPath = location.state?.from || (authenticatedRole === 'Administrator' ? '/dashboard' : '/community')
  const updateField = (name, value) => {
    clearAuthorizationError()
    setError('')
    setFields((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearAuthorizationError()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      if (isSigningUp) {
        await register({
          fullName: fields.fullName.trim(),
          email: fields.email.trim(),
          password: fields.password,
          profileType: fields.profileType,
          referenceId: fields.referenceId.trim(),
        })
        setFields(initialFields())
        setSearchParams({})
        setNotice('Your access request was submitted. You can sign in after an administrator approves it.')
      } else {
        const result = await login({ email: fields.email.trim(), password: fields.password, rememberMe: fields.rememberMe })
        navigate(result.role === 'Administrator' ? '/dashboard' : '/community', { replace: true })
      }
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in. Please check your credentials and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    clearAuthorizationError()
    setError('')
    setNotice('')
    setFields(initialFields())
    setSearchParams(isSigningUp ? {} : { mode: 'signup' })
  }

  return {
    error: error || authorizationError,
    notice,
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
