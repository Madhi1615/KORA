import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// Catches render-time crashes (e.g. a browser extension like Google Translate mutating
// the DOM out from under React) so the screen shows a recoverable message instead of
// silently going blank.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      // Deliberately independent of the i18n context — it lives outside this boundary, so a
      // crash there must not also break this fallback. Detects the browser language directly.
      const isGerman = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')
      const text = isGerman
        ? {
            title: 'Da ist etwas schiefgelaufen',
            body: 'Bitte lade die Seite neu. Falls dein Browser die Seite automatisch übersetzt hat, schalte die Übersetzung aus und lade danach neu.',
            reload: 'Neu laden',
          }
        : {
            title: 'Something went wrong',
            body: 'Please reload the page. If your browser auto-translated this page, turn translation off first, then reload.',
            reload: 'Reload',
          }
      return (
        <div className="center-screen">
          <div className="card">
            <h2>{text.title}</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              {text.body}
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              {text.reload}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
