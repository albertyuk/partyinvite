import { useEffect, useState } from 'react'
import { useContent } from '../content/ContentContext'
import { calendarHref, contributionSummary, makeQrDataUrl } from '../lib/pass'
import type { RsvpRecord } from '../lib/rsvp'
import { DecoDivider, Monogram } from './Ornaments'

interface EntryPassProps {
  record: RsvpRecord
  onEdit: () => void
  onBack: () => void
}

export function EntryPass({ record, onEdit, onBack }: EntryPassProps) {
  const c = useContent()
  const [qr, setQr] = useState<string | null>(null)
  const contribution = contributionSummary(record)

  useEffect(() => {
    let alive = true
    makeQrDataUrl(record.confirmationCode).then((url) => {
      if (alive) setQr(url)
    })
    return () => {
      alive = false
    }
  }, [record.confirmationCode])

  return (
    <main
      className="bg-grain relative flex min-h-svh items-center justify-center px-5 py-10"
      style={{
        backgroundColor: 'var(--forest)',
        backgroundImage:
          'radial-gradient(120% 90% at 50% -10%, #16382c 0%, var(--forest) 48%, var(--midnight) 100%)',
      }}
    >
      <div className="relative w-full max-w-[23rem] animate-rise-in">
        {/* ── Ticket ── */}
        <article
          className="relative overflow-hidden rounded-md shadow-pass"
          style={{ backgroundColor: '#fbf7ee' }}
        >
          {/* Header band */}
          <div
            className="relative flex flex-col items-center px-6 pb-5 pt-6 text-center"
            style={{ backgroundColor: 'var(--forest)' }}
          >
            <Monogram className="h-9 w-9 text-gold-light" />
            <p className="eyebrow mt-3 text-gold-light/85">Admit One</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-luxe text-gold-light/85">
              Peninsula Residence
            </p>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-6 text-center">
            <p className="eyebrow text-gold-ink">This admits</p>
            <h1 className="mt-2 break-words font-display text-[2.1rem] font-medium leading-tight text-forest text-balance">
              {record.name}
            </h1>
            {record.partySize > 1 && (
              <p className="mt-2 inline-block rounded-full border border-gold/40 px-3 py-0.5 text-[0.7rem] uppercase tracking-wide2 text-gold-ink">
                Party of {record.partySize}
              </p>
            )}

            <p className="eyebrow mt-4 text-forest/70">{c.admitLine}</p>

            <DecoDivider className="mx-auto my-4 h-3 w-36 text-gold" />

            {/* When */}
            <div className="flex items-center justify-center gap-4 text-forest">
              <span className="font-display text-lg">{c.dateShort}</span>
              <span className="h-4 w-px bg-gold/50" />
              <span className="font-display text-lg">{c.time}</span>
            </div>

            {/* Bringing */}
            <div className="mt-5 rounded-sm bg-forest/[0.04] px-4 py-3">
              <p className="eyebrow text-gold-ink">Bringing</p>
              <p className="mt-1 text-sm text-forest">{contribution.label}</p>
              {contribution.detail && (
                <p className="mt-0.5 text-xs italic text-ink-soft">
                  “{contribution.detail}”
                </p>
              )}
            </div>
          </div>

          {/* Perforation */}
          <div className="relative h-6">
            <span
              className="absolute left-[-12px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: 'var(--forest)' }}
            />
            <span
              className="absolute right-[-12px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: 'var(--forest)' }}
            />
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 border-t border-dashed border-gold/50" />
          </div>

          {/* Stub — code + QR */}
          <div className="flex flex-col items-center px-6 pb-7 pt-4 text-center">
            {qr && (
              <img
                src={qr}
                width={120}
                height={120}
                alt={`QR code for confirmation ${record.confirmationCode}`}
                className="mb-4 h-28 w-28 rounded-sm border border-gold/25 p-1"
                style={{ backgroundColor: '#fbf7ee' }}
              />
            )}
            <p className="eyebrow text-gold-ink">Confirmation</p>
            <p className="mt-1 font-display text-[2.4rem] font-semibold leading-none tracking-[0.12em] text-forest">
              {record.confirmationCode}
            </p>
            <p className="mt-4 max-w-[18rem] text-[0.72rem] leading-relaxed text-ink-soft">
              {c.lobbyInstruction}
            </p>
          </div>
        </article>

        {/* Below-ticket actions (on the dark ground) */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-center text-[0.7rem] uppercase tracking-wide2 text-gold-light/70">
            Screenshot this pass to show at the door
          </p>
          <div className="flex w-full flex-col gap-2">
            <a
              href={calendarHref(record, c)}
              download="peninsula-residence.ics"
              className="btn-ghost w-full !border-gold/35 !text-gold-light hover:!bg-white/5"
            >
              Add to calendar
            </a>
            <div className="flex gap-2">
              <button
                className="btn-ghost flex-1 !border-gold/35 !text-gold-light hover:!bg-white/5"
                onClick={onEdit}
              >
                Update reply
              </button>
              <button
                className="btn-ghost flex-1 !border-gold/35 !text-gold-light hover:!bg-white/5"
                onClick={onBack}
              >
                Invitation
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
