import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useI18n } from '../lib/i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function Login() {
  const { session, signIn } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email, password)
    setSubmitting(false)
    if (message) setError(message)
  }

  return (
    <div className="center-screen">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="brand-mark">
            <span />
          </div>
          <LanguageSwitcher />
        </div>
        <h2>{t('login.submit')}</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          {t('login.subtitle')}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">{t('login.email')}</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          {t('login.newCompanyHint')}
        </p>
      </div>
    </div>
  )
}
