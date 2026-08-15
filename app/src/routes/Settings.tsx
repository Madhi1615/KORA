import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { fetchTeam, inviteTeamMember } from '../lib/api'
import type { Client, Guard, Qualification, RateCard, TeamMember } from '../types'

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

function formatEuro(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

export default function Settings() {
  const { companyId } = useAuth()

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
      setRateError(error.message.includes('duplicate') ? 'Für diese Kombination existiert bereits ein Tarif.' : error.message)
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
        Einstellungen
        <span className="sub">Mitarbeitende, Tarife, Kunden und Team — alles an einem Ort.</span>
      </h1>

      <div className="grid-2" style={{ marginTop: 20, alignItems: 'start' }}>
        <div className="card">
          <h3>Mitarbeitende</h3>
          <form onSubmit={addGuard} style={{ marginTop: 12 }}>
            <div className="field">
              <label>Name</label>
              <input required value={guardName} onChange={(e) => setGuardName(e.target.value)} />
            </div>
            <div className="field">
              <label>WhatsApp-Nummer (E.164, z. B. +4915112345678)</label>
              <input value={guardPhone} onChange={(e) => setGuardPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit">
              Hinzufügen
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {guards.map((g) => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div>
                  <strong>{g.name}</strong>
                  <div className="muted">{g.phone ?? 'Keine Nummer hinterlegt'}</div>
                  <div className="muted" style={{ wordBreak: 'break-all' }}>
                    Persönlicher Link: {portalLink(g.portal_token)}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => removeGuard(g.id)}>
                  Entfernen
                </button>
              </div>
            ))}
            {guards.length === 0 && <p className="muted">Noch keine Mitarbeitenden.</p>}
          </div>
        </div>

        <div className="card">
          <h3>Tarife</h3>
          <p className="muted">Ein Tarif pro Bundesland und Qualifikation. Fehlt einer, kann kein Angebot kalkuliert werden.</p>
          <form onSubmit={addRateCard} style={{ marginTop: 12 }}>
            <div className="grid-2">
              <div className="field">
                <label>Bundesland</label>
                <select value={rateState} onChange={(e) => setRateState(e.target.value)}>
                  {GERMAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Qualifikation</label>
                <select value={rateQualification} onChange={(e) => setRateQualification(e.target.value as Qualification)}>
                  <option value="unterrichtung">Unterrichtung</option>
                  <option value="sachkunde">Sachkunde</option>
                  <option value="meister">Meister</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Stundensatz (€)</label>
              <input required type="number" min={0} step="0.01" value={rateHourly} onChange={(e) => setRateHourly(e.target.value)} />
            </div>
            {rateError && <p className="error-text">{rateError}</p>}
            <button className="btn btn-primary" type="submit">
              Tarif hinzufügen
            </button>
          </form>

          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Bundesland</th>
                <th>Qualifikation</th>
                <th>€/h</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rateCards.map((r) => (
                <tr key={r.id}>
                  <td>{r.federal_state}</td>
                  <td>{r.qualification}</td>
                  <td>{formatEuro(r.hourly_rate)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => removeRateCard(r.id)}>
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
              {rateCards.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Noch keine Tarife.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Kunden</h3>
          <form onSubmit={addClient} style={{ marginTop: 12 }}>
            <div className="field">
              <label>Name</label>
              <input required value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>E-Mail</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Telefon</label>
                <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Kunde hinzufügen
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
                  Entfernen
                </button>
              </div>
            ))}
            {clients.length === 0 && <p className="muted">Noch keine Kunden.</p>}
          </div>
        </div>

        <div className="card">
          <h3>Team</h3>
          <p className="muted">Admins (Owner) sehen Berichte und Einstellungen. Disponenten sehen nur den Dienstplan.</p>
          <form onSubmit={invite} style={{ marginTop: 12 }}>
            <div className="field">
              <label>E-Mail</label>
              <input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Passwort</label>
                <input required type="text" minLength={6} value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
              </div>
              <div className="field">
                <label>Rolle</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'owner' | 'dispatcher')}>
                  <option value="dispatcher">Disponent</option>
                  <option value="owner">Admin (Owner)</option>
                </select>
              </div>
            </div>
            {inviteError && <p className="error-text">{inviteError}</p>}
            <button className="btn btn-primary" type="submit" disabled={inviteBusy}>
              {inviteBusy ? 'Wird angelegt …' : 'Teammitglied hinzufügen'}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {team.map((m) => (
              <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <span>{m.email}</span>
                <span className={m.role === 'owner' ? 'role-badge' : 'pill'}>{m.role === 'owner' ? 'Admin' : 'Disponent'}</span>
              </div>
            ))}
            {team.length === 0 && <p className="muted">Team wird geladen …</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
