import { useI18n } from '../lib/i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const PROCESSORS = [
  { name: 'Supabase (EU/Frankfurt project)', key: 'supabase', locationKey: 'eu' },
  { name: 'Meta Platforms Ireland Ltd. (WhatsApp Business Cloud API)', key: 'meta', locationKey: 'euUs' },
  { name: 'Anthropic', key: 'anthropic', locationKey: 'us' },
  { name: 'Vercel Inc.', key: 'vercel', locationKey: 'euUsRegion' },
] as const

export default function Subprocessors() {
  const { t } = useI18n()
  return (
    <div className="app-shell">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <LanguageSwitcher />
      </div>
      <h1>
        {t('subprocessors.title')}
        <span className="sub">{t('subprocessors.subtitle')}</span>
      </h1>
      <div className="card" style={{ marginTop: 20, maxWidth: 640 }}>
        <table>
          <thead>
            <tr>
              <th>{t('subprocessors.colProvider')}</th>
              <th>{t('subprocessors.colPurpose')}</th>
              <th>{t('subprocessors.colLocation')}</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSORS.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{t(`subprocessors.${p.key}.purpose`)}</td>
                <td>{t(`subprocessors.location.${p.locationKey}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 16, maxWidth: 640 }}>
        {t('subprocessors.footer')}
      </p>
    </div>
  )
}
