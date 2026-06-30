// ─────────────────────────────────────────────────────────────────────────────
// Entry-pass helpers: QR generation, human-readable contribution summaries,
// and an "add to calendar" .ics payload. All derivable offline from the
// RsvpRecord — the pass never needs the network to render.
// ─────────────────────────────────────────────────────────────────────────────

import QRCode from 'qrcode'
import type { ResolvedContent } from './content'
import type { RsvpRecord } from './rsvp'

/**
 * Render the confirmation code as a QR data-URL. Encodes just the code (what
 * the attendant matches against the Sheet) in high-contrast ink-on-ivory so a
 * phone screen scans cleanly. Returns null on any failure — the printed code
 * is always legible by eye, so the QR is a nicety, never load-bearing.
 */
export async function makeQrDataUrl(code: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
      color: { dark: '#0E2A23', light: '#F8F3E8' },
    })
  } catch {
    return null
  }
}

/** "A dish to share" / "A mix of spirits for the bar", with optional detail. */
export function contributionSummary(record: RsvpRecord): {
  label: string
  detail: string
} {
  const label =
    record.contributionType === 'spirits'
      ? 'A mix of spirits for the cocktail bar'
      : 'A dish to share at the table'
  return { label, detail: record.contributionDetail.trim() }
}

/** Escape a TEXT value per RFC 5545 (backslash, semicolon, comma, newlines). */
function ics(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Build a downloadable .ics so guests can drop the evening into their calendar. */
export function calendarHref(record: RsvpRecord, c: ResolvedContent): string {
  const location = `${c.venue}, ${c.addressLine}, ${c.unitFull}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Peninsula Residence//Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${record.confirmationCode}@peninsula-residence`,
    `SUMMARY:${ics(c.title)}`,
    `DTSTART;TZID=${c.tz}:${c.calStart}`,
    `DTEND;TZID=${c.tz}:${c.calEnd}`,
    `LOCATION:${ics(location)}`,
    `DESCRIPTION:${ics(`${c.lobbyInstruction} Your code: ${record.confirmationCode}.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}
