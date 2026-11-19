import React from 'react';
import { Globe2, Music, Radio, Sliders, Sparkles, Waves } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';

export const AboutPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const pillars = [
    {
      icon: Globe2,
      title: '140+ World Tuning Traditions',
      body: 'Every note is computed with microtonal precision — from Arabic Maqam Rast & Bayati (-50¢ neutral intervals) and Turkish 53-TET Makam commas to Persian Koron Dastgahs, Indian Shruti Ragas, and K-EDO equal temperaments.',
    },
    {
      icon: Sliders,
      title: '52-Parameter Real-Time DSP Engine',
      body: 'Zero-latency Web Audio processing graph with biquad resonant filter, tape saturation drive, stereo chorus, phaser, flanger, algorithmic hall reverb, reverse delay, compressor, ADSR envelope, and binaural beats.',
    },
    {
      icon: Sparkles,
      title: '13 Musical Realms & DJ Matrix',
      body: 'Move seamlessly between the full 88-key Piano Stage, Dual Grand Manuals, 6×2 DJ Performance Deck with Dual Vinyl turntables, Sacred Mandala strings, Qiano K-EDO lattice, Guitouch, and Raga spirals.',
    },
    {
      icon: Radio,
      title: '30s Retrospective Rescue & WAV/MIDI Export',
      body: 'Never lose an improvised phrase. Capture live master audio, record vocals/acoustic instruments via microphone, rescue the past 30 seconds of played notes, and export WAV audio or Standard MIDI (.mid) files.',
    },
    {
      icon: Waves,
      title: 'Polyphonic Aftertouch & Sticky FX Freeze',
      body: 'Expressive per-note vibrato, pitch glide, and cutoff sculpting on any key. Right-click or double-tap to latch drone chords hands-free and freeze FX snapshots per voice.',
    },
    {
      icon: Music,
      title: 'Ask Amir AI Producer',
      body: 'Powered server-side by Gemini to recommend Maqamat, instruments, BPMs, and Sonic Engine parameter patches tailored to any mood or arrangement.',
    },
  ];

  return (
    <SiteChrome currentPath="/about" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 space-y-14">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
              Microtonal World Music Workstation
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Bridging Millennia of World Scales with a Modern Browser DAW
            </h1>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              MaqAmir Piano Studio is built from the ground up so performers, composers, and students across Middle Eastern, Anatolian, Persian, Indian, and Western traditions can perform authentic quarter-tones, commas, and expressive slides directly in the browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/piano')}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold transition"
              >
                Launch Piano Studio
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/guides')}
                className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white transition"
              >
                Read the 6-Part Handbook
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/music-theory')}
                className="px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-sm font-semibold text-white/85 transition"
              >
                Explore World Scales
              </button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
            <img
              src="/images/multicultural-piano.png"
              alt="MaqAmir Multicultural Piano Studio"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 hover:border-[#D4AF37]/45 transition space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#FACC15]">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-extrabold text-white">{p.title}</h2>
                <p className="text-xs leading-relaxed text-white/65">{p.body}</p>
              </div>
            );
          })}
        </section>
      </div>
    </SiteChrome>
  );
};
