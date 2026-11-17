# MaqAmir Piano Studio

Full-stack interactive microtonal piano studio and multi-realm performance workstation (`https://maqamir.tech/piano`), built with React 19, TypeScript, Tailwind CSS v4, Web Audio API, Tone.js, and an Express + Vite backend.

## Features

- **88-Key Microtonal Keyboard (`A0`–`C8`)**: Polyphonic Web Audio + Tone.js synthesis with velocity sensitivity, sustain, right-click note latching, Sticky FX Freeze, octave shifting, and keyboard shortcuts.
- **199 World Scales & Maqamat**: Arabic Maqamat (Rast, Bayati, Hijaz, Saba, Nahawand, Kurd, Ajam, etc.), Turkish Makams, Persian Dastgahs, Indian Ragas, Western modes, and microtonal K-EDO tunings with real-time cent offsets (`-50¢`).
- **8 Instruments & 44 Piano Skins**: Grand Piano, Warm Oud, Electric Rhodes, Ney Flute, Analog Synth, Sitar & Tanpura, Bowed Cello, and Crystal Bowls.
- **13 Interactive Musical Realms**: `Play`, `Piano` (Dual Grand Manuals), `DJ` (`6x2`, `4x3`, `5+7` matrices, Dual Vinyl turntables, `ARM REC` live pad capture), `Qiano` (`53-EDO`), `Mandala`, `Guitouch`, `Cellomir`, `Silk River`, `Sitabla`, `Vortex`, `Arabesque`, `Meend Spiral`, and `Aura Bowls` (`432Hz` + `7.5Hz` binaural mode).
- **52-Parameter Sonic Engine & 2D XY Gesture Pad**: Hardware-styled vertical faders with parameter locking, Magic Shuffle, `A/B` compare, preset slots, `SPACE THROW`, and real-time XY modulation.
- **Transport, Sequencer, Looper & Export**: Beat Sequencer (`Maqsum`, `Baladi`, `Malfuf`, `House`), Live Note Looper, 30-second performance rescue, Master Studio recording with WAV & `.MID` export, and Web MIDI input/CC/pitch-bend support.
- **Ask Amir AI Assistant (`POST /api/ai/assist`)**: Optional server-side Gemini integration for scale, instrument, realm, and Sonic Engine patch suggestions.
- **Multi-Page App Routes**: `/piano` (Main Studio), `/about`, `/guides` (interactive lessons with persisted progress), `/pro`, and `/pricing`.

## Prerequisites

- Node.js `>= 20` (tested on Node `v22`)
- `npm`

## Installation & Local Development

The application runs completely locally without requiring external authentication, Stripe payments, analytics, or Base44 services.

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Create local .env only if enabling Ask Amir AI
cp .env.example .env

# 3. Start full-stack Express + Vite development server on http://localhost:3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `/piano`, `/about`, `/guides`, `/pro`, `/pricing`).

## TypeScript Check & Production Build

```bash
# Run TypeScript type checking
npm run lint

# Build frontend (dist/) and server bundle (dist/server.cjs)
npm run build
```

## Production Run & Deployment

```bash
# Start compiled Express server serving dist/ on port 3000 (or process.env.PORT)
NODE_ENV=production npm start
```

For containerized or Cloud Run deployments:
- **Build command**: `npm ci && npm run build`
- **Start command**: `npm start` (set `NODE_ENV=production`)
- **Listening port**: `process.env.PORT || 3000` (bound to `0.0.0.0`)
- **Health endpoint**: `GET /api/health`

## Environment Variables

| Variable | Status | Used In | Description / How to Obtain |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Optional (Required only for **Ask Amir** AI) | `server.ts` | Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) or **Settings > Secrets**. Never expose with `VITE_`. |
| `AI_PROVIDER_API_KEY` | Optional (Legacy fallback alias) | `server.ts` | Checked only if `GEMINI_API_KEY` is unset. Same Google AI Studio API key. |
| `PORT` | Optional | `server.ts` | HTTP server port (defaults to `3000`). Provided automatically by most hosts. |
| `NODE_ENV` | Optional | `server.ts` | Set to `production` when running `npm start` with built `dist/` assets. |
| `BASE44_APP_ID`, `BASE44_API_BASE_URL`, `AUTH_SESSION_SECRET`, `STRIPE_SECRET_KEY`, `AUDIO_SAMPLES_CDN_BASE`, `GA4_MEASUREMENT_ID` | Unused (legacy export metadata) | None (`env-vars.json` only) | Leftover metadata from initial site export; not read anywhere at runtime and not required to run locally or in production. |

## Security Notes

- Never commit `.env` files, API keys, or credentials (`.gitignore` excludes `.env`, `.env.*`, `node_modules/`, `dist/`, `.aistudio/`, and temporary audit artifacts).
- All Gemini requests execute exclusively server-side in `server.ts` via `/api/ai/assist`.
