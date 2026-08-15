import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'de' | 'en'

const STORAGE_KEY = 'kora-language'
const LOCALE: Record<Language, string> = { de: 'de-DE', en: 'en-GB' }

// Flat, dot-namespaced keys — one dictionary per language, same key set. `t()` falls back to
// the key itself if a translation is missing, so a missing entry is visible rather than silent.
const translations: Record<Language, Record<string, string>> = {
  de: {
    'app.notConnected.title': 'KORA ist noch nicht verbunden',
    'app.notConnected.body': 'Es fehlen VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY. Siehe kora/README.md für die Einrichtung.',

    'nav.dashboard': 'Dienstplan',
    'nav.newRequest': 'Neue Anfrage',
    'nav.reports': 'Berichte',
    'nav.settings': 'Einstellungen',
    'nav.admin': 'Admin',
    'nav.signOut': 'Abmelden',

    'error.somethingWrong.title': 'Da ist etwas schiefgelaufen',
    'error.somethingWrong.body': 'Bitte lade die Seite neu. Falls dein Browser die Seite automatisch übersetzt hat, schalte die Übersetzung aus und lade danach neu.',
    'error.reload': 'Neu laden',

    'login.subtitle': 'Dienstplan, Nachweis, Angebot und Rechnung an einem Ort.',
    'login.email': 'E-Mail',
    'login.password': 'Passwort',
    'login.submitting': 'Einen Moment …',
    'login.submit': 'Anmelden',
    'login.newCompanyHint': 'Neuer Betrieb? Ein Konto wird in Supabase Authentication angelegt — siehe kora/README.md.',

    'status.new': 'Neu',
    'status.quoted': 'Angebot erstellt',
    'status.planned': 'Geplant',
    'status.executed': 'Ausgeführt',
    'status.invoiced': 'Abgerechnet',
    'status.cancelled': 'Storniert',

    'dashboard.title': 'Dienstplan',
    'dashboard.subtitle': 'Alle Anfragen auf einen Blick.',
    'dashboard.loading': 'Lädt …',
    'dashboard.empty': 'Noch keine Anfragen. Leg die erste unter „Neue Anfrage“ an.',
    'dashboard.noClient': 'Kein Kunde hinterlegt',

    'qualification.unterrichtung': 'Unterrichtung (§ 34a)',
    'qualification.sachkunde': 'Sachkunde § 34a',
    'qualification.meister': 'Meister für Schutz und Sicherheit',
    'qualification.unterrichtung.short': 'Unterrichtung',
    'qualification.sachkunde.short': 'Sachkunde',
    'qualification.meister.short': 'Meister',

    'newRequest.title': 'Neue Anfrage',
    'newRequest.subtitle': 'Wird zur Kalkulation und zum Dienstplan.',
    'newRequest.titleLabel': 'Titel',
    'newRequest.titlePlaceholder': 'z. B. Messe München, Halle 3',
    'newRequest.client': 'Kunde',
    'newRequest.noClient': 'Kein Kunde hinterlegt',
    'newRequest.location': 'Einsatzort',
    'newRequest.state': 'Bundesland',
    'newRequest.starts': 'Beginn',
    'newRequest.ends': 'Ende',
    'newRequest.guardsRequired': 'Anzahl Kräfte',
    'newRequest.qualification': 'Qualifikation',
    'newRequest.saveError': 'Anfrage konnte nicht gespeichert werden.',
    'newRequest.saving': 'Wird gespeichert …',
    'newRequest.submit': 'Anfrage anlegen',

    'assignmentStatus.proposed': 'Vorgeschlagen',
    'assignmentStatus.accepted': 'Angenommen',
    'assignmentStatus.declined': 'Abgelehnt',
    'assignmentStatus.confirmed': 'Bestätigt',

    'planner.availableStaff': 'Verfügbares Personal',
    'planner.noGuards': 'Noch keine Mitarbeitenden angelegt (Einstellungen).',
    'planner.noCredential': 'Kein Nachweis',
    'planner.assigned': 'Eingeteilt',
    'planner.slotsFilled': '{{filled}} / {{total}} besetzt — Kräfte hier ablegen oder links anklicken',
    'planner.remove': 'Entfernen',
    'planner.askForHelp': 'KORA soll {{count}} verfügbare Kraft/Kräfte anfragen',
    'planner.calculation': 'Kalkulation',
    'planner.margin': 'Marge: {{percent}}%',
    'planner.personnelCost': 'Personalkosten',
    'planner.premiums': 'Zuschläge',
    'planner.marginLabel': 'Marge',
    'planner.offer': 'Angebot',
    'planner.offerPdf': 'Angebot als PDF',
    'planner.completeShift': 'Schicht abschließen → Rechnung',
    'planner.toInvoice': 'Zur Rechnung',

    'quote.notReady': 'Noch kein Angebot berechnet — im Dienstplan die Marge einstellen.',
    'quote.title': 'Angebot',
    'quote.marginPercent': 'Marge ({{percent}}%)',
    'quote.totalNet': 'Gesamt (netto)',
    'quote.downloadPdf': 'Als PDF herunterladen',

    'invoice.title': 'Rechnung',
    'invoice.subtitle': 'Aus dem ausgeführten Dienstplan, mit Nachweis.',
    'invoice.notCreated': 'Noch keine Rechnung erzeugt.',
    'invoice.generating': 'Wird erzeugt …',
    'invoice.generate': 'Rechnung erzeugen',
    'invoice.colGuard': 'Kraft',
    'invoice.colHours': 'Stunden',
    'invoice.colRate': 'Satz',
    'invoice.colAmount': 'Betrag',
    'invoice.subtotal': 'Zwischensumme',
    'invoice.vat': 'USt. ({{percent}}%)',
    'invoice.total': 'Gesamt',
    'invoice.downloadPdf': 'Als PDF herunterladen',
    'invoice.auditRecord': 'Nachweis (Prüfprotokoll)',

    'portal.greeting': 'Hallo {{name}}',
    'portal.subtitle': 'Dein Nachweis, deine Stunden, deine Schichten.',
    'portal.credentials': 'Nachweis',
    'portal.validUntil': 'Gültig bis {{date}}',
    'portal.noCredentials': 'Kein Nachweis hinterlegt.',
    'portal.hoursThisMonth': 'Stunden diesen Monat',
    'portal.offeredShifts': 'Angebotene Schichten',
    'portal.accept': 'Annehmen',
    'portal.decline': 'Ablehnen',
    'portal.noOfferedShifts': 'Aktuell keine angebotenen Schichten.',
    'portal.loading': 'Lädt …',

    'settings.title': 'Einstellungen',
    'settings.subtitle': 'Mitarbeitende, Tarife, Kunden und Team — alles an einem Ort.',
    'settings.staff': 'Mitarbeitende',
    'settings.name': 'Name',
    'settings.guardPhone': 'WhatsApp-Nummer (E.164, z. B. +4915112345678)',
    'settings.add': 'Hinzufügen',
    'settings.noPhone': 'Keine Nummer hinterlegt',
    'settings.personalLink': 'Persönlicher Link:',
    'settings.remove': 'Entfernen',
    'settings.noStaff': 'Noch keine Mitarbeitenden.',
    'settings.rateCards': 'Tarife',
    'settings.rateCardsHint': 'Ein Tarif pro Bundesland und Qualifikation. Fehlt einer, kann kein Angebot kalkuliert werden.',
    'settings.hourlyRate': 'Stundensatz (€)',
    'settings.addRateCard': 'Tarif hinzufügen',
    'settings.colState': 'Bundesland',
    'settings.colQualification': 'Qualifikation',
    'settings.colRate': '€/h',
    'settings.noRateCards': 'Noch keine Tarife.',
    'settings.rateCardDuplicate': 'Für diese Kombination existiert bereits ein Tarif.',
    'settings.clients': 'Kunden',
    'settings.email': 'E-Mail',
    'settings.phone': 'Telefon',
    'settings.addClient': 'Kunde hinzufügen',
    'settings.noClients': 'Noch keine Kunden.',
    'settings.team': 'Team',
    'settings.teamHint': 'Admins (Owner) sehen Berichte und Einstellungen. Disponenten sehen nur den Dienstplan.',
    'settings.password': 'Passwort',
    'settings.role': 'Rolle',
    'settings.roleDispatcher': 'Disponent',
    'settings.roleOwner': 'Admin (Owner)',
    'settings.inviting': 'Wird angelegt …',
    'settings.inviteSubmit': 'Teammitglied hinzufügen',
    'settings.teamLoading': 'Team wird geladen …',

    'reports.title': 'Berichte',
    'reports.subtitle': 'Auf einen Blick, was diesen Monat läuft.',
    'reports.loading': 'Lädt …',
    'reports.revenueThisMonth': 'Umsatz diesen Monat',
    'reports.hoursThisMonth': 'Stunden diesen Monat',
    'reports.activeGuards': 'Aktive Kräfte',
    'reports.expiringSoon': 'Nachweise laufen bald ab',
    'reports.byStatus': 'Anfragen nach Status',
    'reports.expiringCredentials': 'Nachweise, die bald ablaufen',
    'reports.noneExpiring': 'Nichts läuft in den nächsten 30 Tagen ab.',
    'reports.manageCredentialsPrefix': 'Verwaltung der Nachweise unter',
    'reports.unknownGuard': 'Unbekannt',

    'subprocessors.title': 'Unterauftragsverarbeiter',
    'subprocessors.subtitle': 'Offenlegung gemäß Art. 13 Abs. 1 lit. e DSGVO.',
    'subprocessors.colProvider': 'Anbieter',
    'subprocessors.colPurpose': 'Zweck',
    'subprocessors.colLocation': 'Standort',
    'subprocessors.footer': 'KORA speichert keine Dokumente oder Bewacher-IDs im Text von WhatsApp-Nachrichten. Nachrichten enthalten höchstens einen Link zu Daten, die hinter Zugriffsschutz liegen.',
    'subprocessors.supabase.purpose': 'Datenbank, Authentifizierung, Backend-Funktionen',
    'subprocessors.meta.purpose': 'Zustellung von WhatsApp-Benachrichtigungen (nur Text/Links, keine Dokumente)',
    'subprocessors.anthropic.purpose': 'KI-Textgenerierung für den KORA-Assistenten',
    'subprocessors.vercel.purpose': 'Hosting der Weboberfläche',
    'subprocessors.location.eu': 'Europäische Union',
    'subprocessors.location.euUs': 'EU/USA je nach Meta-Infrastruktur',
    'subprocessors.location.us': 'USA',
    'subprocessors.location.euUsRegion': 'EU/USA je nach gewählter Region',
  },
  en: {
    'app.notConnected.title': 'KORA isn’t connected yet',
    'app.notConnected.body': 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. See kora/README.md for setup.',

    'nav.dashboard': 'Schedule',
    'nav.newRequest': 'New Request',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign out',

    'error.somethingWrong.title': 'Something went wrong',
    'error.somethingWrong.body': 'Please reload the page. If your browser auto-translated this page, turn translation off first, then reload.',
    'error.reload': 'Reload',

    'login.subtitle': 'Scheduling, credentials, quotes and invoices in one place.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submitting': 'One moment …',
    'login.submit': 'Sign in',
    'login.newCompanyHint': 'New company? An account is created in Supabase Authentication — see kora/README.md.',

    'status.new': 'New',
    'status.quoted': 'Quoted',
    'status.planned': 'Planned',
    'status.executed': 'Executed',
    'status.invoiced': 'Invoiced',
    'status.cancelled': 'Cancelled',

    'dashboard.title': 'Schedule',
    'dashboard.subtitle': 'All requests at a glance.',
    'dashboard.loading': 'Loading …',
    'dashboard.empty': 'No requests yet. Create the first one under “New Request”.',
    'dashboard.noClient': 'No client on file',

    'qualification.unterrichtung': 'Instruction (§ 34a)',
    'qualification.sachkunde': 'Certified expertise § 34a',
    'qualification.meister': 'Master of Protection and Security',
    'qualification.unterrichtung.short': 'Instruction',
    'qualification.sachkunde.short': 'Certified',
    'qualification.meister.short': 'Master',

    'newRequest.title': 'New Request',
    'newRequest.subtitle': 'Becomes a quote and a shift plan.',
    'newRequest.titleLabel': 'Title',
    'newRequest.titlePlaceholder': 'e.g. Munich trade fair, Hall 3',
    'newRequest.client': 'Client',
    'newRequest.noClient': 'No client on file',
    'newRequest.location': 'Location',
    'newRequest.state': 'Federal state',
    'newRequest.starts': 'Starts',
    'newRequest.ends': 'Ends',
    'newRequest.guardsRequired': 'Guards required',
    'newRequest.qualification': 'Qualification',
    'newRequest.saveError': 'Could not save the request.',
    'newRequest.saving': 'Saving …',
    'newRequest.submit': 'Create request',

    'assignmentStatus.proposed': 'Proposed',
    'assignmentStatus.accepted': 'Accepted',
    'assignmentStatus.declined': 'Declined',
    'assignmentStatus.confirmed': 'Confirmed',

    'planner.availableStaff': 'Available staff',
    'planner.noGuards': 'No staff added yet (Settings).',
    'planner.noCredential': 'No credential',
    'planner.assigned': 'Assigned',
    'planner.slotsFilled': '{{filled}} / {{total}} filled — drop staff here or click on the left',
    'planner.remove': 'Remove',
    'planner.askForHelp': 'Have KORA ask {{count}} available guard(s)',
    'planner.calculation': 'Calculation',
    'planner.margin': 'Margin: {{percent}}%',
    'planner.personnelCost': 'Personnel cost',
    'planner.premiums': 'Premiums',
    'planner.marginLabel': 'Margin',
    'planner.offer': 'Offer',
    'planner.offerPdf': 'Offer as PDF',
    'planner.completeShift': 'Complete shift → Invoice',
    'planner.toInvoice': 'Go to invoice',

    'quote.notReady': 'No quote calculated yet — set the margin in the planner.',
    'quote.title': 'Quote',
    'quote.marginPercent': 'Margin ({{percent}}%)',
    'quote.totalNet': 'Total (net)',
    'quote.downloadPdf': 'Download as PDF',

    'invoice.title': 'Invoice',
    'invoice.subtitle': 'From the executed shift plan, with audit record.',
    'invoice.notCreated': 'No invoice generated yet.',
    'invoice.generating': 'Generating …',
    'invoice.generate': 'Generate invoice',
    'invoice.colGuard': 'Guard',
    'invoice.colHours': 'Hours',
    'invoice.colRate': 'Rate',
    'invoice.colAmount': 'Amount',
    'invoice.subtotal': 'Subtotal',
    'invoice.vat': 'VAT ({{percent}}%)',
    'invoice.total': 'Total',
    'invoice.downloadPdf': 'Download as PDF',
    'invoice.auditRecord': 'Audit record',

    'portal.greeting': 'Hi {{name}}',
    'portal.subtitle': 'Your credentials, your hours, your shifts.',
    'portal.credentials': 'Credentials',
    'portal.validUntil': 'Valid until {{date}}',
    'portal.noCredentials': 'No credentials on file.',
    'portal.hoursThisMonth': 'Hours this month',
    'portal.offeredShifts': 'Offered shifts',
    'portal.accept': 'Accept',
    'portal.decline': 'Decline',
    'portal.noOfferedShifts': 'No shifts offered right now.',
    'portal.loading': 'Loading …',

    'settings.title': 'Settings',
    'settings.subtitle': 'Staff, rate cards, clients and team — all in one place.',
    'settings.staff': 'Staff',
    'settings.name': 'Name',
    'settings.guardPhone': 'WhatsApp number (E.164, e.g. +4915112345678)',
    'settings.add': 'Add',
    'settings.noPhone': 'No number on file',
    'settings.personalLink': 'Personal link:',
    'settings.remove': 'Remove',
    'settings.noStaff': 'No staff yet.',
    'settings.rateCards': 'Rate cards',
    'settings.rateCardsHint': 'One rate card per federal state and qualification. Missing one blocks quoting.',
    'settings.hourlyRate': 'Hourly rate (€)',
    'settings.addRateCard': 'Add rate card',
    'settings.colState': 'State',
    'settings.colQualification': 'Qualification',
    'settings.colRate': '€/h',
    'settings.noRateCards': 'No rate cards yet.',
    'settings.rateCardDuplicate': 'A rate card for this combination already exists.',
    'settings.clients': 'Clients',
    'settings.email': 'Email',
    'settings.phone': 'Phone',
    'settings.addClient': 'Add client',
    'settings.noClients': 'No clients yet.',
    'settings.team': 'Team',
    'settings.teamHint': 'Admins (owners) see Reports and Settings. Dispatchers only see the schedule.',
    'settings.password': 'Password',
    'settings.role': 'Role',
    'settings.roleDispatcher': 'Dispatcher',
    'settings.roleOwner': 'Admin (owner)',
    'settings.inviting': 'Creating …',
    'settings.inviteSubmit': 'Add team member',
    'settings.teamLoading': 'Loading team …',

    'reports.title': 'Reports',
    'reports.subtitle': 'What’s happening this month, at a glance.',
    'reports.loading': 'Loading …',
    'reports.revenueThisMonth': 'Revenue this month',
    'reports.hoursThisMonth': 'Hours this month',
    'reports.activeGuards': 'Active guards',
    'reports.expiringSoon': 'Credentials expiring soon',
    'reports.byStatus': 'Requests by status',
    'reports.expiringCredentials': 'Credentials expiring soon',
    'reports.noneExpiring': 'Nothing expires in the next 30 days.',
    'reports.manageCredentialsPrefix': 'Manage credentials under',
    'reports.unknownGuard': 'Unknown',

    'subprocessors.title': 'Sub-processors',
    'subprocessors.subtitle': 'Disclosure under Art. 13(1)(e) GDPR.',
    'subprocessors.colProvider': 'Provider',
    'subprocessors.colPurpose': 'Purpose',
    'subprocessors.colLocation': 'Location',
    'subprocessors.footer': 'KORA never puts documents or Bewacher-IDs in the body of a WhatsApp message. Messages carry at most a link to data that lives behind access control.',
    'subprocessors.supabase.purpose': 'Database, authentication, backend functions',
    'subprocessors.meta.purpose': 'Delivery of WhatsApp notifications (text/links only, no documents)',
    'subprocessors.anthropic.purpose': 'AI text generation for the KORA assistant',
    'subprocessors.vercel.purpose': 'Hosting of the web frontend',
    'subprocessors.location.eu': 'European Union',
    'subprocessors.location.euUs': 'EU/US depending on Meta infrastructure',
    'subprocessors.location.us': 'US',
    'subprocessors.location.euUsRegion': 'EU/US depending on chosen region',
  },
}

function detectDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'de'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'de' || stored === 'en') return stored
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  locale: string
}

const I18nContext = createContext<I18nState | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectDefaultLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = translations[language][key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value))
        }
      }
      return text
    },
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t, locale: LOCALE[language] }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export function useFormatters() {
  const { locale } = useI18n()
  return useMemo(
    () => ({
      euro: (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value),
      dateTime: (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)),
    }),
    [locale],
  )
}
