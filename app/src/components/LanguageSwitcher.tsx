import { useI18n, type Language } from '../lib/i18n'

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  const options: { value: Language; label: string }[] = [
    { value: 'de', label: 'DE' },
    { value: 'en', label: 'EN' },
  ]
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 999, padding: 2 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLanguage(opt.value)}
          aria-pressed={language === opt.value}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: language === opt.value ? 'var(--gradient)' : 'transparent',
            color: language === opt.value ? '#ffffff' : 'var(--grey)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
