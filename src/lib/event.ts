// ─────────────────────────────────────────────────────────────────────────────
// Canonical event facts. Single source of truth — do not duplicate these
// strings elsewhere. The invitation card and the entry pass both read from here
// so the two can never drift out of sync.
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT = {
  title: 'An Independence Day Gathering',
  // Where
  residence: 'The Peninsula Residence',
  unitShort: '12F',
  unitFull: 'Peninsula Residence · 12F',
  venue: 'The Peninsula Shanghai',
  addressLine: 'No. 32 The Bund, Zhongshan East 1st Road',
  addressLineCn: '中山东一路32号',
  city: 'Shanghai',
  // When
  dateLong: 'Saturday, July 4, 2026',
  dateShort: 'Sat · July 4, 2026',
  time: '6:00 PM',
  timeWords: 'Six o’clock in the evening',
  // Door
  admitLine: 'Admit to Peninsula Residence · 12F',
  lobbyInstruction:
    'Present your pass to the attendant in the lobby, who will send you up to the residence.',
  lobbyInstructionShort: 'Present your pass to the attendant in the lobby.',
  // Map target — The Peninsula Shanghai sits at the north end of the Bund,
  // by Garden Bridge over Suzhou Creek. Coordinates verified against the
  // north-Bund waterfront (mid-Bund references sit ~0.01° further south).
  coordinates: { lng: 121.4894, lat: 31.2456 },
} as const

// ICS calendar payload (local Shanghai time, UTC+08). Used by the "add to
// calendar" affordance on the entry pass. Start 18:00, end 22:00 CST.
export const CALENDAR = {
  start: '20260704T180000',
  end: '20260704T220000',
  tz: 'Asia/Shanghai',
} as const
