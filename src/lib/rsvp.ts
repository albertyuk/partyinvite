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

/**
 * Pure-JS SHA-256 (FIPS 180-4) over a byte array → lowercase hex. Used as the
 * fallback when SubtleCrypto is unavailable (e.g. a non-secure context). It is
 * a real SHA-256, so it produces the EXACT same digest as `crypto.subtle` —
 * the derived code is identical on every device, secure context or not.
 */
function sha256Hex(bytes: Uint8Array): string {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ])
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19

  const l = bytes.length
  const byteLen = (((l + 8) >> 6) + 1) << 6 // smallest multiple of 64 ≥ l + 9
  const buf = new Uint8Array(byteLen)
  buf.set(bytes)
  buf[l] = 0x80
  const bitLen = l * 8
  buf[byteLen - 4] = (bitLen >>> 24) & 0xff
  buf[byteLen - 3] = (bitLen >>> 16) & 0xff
  buf[byteLen - 2] = (bitLen >>> 8) & 0xff
  buf[byteLen - 1] = bitLen & 0xff

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  const w = new Uint32Array(64)
  for (let off = 0; off < byteLen; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4
      w[i] = ((buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3]) >>> 0
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0
  }
  const hex = (x: number) => (x >>> 0).toString(16).padStart(8, '0')
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7)
}

/**
 * Derive a stable, human-readable code from a phone number:
 *   normalize → SHA-256 → first 4 hex chars → "PEN-XXXX" (uppercase).
 * Same phone → same code, on any device, with no network round-trip.
 *
 * Note: 4 hex chars = 16 bits = 65,536 possible codes, so two *different*
 * phones can occasionally share a code (≈2% odds across ~50 guests). This is
 * cosmetic only — the Sheet dedupes on the full phone number, never on the
 * code, so no RSVP is ever lost; the attendant simply confirms by name in the
 * rare case two passes show the same code.
 */
export async function deriveCode(rawPhone: string): Promise<string> {
  const normalized = normalizePhone(rawPhone)
  const data = new TextEncoder().encode(normalized)
  let hex: string
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
      hex = toHex(digest)
    } else {
      hex = sha256Hex(data)
    }
  } catch {
    hex = sha256Hex(data)
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
