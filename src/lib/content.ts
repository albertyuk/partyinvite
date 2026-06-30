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

function periodPhrase(h: number): string {
  if (h < 5) return 'at night'
  if (h < 12) return 'in the morning'
  if (h < 17) return 'in the afternoon'
  if (h < 21) return 'in the evening'
  return 'at night'
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
    const date = new Date(Date.UTC(y, mo - 1, d, 12))
    // Reject impossible dates (e.g. 2026-13-40, 2026-02-30) so we fall back
    // instead of silently rolling over to the wrong day.
    const valid =
      !!y && !!mo && !!d &&
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === mo - 1 &&
      date.getUTCDate() === d
    if (valid) {
      const fmt = (opts: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(date)
      dateLong = fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      // Derive every part from the normalized Date so it can't disagree with dateLong.
      dateShort = `${fmt({ weekday: 'short' })} · ${fmt({ month: 'long' })} ${date.getUTCDate()}, ${date.getUTCFullYear()}`

      const { h, m } = parseTime(c.startTime)
      time = to12h(h, m)
      timeWords =
        m === 0
          ? `${HOUR_WORDS[h % 12 === 0 ? 12 : h % 12]} o’clock ${periodPhrase(h)}`
          : `${time} ${periodPhrase(h)}`

      const end = parseTime(c.endTime)
      const overnight = end.h * 60 + end.m <= h * 60 + m
      const endDate = new Date(Date.UTC(y, mo - 1, d + (overnight ? 1 : 0), 12))
      const ymd = `${y}${twoDigit(mo)}${twoDigit(d)}`
      const endYmd = `${endDate.getUTCFullYear()}${twoDigit(endDate.getUTCMonth() + 1)}${twoDigit(endDate.getUTCDate())}`
      calStart = `${ymd}T${twoDigit(h)}${twoDigit(m)}00`
      calEnd = `${endYmd}T${twoDigit(end.h)}${twoDigit(end.m)}00`
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

/**
 * Merge stored content over the defaults, copying ONLY known keys and ONLY when
 * the stored value is actually a string. A malformed remote payload (a null
 * title, a number, an object, an injected `__proto__`) can never reach the UI —
 * the bundled default is kept for that field. This is what guarantees the
 * invitation can't white-screen on bad content.
 */
export function withDefaults(stored: Partial<EditableContent> | null): EditableContent {
  const out: EditableContent = { ...DEFAULT_CONTENT }
  if (stored && typeof stored === 'object') {
    const src = stored as Record<string, unknown>
    for (const k of Object.keys(DEFAULT_CONTENT) as (keyof EditableContent)[]) {
      if (typeof src[k] === 'string') out[k] = src[k] as string
    }
  }
  return out
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

interface ContentResponse {
  ok?: boolean
  content?: Partial<EditableContent> | null
  rev?: string
}

async function fetchContentResponse(): Promise<ContentResponse | null> {
  if (!ENDPOINT) return null
  try {
    return await jsonp<ContentResponse>(`${ENDPOINT}?type=content`)
  } catch {
    return null
  }
}

/** Fetch the live content. Returns null if absent/unreachable/malformed. */
export async function fetchRemoteContent(): Promise<EditableContent | null> {
  const res = await fetchContentResponse()
  if (res && res.content && typeof res.content === 'object') {
    return withDefaults(res.content)
  }
  return null
}

export type SaveOutcome = 'saved' | 'unconfirmed' | 'no-endpoint'

/**
 * Save edited content. The POST is a fire-and-forget simple request — its
 * cross-origin response can't be read, and a `cors`-mode attempt always rejects
 * against an Apps Script /exec redirect, so we use `no-cors` directly.
 *
 * To CONFIRM the write actually landed (and wasn't silently rejected by a wrong
 * password), each save carries a unique `rev`; we then poll the content endpoint
 * until that exact rev comes back. Equality of content alone isn't enough —
 * a rejected write would still leave the old content equal to the draft if it
 * happened to match — so the rev is the authoritative proof THIS save persisted.
 */
export async function saveContent(
  content: EditableContent,
  token: string,
): Promise<SaveOutcome> {
  if (!ENDPOINT) return 'no-endpoint'
  const rev = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
  const payload = JSON.stringify({ kind: 'content', token, content, rev })
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow',
    })
  } catch {
    /* request may still have been sent; confirm by polling below */
  }
  // Poll for our rev with backoff — tolerates an Apps Script cold start without
  // a false 'unconfirmed', and never reports success on a rejected write.
  for (const delay of [400, 800, 1600]) {
    await new Promise((r) => window.setTimeout(r, delay))
    const res = await fetchContentResponse()
    if (res && res.rev === rev) {
      cacheContent(content)
      return 'saved'
    }
  }
  return 'unconfirmed'
}
