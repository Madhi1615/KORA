import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useI18n } from '../lib/i18n'
import type { Client, Qualification } from '../types'

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

export default function NewRequest() {
  const { companyId } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [location, setLocation] = useState('')
  const [federalState, setFederalState] = useState('Berlin')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [guardsRequired, setGuardsRequired] = useState(1)
  const [qualification, setQualification] = useState<Qualification>('unterrichtung')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!companyId || !supabase) return
    supabase.from('clients').select('*').eq('company_id', companyId).then(({ data }) => setClients((data as Client[]) ?? []))
  }, [companyId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyId || !supabase) return
    setSubmitting(true)
    setError(null)

    const { data: request, error: insertError } = await supabase
      .from('requests')
      .insert({
        company_id: companyId,
        client_id: clientId || null,
        title,
        location,
        federal_state: federalState,
        starts_at: startsAt,
        ends_at: endsAt,
        guards_required: guardsRequired,
        qualification_required: qualification,
      })
      .select()
      .single()

    setSubmitting(false)
    if (insertError || !request) {
      setError(insertError?.message ?? t('newRequest.saveError'))
      return
    }

    navigate(`/planner/${request.id}`)
  }

  return (
    <div>
      <h1>
        {t('newRequest.title')}
        <span className="sub">{t('newRequest.subtitle')}</span>
      </h1>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 20, maxWidth: 560 }}>
        <div className="field">
          <label htmlFor="title">{t('newRequest.titleLabel')}</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('newRequest.titlePlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="client">{t('newRequest.client')}</label>
          <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">{t('newRequest.noClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="location">{t('newRequest.location')}</label>
            <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="state">{t('newRequest.state')}</label>
            <select id="state" value={federalState} onChange={(e) => setFederalState(e.target.value)}>
              {GERMAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="starts">{t('newRequest.starts')}</label>
            <input id="starts" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ends">{t('newRequest.ends')}</label>
            <input id="ends" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="guards">{t('newRequest.guardsRequired')}</label>
            <input id="guards" type="number" min={1} required value={guardsRequired} onChange={(e) => setGuardsRequired(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="qualification">{t('newRequest.qualification')}</label>
            <select id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value as Qualification)}>
              <option value="unterrichtung">{t('qualification.unterrichtung')}</option>
              <option value="sachkunde">{t('qualification.sachkunde')}</option>
              <option value="meister">{t('qualification.meister')}</option>
            </select>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? t('newRequest.saving') : t('newRequest.submit')}
        </button>
      </form>
    </div>
  )
}
