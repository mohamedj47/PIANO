import React, { useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';

export const ProPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [annual, setAnnual] = useState(true);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const proPrice = annual ? '$9' : '$12';

  const handleCheckoutDemo = async () => {
    setCheckoutLoading(true);
    try {
      await fetch('/api/mock/api/v1/checkout/session', { method: 'POST' });
      setCheckoutDone(true);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <SiteChrome currentPath="/pro" onNavigate={onNavigate}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-extrabold text-[#FACC15]">
            <Crown className="w-3.5 h-3.5" />
            <span>MAQAMIR PRO STUDIO</span>
          </div>
          <h1 className="brand-font text-3xl sm:text-5xl font-black text-white">
            Unlock Complete Expressive Power
          </h1>
          <p className="text-sm text-white/65 max-w-2xl mx-auto">
            Every core studio instrument, all 140+ World Scales, DJ Performance Deck, 52 Sonic Engine sliders, and Web MIDI support are included free. Upgrade to Pro for studio cloud presets and priority AI Sound Builder generation.
          </p>

          {/* Annual / Monthly Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full bg-white/[0.05] border border-white/10">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                !annual ? 'bg-[#D4AF37] text-black' : 'text-white/70'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                annual ? 'bg-[#D4AF37] text-black' : 'text-white/70'
              }`}
            >
              Annual (Save 25%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-white/55">Community Free</div>
            <div className="text-3xl font-black text-white">$0 <span className="text-xs font-normal text-white/50">/ forever</span></div>
            <ul className="space-y-2.5 text-xs text-white/75">
              {[
                '140+ World Scales & Microtonal Maqamat',
                '8 Web Audio Synthesized Instruments & 44 Skins',
                'All 13 Interactive Realms + DJ 6×2 Matrix',
                '52 Real-Time Sonic Engine DSP Sliders',
                '30s Retrospective Rescue + WAV & MIDI Export',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('/piano')}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Play Studio Free
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1e190b] to-[#0e0e13] border border-[#D4AF37] space-y-4 shadow-[0_0_40px_rgba(212,175,55,0.14)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FACC15]">MaqAmir Pro</span>
              <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-black text-[10px] font-black">RECOMMENDED</span>
            </div>
            <div className="text-3xl font-black text-white">
              {proPrice} <span className="text-xs font-normal text-white/55">/ month {annual ? 'billed annually' : ''}</span>
            </div>
            <ul className="space-y-2.5 text-xs text-white/85">
              {[
                'Everything in Community Free included',
                'Priority Ask Amir AI Maqam & Patch Builder',
                'Unlimited Custom Preset Bank & MIDI Mappings',
                'Pro Quantized Multi-Layer Recording Workflows',
                'Early Access to New EDO & Raga Packs',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FACC15] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            {checkoutDone ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-xs text-emerald-200 text-center font-semibold">
                Simulated Pro Session Ready — Return to Piano Studio to enjoy all unlocked tools.
              </div>
            ) : (
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleCheckoutDemo}
                className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold transition"
              >
                {checkoutLoading ? 'Preparing Session...' : 'Start Pro Membership'}
              </button>
            )}
          </div>
        </div>
      </div>
    </SiteChrome>
  );
};
