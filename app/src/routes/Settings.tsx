import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { fetchTeam, inviteTeamMember } from '../lib/api'
import { useFormatters, useI18n } from '../lib/i18n'
import type { Client, Guard, Qualification, RateCard, TeamMember } from '../types'

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

export default function Settings() {
  const { companyId } = useAuth()
  const { t } = useI18n()
  const { euro } = useFormatters()

  const [guards, setGuards] = useState<Guard[]>([])
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])

  const [guardName, setGuardName] = useState('')
  const [guardPhone, setGuardPhone] = useState('')

  const [rateState, setRateState] = useState('Berlin')
  const [rateQualification, setRateQualification] = useState<Qualification>('unterrichtung')
  const [rateHourly, setRateHourly] = useState('')
  const [rateError, setRateError] = useState<string | null>(null)

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'dispatcher'>('dispatcher')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)

  async function reload() {
    if (!companyId || !supabase) return
    const [g, r, c] = await Promise.all([
      supabase.from('guards').select('*').eq('company_id', companyId).order('name'),
      supabase.from('rate_cards').select('*').eq('company_id', companyId).order('federal_state'),
      supabase.from('clients').select('*').eq('company_id', companyId).order('name'),
    ])
    setGuards((g.data as Guard[]) ?? [])
    setRateCards((r.data as RateCard[]) ?? [])
    setClients((c.data as Client[]) ?? [])
    try {
      const { members } = await fetchTeam(companyId)
      setTeam(members)
    } catch {
      // non-fatal — team list is a nice-to-have on this page
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  async function addGuard(e: FormEvent) {
    e.preventDefault()
    if (!companyId || !supabase || !guardName) return
    await supabase.from('guards').insert({ company_id: companyId, name: guardName, phone: guardPhone || null })
    setGuardName('')
    setGuardPhone('')
    reload()
  }

  async function removeGuard(id: string) {
    if (!supabase) return
    await supabase.from('guards').delete().eq('id', id)
    reload()
  }

  async function addRateCard(e: FormEvent) {
    e.preventDefault()
    setRateError(null)
    if (!companyId || !supabase || !rateHourly) return
    const { error } = await supabase.from('rate_cards').insert({
      company_id: companyId,
      federal_state: rateState,
      qualification: rateQualification,
      hourly_rate: Number(rateHourly),
    })
    if (error) {
      setRateError(error.message.includes('duplicate') ? t('settings.rateCardDuplicate') : error.message)
      return
    }
    setRateHourly('')
    reload()
  }

  async function removeRateCard(id: string) {
    if (!supabase) return
    await supabase.from('rate_cards').delete().eq('id', id)
    reload()
  }

  async function addClient(e: FormEvent) {
    e.preventDefault()
    if (!companyId || !supabase || !clientName) return
    await supabase.from('clients').insert({
      company_id: companyId,
      name: clientName,
      contact_email: clientEmail || null,
      contact_phone: clientPhone || null,
    })
    setClientName('')
    setClientEmail('')
    setClientPhone('')
    reload()
  }

  async function removeClient(id: string) {
    if (!supabase) return
    await supabase.from('clients').delete().eq('id', id)
    reload()
  }

  async function invite(e: FormEvent) {
    e.preventDefault()
    if (!companyId) return
    setInviteError(null)
    setInviteBusy(true)
    try {
      await inviteTeamMember(companyId, inviteEmail, invitePassword, inviteRole)
      setInviteEmail('')
      setInvitePassword('')
      setInviteRole('dispatcher')
      reload()
    } catch (err) {
      setInviteError((err as Error).message)
    } finally {
      setInviteBusy(false)
    }
  }

  function portalLink(token: string) {
    return `${window.location.origin}/guard/${token}`
  }

  return (
    <div>
      <h1>
        {t('settings.title')}
        <span className="sub">{t('settings.subtitle')}</span>
      </h1>

      <div className="grid-2" style={{ marginTop: 20, alignItems: 'start' }}>
        <div className="card">
          <h3>{t('settings.staff')}</h3>
          <form onSubmit={addGuard} style={{ marginTop: 12 }}>
            <div className="field">
              <label>{t('settings.name')}</label>
              <input required value={guardName} onChange={(e) => setGuardName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('settings.guardPhone')}</label>
              <input value={guardPhone} onChange={(e) => setGuardPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit">
              {t('settings.add')}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {guards.map((g) => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div>
                  <strong>{g.name}</strong>
                  <div className="muted">{g.phone ?? t('settings.noPhone')}</div>
                  <div className="muted" style={{ wordBreak: 'break-all' }}>
                    {t('settings.personalLink')} {portalLink(g.portal_token)}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => removeGuard(g.id)}>
                  {t('settings.remove')}
                </button>
              </div>
            ))}
            {guards.length === 0 && <p className="muted">{t('settings.noStaff')}</p>}
          </div>
        </div>

        <div className="card">
          <h3>{t('settings.rateCards')}</h3>
          <p className="muted">{t('settings.rateCardsHint')}</p>
          <form onSubmit={addRateCard} style={{ marginTop: 12 }}>
            <div className="grid-2">
              <div className="field">
                <label>{t('newRequest.state')}</label>
                <select value={rateState} onChange={(e) => setRateState(e.target.value)}>
                  {GERMAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('newRequest.qualification')}</label>
                <select value={rateQualification} onChange={(e) => setRateQualification(e.target.value as Qualification)}>
                  <option value="unterrichtung">{t('qualification.unterrichtung.short')}</option>
                  <option value="sachkunde">{t('qualification.sachkunde.short')}</option>
                  <option value="meister">{t('qualification.meister.short')}</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>{t('settings.hourlyRate')}</label>
              <input required type="number" min={0} step="0.01" value={rateHourly} onChange={(e) => setRateHourly(e.target.value)} />
            </div>
            {rateError && <p className="error-text">{rateError}</p>}
            <button className="btn btn-primary" type="submit">
              {t('settings.addRateCard')}
            </button>
          </form>

          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>{t('settings.colState')}</th>
                <th>{t('settings.colQualification')}</th>
                <th>{t('settings.colRate')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rateCards.map((r) => (
                <tr key={r.id}>
                  <td>{r.federal_state}</td>
                  <td>{t(`qualification.${r.qualification}.short`)}</td>
                  <td>{euro(r.hourly_rate)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => removeRateCard(r.id)}>
                      {t('settings.remove')}
                    </button>
                  </td>
                </tr>
              ))}
              {rateCards.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    {t('settings.noRateCards')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>{t('settings.clients')}</h3>
          <form onSubmit={addClient} style={{ marginTop: 12 }}>
            <div className="field">
              <label>{t('settings.name')}</label>
              <input required value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>{t('settings.email')}</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>{t('settings.phone')}</label>
                <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              {t('settings.addClient')}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {clients.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div>
                  <strong>{c.name}</strong>
                  <div className="muted">{c.contact_email ?? c.contact_phone ?? '—'}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => removeClient(c.id)}>
                  {t('settings.remove')}
                </button>
              </div>
            ))}
            {clients.length === 0 && <p className="muted">{t('settings.noClients')}</p>}
          </div>
        </div>

        <div className="card">
          <h3>{t('settings.team')}</h3>
          <p className="muted">{t('settings.teamHint')}</p>
          <form onSubmit={invite} style={{ marginTop: 12 }}>
            <div className="field">
              <label>{t('settings.email')}</label>
              <input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>{t('settings.password')}</label>
                <input required type="text" minLength={6} value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
              </div>
              <div className="field">
                <label>{t('settings.role')}</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'owner' | 'dispatcher')}>
                  <option value="dispatcher">{t('settings.roleDispatcher')}</option>
                  <option value="owner">{t('settings.roleOwner')}</option>
                </select>
              </div>
            </div>
            {inviteError && <p className="error-text">{inviteError}</p>}
            <button className="btn btn-primary" type="submit" disabled={inviteBusy}>
              {inviteBusy ? t('settings.inviting') : t('settings.inviteSubmit')}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {team.map((m) => (
              <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <span>{m.email}</span>
                <span className={m.role === 'owner' ? 'role-badge' : 'pill'}>{m.role === 'owner' ? t('nav.admin') : t('settings.roleDispatcher')}</span>
              </div>
            ))}
            {team.length === 0 && <p className="muted">{t('settings.teamLoading')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
