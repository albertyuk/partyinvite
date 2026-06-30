import { useRef, useState } from 'react'
import {
  deriveCode,
  isValidPhone,
  normalizePhone,
  type ContributionType,
  type RsvpRecord,
} from '../lib/rsvp'
import { DecoDivider, Monogram } from './Ornaments'

interface RsvpFormProps {
  initial?: RsvpRecord | null
  onSubmit: (record: RsvpRecord) => void
  onBack: () => void
}

export function RsvpForm({ initial, onSubmit, onBack }: RsvpFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phoneDisplay ?? '')
  const [type, setType] = useState<ContributionType>(
    initial?.contributionType ?? 'dish',
  )
  const [detail, setDetail] = useState(initial?.contributionDetail ?? '')
  const [partySize, setPartySize] = useState(initial?.partySize ?? 1)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  const detailPlaceholder =
    type === 'spirits'
      ? 'e.g. gin, Campari & sweet vermouth — for Negronis'
      : 'e.g. saffron paella, enough for ten'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const nextErrors: { name?: string; phone?: string } = {}
    if (!name.trim()) nextErrors.name = 'Your name, please.'
    if (!isValidPhone(phone))
      nextErrors.phone = 'A reachable phone number, please.'

    setErrors(nextErrors)
    if (nextErrors.name) {
      nameRef.current?.focus()
      return
    }
    if (nextErrors.phone) {
      phoneRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      const confirmationCode = await deriveCode(phone)
      const record: RsvpRecord = {
        name: name.trim(),
        phone: normalizePhone(phone),
        phoneDisplay: phone.trim(),
        contributionType: type,
        contributionDetail: detail.trim(),
        partySize: Math.max(1, Math.min(20, Math.round(partySize) || 1)),
        confirmationCode,
        timestamp: new Date().toISOString(),
      }
      onSubmit(record)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center px-5 py-10">
      <article
        className="relative w-full max-w-[26rem] rounded-sm border border-gold/40 bg-ivory px-7 pb-9 pt-9 shadow-card animate-rise-in"
        style={{ backgroundColor: 'var(--ivory)' }}
      >
        <div className="pointer-events-none absolute inset-[10px] rounded-[2px] border border-gold/25" />

        <form className="relative flex flex-col" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col items-center text-center">
            <Monogram className="h-9 w-9 text-gold-deep" />
            <p className="eyebrow mt-4 text-gold-ink/80">Kindly reply</p>
            <h1 className="mt-2 font-display text-[1.9rem] font-medium leading-tight text-forest">
              Reserve your place
            </h1>
            <DecoDivider className="my-5 h-3 w-40 text-gold" />
          </div>

          {/* Name */}
          <label htmlFor="rsvp-name" className="eyebrow mb-2 text-forest/70">
            Name
          </label>
          <input
            id="rsvp-name"
            ref={nameRef}
            type="text"
            autoComplete="name"
            className={`field ${errors.name ? 'field-invalid' : ''}`}
            placeholder="Your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
            }}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'rsvp-name-err' : undefined}
          />
          {errors.name && (
            <p id="rsvp-name-err" className="mt-1.5 text-xs text-claret">
              {errors.name}
            </p>
          )}

          {/* Phone */}
          <label htmlFor="rsvp-phone" className="eyebrow mb-2 mt-5 text-forest/70">
            Phone
          </label>
          <input
            id="rsvp-phone"
            ref={phoneRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`field ${errors.phone ? 'field-invalid' : ''}`}
            placeholder="e.g. +86 138 0000 0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }))
            }}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'rsvp-phone-err' : 'rsvp-phone-hint'}
          />
          {errors.phone ? (
            <p id="rsvp-phone-err" className="mt-1.5 text-xs text-claret">
              {errors.phone}
            </p>
          ) : (
            <p id="rsvp-phone-hint" className="mt-1.5 text-xs text-ink-soft/70">
              Your number is the host’s only — it stays private to her list.
            </p>
          )}

          {/* Contribution type — segmented control */}
          <fieldset className="mt-5">
            <legend className="eyebrow mb-2 text-forest/70">
              You’ll be bringing
            </legend>
            <div
              className="grid grid-cols-2 gap-2 rounded-sm border border-gold/30 p-1"
              role="radiogroup"
              aria-label="What you'll be bringing"
            >
              {(
                [
                  { key: 'dish', label: 'A dish' },
                  { key: 'spirits', label: 'Spirits' },
                ] as const
              ).map((opt) => {
                const active = type === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(opt.key)}
                    className={`min-h-[44px] rounded-[2px] text-sm font-medium uppercase tracking-[0.16em] transition ${
                      active
                        ? 'bg-forest text-gold-light shadow-inner'
                        : 'text-forest/70 hover:bg-forest/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Contribution detail */}
          <label htmlFor="rsvp-detail" className="eyebrow mb-2 mt-5 text-forest/70">
            A note on what you’ll bring{' '}
            <span className="lowercase tracking-normal text-ink-soft/60">
              (optional)
            </span>
          </label>
          <input
            id="rsvp-detail"
            type="text"
            className="field"
            placeholder={detailPlaceholder}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />

          {/* Party size — stepper */}
          <div className="mt-5 flex items-center justify-between">
            <span className="eyebrow text-forest/70">In your party</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 text-lg text-gold-ink transition hover:bg-gold/10 disabled:opacity-40"
                disabled={partySize <= 1}
              >
                –
              </button>
              <span
                className="w-8 text-center font-display text-xl text-forest"
                aria-live="polite"
              >
                {partySize}
              </span>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => setPartySize((n) => Math.min(20, n + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 text-lg text-gold-ink transition hover:bg-gold/10 disabled:opacity-40"
                disabled={partySize >= 20}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <button
            type="submit"
            className="btn-primary mt-8 w-full"
            disabled={submitting}
          >
            {submitting ? 'Issuing your pass…' : 'Receive your entry pass'}
          </button>
          <button
            type="button"
            className="mt-3 text-xs uppercase tracking-[0.16em] text-ink-soft/70 transition hover:text-gold-ink"
            onClick={onBack}
          >
            ← Back to the invitation
          </button>
        </form>
      </article>
    </main>
  )
}
