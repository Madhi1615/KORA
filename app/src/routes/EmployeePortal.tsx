import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchEmployeePortal, respondToShift } from '../lib/api'
import { useFormatters, useI18n } from '../lib/i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

interface PortalData {
  guard: { name: string }
  credentials: Array<{ qualification: string; expires_at: string; permitted_deployment: string | null }>
  hours_this_month: number
  shifts: Array<{ id: string; status: string; shifts: { starts_at: string; ends_at: string; qualification_required: string } }>
}

export default function EmployeePortal() {
  const { token } = useParams<{ token: string }>()
  const { t } = useI18n()
  const { dateTime } = useFormatters()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!token) return
    try {
      const result = await fetchEmployeePortal(token)
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function respond(shiftAssignmentId: string, action: 'accept' | 'decline') {
    if (!token) return
    await respondToShift(token, shiftAssignmentId, action)
    load()
  }

  if (error) {
    return (
      <div className="center-screen">
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return <p className="muted" style={{ padding: 20 }}>{t('portal.loading')}</p>

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <LanguageSwitcher />
      </div>
      <h1>
        {t('portal.greeting', { name: data.guard.name })}
        <span className="sub">{t('portal.subtitle')}</span>
      </h1>

      <div className="grid-2" style={{ marginTop: 20, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 15 }}>{t('portal.credentials')}</h3>
          {data.credentials.map((c, i) => {
            const expired = c.expires_at < today
            return (
              <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div>{t(`qualification.${c.qualification}`)}</div>
                <span className={`pill ${expired ? 'pill-danger' : ''}`}>{t('portal.validUntil', { date: c.expires_at })}</span>
              </div>
            )
          })}
          {data.credentials.length === 0 && <p className="muted">{t('portal.noCredentials')}</p>}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15 }}>{t('portal.hoursThisMonth')}</h3>
          <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>{data.hours_this_month.toFixed(1)} h</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 15 }}>{t('portal.offeredShifts')}</h3>
        {data.shifts.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
            <div>
              <div>{dateTime(s.shifts.starts_at)}</div>
              <span className="pill">{t(`assignmentStatus.${s.status}`)}</span>
            </div>
            {s.status === 'proposed' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => respond(s.id, 'accept')}>
                  {t('portal.accept')}
                </button>
                <button className="btn btn-secondary" onClick={() => respond(s.id, 'decline')}>
                  {t('portal.decline')}
                </button>
              </div>
            )}
          </div>
        ))}
        {data.shifts.length === 0 && <p className="muted">{t('portal.noOfferedShifts')}</p>}
      </div>
    </div>
  )
}
