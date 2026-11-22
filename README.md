# VYBE

**A free, premium-feeling music streaming PWA. No account, no paywall, no ads.**

VYBE streams music from *legal open catalogues* — [Jamendo](https://www.jamendo.com)
(Creative Commons) and the [Internet Archive](https://archive.org) (public domain
and openly licensed) — and lets you upload your own library straight into the
browser. Everything else (favourites, playlists, history, playback state) lives
locally in IndexedDB, so the app keeps working when the network does not.

```
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
Zustand · TanStack Query · Howler.js · Web Audio API · Dexie (IndexedDB)
Framer Motion · Radix UI (shadcn-style primitives) · React Hook Form + Zod
```

---

## Highlights

| Area | What you get |
| --- | --- |
| **Home** | Time-aware greeting, instant search, recently played, popular mixes, recommended albums, genres, quick playlists, your own uploads |
| **Search** | 350 ms debounce, live suggestions, local-first results, tabbed results (tracks / artists / albums / playlists), history with clear, honest empty states |
| **Player** | Persistent bottom bar + full-screen player, queue with reorder/remove, shuffle, repeat, crossfade, gapless (best effort), speed control, sleep timer, visualizer, media-session lock-screen controls |
| **Local library** | Drag & drop upload of MP3/WAV/FLAC/M4A/AAC/OGG/Opus, ID3/Vorbis tag + cover extraction, duplicate detection, inline editing, sorting, storage-quota warnings |
| **Playlists** | Create, rename, reorder, custom cover, delete, total duration, add tracks from anywhere |
| **i18n** | 10 languages: English, Русский, Кыргызча, Қазақша, Türkçe, Español, Français, Deutsch, 日本語, 中文 — auto-detected, remembered, and covering every string in the UI |
| **Settings** | Language, light/dark theme, audio quality, autoplay, crossfade, equalizer, storage management, history clearing, JSON export/import, full ZIP backup (with audio), reset |
| **PWA** | Installable on Android and iOS, standalone display, offline shell, offline playback of your own uploads, install prompt with platform-specific instructions |
| **Accessibility** | Full keyboard control, focus-visible rings, ARIA labels, `prefers-reduced-motion` respected |

---

## Quick start

```bash
git clone <your-fork-url> vybe
cd vybe
npm install
npm run dev          # http://localhost:3000
```

**No configuration is required.** The catalogue APIs used here are public. To
customise, copy `.env.example` to `.env.local` and fill in only what you need.

```bash
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run i18n:audit   # verify every locale has every key
npm run icons        # regenerate PWA icons + OG image
```

---

## Environment variables

All optional — see [`.env.example`](./.env.example) for the annotated list.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `JAMENDO_CLIENT_ID` | server only | Your Jamendo key for higher rate limits. **Never** expose this to the client. |
| `INTERNET_ARCHIVE_HOST` | server only | Override the Archive.org host (defaults to `https://archive.org`). |
| `INTERNET_ARCHIVE_TOKEN` | server only | Optional token for higher-throughput Archive nodes. |
| `AUDIO_PROXY_ALLOWED_HOSTS` | server only | Extra hostnames the audio proxy may fetch from (comma separated). |
| `NEXT_PUBLIC_SITE_URL` | public | Absolute origin used for Open Graph metadata links. |

---

## Architecture

```
src/
├── app/                     App Router pages + API route handlers
│   ├── api/                 Server-side proxies: search, home, explore, audio,
│   │                        artwork, mix, genre, album, artist, stats
│   ├── album|artist|genre|mix/[id]/    Catalogue collection pages
│   ├── library|favorites|playlists|recent|upload|settings/
│   ├── player/              Deep link that expands the full-screen player
│   ├── track/[id]/          Track detail / share target
│   ├── error.tsx · global-error.tsx · not-found.tsx
│   └── layout.tsx · page.tsx · globals.css
├── components/
│   ├── layout/              App shell, sidebar, mobile nav, top bar, modals
│   ├── player/              Mini player, full-screen player, queue, visualizer
│   ├── music/               Track rows/cards, artwork, context menu, dialogs
│   ├── library/             Track table, storage meter, empty states
│   ├── home|search|explore|playlist|collection|settings|upload/
│   ├── providers/           Query, i18n, theme, player, PWA lifecycle
│   └── ui/                  Radix-based primitives (button, dialog, slider…)
├── database/                Dexie schema + typed table modules (8 tables)
├── hooks/                   Player controller, media session, storage, media queries
├── i18n/                    Provider + 10 message catalogues
├── lib/                     Utils, constants, HTTP + rate limiting, audio engine
├── services/                Jamendo / Archive clients, search, metadata, uploads
├── store/                   Zustand stores (player, library, settings, UI, upload)
└── types/                   Shared domain types
```

### How audio actually plays

1. `services/*` fetch metadata from Jamendo and Archive.org and normalise it to
   one `Track` shape.
2. Every audio and artwork URL is rewritten through our own
   `/api/audio` and `/api/artwork` proxies — no third-party keys ever reach the
   browser, and archive.org's redirect quirks are handled server-side.
3. `lib/audio-engine.ts` wraps Howler.js with a single Web Audio `AnalyserNode`
   so the visualizer and equalizer work without opening extra streams.
4. Uploaded files never leave the device: they are stored as `Blob`s in
   IndexedDB and played from `blob:` URLs.

### Data & privacy

* No accounts, no cookies for tracking, no analytics scripts.
* Library, playlists, history and settings live in **IndexedDB + localStorage**
  on your device only.
* **Export Data (JSON)** downloads metadata only — audio is *never* embedded in
  the JSON. Use **Full backup (ZIP)** to move audio files between devices.
* Catalogue requests are rate-limited per IP in `lib/rate-limit.ts`.

---

## Licensing

VYBE is a **client**, not a distributor.

* **Jamendo** tracks are Creative Commons — the license badge and a link to the
  source are shown wherever a track appears.
* **Internet Archive** items are public domain or openly licensed by their
  uploaders. Attribution and the original item page are always one tap away.
* **Your uploads** remain yours. You are responsible for the rights to anything
  you import.
* The UI never scrapes, re-hosts or caches commercial catalogues from Spotify,
  Apple Music, YouTube or similar services.

---

## PWA notes (honest limits)

* Installable on Chrome/Edge (Android, desktop) and Safari (iOS 16.4+).
* **Offline**: the app shell, cached catalogue pages and *your own uploads* work
  offline. Third-party streams require a network connection — no web app can
  legally cache them for offline replay.
* **Background audio** is best-effort. Media Session integration gives proper
  lock-screen and headset controls, but iOS may pause web audio when Safari is
  backgrounded; that is a platform constraint, not a bug.
* An optional Capacitor wrapper (scripts present under `android:*`) can provide
  a native shell. Auto-start on device boot is **never** enabled by default and
  requires explicit user consent.

---

## Deployment

**Vercel** (recommended):

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — the framework is
   auto-detected.
3. Optional: add the environment variables from the table above.
4. Deploy. `public/sw.js` and `public/manifest.webmanifest` are served with the
   correct cache headers by `next.config.ts`.

Any Node.js host works too: `npm run build && npm start`.

---

## Credits

Typography: [Inter](https://rsms.me/inter/) and [Manrope](https://manropefont.com)
via Fontsource (SIL Open Font License). Icons: [Lucide](https://lucide.dev) (ISC).
Curated-mix artwork and app icons are generated locally by
`scripts/generate-mix-art.mjs` and `scripts/generate-icons.mjs` — no third-party
image assets are bundled.

Built with care. Enjoy the music. 🎧
