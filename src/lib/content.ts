// ─────────────────────────────────────────────────────────────────────────────
// Editable site content — the words and the date/time the host can change from
// the live editor (yukinvite.com/?edit) without a redeploy.
//
// Reliability contract:
//   • DEFAULT_CONTENT (below) always renders instantly — the bundled fallback.
//   • The last-seen edit is cached in localStorage and used immediately on load.
//   • The live copy is fetched in the background (JSONP) and merged in when it
//     arrives. A missing endpoint, offline device, or malformed response simply
//     leaves the defaults in place — the invitation can never break.
// ─────────────────────────────────────────────────────────────────────────────

import { CALENDAR, EVENT } from './event'

/** The fields a host can edit. Dates are structured; display strings derive. */
export interface EditableContent {
  // Invitation card — headings & prose
  eyebrow: string
  title: string
  subEyebrow: string
  // Where
  unitFull: string
  venue: string
  addressLine: string
  addressLineCn: string
  // Potluck + door
  potluckAsk: string
  lobbyInstruction: string
  lobbyInstructionShort: string
  admitLine: string
  // Call to action
  ctaPrimary: string
  // When (structured → display strings are derived)
  dateISO: string // YYYY-MM-DD
  startTime: string // HH:MM (24h)
  endTime: string // HH:MM (24h)
}

/** Resolved content: editable fields + auto-derived date/time display strings. */
export interface ResolvedContent extends EditableContent {
  dateLong: string // "Saturday, July 4, 2026"
  dateShort: string // "Sat · July 4, 2026"
  time: string // "6:00 PM"
  timeWords: string // "Six o’clock in the evening"
  calStart: string // ICS local time: 20260704T180000
  calEnd: string
  tz: string
}

export const DEFAULT_CONTENT: EditableContent = {
  eyebrow: 'The pleasure of your company',
  title: EVENT.title,
  subEyebrow: 'On the Bund · the Fourth of July',
  unitFull: EVENT.unitFull,
  venue: EVENT.venue,
  addressLine: EVENT.addressLine,
  addressLineCn: EVENT.addressLineCn,
  potluckAsk:
    'An evening shared in kind. We ask each guest to bring a dish for the table, or a mix of spirits for the cocktail bar — whichever suits your hand.',
  lobbyInstruction: EVENT.lobbyInstruction,
  lobbyInstructionShort: EVENT.lobbyInstructionShort,
  admitLine: EVENT.admitLine,
  ctaPrimary: 'Reply & receive your pass',
  dateISO: '2026-07-04',
  startTime: '18:00',
  endTime: '22:00',
}

// ── Date / time derivation ───────────────────────────────────────────────────

const HOUR_WORDS = [
  'Twelve', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
  'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
]

function partOfDay(h: number): string {
  if (h < 5) return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

function twoDigit(n: number): string {
  return String(n).padStart(2, '0')
}

/** "18:00" → { h: 18, m: 0 }; tolerant of bad input. */
function parseTime(t: string): { h: number; m: number } {
  const [hh, mm] = (t || '').split(':')
  const h = Math.min(23, Math.max(0, parseInt(hh, 10) || 0))
  const m = Math.min(59, Math.max(0, parseInt(mm, 10) || 0))
  return { h, m }
}

function to12h(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${twoDigit(m)} ${period}`
}

/**
 * Turn the structured date/time into the display strings the card and pass use.
 * Uses a UTC-noon Date so weekday/month never drift across the viewer's timezone.
 * Any parse failure falls back to the original event.ts strings.
 */
export function resolve(c: EditableContent): ResolvedContent {
  let dateLong: string = EVENT.dateLong
  let dateShort: string = EVENT.dateShort
  let time: string = EVENT.time
  let timeWords: string = EVENT.timeWords
  let calStart: string = CALENDAR.start
  let calEnd: string = CALENDAR.end

  try {
    const [y, mo, d] = c.dateISO.split('-').map((n) => parseInt(n, 10))
    if (y && mo && d) {
      const date = new Date(Date.UTC(y, mo - 1, d, 12))
      const long = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: 'UTC',
      })
      const wkShort = new Intl.DateTimeFormat('en-US', {
        weekday: 'short', timeZone: 'UTC',
      })
      const monthLong = new Intl.DateTimeFormat('en-US', {
        month: 'long', timeZone: 'UTC',
      })
      dateLong = long.format(date)
      dateShort = `${wkShort.format(date)} · ${monthLong.format(date)} ${d}, ${y}`

      const { h, m } = parseTime(c.startTime)
      time = to12h(h, m)
      timeWords =
        m === 0
          ? `${HOUR_WORDS[h % 12 === 0 ? 12 : h % 12]} o’clock in the ${partOfDay(h)}`
          : `${time} in the ${partOfDay(h)}`

      const end = parseTime(c.endTime)
      const ymd = `${y}${twoDigit(mo)}${twoDigit(d)}`
      calStart = `${ymd}T${twoDigit(h)}${twoDigit(m)}00`
      calEnd = `${ymd}T${twoDigit(end.h)}${twoDigit(end.m)}00`
    }
  } catch {
    /* keep the bundled fallbacks */
  }

  return {
    ...c,
    dateLong,
    dateShort,
    time,
    timeWords,
    calStart,
    calEnd,
    tz: CALENDAR.tz,
  }
}

// ── Local cache + defaults merge ─────────────────────────────────────────────

const CACHE_KEY = 'peninsula_content'

/** Merge stored (possibly partial) content over the defaults. */
export function withDefaults(stored: Partial<EditableContent> | null): EditableContent {
  return { ...DEFAULT_CONTENT, ...(stored ?? {}) }
}

export function loadCachedContent(): EditableContent {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return withDefaults(raw ? (JSON.parse(raw) as Partial<EditableContent>) : null)
  } catch {
    return { ...DEFAULT_CONTENT }
  }
}

export function cacheContent(content: EditableContent): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  } catch {
    /* storage unavailable — fine */
  }
}

// ── Remote read (JSONP) + write (token-gated) ────────────────────────────────

const ENDPOINT = (import.meta.env.VITE_RSVP_ENDPOINT ?? '').trim()

export function hasEndpoint(): boolean {
  return ENDPOINT.length > 0
}

/**
 * Apps Script web apps don't send CORS headers, so a cross-origin JSON GET can't
 * be read. JSONP (a <script> tag) sidesteps that for this public, read-only copy.
 */
function jsonp<T>(url: string, timeoutMs = 9000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cb = `__pen_cb_${Math.floor(Math.random() * 1e9)}`
    const script = document.createElement('script')
    let settled = false
    const w = window as unknown as Record<string, unknown>
    const cleanup = () => {
      delete w[cb]
      script.remove()
      window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => {
      if (!settled) { settled = true; cleanup(); reject(new Error('timeout')) }
    }, timeoutMs)
    w[cb] = (data: T) => {
      if (settled) return
      settled = true; cleanup(); resolve(data)
    }
    script.onerror = () => {
      if (!settled) { settled = true; cleanup(); reject(new Error('jsonp error')) }
    }
    const sep = url.includes('?') ? '&' : '?'
    script.src = `${url}${sep}callback=${cb}`
    document.head.appendChild(script)
  })
}

/** Fetch the live content. Returns null if absent/unreachable/malformed. */
export async function fetchRemoteContent(): Promise<EditableContent | null> {
  if (!ENDPOINT) return null
  try {
    const res = await jsonp<{ ok?: boolean; content?: Partial<EditableContent> | null }>(
      `${ENDPOINT}?type=content`,
    )
    if (res && res.content && typeof res.content === 'object') {
      return withDefaults(res.content)
    }
    return null
  } catch {
    return null
  }
}

export type SaveOutcome = 'saved' | 'unconfirmed' | 'no-endpoint'

/**
 * Save edited content. The POST is a simple request (text/plain) so it lands
 * even though we can't read its cross-origin response; we then re-fetch and
 * compare to confirm. A mismatch usually means a wrong edit password.
 */
export async function saveContent(
  content: EditableContent,
  token: string,
): Promise<SaveOutcome> {
  if (!ENDPOINT) return 'no-endpoint'
  const payload = JSON.stringify({ kind: 'content', token, content })
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow',
    })
  } catch {
    try {
      await fetch(ENDPOINT, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload, redirect: 'follow',
      })
    } catch {
      /* fall through to verify */
    }
  }
  // Give Apps Script a moment, then confirm the write took.
  await new Promise((r) => window.setTimeout(r, 900))
  const remote = await fetchRemoteContent()
  if (remote && sameContent(remote, content)) {
    cacheContent(content)
    return 'saved'
  }
  return 'unconfirmed'
}

function sameContent(a: EditableContent, b: EditableContent): boolean {
  const keys = Object.keys(DEFAULT_CONTENT) as (keyof EditableContent)[]
  return keys.every((k) => (a[k] ?? '') === (b[k] ?? ''))
}
