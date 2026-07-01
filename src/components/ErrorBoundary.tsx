import { Component, type ReactNode } from 'react'
import { Monogram } from './Ornaments'

interface Props {
  children: ReactNode
}
interface State {
  failed: boolean
}

/**
 * Last line of defense: if anything throws during render, show a calm recovery
 * screen instead of a blank white page. "Start over" clears the locally-saved
 * RSVP + content (the usual culprits for a corrupt-state crash) and reloads.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  private recover = () => {
    try {
      localStorage.removeItem('peninsula_rsvp')
      localStorage.removeItem('peninsula_content')
    } catch {
      /* ignore */
    }
    window.location.href = window.location.pathname
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main
        className="bg-grain flex min-h-svh flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: 'var(--forest)' }}
      >
        <Monogram className="h-11 w-11 text-gold-light/80" />
        <p className="eyebrow mt-6 text-gold-light/80">The Peninsula Residence</p>
        <h1 className="mt-3 font-display text-2xl text-ivory">
          We hit a small snag.
        </h1>
        <p className="mt-2 max-w-xs text-sm text-ivory/70">
          Something didn’t load correctly. Starting over should fix it.
        </p>
        <button className="btn-primary mt-7" onClick={this.recover}>
          Start over
        </button>
      </main>
    )
  }
}
