import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getRegistrationAcademicOptions } from '../services/registrationOptionsService.js'

const initialFields = () => ({
  fullName: '',
  email: '',
  password: '',
  rememberMe: false,
  profileType: 'Student',
  referenceId: '',
  schoolYearId: '',
  strandId: '',
  sectionId: '',
})

export function useLoginForm() {
  const { login, register, isAuthenticated, loading, role: authenticatedRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSigningUp = searchParams.get('mode') === 'signup'
  const [fields, setFields] = useState(initialFields)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(location.state?.error || '')
  const [notice, setNotice] = useState('')
  const [academicOptions, setAcademicOptions] = useState({ schoolYears: [], strands: [], sections: [] })
  const [academicOptionsLoading, setAcademicOptionsLoading] = useState(false)

  useEffect(() => {
    setError('')
    setNotice('')
  }, [location.key])

  useEffect(() => {
    if (!isSigningUp || academicOptions.schoolYears.length) return undefined
    let active = true
    setAcademicOptionsLoading(true)
    getRegistrationAcademicOptions()
      .then((options) => { if (active) setAcademicOptions(options) })
      .catch(() => { if (active) setError('School year, strand, and section choices could not be loaded. Please try again.') })
      .finally(() => { if (active) setAcademicOptionsLoading(false) })
    return () => { active = false }
  }, [academicOptions.schoolYears.length, isSigningUp])

  const redirectPath = location.state?.from || (authenticatedRole === 'Administrator' ? '/dashboard' : authenticatedRole === 'Teacher' ? '/community/teacher' : '/community')
  const updateField = (name, value) => {
    setError('')
    setFields((current) => {
      if (name === 'schoolYearId') return { ...current, schoolYearId: value, strandId: '', sectionId: '' }
      if (name === 'strandId') return { ...current, strandId: value, sectionId: '' }
      return { ...current, [name]: value }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
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
          schoolYearId: fields.schoolYearId,
          strandId: fields.strandId,
          sectionId: fields.sectionId,
        })
        setFields(initialFields())
        setSearchParams({})
        setNotice('Your access request was submitted. You can sign in after the school approves it.')
      } else {
        const result = await login({ email: fields.email.trim(), password: fields.password, rememberMe: fields.rememberMe })
        navigate(result.role === 'Administrator' ? '/dashboard' : result.role === 'Teacher' ? '/community/teacher' : '/community', { replace: true })
      }
    } catch (loginError) {
      setError(loginError?.message || (isSigningUp ? 'We could not create your account. Please try again.' : 'We could not sign you in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setError('')
    setNotice('')
    setFields(initialFields())
    setSearchParams(isSigningUp ? {} : { mode: 'signup' })
  }

  return {
    error,
    academicOptions,
    academicOptionsLoading,
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
