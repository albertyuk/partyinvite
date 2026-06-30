import { EVENT } from '../lib/event'
import { DecoCorner, DecoDivider, Monogram, SkylineSilhouette } from './Ornaments'

interface InvitationCardProps {
  hasRsvp: boolean
  guestName?: string
  onRsvp: () => void
  onViewPass: () => void
}

export function InvitationCard({
  hasRsvp,
  guestName,
  onRsvp,
  onViewPass,
}: InvitationCardProps) {
  const firstName = guestName?.trim().split(/\s+/)[0]

  return (
    <main className="relative flex min-h-svh items-center justify-center px-5 py-10">
      <article
        className="bg-grain relative w-full max-w-[26rem] overflow-hidden rounded-sm border border-gold/40 bg-ivory px-7 pb-9 pt-10 shadow-card animate-rise-in"
        style={{ backgroundColor: 'var(--ivory)' }}
      >
        {/* hairline inner frame + deco corners */}
        <div className="pointer-events-none absolute inset-[10px] rounded-[2px] border border-gold/30" />
        <DecoCorner className="pointer-events-none absolute left-1.5 top-1.5 h-7 w-7 text-gold/70" />
        <DecoCorner className="pointer-events-none absolute right-1.5 top-1.5 h-7 w-7 rotate-90 text-gold/70" />
        <DecoCorner className="pointer-events-none absolute bottom-1.5 right-1.5 h-7 w-7 rotate-180 text-gold/70" />
        <DecoCorner className="pointer-events-none absolute bottom-1.5 left-1.5 h-7 w-7 -rotate-90 text-gold/70" />

        <div className="relative flex flex-col items-center text-center">
          <Monogram className="h-11 w-11 text-gold-deep" />

          <p className="eyebrow mt-5 text-gold-ink">
            The pleasure of your company
          </p>

          <h1 className="mt-3 break-words font-display text-[2.35rem] font-medium leading-[1.05] text-forest text-balance">
            {EVENT.title}
          </h1>

          <p className="eyebrow mt-3 text-forest/70">
            On the Bund · the Fourth of July
          </p>

          <DecoDivider className="my-6 h-3 w-44 text-gold" />

          {/* Where */}
          <h2 className="font-display text-[1.45rem] font-medium text-forest">
            {EVENT.unitFull}
          </h2>
          <p className="eyebrow mt-2 text-gold-ink">{EVENT.venue}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {EVENT.addressLine}
            <br />
            <span className="text-ink-soft/80">{EVENT.addressLineCn}</span>
          </p>

          {/* When — flanked by gold dots */}
          <div className="mt-6 flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-gold" />
            <div>
              <p className="font-display text-lg text-forest">{EVENT.dateLong}</p>
              <p className="mt-0.5 text-sm italic text-ink-soft">
                {EVENT.timeWords}
              </p>
            </div>
            <span className="h-1 w-1 rounded-full bg-gold" />
          </div>

          {/* Potluck ask */}
          <p className="mt-6 max-w-[22rem] text-[0.95rem] leading-relaxed text-ink text-balance">
            An evening shared in kind. We ask each guest to bring{' '}
            <span className="text-gold-ink">a dish for the table</span> or{' '}
            <span className="text-gold-ink">a mix of spirits for the cocktail bar</span>
            {' '}— whichever suits your hand.
          </p>

          {/* Door note */}
          <p className="mt-5 text-xs leading-relaxed text-ink-soft/85">
            {EVENT.lobbyInstructionShort}
          </p>

          {/* CTA */}
          <div className="mt-7 flex w-full flex-col items-center gap-3">
            {hasRsvp ? (
              <>
                <button className="btn-primary w-full" onClick={onViewPass}>
                  View your entry pass
                </button>
                <button className="btn-ghost w-full" onClick={onRsvp}>
                  Update your reply
                </button>
                {firstName && (
                  <p className="mt-1 text-xs text-ink-soft/80">
                    Welcome back, {firstName}.
                  </p>
                )}
              </>
            ) : (
              <button className="btn-primary w-full" onClick={onRsvp}>
                Reply &amp; receive your pass
              </button>
            )}
          </div>
        </div>

        {/* faint skyline along the foot of the card */}
        <SkylineSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-forest/[0.06]" />
      </article>
    </main>
  )
}
