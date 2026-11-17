import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Compass, Play, Sparkles } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';

interface HandbookChapter {
  id: string;
  part: number;
  title: string;
  subtitle: string;
  duration: string;
  lessons: Array<{ id: string; title: string; summary: string }>;
}

const CHAPTERS: HandbookChapter[] = [
  {
    id: 'part-1',
    part: 1,
    title: 'Keyboard Mastery & Microtonal Cents',
    subtitle: 'Understanding quarter-tones (-50¢), Jins tetrachords, and touch velocity',
    duration: '8 min read',
    lessons: [
      { id: '1.1', title: '1.1 Touch Velocity & Octave Navigation', summary: 'Strike near the key lip for bright fortissimo or the pivot for delicate pianissimo. Use < / > pills to glide between A0 and C8.' },
      { id: '1.2', title: '1.2 Reading Quarter-Tone Badges (-50¢)', summary: 'Notice amber cent badges above keys like E-half-flat in Maqam Rast or D-half-flat in Bayati. Switch tonic roots live with zero zipper noise.' },
    ],
  },
  {
    id: 'part-2',
    part: 2,
    title: 'Exploring 140+ World Scales',
    subtitle: 'Arabic Maqamat, Turkish 53-TET Makams, Persian Dastgahs, and Indian Ragas',
    duration: '12 min read',
    lessons: [
      { id: '2.1', title: '2.1 Jins & Sayr Melodic Pathways', summary: 'Combine lower Rast or Bayati trichords with Hijaz upper jins modulations like Maqam Suznak.' },
      { id: '2.2', title: '2.2 Shruti Just Intonation & K-EDO Lattices', summary: 'Explore pure harmonic ratios in Raga Bhairav and Raga Yaman or launch the Qiano realm for 19/24/31/53-EDO layouts.' },
    ],
  },
  {
    id: 'part-3',
    part: 3,
    title: 'Realms & Expressive Performance Modes',
    subtitle: 'Dual Grand Manuals, DJ 6×2 Matrix, Mandala, Guitouch, and Meend Spiral',
    duration: '10 min read',
    lessons: [
      { id: '3.1', title: '3.1 DJ Performance Deck & Vinyl Turntables', summary: 'Trigger Maqsum & Baladi starter kits on 6×2 or 4×3 square pads, latch BPM loops, and drag vinyl platters to scratch.' },
      { id: '3.2', title: '3.2 Sacred Geometry Mandala & String Realms', summary: 'Strum 12 radial Mandala rays or bend microtonal intervals continuously on Guitouch and Meend Spiral.' },
    ],
  },
  {
    id: 'part-4',
    part: 4,
    title: 'Polyphonic Aftertouch & Hold-Latch',
    subtitle: 'Per-note vibrato, cutoff, pitch bend, and Sticky FX Freeze',
    duration: '7 min read',
    lessons: [
      { id: '4.1', title: '4.1 Three-Axis Finger Modulation', summary: 'Hold any key for 200ms and drag up for Vibrato, down for Lowpass Cutoff, or sideways for microtonal Pitch Bend.' },
      { id: '4.2', title: '4.2 Hands-Free Drone Chips & FX Routing', summary: 'Right-click keys to latch them into the LATCHED chip bar, then toggle chips between live FX routing and Sticky Freeze.' },
    ],
  },
  {
    id: 'part-5',
    part: 5,
    title: 'Sonic Engine & 2D XY Gesture Pad',
    subtitle: 'Sculpting 52 real-time DSP sliders, A/B compare, and Space Throw',
    duration: '9 min read',
    lessons: [
      { id: '5.1', title: '5.1 Parameter Locking & A/B Snapshots', summary: 'Lock Master Gain or Tuning while switching CLEAN / 1 / 2 / 3 presets, and compare edits instantly using the A/B toggle.' },
      { id: '5.2', title: '5.2 Four-Quadrant Gesture Pad', summary: 'Sweep Filter/Pitch, Tremolo/Phaser, Distort/Crush, and Reverb/Space simultaneously—or trigger Space Throw.' },
    ],
  },
  {
    id: 'part-6',
    part: 6,
    title: 'Recording, 30s Rescue & Ask Amir AI',
    subtitle: 'Capturing studio takes, WAV/MIDI exports, and AI sound design',
    duration: '6 min read',
    lessons: [
      { id: '6.1', title: '6.1 30s Retrospective Rescue', summary: 'Always-on rolling MIDI buffer lets you save great improvisations after the fact and export WAV or .mid files.' },
      { id: '6.2', title: '6.2 Ask Amir AI Producer', summary: 'Describe any cultural tradition, mood, or synth texture to receive custom scale, instrument, and DSP patch settings.' },
    ],
  },
];

const CURATED_PATHS = [
  { name: 'Middle Eastern Maqam Performer', steps: 'Part 1 → Part 2 → Part 4', target: 'Focus: Rast, Bayati, Hijaz & Warm Oud' },
  { name: 'Live Electronic & DJ Producer', steps: 'Part 3 → Part 5 → Part 6', target: 'Focus: DJ 6×2 Deck, Looper & 2D Gesture Pad' },
  { name: 'Indian Raga & Microtonal Explorer', steps: 'Part 2 → Part 3 → Part 4', target: 'Focus: Sitabla, Meend Spiral & Qiano 24-EDO' },
  { name: 'Sound Healer & Ambient Composer', steps: 'Part 3 → Part 5 → Part 6', target: 'Focus: Aura Bowls, Binaural Beats & Cathedral Reverb' },
];

export const GuidesPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [activePart, setActivePart] = useState(1);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('maqamir_handbook_done');
      return raw ? new Set(JSON.parse(raw)) : new Set(['1.1']);
    } catch {
      return new Set(['1.1']);
    }
  });
  const [showPaths, setShowPaths] = useState(false);

  const toggleLesson = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('maqamir_handbook_done', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const activeChapter = CHAPTERS.find((c) => c.part === activePart) || CHAPTERS[0];

  return (
    <SiteChrome currentPath="/guides" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
              <BookOpen className="w-4 h-4" />
              <span>MaqAmir Interactive Handbook</span>
            </div>
            <h1 className="brand-font text-3xl sm:text-4xl font-black text-white mt-1">
              6-Part Studio Mastery Guide
            </h1>
            <p className="text-xs sm:text-sm text-white/65 mt-1">
              Track your progress ({completed.size}/12 lessons completed) across microtonality, realms, DSP effects, and recording.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPaths(true)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-bold flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>4 Curated Learning Paths</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/piano')}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice in Studio</span>
            </button>
          </div>
        </div>

        {/* 6 Chapter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setActivePart(ch.part)}
              className={`p-3 rounded-xl border text-left transition ${
                activePart === ch.part
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                  : 'bg-[#0e0e13] border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-[#FACC15]">
                Part {ch.part}
              </div>
              <div className="text-xs font-bold mt-0.5 line-clamp-2">{ch.title}</div>
            </button>
          ))}
        </div>

        {/* Active Chapter Details */}
        <div className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-white">{activeChapter.title}</h2>
              <p className="text-xs text-white/60 mt-1">{activeChapter.subtitle}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold text-[#D4AF37]">
              {activeChapter.duration}
            </span>
          </div>

          <div className="space-y-3">
            {activeChapter.lessons.map((lesson) => {
              const done = completed.has(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => toggleLesson(lesson.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    done
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-black/35 border-white/10 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/35 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{lesson.title}</div>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">{lesson.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showPaths && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#111116] border border-[#D4AF37]/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#FACC15]">
                <Sparkles className="w-4 h-4" />
                <span>4 Curated Learning Paths</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaths(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-2.5">
              {CURATED_PATHS.map((p) => (
                <div
                  key={p.name}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1"
                >
                  <div className="text-sm font-bold text-white">{p.name}</div>
                  <div className="text-[11px] font-semibold text-[#D4AF37]">{p.steps}</div>
                  <div className="text-xs text-white/60">{p.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SiteChrome>
  );
};
