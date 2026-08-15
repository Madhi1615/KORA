import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useFormatters, useI18n } from '../lib/i18n'
import type { RequestStatus } from '../types'

const STATUSES: RequestStatus[] = ['new', 'quoted', 'planned', 'executed', 'invoiced', 'cancelled']

interface ExpiringCredential {
  guard_id: string
  qualification: string
  expires_at: string
  guards: { name: string } | null
}

export default function Reports() {
  const { companyId } = useAuth()
  const { t } = useI18n()
  const { euro } = useFormatters()
  const [loading, setLoading] = useState(true)
  const [revenueThisMonth, setRevenueThisMonth] = useState(0)
  const [hoursThisMonth, setHoursThisMonth] = useState(0)
  const [activeGuards, setActiveGuards] = useState(0)
  const [totalGuards, setTotalGuards] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [expiring, setExpiring] = useState<ExpiringCredential[]>([])

  useEffect(() => {
    if (!companyId || !supabase) return

    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    const in30Days = new Date()
    in30Days.setDate(in30Days.getDate() + 30)

    async function load() {
      const [invoicesRes, hoursRes, guardsRes, requestsRes, expiringRes] = await Promise.all([
        supabase!.from('invoices').select('total').gte('created_at', startOfMonth.toISOString()),
        supabase!
          .from('shift_assignments')
          .select('hours_worked, shifts!inner(starts_at)')
          .eq('status', 'confirmed')
          .gte('shifts.starts_at', startOfMonth.toISOString()),
        supabase!.from('guards').select('active'),
        supabase!.from('requests').select('status'),
        supabase!
          .from('credentials')
          .select('guard_id, qualification, expires_at, guards(name)')
          .lte('expires_at', in30Days.toISOString().slice(0, 10))
          .order('expires_at', { ascending: true })
          .limit(8),
      ])

      setRevenueThisMonth((invoicesRes.data ?? []).reduce((sum, row: any) => sum + Number(row.total), 0))
      setHoursThisMonth((hoursRes.data ?? []).reduce((sum, row: any) => sum + Number(row.hours_worked ?? 0), 0))
      setActiveGuards((guardsRes.data ?? []).filter((g: any) => g.active).length)
      setTotalGuards((guardsRes.data ?? []).length)

      const counts: Record<string, number> = {}
      for (const row of (requestsRes.data ?? []) as { status: string }[]) {
        counts[row.status] = (counts[row.status] ?? 0) + 1
      }
      setStatusCounts(counts)
      setExpiring((expiringRes.data as unknown as ExpiringCredential[]) ?? [])
      setLoading(false)
    }

    load()
  }, [companyId])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <h1>
        {t('reports.title')}
        <span className="sub">{t('reports.subtitle')}</span>
      </h1>

      {loading && (
        <p className="muted" style={{ marginTop: 20 }}>
          {t('reports.loading')}
        </p>
      )}

      {!loading && (
        <>
          <div className="stat-grid" style={{ marginTop: 24 }}>
            <div className="stat-tile">
              <div className="stat-label">{t('reports.revenueThisMonth')}</div>
              <div className="stat-value">{euro(revenueThisMonth)}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">{t('reports.hoursThisMonth')}</div>
              <div className="stat-value">{hoursThisMonth.toFixed(1)} h</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">{t('reports.activeGuards')}</div>
              <div className="stat-value plain">
                {activeGuards} <span className="muted" style={{ fontSize: 16 }}>/ {totalGuards}</span>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">{t('reports.expiringSoon')}</div>
              <div className="stat-value plain">{expiring.length}</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
            <div className="card">
              <h3 className="section-title">{t('reports.byStatus')}</h3>
              {STATUSES.map((status) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                  <span className="muted">{t(`status.${status}`)}</span>
                  <strong>{statusCounts[status] ?? 0}</strong>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="section-title">{t('reports.expiringCredentials')}</h3>
              {expiring.map((c) => {
                const expired = c.expires_at < today
                return (
                  <div key={`${c.guard_id}-${c.qualification}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                    <span>{c.guards?.name ?? t('reports.unknownGuard')}</span>
                    <span className={`pill ${expired ? 'pill-danger' : ''}`}>{c.expires_at}</span>
                  </div>
                )
              })}
              {expiring.length === 0 && <p className="muted">{t('reports.noneExpiring')}</p>}
              <p className="muted" style={{ marginTop: 12 }}>
                {t('reports.manageCredentialsPrefix')} <Link to="/settings">{t('nav.settings')}</Link>.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
