import { useEffect, useMemo, useState } from 'react'
import { ContentContext } from '../content/ContentContext'
import {
  DEFAULT_CONTENT,
  fetchRemoteContent,
  hasEndpoint,
  loadCachedContent,
  resolve,
  saveContent,
  type EditableContent,
  type SaveOutcome,
} from '../lib/content'
import type { RsvpRecord } from '../lib/rsvp'
import { InvitationCard } from './InvitationCard'
import { EntryPass } from './EntryPass'
import { Monogram } from './Ornaments'

type FieldType = 'text' | 'textarea' | 'date' | 'time'
interface Field {
  k: keyof EditableContent
  label: string
  type?: FieldType
  hint?: string
}
const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: 'Headline',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow', hint: 'small line above the title' },
      { k: 'title', label: 'Title' },
      { k: 'subEyebrow', label: 'Sub-line', hint: 'under the title' },
    ],
  },
  {
    title: 'When',
    fields: [
      { k: 'dateISO', label: 'Date', type: 'date' },
      { k: 'startTime', label: 'Start time', type: 'time' },
      { k: 'endTime', label: 'End time', type: 'time' },
    ],
  },
  {
    title: 'Where',
    fields: [
      { k: 'unitFull', label: 'Residence · unit' },
      { k: 'venue', label: 'Venue' },
      { k: 'addressLine', label: 'Address' },
      { k: 'addressLineCn', label: 'Address (Chinese)' },
    ],
  },
  {
    title: 'Potluck & door',
    fields: [
      { k: 'potluckAsk', label: 'Potluck ask', type: 'textarea' },
      { k: 'lobbyInstructionShort', label: 'Lobby note · short', hint: 'shown on the card' },
      { k: 'lobbyInstruction', label: 'Lobby note · full', type: 'textarea', hint: 'shown on the pass' },
      { k: 'admitLine', label: 'Admit line', hint: 'shown on the pass' },
    ],
  },
  {
    title: 'Button',
    fields: [{ k: 'ctaPrimary', label: 'Primary button text' }],
  },
]

const SAMPLE: RsvpRecord = {
  name: 'Your Guest',
  phone: '8613800138000',
  phoneDisplay: '+86 138 0013 8000',
  contributionType: 'spirits',
  contributionDetail: 'gin, Campari & sweet vermouth',
  partySize: 2,
  confirmationCode: 'PEN-0000',
  timestamp: '2026-07-01T00:00:00.000Z',
}

const TOKEN_KEY = 'peninsula_edit_token'

export function Editor() {
  const [draft, setDraft] = useState<EditableContent>(() => loadCachedContent())
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) ?? '',
  )
  const [status, setStatus] = useState<
    'idle' | 'saving' | SaveOutcome
  >('idle')
  const [preview, setPreview] = useState<'card' | 'pass'>('card')

  // Pull the latest live copy in so edits start from what's published.
  useEffect(() => {
    let alive = true
    fetchRemoteContent().then((c) => {
      if (alive && c) setDraft(c)
    })
    return () => {
      alive = false
    }
  }, [])

  const resolved = useMemo(() => resolve(draft), [draft])
  const set = (k: keyof EditableContent, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setStatus('idle')
  }

  async function onSave() {
    setStatus('saving')
    sessionStorage.setItem(TOKEN_KEY, token)
    const outcome = await saveContent(draft, token)
    setStatus(outcome)
  }

  const dirty = useMemo(
    () =>
      (Object.keys(DEFAULT_CONTENT) as (keyof EditableContent)[]).some(
        (k) => draft[k] !== loadCachedContent()[k],
      ),
    [draft],
  )

  return (
    <div className="min-h-svh bg-ivory" style={{ backgroundColor: 'var(--ivory)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gold/30 bg-ivory/95 backdrop-blur"
        style={{ backgroundColor: 'rgba(248,243,232,0.95)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Monogram className="h-7 w-7 text-gold-deep" />
            <div>
              <p className="eyebrow text-gold-ink">Invitation editor</p>
              <p className="text-xs text-ink-soft">
                Changes go live for everyone on save.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              className="field !w-40 !py-2 text-sm"
              placeholder="Edit password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-label="Edit password"
            />
            <button
              className="btn-primary !min-h-[44px] !px-5"
              onClick={onSave}
              disabled={status === 'saving' || !token}
            >
              {status === 'saving' ? 'Saving…' : 'Publish'}
            </button>
          </div>
        </div>
        {status !== 'idle' && status !== 'saving' && (
          <div className="mx-auto max-w-6xl px-4 pb-2">
            <StatusLine status={status} dirty={dirty} />
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-2">
        {/* Form */}
        <div className="flex flex-col gap-7">
          {!hasEndpoint() && (
            <p className="rounded-sm border border-claret/40 bg-claret/5 px-4 py-3 text-sm text-claret">
              No RSVP endpoint is configured (<code>VITE_RSVP_ENDPOINT</code>), so
              saves can’t be published. Edits here will still preview.
            </p>
          )}
          {SECTIONS.map((section) => (
            <fieldset key={section.title} className="flex flex-col gap-4">
              <legend className="eyebrow mb-1 text-forest/70">
                {section.title}
              </legend>
              {section.fields.map((f) => (
                <label key={f.k} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide2 text-ink-soft">
                    {f.label}
                    {f.hint && (
                      <span className="ml-1 lowercase tracking-normal text-ink-soft/60">
                        — {f.hint}
                      </span>
                    )}
                  </span>
                  {f.type === 'textarea' ? (
                    <textarea
                      className="field min-h-[5rem] resize-y"
                      value={draft[f.k]}
                      onChange={(e) => set(f.k, e.target.value)}
                    />
                  ) : (
                    <input
                      type={f.type ?? 'text'}
                      className="field"
                      value={draft[f.k]}
                      onChange={(e) => set(f.k, e.target.value)}
                    />
                  )}
                </label>
              ))}
              {section.title === 'When' && (
                <p className="rounded-sm bg-forest/[0.04] px-3 py-2 text-sm text-forest">
                  Shows as{' '}
                  <span className="font-display">{resolved.dateLong}</span> ·{' '}
                  <span className="italic">{resolved.timeWords}</span>{' '}
                  <span className="text-ink-soft">({resolved.time})</span>
                </p>
              )}
            </fieldset>
          ))}

          <button
            className="btn-ghost self-start"
            onClick={() => {
              setDraft({ ...DEFAULT_CONTENT })
              setStatus('idle')
            }}
          >
            Reset to original wording
          </button>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow text-forest/70">Live preview</p>
            <div className="flex gap-1 rounded-sm border border-gold/30 p-0.5">
              {(['card', 'pass'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreview(p)}
                  className={`rounded-[2px] px-3 py-1 text-xs uppercase tracking-wide2 transition ${
                    preview === p
                      ? 'bg-forest text-gold-light'
                      : 'text-forest/70 hover:bg-forest/5'
                  }`}
                >
                  {p === 'card' ? 'Invitation' : 'Pass'}
                </button>
              ))}
            </div>
          </div>
          {/* Neutralize the full-screen min-height so the preview sits inline. */}
          <div className="overflow-hidden rounded-md border border-gold/30 shadow-card [&_main]:!min-h-0 [&_main]:!py-8">
            <ContentContext.Provider value={resolved}>
              {preview === 'card' ? (
                <div className="pointer-events-none">
                  <InvitationCard
                    hasRsvp={false}
                    onRsvp={() => {}}
                    onViewPass={() => {}}
                  />
                </div>
              ) : (
                <div className="pointer-events-none">
                  <EntryPass record={SAMPLE} onEdit={() => {}} onBack={() => {}} />
                </div>
              )}
            </ContentContext.Provider>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusLine({
  status,
  dirty,
}: {
  status: 'idle' | 'saving' | SaveOutcome
  dirty: boolean
}) {
  if (status === 'saved')
    return (
      <p className="text-sm text-forest-700">
        ✓ Published{dirty ? '' : ''} — live for everyone now.
      </p>
    )
  if (status === 'unconfirmed')
    return (
      <p className="text-sm text-claret">
        Couldn’t confirm the save — check your edit password and try again. (If
        the password is right, the network may be slow; wait a moment and retry.)
      </p>
    )
  if (status === 'no-endpoint')
    return (
      <p className="text-sm text-claret">
        Saving isn’t configured (no RSVP endpoint). Edits preview only.
      </p>
    )
  return null
}
