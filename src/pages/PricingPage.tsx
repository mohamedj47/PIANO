import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';

export const PricingPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <SiteChrome currentPath="/pricing" onNavigate={onNavigate}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="brand-font text-3xl sm:text-4xl font-black text-white">
            Transparent Access for Every Musician
          </h1>
          <p className="text-sm text-white/65">
            Play 140+ world scales and all 13 musical realms with zero barriers, and expand with AI Sound Builder &amp; Pro Studio workflows.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0e0e13] border border-[#D4AF37]/40 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#FACC15] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Open Browser Workstation
              </div>
              <h2 className="text-2xl font-black text-white mt-1">Free Full Studio Access</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/piano')}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold"
            >
              Launch /piano Studio
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80">
            {[
              'Arabic Maqamat, Turkish Makams, Persian Dastgahs, Indian Ragas',
              'Multi-octave Grand Piano & Dual Manual Realm',
              '6×2 & 4×3 DJ Performance Matrix + Vinyl Turntables',
              '52 Sonic Engine Vertical Sliders & 2D Gesture Pad',
              '30s Retrospective Rescue & Standard MIDI Export',
              'Hardware Web MIDI Controller Plug-and-Play',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SiteChrome>
  );
};
