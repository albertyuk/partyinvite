// ─────────────────────────────────────────────────────────────────────────────
// Art-deco ornamental SVGs, shared across the card, pass, and hero. All draw in
// `currentColor` so a parent can tint them gold or ink. Brand-neutral by design:
// we evoke the Peninsula era, never reproduce its marks.
// ─────────────────────────────────────────────────────────────────────────────

interface SvgProps {
  className?: string
}

/** Abstract deco crest — a rising sunburst within a fine double frame. */
export function Monogram({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="52" height="52" rx="3" strokeWidth="1.4" />
      <rect x="10.5" y="10.5" width="43" height="43" rx="2" strokeWidth="0.8" opacity="0.6" />
      {/* sunburst rays */}
      <g strokeWidth="1.2" strokeLinecap="round">
        <line x1="32" y1="44" x2="32" y2="18" />
        <line x1="32" y1="44" x2="22" y2="20" />
        <line x1="32" y1="44" x2="42" y2="20" />
        <line x1="32" y1="44" x2="14" y2="26" />
        <line x1="32" y1="44" x2="50" y2="26" />
      </g>
      <line x1="18" y1="44" x2="46" y2="44" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="44" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Centered ornamental rule: hairlines tapering to a small faceted lozenge. */
export function DecoDivider({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 240 16"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <line x1="6" y1="8" x2="98" y2="8" strokeWidth="1" />
      <line x1="142" y1="8" x2="234" y2="8" strokeWidth="1" />
      <circle cx="104" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="136" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <path d="M120 2 L126 8 L120 14 L114 8 Z" strokeWidth="1" />
      <path d="M120 5 L123 8 L120 11 L117 8 Z" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  )
}

/** Stepped art-deco corner flourish. Rotate via CSS to place on each corner. */
export function DecoCorner({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M4 4 H30 M4 4 V30" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 9 H22 M9 9 V22" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      <path d="M4 4 L13 13" strokeWidth="0.9" opacity="0.6" />
    </svg>
  )
}

/**
 * Stylized Shanghai skyline — Bund cupolas to the west, Pudong's Lujiazui
 * towers (Oriental Pearl, Jin Mao, the SWFC "bottle opener", Shanghai Tower)
 * across the river. Decorative; fills with currentColor.
 */
export function SkylineSilhouette({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 1200 240"
      className={className}
      fill="currentColor"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      {/* ── West bank: the Bund's neoclassical roofline ── */}
      <rect x="0" y="176" width="150" height="64" />
      <rect x="150" y="158" width="120" height="82" />
      {/* a domed customs-house silhouette */}
      <rect x="196" y="120" width="28" height="42" />
      <path d="M196 120 Q210 96 224 120 Z" />
      <rect x="208" y="84" width="4" height="24" />
      <rect x="270" y="168" width="110" height="72" />
      <rect x="312" y="138" width="26" height="34" />
      <path d="M312 138 L325 118 L338 138 Z" />

      {/* river gap */}

      {/* ── East bank: Lujiazui ── */}
      {/* Oriental Pearl Tower */}
      <rect x="486" y="60" width="6" height="180" />
      <circle cx="489" cy="150" r="20" />
      <circle cx="489" cy="96" r="13" />
      <circle cx="489" cy="60" r="7" />
      <path d="M471 240 L489 150 L507 240 Z" opacity="0.92" />
      {/* a mid-rise cluster */}
      <rect x="540" y="150" width="40" height="90" />
      <rect x="588" y="128" width="34" height="112" />
      {/* Jin Mao Tower — tiered taper */}
      <path d="M660 240 L666 110 L684 110 L690 240 Z" />
      <rect x="671" y="84" width="8" height="30" />
      {/* SWFC — the bottle opener */}
      <path d="M720 240 L734 64 L770 64 L784 240 Z" />
      <path d="M742 64 q16 -14 32 0 l-4 22 q-12 -9 -24 0 Z" fill="#000" opacity="0" />
      <rect x="744" y="58" width="26" height="14" />
      <path d="M748 60 h18 l-3 12 h-12 Z" />
      {/* Shanghai Tower — tallest, gently twisting taper */}
      <path d="M824 240 L838 40 Q846 30 852 40 L862 240 Z" />
      {/* trailing low-rises */}
      <rect x="900" y="170" width="80" height="70" />
      <rect x="990" y="186" width="70" height="54" />
      <rect x="1070" y="160" width="60" height="80" />
      <rect x="1130" y="190" width="70" height="50" />
    </svg>
  )
}
