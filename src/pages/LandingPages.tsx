import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Keyboard,
  Layers,
  Piano,
  Play,
  Radio,
  Sliders,
  Waves,
} from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { INSTRUMENTS, PIANO_SKINS } from '../data/instruments';
import { REALMS } from '../data/realms';
import { SCALE_CATEGORIES, ScaleCategory, WORLD_SCALES } from '../data/scales';
import { EDUCATIONAL_ARTICLES } from '../data/articles';
import { trackEvent } from '../lib/analytics';

interface PageNavProps {
  onNavigate: (path: string) => void;
}

const KEYBOARD_SHORTCUT_MAP = [
  { keys: 'A S D F G H J K L ;', role: 'White natural piano keys across middle octave & upper C' },
  { keys: 'W E · T Y U · O P', role: 'Raised black accidental / sharp-flat keys' },
  { keys: 'Spacebar', role: 'Momentary concert damper sustain pedal' },
  { keys: 'Z / X', role: 'Shift keybed octave register down or up instantaneously' },
  { keys: 'Right-Click / Long-Press', role: 'Hold-Latch any key into a continuous drone or chord chip' },
];

export const OnlinePianoPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/online-piano" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-16">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
              Online Virtual Piano · Browser Keyboard
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.08]">
              Play Piano Online Free with Expressive Studio Precision
            </h1>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl">
              Step straight to a responsive virtual piano in your browser—no downloads or plugins required. Perform with velocity-sensitive keys, computer keyboard shortcuts, USB/Bluetooth MIDI controllers, sustain latch, and 44 handcrafted visual themes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/piano?instrument=Grand+Piano')}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold flex items-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Piano Now</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/guides/how-to-play-piano-online')}
                className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white transition"
              >
                Beginner Keyboard Guide
              </button>
            </div>
            <div className="pt-2 text-xs text-white/55 tabular-nums">
              8 Synthesized Instruments · 44 Keybed Skins · A0 to C8 Range · Free WAV &amp; MIDI Export
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-[#0e0e13] shadow-2xl">
              <img
                src="/images/realms/piano-studio.webp"
                alt="MAQAMIR Virtual Grand Piano Keybed"
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-72 object-cover"
              />
              <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Concert Grand Engine Active</div>
                  <div className="text-[11px] text-white/55">Web Audio Multi-Partial + Sustain</div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/piano')}
                  className="text-xs font-extrabold text-[#FACC15] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Open Stage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="brand-font text-2xl sm:text-3xl font-extrabold text-white">
              Built Like a Concert Instrument, Open to Every Browser
            </h2>
            <p className="text-xs sm:text-sm text-white/65">
              Designed for first-time learners checking melodies, teachers demonstrating intervals, and touring musicians sketching arrangements anywhere.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Keyboard,
                title: 'QWERTY, Touch & Web MIDI',
                body: 'Play immediately on any laptop keyboard, multi-touch tablet screen, or hardware MIDI controller plugged over USB or Bluetooth.',
              },
              {
                icon: Waves,
                title: 'Polyphonic Aftertouch & Hold-Latch',
                body: 'Hold any key to modulate per-note vibrato, pitch bend, or filter brightness—or right-click notes to latch drones hands-free.',
              },
              {
                icon: Radio,
                title: '30s Retrospective Rescue',
                body: 'Never lose an improvised idea. Save live audio takes or recover your past 30 seconds of played MIDI notes as WAV or .mid.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-3"
                >
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-extrabold text-white">{card.title}</h3>
                  <p className="text-xs text-white/65 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Computer Keyboard Cheat Sheet */}
        <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
              Instant Laptop Performance
            </div>
            <h2 className="brand-font text-2xl font-extrabold text-white">
              Computer Keyboard Controls
            </h2>
            <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
              No external controller nearby? MAQAMIR maps your typing rows symmetrically to white and black piano keys with one-thumb Spacebar sustain.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/guides/practice-piano-computer-keyboard')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FACC15] hover:underline pt-1"
            >
              <span>Read the full QWERTY practice guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="lg:col-span-7 divide-y divide-white/10 border border-white/10 rounded-xl bg-black/40">
            {KEYBOARD_SHORTCUT_MAP.map((row) => (
              <div
                key={row.keys}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <span className="font-mono font-bold text-[#FACC15]">{row.keys}</span>
                <span className="text-white/70">{row.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-5">
          <h2 className="brand-font text-2xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: 'Is MAQAMIR Online Piano really free to play?',
                a: 'Yes. The interactive piano keyboard, all 8 Web Audio instruments, 140+ world scales, 13 realms, and WAV/MIDI export are free for everyone. Optional Pro plans unlock Ask Amir AI sound design and unlimited preset saving.',
              },
              {
                q: 'Can I switch between Western tuning and Arabic Maqam quarter-tones?',
                a: 'Yes. Tap the scale selector in the studio top bar at any time to switch between Equal Temperament Major/Minor, Arabic Maqam Rast/Bayati (-50¢), Turkish Makams, or Indian Ragas.',
              },
            ].map((item) => (
              <div
                key={item.q}
                className="p-5 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-2"
              >
                <h3 className="text-sm font-bold text-white">{item.q}</h3>
                <p className="text-xs text-white/65 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
};

export const VirtualInstrumentsPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/virtual-instruments" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-14">
        <section className="space-y-4 max-w-3xl">
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
            Virtual Instruments · Web Audio Synthesis
          </div>
          <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-tight">
            8 Expressive Acoustic, World &amp; Analog Instruments in Your Browser
          </h1>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed">
            Every voice inside MAQAMIR is synthesized harmonically in real time—responding smoothly to quarter-tone micro-detuning, polyphonic aftertouch vibrato, and all 52 Sonic Engine parameters.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {INSTRUMENTS.map((inst) => (
            <div
              key={inst.id}
              className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 hover:border-[#D4AF37]/45 transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  <span>{inst.category}</span>
                  <span className="text-white/45 font-mono">{inst.engineLabel}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">{inst.name}</h2>
                <div className="text-xs font-semibold text-white/60">{inst.subtitle}</div>
                <p className="text-xs text-white/70 leading-relaxed pt-1">{inst.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-[11px] text-white/45">
                  Pairs with {inst.recommendedSkin} skin
                </span>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('instrument_selected', {
                      instrument: inst.name,
                      source: 'virtual_instruments_page',
                    });
                    onNavigate(`/piano?instrument=${encodeURIComponent(inst.id)}`);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play {inst.name}</span>
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 44 Visual Keybed Skins Showcase */}
        <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
                Visual Personalization
              </div>
              <h2 className="brand-font text-2xl font-extrabold text-white tabular-nums">
                {PIANO_SKINS.length} Custom Piano &amp; Instrument Skins
              </h2>
              <p className="text-xs text-white/65">
                Transform the keybed surface from Concert Classic Ivory and Obsidian Noir to Mother-of-Pearl Oud, Suitcase Rhodes, and Playful Solfege.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/piano')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Browse All Skins in Studio
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {PIANO_SKINS.slice(0, 18).map((skin) => (
              <div
                key={skin.id}
                className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-1.5"
              >
                <div
                  className="w-full h-2 rounded-sm"
                  style={{ backgroundColor: skin.swatch }}
                />
                <div className="text-xs font-bold text-white truncate">{skin.name}</div>
                <div className="text-[10px] text-white/50">{skin.tag}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
};

export const MusicStudioPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/music-studio" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-16">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
              Browser DAW · Realms &amp; Sonic Engine
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-tight">
              A Complete Browser Music Studio with 13 Realms &amp; 52 DSP Controls
            </h1>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Move effortlessly from a studio grand piano into Dual Manuals, live 6×2 DJ Sample Matrix with scratch vinyl platters, 24/53-EDO microtonal lattices, bowed cello fingerboards, and crystal healing bowls.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/piano')}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold flex items-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Open Full Workstation</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/pricing')}
                className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
              >
                Compare Free &amp; Pro
              </button>
            </div>
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 gap-3">
            <img
              src="/images/realms/synth-lab.webp"
              alt="Sonic Engine DSP Synth Lab"
              referrerPolicy="no-referrer"
              className="rounded-xl border border-white/15 w-full h-44 object-cover"
            />
            <img
              src="/images/realms/dj-realm-vinyl.webp"
              alt="MAQAMIR DJ Deck & Vinyl Turntables"
              referrerPolicy="no-referrer"
              className="rounded-xl border border-white/15 w-full h-44 object-cover"
            />
            <img
              src="/images/realms/mandala.webp"
              alt="Mandala Sacred Geometry Instrument"
              referrerPolicy="no-referrer"
              className="rounded-xl border border-white/15 w-full h-44 object-cover"
            />
            <img
              src="/images/realms/qiano.webp"
              alt="Qiano K-EDO Microtonal Lattice"
              referrerPolicy="no-referrer"
              className="rounded-xl border border-white/15 w-full h-44 object-cover"
            />
          </div>
        </section>

        {/* 13 Interactive Musical Realms */}
        <section className="space-y-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="brand-font text-2xl sm:text-3xl font-extrabold text-white">
              13 Specialized Performance Realms
            </h2>
            <p className="text-xs sm:text-sm text-white/65">
              Each Realm reshapes touch, pitch continuity, and visual geometry around how specific world instruments feel to perform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REALMS.map((realm) => (
              <div
                key={realm.id}
                className="rounded-2xl bg-[#0e0e13] border border-white/10 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={realm.image}
                    alt={`${realm.name} — ${realm.subtitle}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-36 object-cover bg-black/50"
                  />
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-white">{realm.name}</h3>
                      <span className="text-[11px] font-semibold text-[#D4AF37]">
                        {realm.subtitle}
                      </span>
                    </div>
                    <p className="text-xs text-white/65 leading-relaxed">
                      {realm.interactionHint}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/piano?realm=${encodeURIComponent(realm.queryParam)}`)}
                    className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-[#D4AF37] hover:text-black text-xs font-bold text-white transition"
                  >
                    Launch {realm.name} Realm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
};

export const LearnPianoPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/learn-piano" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-14">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
              Piano Education · Structured Practice
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-tight">
              Learn Piano Online Step by Step — From First Notes to World Scales
            </h1>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Read plain-language music fundamentals alongside hands-on drills designed specifically for browser keyboard, tablet, and MIDI practice inside MAQAMIR.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/guides/how-to-play-piano-online')}
                className="px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Lesson 1: Play Piano Online</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/guides')}
                className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
              >
                Open 6-Part Handbook
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-white/15 bg-[#0e0e13]">
            <img
              src="/images/realms/piano-realm-dual.webp"
              alt="Learn piano keys and chords online"
              referrerPolicy="no-referrer"
              className="w-full h-64 object-cover"
            />
          </div>
        </section>

        {/* All 8 Educational Articles */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="brand-font text-2xl sm:text-3xl font-extrabold text-white">
                8 Core Piano &amp; Musicianship Tutorials
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Every guide links directly to a pre-configured scale &amp; instrument inside MAQAMIR Studio.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {EDUCATIONAL_ARTICLES.map((article) => (
              <div
                key={article.slug}
                className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 hover:border-[#D4AF37]/50 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    {article.category} · {article.readingMinutes} min read
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-white/65 leading-relaxed">{article.description}</p>
                </div>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/guides/${article.slug}`)}
                    className="text-xs font-extrabold text-[#FACC15] hover:underline flex items-center gap-1"
                  >
                    <span>Read Tutorial</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(article.studioHref)}
                    className="text-[11px] font-semibold text-white/70 hover:text-white"
                  >
                    Practice in Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
};

export const MusicTheoryPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  const [selectedCat, setSelectedCat] = useState<ScaleCategory>('Arabic Maqam');

  const categoryScales = useMemo(
    () => WORLD_SCALES.filter((s) => s.category === selectedCat).slice(0, 12),
    [selectedCat]
  );

  return (
    <SiteChrome currentPath="/music-theory" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-14">
        <section className="space-y-4 max-w-3xl">
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
            World Music Theory · {WORLD_SCALES.length} Interactive Scales
          </div>
          <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-tight">
            Modes, Chords &amp; Microtonal Maqam Systems Explained
          </h1>
          <p className="text-sm sm:text-base text-white/75 leading-relaxed">
            Compare Western Major and Minor modes directly against quarter-tone Arabic Maqamat (-50¢), Turkish 53-TET comma Makams, Persian Dastgahs, and Hindustani Shruti Ragas—and launch any scale live on the keyboard.
          </p>
        </section>

        {/* Interactive Scale Explorer */}
        <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Interactive Scale Tradition Explorer</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Pick a musical tradition to preview sample scales and launch them tuned in Studio.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SCALE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCat === cat
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-white/[0.05] text-white/75 hover:bg-white/[0.12]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryScales.map((sc) => {
              const microCount = sc.centsOffsets.filter((c) => c !== 0).length;
              return (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl bg-black/45 border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-white">{sc.name}</h3>
                      {microCount > 0 && (
                        <span className="text-[10px] font-mono text-[#FACC15]">
                          {microCount} micro-tones
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{sc.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/piano?scale=${encodeURIComponent(sc.id)}`)}
                    className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-[#D4AF37] hover:text-black text-xs font-bold text-white transition"
                  >
                    Play {sc.name} in Studio
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Deep-dive Theory Guides */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              slug: 'what-are-musical-scales',
              icon: Compass,
              title: 'What Are Musical Scales? Western Modes to Arabic Maqam',
              desc: 'Understand whole steps, half steps, neutral -50¢ thirds, Jins tetrachords, and tuning ratios.',
            },
            {
              slug: 'understanding-major-minor-chords',
              icon: Layers,
              title: 'Major & Minor Chords: Counting Formulas & Inversions',
              desc: 'Master the 4+3 and 3+4 semitone triad patterns and voice lead progressions cleanly.',
            },
          ].map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.slug}
                className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-3"
              >
                <Icon className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-extrabold text-white">{g.title}</h3>
                <p className="text-xs text-white/65 leading-relaxed">{g.desc}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(`/guides/${g.slug}`)}
                  className="text-xs font-extrabold text-[#FACC15] hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Read Theory Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </SiteChrome>
  );
};

export const NotFoundPage: React.FC<PageNavProps> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/404" onNavigate={onNavigate}>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-20 text-center space-y-6">
        <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]">
          HTTP 404 · Page Not Found
        </div>
        <h1 className="brand-font text-4xl sm:text-5xl font-black text-white">
          This Musical Path Does Not Exist
        </h1>
        <p className="text-sm text-white/65 max-w-xl mx-auto leading-relaxed">
          The page URL you requested could not be found on MAQAMIR. Return to the interactive Piano Studio, browse learning guides, or explore available plans below.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/piano')}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold flex items-center gap-2"
          >
            <Piano className="w-4 h-4" />
            <span>Return to Piano Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/online-piano')}
            className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
          >
            Online Piano Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/guides')}
            className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
          >
            Browse Guides
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/pricing')}
            className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
          >
            Pricing
          </button>
        </div>
      </div>
    </SiteChrome>
  );
};
