// ─────────────────────────────────────────────────────────────────────────────
// RSVP core: deterministic confirmation codes, local persistence, and a
// best-effort write to the host's Google Sheet (via Apps Script).
//
// Design contract (see hand-off §7):
//   • The confirmation code is derived CLIENT-SIDE from the phone number, so the
//     same phone yields the same pass on any device with zero server reads.
//   • The pass renders from local data; the Sheet write is best-effort and must
//     never block or break the guest's experience.
// ─────────────────────────────────────────────────────────────────────────────

export type ContributionType = 'dish' | 'spirits'

export interface RsvpRecord {
  name: string
  /** Canonical (digits-only) phone — the dedupe + code-derivation key. */
  phone: string
  /** Exactly as the guest typed it, for display + the Sheet. */
  phoneDisplay: string
  contributionType: ContributionType
  contributionDetail: string
  partySize: number
  confirmationCode: string
  /** ISO timestamp of when the pass was first issued on this device. */
  timestamp: string
}

const STORAGE_KEY = 'peninsula_rsvp'

// ── Phone normalization ──────────────────────────────────────────────────────

/**
 * Reduce a typed phone number to a canonical, digits-only key used for both
 * dedupe and code derivation. A leading "00" international prefix is collapsed
 * so "+86…" and "0086…" hash identically.
 */
export function normalizePhone(raw: string): string {
  let digits = (raw || '').replace(/[^\d]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  return digits
}

/** A pragmatic check — enough digits to be a real number, not OTP-grade. */
export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw).length >= 7
}

// ── Deterministic confirmation code ──────────────────────────────────────────

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Deterministic 32-bit FNV-1a fallback for environments without SubtleCrypto. */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * Derive a stable, human-readable code from a phone number:
 *   normalize → SHA-256 → first 4 hex chars → "PEN-XXXX" (uppercase).
 * Same phone → same code, on any device, with no network round-trip.
 */
export async function deriveCode(rawPhone: string): Promise<string> {
  const normalized = normalizePhone(rawPhone)
  let hex: string
  try {
    if (globalThis.crypto?.subtle) {
      const data = new TextEncoder().encode(normalized)
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
      hex = toHex(digest)
    } else {
      hex = fnv1aHex(normalized)
    }
  } catch {
    hex = fnv1aHex(normalized)
  }
  return `PEN-${hex.slice(0, 4).toUpperCase()}`
}

// ── Local persistence ────────────────────────────────────────────────────────

export function loadRsvp(): RsvpRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RsvpRecord>
    if (!parsed || !parsed.confirmationCode || !parsed.name) return null
    // Backfill fields that may be missing from an older saved shape.
    return {
      name: parsed.name,
      phone: parsed.phone ?? '',
      phoneDisplay: parsed.phoneDisplay ?? parsed.phone ?? '',
      contributionType: parsed.contributionType === 'spirits' ? 'spirits' : 'dish',
      contributionDetail: parsed.contributionDetail ?? '',
      partySize: Number(parsed.partySize) > 0 ? Number(parsed.partySize) : 1,
      confirmationCode: parsed.confirmationCode,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveRsvp(record: RsvpRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    /* storage may be unavailable (private mode) — the pass still renders. */
  }
}

export function clearRsvp(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* no-op */
  }
}

// ── Best-effort Sheet write ──────────────────────────────────────────────────

export type SubmitStatus = 'ok' | 'sent' | 'skipped' | 'failed'

export interface SubmitResult {
  status: SubmitStatus
  row?: number
  error?: string
}

const ENDPOINT = (import.meta.env.VITE_RSVP_ENDPOINT ?? '').trim()

/**
 * Write the RSVP to the Sheet. Sent as a "simple request" (text/plain) so the
 * browser skips the CORS preflight that Apps Script cannot answer. On any
 * failure, retries once as a fire-and-forget `no-cors` POST — the row still
 * lands in the Sheet even though we can't read the response.
 *
 * Never throws: the pass is already on screen by the time this resolves.
 */
export async function submitRsvp(record: RsvpRecord): Promise<SubmitResult> {
  if (!ENDPOINT) return { status: 'skipped' }

  const payload = JSON.stringify({
    timestamp: record.timestamp,
    name: record.name,
    phone: record.phoneDisplay || record.phone,
    contribution_type: record.contributionType,
    contribution_detail: record.contributionDetail,
    party_size: record.partySize,
    confirmation_code: record.confirmationCode,
  })

  // Attempt 1 — readable simple request.
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow',
    })
    try {
      const data = await res.json()
      if (data && data.ok) return { status: 'ok', row: data.row }
      return { status: 'sent' }
    } catch {
      // Opaque/blocked body but the request itself succeeded.
      return { status: 'sent' }
    }
  } catch {
    // Attempt 2 — fire-and-forget; opaque response, but the row still appends.
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        redirect: 'follow',
      })
      return { status: 'sent' }
    } catch (err) {
      return { status: 'failed', error: String(err) }
    }
  }
}

export function hasEndpoint(): boolean {
  return ENDPOINT.length > 0
}
