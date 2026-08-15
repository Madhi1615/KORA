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
      return (
        <div className="center-screen">
          <div className="card">
            <h2>Da ist etwas schiefgelaufen</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Bitte lade die Seite neu. Falls dein Browser die Seite automatisch übersetzt hat, schalte die
              Übersetzung aus und lade danach neu.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
