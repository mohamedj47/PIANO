# MAQAMIR — Global Growth, SEO & Digital Marketing Plan

**Official Product Name:** MAQAMIR  
**Official Production Domain:** `https://piano-eta-ivory.vercel.app`  
**Hosting:** Vercel (with Express + Vite production/dev server support in `server.ts`)  
**Scope Note:** This document clearly separates **implemented codebase features** from **manual external platform operations** (Google Search Console, Bing Webmaster Tools, social channel publishing). No external search rankings, organic traffic spikes, or social follower counts are claimed or guaranteed.

---

## 1. Keyword & Search Intent Map

Each primary landing page and educational guide targets distinct intent with dedicated `<title>`, `<meta name="description">`, `<link rel="canonical">`, Schema.org structured data, and internal studio deep links.

| Target Route | Primary Keyword | Secondary Keywords | Search Intent |
| --- | --- | --- | --- |
| `/` & `/piano` | interactive piano studio online | online microtonal piano, browser DAW music studio, virtual piano keyboard | Action / Tool Launch |
| `/online-piano` | play piano online free | virtual piano keyboard, computer keyboard piano, midi browser piano | Tool / Commercial-Free |
| `/virtual-instruments` | virtual piano and world instruments | online oud synthesizer, virtual rhodes, ney flute synth, 44 piano skins | Discovery / Feature |
| `/music-studio` | online browser music studio | web audio DAW, sonic engine synth, dj matrix deck online, wav midi export | Creator / Producer |
| `/learn-piano` | learn piano online free | beginner piano tutorial hub, online piano lessons step by step | Educational Hub |
| `/music-theory` | musical scales and microtonal maqam | arabic maqam scales, turkish 53-tet makam, indian raga scales, k-edo | Reference / Theory |
| `/guides/how-to-play-piano-online` | how to play piano online | play piano with browser, virtual piano beginner guide | Beginner How-To |
| `/guides/piano-keyboard-notes-explained` | piano keyboard notes | piano keys labeled, white black piano keys, sharps flats octave numbers | Educational Reference |
| `/guides/how-to-find-middle-c` | how to find middle c | middle c piano C4, find middle c 88 keys | Specific Learning Query |
| `/guides/learn-musical-notes-step-by-step` | learn musical notes step by step | do re mi piano notes, ear training intervals | Structured Tutorial |
| `/guides/piano-practice-tips-beginners` | piano practice tips for beginners | daily piano routine, metronome practice browser | Habit / Technique |
| `/guides/what-are-musical-scales` | what are musical scales | musical scales explained, arabic maqam quarter tones | Theory Concept |
| `/guides/understanding-major-minor-chords` | understanding major and minor chords | piano chords beginners, major minor triad formula, chord inversions | Harmony Concept |
| `/guides/practice-piano-computer-keyboard` | practice piano on computer keyboard | qwerty piano shortcuts, browser keyboard sustain | Laptop Tool Workflow |
| `/ar` (`dir="rtl"`) | بيانو أونلاين والمقامات العربية | تعلم عزف البيانو، مقام راست، ربع تون في المتصفح | Multilingual Arabic |
| `/es`, `/fr`, `/de` | piano online gratis / piano en ligne / online klavier | escalas del mundo, gammes microtonales, mikrotonale tonleitern | Multilingual ES/FR/DE |

---

## 2. Architecture & Technical SEO Status

### Implemented in Repository (`✅ Complete`)
- **Canonical Domain Standardization:** All canonical URLs, OpenGraph `og:url` / `og:image`, Twitter Card URLs, `sitemap.xml`, and `robots.txt` point strictly to `https://piano-eta-ivory.vercel.app`.
- **Isomorphic Route Metadata Injection (`src/lib/seoMeta.ts` + `server.ts`):** Express serves accurate HTTP status (`200` for valid routes, genuine `404` status + `<meta name="robots" content="noindex, nofollow">` for unknown paths), pre-populated `<title>`, meta description, canonical link, `hreflang` alternates (`/`, `/ar`, `/es`, `/fr`, `/de`), OpenGraph/Twitter tags, Schema.org JSON-LD (`WebApplication`, `Organization`, `LearningResource`, `Article`, `BreadcrumbList`, `FAQPage`), and semantic `<noscript>` summaries before React mounts.
- **Client-Side Synchronization (`src/lib/seoClient.ts`):** Every client navigation updates `<title>`, description, canonical, OG/Twitter tags, `hreflang`, JSON-LD scripts, `lang`, and `dir` (`rtl` on `/ar`, `ltr` elsewhere).
- **Crawl Protection & Sitemaps (`public/robots.txt`, `public/sitemap.xml`, `vercel.json`):** Disallows `/admin`, `/admin/`, `/api/`, and `/api/uploads/proofs/` while setting `X-Robots-Tag: noindex, nofollow` on admin headers.
- **Code-Splitting (`App.tsx`):** `React.lazy()` + `Suspense` decouples informational pages from `PianoStudioPage` (`Tone.js` audio synthesis).
- **Consent-Safe Analytics (`src/lib/analytics.ts`):** Supports optional `VITE_GA4_MEASUREMENT_ID` or server-side `GA4_MEASUREMENT_ID`, strictly blocks PII (`email`, `uid`, `token`, `referenceNumber`, proof filenames), throttles high-frequency note strikes, deduplicates session events, and runs only after explicit cookie consent.

---

## 3. Video & Social Content Strategy (Reusable Creator Playbook)

### Core Short-Form Formats (YouTube Shorts / TikTok / Instagram Reels)
1. **30-Second Maqam Comparison:** Play C Major vs. Maqam Rast (`-50¢` neutral 3rd) side-by-side inside `/piano?scale=0-rast&instrument=Warm+Oud`. Link in pinned comment: `https://piano-eta-ivory.vercel.app/piano?scale=0-rast`
2. **Computer Keyboard Beat + Melody:** Show A–L keys + Spacebar sustain + `6×2 DJ Matrix` Levant loop running natively inside Chrome/Edge.
3. **Middle C to First Song in 45 Seconds:** Walk beginners through the 2-black-key landmark linking directly to `/guides/how-to-find-middle-c`.
4. **Ambient Healing Session:** Latch `Crystal Bowls` chords in `Aura Bowls` Realm paired with Sonic Engine Cathedral Reverb.

### Reusable Social Post Templates
- **Musicians / X & Reddit (`r/WeAreTheMusicMakers`, `r/piano`):**
  > Built a browser workstation that switches live between 12-TET piano and microtonal Arabic Maqam (`-50¢`), Turkish 53-TET Makam, Indian Shruti Raga, and 13 expressive interfaces (Mandala, DJ deck, Qiano K-EDO). Free Web Audio studio + WAV/MIDI export: https://piano-eta-ivory.vercel.app/online-piano
- **Music Teachers / LinkedIn & Facebook:**
  > Teaching scales or quarter-tones remotely? Share a direct link that opens MAQAMIR already tuned to the scale your student is practicing—complete with keyboard shortcuts and visual cent badges: https://piano-eta-ivory.vercel.app/learn-piano

### 30-Day Launch & Publishing Cadence (Manual Execution Calendar)
- **Week 1 (Technical Indexing & Core Pages):** Verify domain in Google Search Console & Bing Webmaster Tools, submit sitemap, share `/online-piano` and *How to Play Piano Online* tutorial across social profiles.
- **Week 2 (Theory & Maqam Discovery):** Publish 2 short comparison clips (Western Major vs. Maqam Rast & Hijaz); cross-link to `/music-theory` and `/guides/what-are-musical-scales`.
- **Week 3 (Instrument & Realms Spotlight):** Showcase `Warm Oud`, `Electric Rhodes`, `DJ Matrix`, and `Qiano` K-EDO; share `/virtual-instruments` and `/music-studio`.
- **Week 4 (Multilingual & Conversion Review):** Share `/ar` in Arabic musician communities and `/es`, `/fr`, `/de` hubs; review GA4 studio engagement and Search Console query impressions before prioritizing Month 2 articles.

---

## 4. Manual External Steps Required After Deployment

The following external integrations cannot run automatically from inside the codebase and must be completed by the site owner:

1. **Google Search Console Verification & Sitemap Submission**
   - Go to [https://search.google.com/search-console](https://search.google.com/search-console).
   - Add property `https://piano-eta-ivory.vercel.app`.
   - Verify ownership via DNS TXT record (recommended) or HTML tag in Vercel DNS/host settings.
   - Open **Sitemaps** in the left menu and submit `https://piano-eta-ivory.vercel.app/sitemap.xml`.
   - Use **URL Inspection** to verify `/`, `/online-piano`, `/guides/how-to-play-piano-online`, and `/ar` return HTTP `200`, canonical `https://piano-eta-ivory.vercel.app/...`, and confirm `/admin/payments` reports `noindex`.
2. **Bing Webmaster Tools Submission**
   - Go to [https://www.bing.com/webmasters](https://www.bing.com/webmasters), import directly from Google Search Console or verify `https://piano-eta-ivory.vercel.app`, and submit `https://piano-eta-ivory.vercel.app/sitemap.xml`.
3. **Google Analytics 4 Activation (Optional)**
   - Create a GA4 Web Stream for `https://piano-eta-ivory.vercel.app` and set `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` (or `GA4_MEASUREMENT_ID=G-XXXXXXXXXX`) in Vercel Environment Variables.
   - Verify real-time events only fire after clicking **Accept** on the MAQAMIR analytics consent banner:
     - Engagement: `page_view`, `studio_open`, `piano_interaction`, `instrument_selected`, `lesson_view`, `share_clicked`
     - Conversion Funnel: `signup_started` → `signup_completed` → `pricing_view` → `checkout_started` → `payment_submitted` → `subscription_activated`
