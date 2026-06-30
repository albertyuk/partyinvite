import { Suspense, lazy, useState } from 'react'
import { ContentProvider } from './content/ContentContext'
import { InvitationCard } from './components/InvitationCard'
import { RsvpForm } from './components/RsvpForm'
import { EntryPass } from './components/EntryPass'
import { Monogram } from './components/Ornaments'
import { loadRsvp, saveRsvp, submitRsvp, type RsvpRecord } from './lib/rsvp'

// Mapbox GL is heavy (~570 kB gzip). Load the intro — and Mapbox with it —
// only when it actually plays. Returning guests who skip the intro never
// download it at all.
const IntroSequence = lazy(() =>
  import('./components/IntroSequence').then((m) => ({
    default: m.IntroSequence,
  })),
)

// The editor (and its preview deps) only load on the /?edit screen.
const Editor = lazy(() =>
  import('./components/Editor').then((m) => ({ default: m.Editor })),
)

type Stage = 'intro' | 'card' | 'rsvp' | 'pass'

/** Dark holding screen shown while the intro chunk loads — never blank. */
function IntroFallback() {
  return (
    <div
      className="bg-grain fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--forest)' }}
    >
      <Monogram className="h-12 w-12 animate-fade-in text-gold-light/80" />
    </div>
  )
}

const isEditMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('edit')

export default function App() {
  return (
    <ContentProvider>
      {isEditMode ? (
        <Suspense fallback={<IntroFallback />}>
          <Editor />
        </Suspense>
      ) : (
        <GuestFlow />
      )}
    </ContentProvider>
  )
}

function GuestFlow() {
  // A returning guest (saved pass on this device) skips straight past the intro.
  const [saved, setSaved] = useState<RsvpRecord | null>(() => loadRsvp())
  const [stage, setStage] = useState<Stage>(() =>
    loadRsvp() ? 'card' : 'intro',
  )

  function handleSubmit(record: RsvpRecord) {
    // 1) Persist + render the pass immediately — never block on the network.
    saveRsvp(record)
    setSaved(record)
    setStage('pass')
    // 2) Best-effort write to the host's Sheet (fire-and-forget).
    void submitRsvp(record)
  }

  switch (stage) {
    case 'intro':
      return (
        <Suspense fallback={<IntroFallback />}>
          <IntroSequence onComplete={() => setStage('card')} />
        </Suspense>
      )

    case 'rsvp':
      return (
        <RsvpForm
          initial={saved}
          onSubmit={handleSubmit}
          onBack={() => setStage('card')}
        />
      )

    case 'pass':
      return saved ? (
        <EntryPass
          record={saved}
          onEdit={() => setStage('rsvp')}
          onBack={() => setStage('card')}
        />
      ) : (
        // Defensive: no record to show — send them to the form.
        <RsvpForm onSubmit={handleSubmit} onBack={() => setStage('card')} />
      )

    case 'card':
    default:
      return (
        <InvitationCard
          hasRsvp={!!saved}
          guestName={saved?.name}
          onRsvp={() => setStage('rsvp')}
          onViewPass={() => setStage('pass')}
        />
      )
  }
}
