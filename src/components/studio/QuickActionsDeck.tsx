import React, { useState } from 'react';
import {
  Piano,
  Sparkles,
  Mic,
  Square,
  MessageCircle,
  SlidersHorizontal,
  Theater,
  History,
} from 'lucide-react';
import { InstrumentId } from '../../data/instruments';

interface QuickActionsDeckProps {
  instrument: InstrumentId;
  onQuickGrandPiano: () => void;
  onSelectAcousticPreset?: (inst: InstrumentId) => void;
  onMagicShuffle: () => void;
  onOpenCuratedPresets?: () => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  onToggleMicRecord?: () => void;
  onRescue30s: () => void;
  onOpenRealmsTheater: () => void;
  onOpenAskAmir: () => void;
  sustainActive: boolean;
  sustainLatched: boolean;
  onToggleSustain: () => void;
  onLatchSustain: () => void;
  onOpenCustomize: () => void;
  highlightedTarget?: string;
}

export const QuickActionsDeck: React.FC<QuickActionsDeckProps> = ({
  instrument,
  onQuickGrandPiano,
  onSelectAcousticPreset,
  onMagicShuffle,
  onOpenCuratedPresets,
  isRecording,
  onToggleRecord,
  onToggleMicRecord,
  onRescue30s,
  onOpenRealmsTheater,
  onOpenAskAmir,
  sustainActive,
  sustainLatched,
  onToggleSustain,
  onLatchSustain,
  onOpenCustomize,
  highlightedTarget,
}) => {
  const [openMenu, setOpenMenu] = useState<'piano' | 'magic' | 'rec' | null>(null);

  const isHighlighted = (t: string) => highlightedTarget === t;

  return (
    <div
      data-testid="simple-quick-actions"
      className="w-full py-1.5 px-3 flex items-center justify-center bg-[#050505] select-none relative z-30"
    >
      <div
        role="toolbar"
        aria-label="Studio Quick Actions"
        className="studio-quick-actions-deck daw-deck-row"
      >
        {/* 1. Piano Module */}
        <div className="relative">
          <button
            type="button"
            data-tour-target="deck-piano"
            data-tutorial="piano-button"
            data-tone="gold"
            data-led={instrument === 'Grand Piano' || isHighlighted('[data-tour-target="deck-piano"]') ? 'on' : 'off'}
            data-active={instrument === 'Grand Piano' || isHighlighted('[data-tour-target="deck-piano"]') ? 'true' : 'false'}
            onClick={onQuickGrandPiano}
            onContextMenu={(e) => {
              e.preventDefault();
              setOpenMenu((m) => (m === 'piano' ? null : 'piano'));
            }}
            title="Grand Piano — hold or right-click for acoustic presets"
            className="daw-module mx-0.5"
          >
            <span className="daw-module-led" aria-hidden="true" />
            <Piano className="daw-module-icon w-5 h-5" />
            <span className="daw-module-notch" aria-hidden="true" />
          </button>

          {openMenu === 'piano' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-14 z-50 w-56 rounded-xl bg-[#121216] border border-[#D4AF37]/40 p-1.5 shadow-2xl space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  Keyboard &amp; Acoustic Presets
                </div>
                {(['Grand Piano', 'Warm Oud', 'Electric Rhodes', 'Ney Flute'] as InstrumentId[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (preset === 'Grand Piano') onQuickGrandPiano();
                      else onSelectAcousticPreset?.(preset);
                      setOpenMenu(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 ${
                      instrument === preset ? 'text-[#FACC15] font-bold' : 'text-white/85'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. Magic Shuffle Module */}
        <div className="relative">
          <button
            type="button"
            data-tour-target="deck-magic"
            data-tone="pro"
            data-led={isHighlighted('[data-tour-target="deck-magic"]') ? 'on' : 'off'}
            data-active={isHighlighted('[data-tour-target="deck-magic"]') ? 'true' : 'false'}
            onClick={onMagicShuffle}
            onContextMenu={(e) => {
              e.preventDefault();
              setOpenMenu((m) => (m === 'magic' ? null : 'magic'));
            }}
            title="Magic shuffle — hold or right-click for presets & AI builder"
            className="daw-module mx-0.5"
          >
            <span className="daw-module-led" aria-hidden="true" />
            <Sparkles className="daw-module-icon w-5 h-5" />
            <span className="daw-module-notch" aria-hidden="true" />
          </button>

          {openMenu === 'magic' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-14 z-50 w-56 rounded-xl bg-[#121216] border border-purple-400/40 p-1.5 shadow-2xl space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onMagicShuffle();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-purple-200 hover:bg-white/10"
                >
                  ✨ Shuffle Random Sound
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenCuratedPresets?.();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-white/85 hover:bg-white/10"
                >
                  🎛️ Browse Curated Presets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAskAmir();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#D4AF37] hover:bg-white/10"
                >
                  🤖 Open Ask Amir AI Builder
                </button>
              </div>
            </>
          )}
        </div>

        {/* 3. Record + 30s Rescue Module */}
        <div className="relative">
          <button
            type="button"
            data-tour-target="deck-record"
            data-tone="warning"
            data-led={isRecording ? 'pulse' : isHighlighted('[data-tour-target="deck-record"]') ? 'on' : 'off'}
            data-active={isRecording || isHighlighted('[data-tour-target="deck-record"]') ? 'true' : 'false'}
            onClick={onToggleRecord}
            onContextMenu={(e) => {
              e.preventDefault();
              setOpenMenu((m) => (m === 'rec' ? null : 'rec'));
            }}
            title="Instant Record — right-click for 30s Retrospective Rescue & Mic Layer"
            className="daw-module mx-0.5"
          >
            <span className="daw-module-led" aria-hidden="true" />
            {isRecording ? (
              <Square className="daw-module-icon w-4 h-4 fill-current text-red-400" />
            ) : (
              <Mic className="daw-module-icon w-5 h-5" />
            )}
            <span className="daw-module-notch" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onRescue30s}
            title="Rescue last 30s played (Retrospective Capture)"
            className="hidden sm:flex absolute -bottom-1 -right-0.5 w-4 h-4 rounded-full bg-[#16161c] border border-white/20 items-center justify-center text-white/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition z-10"
          >
            <History className="w-2.5 h-2.5" />
          </button>

          {openMenu === 'rec' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-14 z-50 w-56 rounded-xl bg-[#121216] border border-red-500/40 p-1.5 shadow-2xl space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onToggleRecord();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-white hover:bg-white/10"
                >
                  {isRecording ? '⏹ Stop Studio Recording' : '🔴 Start Live Studio Record'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRescue30s();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#D4AF37] hover:bg-white/10"
                >
                  ↺ 30s Retrospective Rescue
                </button>
                {onToggleMicRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMicRecord();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-white/10"
                  >
                    🎙️ Toggle Microphone Layer
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 4. Realms Theater Stage Module */}
        <button
          type="button"
          data-tour-target="deck-realms"
          data-tone="edu"
          data-led={isHighlighted('[data-tour-target="deck-realms"]') ? 'on' : 'off'}
          data-active={isHighlighted('[data-tour-target="deck-realms"]') ? 'true' : 'false'}
          onClick={onOpenRealmsTheater}
          title="Enter Dual-Manual Piano Realm & Interactive Realms"
          className="daw-module mx-0.5"
        >
          <span className="daw-module-led" aria-hidden="true" />
          <Theater className="daw-module-icon w-5 h-5" />
          <span className="daw-module-notch" aria-hidden="true" />
        </button>

        {/* 5. Ask Amir AI Assistant Module */}
        <button
          type="button"
          data-tone="silver"
          data-led="off"
          onClick={onOpenAskAmir}
          title="Ask Amir — AI Maqam & Sound Design Assistant"
          className="daw-module mx-0.5"
        >
          <span className="daw-module-led" aria-hidden="true" />
          <MessageCircle className="daw-module-icon w-5 h-5" />
          <span className="daw-module-notch" aria-hidden="true" />
        </button>

        {/* 6. Sustain Pedal Module (Chalice / Damper Icon matching Screenshot 1 & cleaned-piano.html) */}
        <button
          type="button"
          role="slider"
          aria-label="Sustain pedal — tap for momentary, double-tap to latch"
          aria-valuenow={sustainActive || sustainLatched ? 127 : 0}
          aria-valuemin={0}
          aria-valuemax={127}
          data-tone="gold"
          data-led={sustainActive || sustainLatched ? 'on' : 'off'}
          data-active={sustainLatched ? 'latched' : sustainActive ? 'held' : 'false'}
          data-latched={sustainLatched ? 'true' : 'false'}
          onClick={onToggleSustain}
          onDoubleClick={onLatchSustain}
          title="Sustain Pedal (Tap to toggle, Double-click to Lock HOLD)"
          className="daw-module group overflow-hidden mx-0.5"
        >
          <span className="daw-module-led" aria-hidden="true" />
          {/* Damper level fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#D4AF37]/25 transition-all duration-150 pointer-events-none"
            style={{ height: sustainLatched ? '90%' : sustainActive ? '72%' : '12%' }}
          />
          {/* Right-side threshold ticks */}
          <div className="absolute right-1 top-2 bottom-2 w-1 flex flex-col justify-between items-center opacity-35 pointer-events-none">
            <span className="w-0.5 h-0.5 rounded-full bg-current" />
            <span className="w-0.5 h-0.5 rounded-full bg-current" />
          </div>
          {/* Damper Pedal chalice/bell vector matching Screenshot 1 */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="daw-module-icon w-4 h-4 relative z-10 text-[#D4AF37]"
          >
            <path d="M7 5h10l-1.5 7.5a3.5 3.5 0 0 1-7 0L7 5Z" />
            <path d="M12 16v4" />
            <path d="M8.5 20h7" />
          </svg>
          <span className="daw-module-notch" aria-hidden="true" />
        </button>

        <span className="daw-deck-divider mx-1" aria-hidden="true" />

        {/* 7. Customize / Hardware / Skins Tune Button */}
        <button
          type="button"
          onClick={onOpenCustomize}
          title="Customize Skins, Keyboard Shortcuts & Web MIDI"
          className="daw-deck-tune"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
