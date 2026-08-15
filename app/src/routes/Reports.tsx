import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { RequestStatus } from '../types'

function formatEuro(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Neu',
  quoted: 'Angebot erstellt',
  planned: 'Geplant',
  executed: 'Ausgeführt',
  invoiced: 'Abgerechnet',
  cancelled: 'Storniert',
}

interface ExpiringCredential {
  guard_id: string
  qualification: string
  expires_at: string
  guards: { name: string } | null
}

export default function Reports() {
  const { companyId } = useAuth()
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
        Berichte
        <span className="sub">Auf einen Blick, was diesen Monat läuft.</span>
      </h1>

      {loading && (
        <p className="muted" style={{ marginTop: 20 }}>
          Lädt …
        </p>
      )}

      {!loading && (
        <>
          <div className="stat-grid" style={{ marginTop: 24 }}>
            <div className="stat-tile">
              <div className="stat-label">Umsatz diesen Monat</div>
              <div className="stat-value">{formatEuro(revenueThisMonth)}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Stunden diesen Monat</div>
              <div className="stat-value">{hoursThisMonth.toFixed(1)} h</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Aktive Kräfte</div>
              <div className="stat-value plain">
                {activeGuards} <span className="muted" style={{ fontSize: 16 }}>/ {totalGuards}</span>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Nachweise laufen bald ab</div>
              <div className="stat-value plain">{expiring.length}</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
            <div className="card">
              <h3 className="section-title">Anfragen nach Status</h3>
              {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((status) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                  <span className="muted">{STATUS_LABEL[status]}</span>
                  <strong>{statusCounts[status] ?? 0}</strong>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="section-title">Nachweise, die bald ablaufen</h3>
              {expiring.map((c) => {
                const expired = c.expires_at < today
                return (
                  <div key={`${c.guard_id}-${c.qualification}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                    <span>{c.guards?.name ?? 'Unbekannt'}</span>
                    <span className={`pill ${expired ? 'pill-danger' : ''}`}>{c.expires_at}</span>
                  </div>
                )
              })}
              {expiring.length === 0 && <p className="muted">Nichts läuft in den nächsten 30 Tagen ab.</p>}
              <p className="muted" style={{ marginTop: 12 }}>
                Verwaltung der Nachweise unter <Link to="/settings">Einstellungen</Link>.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
