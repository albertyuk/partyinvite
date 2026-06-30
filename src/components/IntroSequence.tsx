import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { EVENT } from '../lib/event'
import { Monogram, SkylineSilhouette } from './Ornaments'

interface IntroSequenceProps {
  onComplete: () => void
}

const TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN ?? '').trim()

// A single continuous descent: a wide view of the whole Shanghai region, then
// one unbroken push down onto The Peninsula. There is intentionally NO mid-point
// stop, so the camera never decelerates and re-accelerates — it's one smooth,
// gently accelerating move. Captions change mid-flight on timers.
const CITY = { center: [121.47, 31.235] as [number, number], zoom: 8.7 }
const FLIGHT = {
  // Land on The Peninsula (verified coords) looking ESE, so the building sits
  // centre-frame with the Huangpu and the Pudong skyline (Oriental Pearl) beyond.
  center: [EVENT.coordinates.lng, EVENT.coordinates.lat] as [number, number],
  zoom: 16.7,
  pitch: 58,
  bearing: 116,
  duration: 9000,
  curve: 1,
}
const HOLD_MS = 1100
// Mid-flight caption changes, as fractions of the flight duration.
const CAPTIONS: Array<{ at: number; label: string }> = [
  { at: 0.5, label: 'The Bund' },
  { at: 0.84, label: 'The Peninsula' },
]

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const doneRef = useRef(false)
  const timers = useRef<number[]>([])

  const reduced = prefersReducedMotion()
  // Static hero when motion is off or there's no Mapbox token to fly with.
  const [mode, setMode] = useState<'map' | 'static'>(
    !TOKEN || reduced ? 'static' : 'map',
  )
  const [label, setLabel] = useState('Shanghai')
  const [fading, setFading] = useState(false)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    // Halt any in-flight flyTo so no further beat runs during the dissolve.
    try {
      mapRef.current?.stop()
    } catch {
      /* no-op */
    }
    setFading(true)
    const t = window.setTimeout(onComplete, 650)
    timers.current.push(t)
  }

  // A failed map (bad token, WebGL off, offline) reveals the designed static
  // hero — per spec, never a blank screen and never a silent skip to the card.
  function fallBackToStatic() {
    if (doneRef.current) return
    setMode('static')
  }

  // ── Map flight ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'map') return
    if (!containerRef.current) return

    let loaded = false
    let map: mapboxgl.Map

    try {
      mapboxgl.accessToken = TOKEN
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: CITY.center,
        zoom: CITY.zoom,
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: true,
        fadeDuration: 280,
        maxPitch: 75,
        dragRotate: false,
      })
    } catch {
      // WebGL unavailable etc. — show the designed static hero instead.
      fallBackToStatic()
      return
    }
    mapRef.current = map

    // A pre-load auth/style error (invalid or unauthorized token) → static hero.
    map.on('error', (e) => {
      const status = (e as { error?: { status?: number } })?.error?.status
      if (!loaded && (status === 401 || status === 403)) fallBackToStatic()
    })

    // If the style/tiles never load (bad token, offline), show the static hero.
    const loadGuard = window.setTimeout(() => {
      if (!loaded) fallBackToStatic()
    }, 6000)
    timers.current.push(loadGuard)

    // Absolute safety net: never strand the guest on the intro.
    const hardStop = window.setTimeout(finish, 16000)
    timers.current.push(hardStop)

    map.on('load', () => {
      loaded = true
      window.clearTimeout(loadGuard)

      // Raise 3D building extrusions for the final push.
      try {
        const style = map.getStyle()
        const labelLayer = style?.layers?.find(
          (l) => l.type === 'symbol' && (l.layout as never)?.['text-field'],
        )?.id
        map.addLayer(
          {
            id: 'deco-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 13,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0,
                '#2a3f37',
                120,
                '#3c574b',
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13.5,
                0,
                16.5,
                ['get', 'height'],
              ],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.9,
            },
          },
          labelLayer,
        )
      } catch {
        /* extrusions are a nicety; ignore if the style lacks the source. */
      }

      // Atmospheric haze for depth.
      try {
        map.setFog({
          color: 'rgb(186, 200, 205)',
          'high-color': 'rgb(36, 60, 74)',
          'horizon-blend': 0.2,
          'space-color': 'rgb(10, 23, 34)',
          'star-intensity': 0,
        } as never)
      } catch {
        /* fog unsupported on this style — fine. */
      }

      // Hold on the wide city view, then one continuous push to the Peninsula.
      let arrived = false
      map.on('moveend', () => {
        if (arrived || doneRef.current) return
        arrived = true
        const settle = window.setTimeout(finish, 1300)
        timers.current.push(settle)
      })
      const kickoff = window.setTimeout(() => {
        if (doneRef.current) return
        map.flyTo({ ...FLIGHT, essential: true })
        CAPTIONS.forEach(({ at, label }) => {
          const t = window.setTimeout(() => {
            if (!doneRef.current) setLabel(label)
          }, FLIGHT.duration * at)
          timers.current.push(t)
        })
      }, HOLD_MS)
      timers.current.push(kickoff)
    })

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
      try {
        map.remove()
      } catch {
        /* map may already be gone — fine. */
      }
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Static (non-reduced-motion) heroes auto-advance so the intro still "plays".
  useEffect(() => {
    if (mode !== 'static' || reduced) return
    const t = window.setTimeout(finish, 4800)
    timers.current.push(t)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reduced])

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${
        fading ? 'animate-dissolve-out' : ''
      }`}
      style={{ backgroundColor: 'var(--forest)' }}
      aria-label="Cinematic introduction"
    >
      {mode === 'map' ? (
        <>
          {/* Inline position/size so mapbox-gl.css `.mapboxgl-map{position:relative}`
              (added to this node, loaded after Tailwind) can't override `.absolute`
              and collapse the container's height. Inline styles beat class rules. */}
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {/* edge vignette + caption legibility */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(10,23,34,0.55) 100%)',
            }}
          />
          {/* current location caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-16 flex flex-col items-center">
            <p
              key={label}
              className="eyebrow text-gold-light animate-fade-in"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
            >
              {label}
            </p>
          </div>
        </>
      ) : (
        <StaticHero onEnter={finish} reduced={reduced} />
      )}

      {/* Skip — always available, never traps the guest */}
      {!fading && (
        <button
          onClick={finish}
          className="absolute right-4 z-10 rounded-full border border-gold/40 bg-black/20 px-4 py-2 text-[0.7rem] uppercase tracking-wide2 text-gold-light backdrop-blur-sm transition hover:bg-black/35"
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        >
          {mode === 'static' ? 'Enter' : 'Skip intro'}
        </button>
      )}
    </div>
  )
}

// ── Static hero — the graceful fallback (no token / reduced-motion / failure) ──
function StaticHero({
  onEnter,
  reduced,
}: {
  onEnter: () => void
  reduced: boolean
}) {
  return (
    <div
      className="bg-grain absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundImage:
          'radial-gradient(120% 90% at 50% 18%, #16382c 0%, var(--forest) 46%, var(--midnight) 100%)',
      }}
    >
      {/* slow sunburst rays behind the title */}
      <div
        className="pointer-events-none absolute left-1/2 top-[26%] h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.10]"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 50%, var(--gold) 0deg 2deg, transparent 2deg 11deg)',
          maskImage: 'radial-gradient(closest-side, black 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(closest-side, black 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        <Monogram className="h-12 w-12 text-gold-light" />
        <p className="eyebrow mt-5 text-gold-light/80">Shanghai · On the Bund</p>
        <h1 className="mt-3 font-display text-[2.5rem] font-medium leading-[1.05] text-ivory text-balance">
          {EVENT.title}
        </h1>
        <p className="eyebrow mt-4 text-gold/80">{EVENT.unitFull}</p>

        <button onClick={onEnter} className="btn-primary mt-9">
          {reduced ? 'Enter' : 'Enter the evening'}
        </button>
      </div>

      <SkylineSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-midnight/70" />
    </div>
  )
}
