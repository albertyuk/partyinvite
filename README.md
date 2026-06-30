# The Peninsula Residence — Invitation

A mobile-first, single-page invitation for an Independence Day gathering at
**The Peninsula Residence, 12F** — *Saturday, July 4, 2026, 6:00 PM*.

A guest opens the link on their phone, watches a short cinematic flight over
Shanghai that lands on the Bund, reads the invitation, replies with their name
and phone, and receives a **digital entry pass** to show the lobby attendant.

> Built for reliability first. Every part degrades gracefully: no Mapbox token →
> static hero; no network → the pass still renders; storage blocked → it still
> works. The guest experience never blocks on anything.

---

## The guest flow

1. **Intro** — a cinematic Mapbox `flyTo` from all of Shanghai → the Bund → onto
   The Peninsula (~8–12s, skippable; honors `prefers-reduced-motion`).
2. **Invitation card** — event details + the potluck ask.
3. **RSVP** — name, phone, what they're bringing (a dish or a mix of spirits),
   an optional note, and party size.
4. **Entry pass** — a Peninsula-styled ticket with the guest's name, *Admit to
   Peninsula Residence · 12F*, the date/time, a prominent confirmation code, and
   a QR. The attendant matches it against the host's live Google Sheet.

Re-opening the link on the same device, or re-submitting the same phone number,
returns the **same pass** (the code is derived deterministically from the phone)
— no duplicate rows.

---

## Tech stack

- **Vite + React + TypeScript + Tailwind CSS**
- **Mapbox GL JS** for the intro (`<IntroSequence>`), lazy-loaded so it only
  downloads when the intro actually plays
- **Google Apps Script** web app writing to a private Google Sheet
- **`qrcode`** for the client-side pass QR

---

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the two values (see below)
npm run dev               # http://localhost:5173
npm run build             # production build → dist/
npm run preview           # serve the build locally
```

The app runs **with no env values at all** — the intro shows a static hero and
RSVPs are stored locally. Add the two variables below to enable the live map and
the Sheet write.

---

## Environment variables

| Variable             | Required? | What it does                                                                 |
| -------------------- | --------- | ---------------------------------------------------------------------------- |
| `VITE_MAPBOX_TOKEN`  | optional  | Mapbox public token (`pk.…`). Absent → cinematic intro falls back to a static hero. |
| `VITE_RSVP_ENDPOINT` | optional  | Apps Script `/exec` URL. Absent → RSVPs are saved locally; the Sheet write is skipped. |

Only `VITE_`-prefixed variables reach the browser. **Never commit `.env`** (it's
git-ignored).

---

## Setup — Google Sheet + Apps Script (the RSVP backend)

This keeps the guest list **private to the host's Google account** — there is no
public endpoint that returns the sheet.

1. **Create the Sheet.** In the host's Google Drive, create a Sheet. The script
   auto-creates the `RSVPs` tab and header row on first write, or run
   `setupSheet()` once from the editor. The header row is:

   ```
   timestamp | name | phone | contribution_type | contribution_detail | party_size | confirmation_code | checked_in
   ```

2. **Add the script.** In the Sheet: **Extensions → Apps Script**. Replace the
   contents with [`apps-script/Code.gs`](./apps-script/Code.gs) and save.

3. **Deploy as a web app.** **Deploy → New deployment → Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Authorize when prompted. Copy the **`/exec` URL**.

4. **Wire it up.** Put that URL in `VITE_RSVP_ENDPOINT` (locally in `.env`, and
   in your host's environment settings) and rebuild/redeploy the site.

> **Redeploy gotcha:** after editing `Code.gs`, the `/exec` URL only picks up
> changes once you publish a **new version** — *Manage deployments → edit (✏️) →
> Version: New version → Deploy*. The URL stays the same.

### Why it works without CORS pain

Apps Script can't answer a CORS preflight. The site avoids triggering one by
POSTing as a **simple request** (`Content-Type: text/plain;charset=utf-8`). If
that ever fails, it retries once as a fire-and-forget `no-cors` POST — the row
still lands in the Sheet. Either way the pass is already on screen, because the
confirmation code is derived on the client and never needs a server read.

---

## Setup — Mapbox token

1. Create a free token at [account.mapbox.com](https://account.mapbox.com/) (the
   default public `pk.…` token is fine).
2. **URL-restrict it** to your deploy domain in the token settings.
3. Put it in `VITE_MAPBOX_TOKEN`.

If the token is missing, invalid, or the device is offline, the intro shows a
designed static hero instead of a blank screen.

---

## Deploy (Vercel or Netlify — static, free tier)

It's a static build; no server runtime needed.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- Add `VITE_MAPBOX_TOKEN` and `VITE_RSVP_ENDPOINT` as environment variables in
  the host's project settings, then deploy.

**Vercel:** import the repo → it detects Vite → add the env vars → Deploy.
**Netlify:** New site from Git → build `npm run build`, publish `dist` → add env
vars → Deploy.

---

## For the host & lobby attendant

No separate app. The host opens the live `RSVPs` Sheet and shares it **read-only**
with the attendant (or exports/prints it). As each guest arrives and shows their
pass, the attendant finds the matching **confirmation code** (or name) and, if
desired, ticks the `checked_in` column. Updating an RSVP never resets a guest's
`checked_in` value.

---

## Customizing the event

All canonical facts (names, address, date/time, coordinates, door copy) live in
one place: [`src/lib/event.ts`](./src/lib/event.ts). The invitation card and the
entry pass both read from it, so they can't drift out of sync.

---

## Project structure

```
src/
  App.tsx                     # stage machine: intro → card → rsvp → pass
  components/
    IntroSequence.tsx         # Mapbox flyTo intro + static-hero fallback (lazy)
    InvitationCard.tsx
    RsvpForm.tsx
    EntryPass.tsx
    Ornaments.tsx             # shared art-deco SVGs (monogram, divider, skyline)
  lib/
    event.ts                  # canonical event facts (single source of truth)
    rsvp.ts                   # deterministic code, localStorage, Sheet write
    pass.ts                   # QR, contribution summary, .ics calendar
  styles/theme.css            # Tailwind + design tokens
apps-script/
  Code.gs                     # paste into the bound Apps Script project
.env.example
```

---

## Acceptance checklist

- [x] Intro auto-plays, is skippable, and degrades gracefully (reduced-motion +
      map-load failure → static hero).
- [x] Card shows all canonical facts correctly.
- [x] Submitting writes a row to the Sheet; re-submitting the same phone updates
      rather than duplicates.
- [x] Pass renders immediately and works offline (code is client-derived); UI
      never blocks on the network.
- [x] No public endpoint exposes the guest list; phone numbers stay private.
- [x] Pass renders fully on a ~380px screen and is screenshot-friendly.
- [x] Works on iOS Safari + Android Chrome.
