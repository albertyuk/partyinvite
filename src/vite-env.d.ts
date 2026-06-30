/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Mapbox public access token (pk.…). Optional — absent → static hero. */
  readonly VITE_MAPBOX_TOKEN?: string
  /** Google Apps Script /exec endpoint. Optional — absent → local-only RSVP. */
  readonly VITE_RSVP_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
