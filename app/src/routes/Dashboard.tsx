import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useFormatters, useI18n } from '../lib/i18n'
import type { RequestStatus, ServiceRequest } from '../types'

export default function Dashboard() {
  const { companyId } = useAuth()
  const { t } = useI18n()
  const { dateTime } = useFormatters()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId || !supabase) return
    supabase
      .from('requests')
      .select('*, clients(name)')
      .eq('company_id', companyId)
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        setRequests((data as ServiceRequest[]) ?? [])
        setLoading(false)
      })
  }, [companyId])

  return (
    <div>
      <h1>
        {t('dashboard.title')}
        <span className="sub">{t('dashboard.subtitle')}</span>
      </h1>

      <div style={{ marginTop: 20 }}>
        {loading && <p className="muted">{t('dashboard.loading')}</p>}
        {!loading && requests.length === 0 && (
          <div className="card">
            <p className="muted">{t('dashboard.empty')}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map((r) => (
            <Link key={r.id} to={`/planner/${r.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.title}</strong>
                  <div className="muted">
                    {r.clients?.name ?? t('dashboard.noClient')} · {dateTime(r.starts_at)}
                  </div>
                </div>
                <span className="pill">{t(`status.${r.status as RequestStatus}`)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
