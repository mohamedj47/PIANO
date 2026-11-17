import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc,
  Lock,
  Pencil,
  Radio,
  RotateCcw,
  Sliders,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Unlock,
  Waves,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_SONIC_PARAMS,
  SONIC_PARAM_DEFS,
  SONIC_PRESETS,
  SonicParamDef,
  SonicParamId,
  SonicParams,
} from '../../data/sonicParams';
import type { LatchedNoteChip } from './PianoKeyboardStage';

export type SonicPanelMode = 'sliders' | 'xy' | 'aftertouch';

interface SonicEnginePanelProps {
  params: SonicParams;
  onChangeParam: (id: SonicParamId, value: number) => void;
  onApplyAllParams: (next: SonicParams, presetLabel?: string) => void;
  presetName: string;
  lockedParams: Set<SonicParamId>;
  onToggleLockParam: (id: SonicParamId) => void;
  latchedNotes: LatchedNoteChip[];
  onToggleChipRoute: (noteId: string) => void;
  onUnlatchNote: (noteId: string) => void;
  mode: SonicPanelMode;
  onChangeMode: (mode: SonicPanelMode) => void;
  onSpaceThrow: () => void;
  compactEmbed?: boolean;
}

const GROUP_ACCENTS: Record<SonicParamDef['group'], { text: string; bar: string; led: string }> = {
  pitch: { text: 'text-brand-heal', bar: 'bg-brand-heal', led: 'bg-brand-heal' },
  reverb: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  delay: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  filter: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  eq: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  tape: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  mod: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  comp: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  env: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  crush: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', led: 'bg-[#FACC15]' },
  space: { text: 'text-sky-400', bar: 'bg-sky-400', led: 'bg-sky-300' },
  tuning: { text: 'text-purple-400', bar: 'bg-purple-400', led: 'bg-purple-300' },
};

function renderGroupIcon(group: SonicParamDef['group'], className: string) {
  switch (group) {
    case 'pitch':
      return <Activity className={className} />;
    case 'reverb':
      return <Waves className={className} />;
    case 'delay':
      return <Clock className={className} />;
    case 'filter':
    case 'eq':
      return <Sliders className={className} />;
    case 'tape':
    case 'crush':
      return <Zap className={className} />;
    case 'comp':
      return <BarChart3 className={className} />;
    case 'env':
      return <Activity className={className} />;
    case 'mod':
      return <Disc className={className} />;
    case 'tuning':
      return <Sparkles className={className} />;
    default:
      return <Radio className={className} />;
  }
}

const XY_PRESETS: Array<{ name: string; patch: Partial<SonicParams> }> = [
  {
    name: 'MULTI-ZONE SURFACE',
    patch: { reverbMix: 16, reverbSize: 1.8, delayMix: 10, cutoff: 14000, distortion: 0, bitCrushMix: 0 },
  },
  {
    name: 'MAQAM SHIMMER PAD',
    patch: { reverbMix: 52, reverbSize: 4.8, delayMix: 28, delayTime: 380, chorusDepth: 34, stereoWidth: 68, cutoff: 8200 },
  },
  {
    name: 'DUB FILTER SWEEP',
    patch: { delayMix: 46, delayTime: 375, delayFeedback: 55, cutoff: 2100, resonance: 48, phaserDepth: 42 },
  },
  {
    name: 'TAPE CRUSH LO-FI',
    patch: { tapeDrive: 44, tapeFlutter: 38, bitCrushDepth: 42, bitCrushMix: 36, cutoff: 4200, reverbMix: 22 },
  },
];

export const SonicEnginePanel: React.FC<SonicEnginePanelProps> = ({
  params,
  onChangeParam,
  onApplyAllParams,
  presetName,
  lockedParams,
  onToggleLockParam,
  latchedNotes,
  onToggleChipRoute,
  onUnlatchNote,
  mode,
  onChangeMode,
  onSpaceThrow,
  compactEmbed = false,
}) => {
  const [abSlot, setAbSlot] = useState<'A' | 'B'>('A');
  const [slotBParams, setSlotBParams] = useState<SonicParams>({
    ...DEFAULT_SONIC_PARAMS,
    reverbMix: 45,
    reverbSize: 3.8,
    delayMix: 25,
    cutoff: 4200,
    resonance: 24,
  });
  const [slotAParams, setSlotAParams] = useState<SonicParams>(params);
  const [activeTooltip, setActiveTooltip] = useState<{ def: SonicParamDef; val: number } | null>(null);
  const [editingParam, setEditingParam] = useState<SonicParamId | null>(null);
  const [editStr, setEditStr] = useState('');
  const tooltipTimerRef = useRef<number | null>(null);

  // XY Gesture Pad state
  const padRef = useRef<HTMLDivElement | null>(null);
  const [xyPos, setXyPos] = useState<{ x: number; y: number } | null>(null);
  const [xyTrail, setXyTrail] = useState<Array<{ x: number; y: number }>>([]);
  const [xyPresetIdx, setXyPresetIdx] = useState(0);
  const [activeZoneName, setActiveZoneName] = useState('MULTI-ZONE SURFACE');
  const [slapBoost, setSlapBoost] = useState(1);

  const slidersScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const scheduleTooltip = (def: SonicParamDef, val: number, immediate = false) => {
    if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
    if (immediate) {
      setActiveTooltip({ def, val });
      return;
    }
    tooltipTimerRef.current = window.setTimeout(() => {
      setActiveTooltip({ def, val });
    }, 420);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
    setActiveTooltip(null);
  };

  const handleToggleAB = () => {
    if (abSlot === 'A') {
      setSlotAParams(params);
      setAbSlot('B');
      onApplyAllParams(slotBParams, 'SLOT B');
    } else {
      setSlotBParams(params);
      setAbSlot('A');
      onApplyAllParams(slotAParams, 'CUSTOM');
    }
  };

  const handleReset = () => {
    const next: SonicParams = { ...DEFAULT_SONIC_PARAMS };
    lockedParams.forEach((id) => {
      next[id] = params[id];
    });
    onApplyAllParams(next, 'CLEAN');
  };

  const handleApplyPreset = (presetId: 'clean' | '1' | '2' | '3') => {
    const preset = SONIC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const next: SonicParams = { ...DEFAULT_SONIC_PARAMS, ...preset.overrides };
    lockedParams.forEach((id) => {
      next[id] = params[id];
    });
    onApplyAllParams(next, preset.label);
  };

  const applyXyPreset = (idx: number) => {
    const chosen = XY_PRESETS[idx];
    if (!chosen) return;
    setXyPresetIdx(idx);
    setActiveZoneName(chosen.name);
    const next: SonicParams = { ...DEFAULT_SONIC_PARAMS, ...chosen.patch };
    lockedParams.forEach((id) => {
      next[id] = params[id];
    });
    onApplyAllParams(next, chosen.name);
  };

  const handleSliderDrag = (def: SonicParamDef, clientY: number, rect: DOMRect) => {
    if (lockedParams.has(def.id)) return;
    const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const raw = def.min + pct * (def.max - def.min);
    const snapped = Math.round(raw / def.step) * def.step;
    const clamped = Math.max(def.min, Math.min(def.max, Number(snapped.toFixed(3))));
    onChangeParam(def.id, clamped);
    scheduleTooltip(def, clamped, true);
  };

  const handlePadPointer = (e: React.PointerEvent) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setXyPos({ x, y });
    setXyTrail((prev) => [...prev.slice(-22), { x, y }]);

    // 4-Quadrant modulation matching Screenshot 8 labels
    if (x < 0.5 && y < 0.5) {
      setActiveZoneName('FILTER × PITCH');
      const cutoff = Math.round(250 + (1 - y * 2) * 18000);
      const pitch = Number((((x * 2 - 0.5) * 2) * 4).toFixed(1));
      onChangeParam('cutoff', cutoff);
      onChangeParam('pitch', pitch);
    } else if (x >= 0.5 && y < 0.5) {
      setActiveZoneName('TREMOLO × PHASER');
      onChangeParam('tremoloDepth', Math.round((x - 0.5) * 200));
      onChangeParam('phaserDepth', Math.round((1 - y * 2) * 100));
    } else if (x < 0.5 && y >= 0.5) {
      setActiveZoneName('DISTORT × CRUSH');
      onChangeParam('distortion', Math.round((y - 0.5) * 200));
      onChangeParam('bitCrushMix', Math.round((0.5 - x) * 160));
    } else {
      setActiveZoneName('REVERB × REVERB');
      onChangeParam('reverbMix', Math.round((x - 0.5) * 200));
      onChangeParam('reverbSize', Number((1.0 + (y - 0.5) * 12).toFixed(1)));
    }
  };

  return (
    <section
      className={`w-full px-2 sm:px-3 py-1.5 bg-[#050507] border-b border-white/[0.08] select-none transition-all ${
        mode === 'xy' ? 'mx-auto' : ''
      }`}
    >
      <div
        data-tour-target="sonic-engine-container"
        className={`rounded-xl transition-all ${
          mode === 'xy'
            ? 'border border-[#D4AF37] bg-[#07070a] shadow-[0_0_24px_rgba(212,175,55,0.2)] p-2'
            : 'bg-transparent'
        }`}
      >
        {/* Top Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 px-1">
          <div className="flex items-center gap-2">
            {/* 3-Button Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#111116] border border-white/10">
              <button
                type="button"
                data-tour-target="gesture-pad-toggle"
                onClick={() => onChangeMode('xy')}
                title="2D X/Y Gesture Pad"
                className={`relative w-8 h-7 rounded-md flex items-center justify-center transition ${
                  mode === 'xy'
                    ? 'bg-[#D4AF37]/20 text-[#FACC15] border border-[#D4AF37]/60'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute -top-0.5 -right-0.5 opacity-80" />
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('aftertouch')}
                title="Polyphonic Aftertouch Matrix & Routing"
                className={`w-8 h-7 rounded-md flex items-center justify-center transition ${
                  mode === 'aftertouch'
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-400/60'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('sliders')}
                title="52 Vertical Parameter Sliders"
                className={`w-8 h-7 rounded-md flex items-center justify-center transition ${
                  mode === 'sliders'
                    ? 'bg-[#D4AF37]/20 text-[#FACC15] border border-[#D4AF37]/60'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Secondary Controls based on Mode matching Screenshots 1 & 8 */}
            {mode === 'xy' ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center h-7 rounded-lg bg-[#111116] border border-white/10 px-1 gap-1">
                  <button
                    type="button"
                    aria-label="Previous XY Preset"
                    onClick={() => {
                      const next = (xyPresetIdx - 1 + XY_PRESETS.length) % XY_PRESETS.length;
                      applyXyPreset(next);
                    }}
                    className="p-0.5 text-white/55 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white/75" />
                  <button
                    type="button"
                    aria-label="Next XY Preset"
                    onClick={() => {
                      const next = (xyPresetIdx + 1) % XY_PRESETS.length;
                      applyXyPreset(next);
                    }}
                    className="p-0.5 text-white/55 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center h-7 rounded-lg bg-[#111116] border border-white/10 px-1.5 gap-1">
                  <button
                    type="button"
                    aria-label="Decrease Slap Intensity"
                    onClick={() => setSlapBoost((s) => Math.max(1, s - 1))}
                    className="p-0.5 text-white/55 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <Zap className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]/40" />
                  <span className="text-[9.5px] font-bold font-mono text-[#FACC15]">{slapBoost}×</span>
                  <button
                    type="button"
                    aria-label="Increase Slap Intensity"
                    onClick={() => setSlapBoost((s) => Math.min(4, s + 1))}
                    className="p-0.5 text-white/55 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="leading-tight">
                <div className="text-[11px] font-black tracking-widest uppercase text-white/90">
                  SONIC ENGINE
                </div>
                <div className="text-[9.5px] font-bold tracking-wider uppercase text-[#D4AF37]">
                  {presetName}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: A/B & Reset */}
          <div className="flex items-center gap-1.5">
            {mode !== 'xy' && (
              <button
                type="button"
                onClick={handleToggleAB}
                title="Compare Slot A / Slot B Sonic Settings"
                className={`px-2.5 h-7 rounded-md text-[10px] font-bold border transition ${
                  abSlot === 'B'
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-white/[0.04] text-white/75 border-white/10 hover:border-white/25'
                }`}
              >
                {abSlot === 'A' ? 'A/B' : 'A/B (B)'}
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              title="Reset Unlocked Parameters to Clean"
              className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/65 hover:text-white hover:border-white/25 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Latched Keys Bar matching [data-testid="dj-latched-keys-bar"] */}
        <div
          data-testid="dj-latched-keys-bar"
          className="h-7 flex items-center gap-1.5 px-2 rounded-[8px] border border-white/10 bg-[#07080C]/95 mb-1.5 overflow-x-auto no-scrollbar"
        >
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-white/10">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                latchedNotes.length > 0 ? 'bg-[#D4AF37]' : 'bg-white/25'
              }`}
            />
            <span className="text-[9px] font-black uppercase tracking-wider text-white/70 font-montserrat">
              LATCHED
            </span>
          </div>
          {latchedNotes.length === 0 ? (
            <span data-testid="dj-latched-empty" className="text-[9.5px] text-white/35 truncate">
              Right-click key, hold pad (2 fingers), or loop sample to latch · tap chips to route FX
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {latchedNotes.map((chip) => (
                <div
                  key={chip.noteId}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                    chip.routedToFx
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FACC15]'
                      : 'bg-sky-500/15 border-sky-400/45 text-sky-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleChipRoute(chip.noteId)}
                    title={chip.routedToFx ? 'Routed to Live FX (Click for Sticky Freeze)' : 'Sticky FX Frozen (Bypassing FX)'}
                    className="flex items-center gap-1"
                  >
                    {!chip.routedToFx && <Snowflake className="w-2.5 h-2.5" />}
                    <span>{chip.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnlatchNote(chip.noteId)}
                    className="ml-0.5 text-white/60 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODE 1: 52 VERTICAL HARDWARE FADERS */}
        {mode === 'sliders' && (
          <div
            data-testid="studio-fx-sliders-view"
            className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#05060A]/95"
          >
            {/* Preset Bank Pills Header */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/[0.06] bg-[#09090d]">
              {SONIC_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    presetName === p.label
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FACC15]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/65 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <span className="text-[10px] text-white/45 ml-1">
                {presetName === 'CLEAN' || presetName === '1' || presetName === '2' || presetName === '3'
                  ? 'Custom'
                  : presetName}
              </span>
            </div>

            {/* White 420ms Hover / Drag Value Popover Badge (matches Screenshot 2 & 7) */}
            {activeTooltip && (
              <div className="hidden md:flex fixed right-4 bottom-[225px] z-40 max-w-[460px] rounded-md bg-white text-black px-2.5 py-1.5 text-[10.5px] leading-snug font-medium shadow-2xl border border-black/10 pointer-events-none">
                <span>
                  <strong>{activeTooltip.def.label}</strong> ({activeTooltip.def.format(activeTooltip.val)}): drag vertically to modulate (tap readout for exact value, right-click to lock).
                  {activeTooltip.def.keyCapable
                    ? ' Key-capable control: affects only routed latched keys when frozen chips exist.'
                    : ''}
                </span>
              </div>
            )}

            {/* Left/Right Overlay Scroll Chevrons */}
            <button
              type="button"
              aria-label="Scroll Sliders Left"
              onClick={() => slidersScrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
              className="hidden sm:flex absolute left-0 top-8 bottom-2 z-30 w-6 items-center justify-center bg-gradient-to-r from-[#05060A] to-transparent text-white/45 hover:text-white transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Scroll Sliders Right"
              onClick={() => slidersScrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
              className="hidden sm:flex absolute right-0 top-8 bottom-2 z-30 w-7 items-center justify-center bg-gradient-to-l from-[#05060A] via-[#05060A]/80 to-transparent text-white/60 hover:text-[#FACC15] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Horizontal 44px Column Bank */}
            <div
              ref={slidersScrollRef}
              data-testid="dj-gesture-sliders"
              className={`daw-slider-scroll flex items-stretch overflow-x-auto bg-[#05060A] pl-6 pr-7 ${
                compactEmbed ? 'h-[150px]' : 'h-[168px] sm:h-[178px]'
              }`}
            >
              {SONIC_PARAM_DEFS.map((def) => {
                const val = params[def.id];
                const pct = Math.max(0, Math.min(1, (val - def.min) / (def.max - def.min)));
                const isLocked = lockedParams.has(def.id);
                const isDefault = Math.abs(val - def.defaultVal) < 0.01;
                const accent = GROUP_ACCENTS[def.group];

                return (
                  <div
                    key={def.id}
                    onMouseEnter={() => scheduleTooltip(def, val, false)}
                    onMouseLeave={hideTooltip}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onToggleLockParam(def.id);
                    }}
                    className="dj-gesture-slider-col w-[44px] min-w-[44px] max-w-[44px] flex flex-col justify-between py-1.5 shrink-0 relative border-r border-white/[0.08] group"
                  >
                    {/* Center subtle gold hairline */}
                    <div
                      className="absolute left-1.5 right-1.5 top-1/2 h-[1px] pointer-events-none z-0"
                      style={{ background: 'rgba(212, 175, 55, 0.18)' }}
                    />

                    {/* Top Value Readout */}
                    <div className="relative z-10 px-0.5 text-center">
                      {editingParam === def.id ? (
                        <input
                          autoFocus
                          value={editStr}
                          onChange={(e) => setEditStr(e.target.value)}
                          onBlur={() => {
                            const n = Number(editStr);
                            if (!Number.isNaN(n)) {
                              onChangeParam(def.id, Math.max(def.min, Math.min(def.max, n)));
                            }
                            setEditingParam(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className="w-10 h-4 text-[9px] text-center bg-black border border-[#D4AF37] rounded text-white"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingParam(def.id);
                            setEditStr(String(val));
                          }}
                          title="Tap to enter exact numeric value"
                          className={`block font-mono font-bold text-[9px] truncate cursor-pointer ${
                            isDefault ? 'text-white/45' : 'text-[#FACC15]'
                          }`}
                        >
                          {def.format(val)}
                        </span>
                      )}
                    </div>

                    {/* Recessed Track + Machined Hardware Thumb */}
                    <div
                      role="slider"
                      aria-label={def.label}
                      aria-valuemin={def.min}
                      aria-valuemax={def.max}
                      aria-valuenow={val}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          onChangeParam(def.id, Math.min(def.max, val + def.step));
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          onChangeParam(def.id, Math.max(def.min, val - def.step));
                        }
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        const el = e.currentTarget;
                        try { el.setPointerCapture(e.pointerId); } catch {}
                        handleSliderDrag(def, e.clientY, el.getBoundingClientRect());
                      }}
                      onPointerMove={(e) => {
                        if (e.buttons === 0 && e.pressure === 0) return;
                        handleSliderDrag(def, e.clientY, e.currentTarget.getBoundingClientRect());
                      }}
                      onDoubleClick={() => {
                        if (!isLocked) onChangeParam(def.id, def.defaultVal);
                      }}
                      className="flex-1 w-full relative cursor-ns-resize flex justify-center my-1.5 touch-none z-10"
                    >
                      {/* Recessed groove */}
                      <div
                        className="absolute top-0 bottom-0 w-3 rounded-full overflow-hidden bg-zinc-800/60"
                        style={{
                          boxShadow:
                            'inset 0 2px 4px rgba(0,0,0,0.45), inset 0 -1px 2px rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="absolute top-1.5 bottom-1.5 left-1/2 -translate-x-1/2 w-[1px] bg-white/10" />
                        <div
                          className="w-full absolute bottom-0 rounded-full"
                          style={{ height: `${Math.max(4, pct * 100)}%` }}
                        >
                          <div className={`absolute inset-0 rounded-full opacity-80 ${accent.bar}`} />
                          <div className={`absolute inset-0 rounded-full blur-[2px] opacity-35 ${accent.bar}`} />
                        </div>
                      </div>

                      {/* Machined metallic hardware thumb cap */}
                      <div
                        className={`absolute left-1/2 -ml-[17px] w-[34px] h-6 rounded-md flex items-center justify-center pointer-events-none transition-transform ${
                          isLocked ? 'ring-1 ring-sky-400' : ''
                        }`}
                        style={{
                          bottom: `calc(${pct * 82}% + 1px)`,
                          background: 'linear-gradient(145deg, #27272e 0%, #151519 100%)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          boxShadow:
                            '0 4px 10px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.14) inset',
                        }}
                      >
                        <div className="flex flex-col gap-[2px] w-full px-2">
                          <div className="h-[1px] bg-white/15 w-full rounded-full" />
                          <div className={`h-[2px] w-4/5 mx-auto rounded-full opacity-95 ${accent.led}`} />
                          <div className="h-[1px] bg-white/15 w-full rounded-full" />
                        </div>
                      </div>

                      {isLocked && (
                        <Lock className="w-2.5 h-2.5 text-sky-400 absolute top-0 right-1 pointer-events-none" />
                      )}
                    </div>

                    {/* Bottom Icon + Dotted Label */}
                    <button
                      type="button"
                      onClick={() => onToggleLockParam(def.id)}
                      title="Click to lock/unlock parameter"
                      className="relative z-10 flex flex-col items-center gap-0.5 w-full px-0.5 text-white/65 hover:text-white transition"
                    >
                      {renderGroupIcon(def.group, `w-3 h-3 shrink-0 ${accent.text}`)}
                      <span className="flex items-center gap-0.5 text-[7.5px] font-bold uppercase tracking-tight border-b border-dotted border-white/25 pb-0.5 truncate max-w-full">
                        {isLocked && <Unlock className="w-2 h-2 text-sky-400 shrink-0" />}
                        <span className="truncate">{def.label}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: 2D XY GESTURE PAD matching Screenshot 8 */}
        {mode === 'xy' && (
          <div
            ref={padRef}
            data-testid="xy-gesture-surface"
            onPointerDown={(e) => {
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
              handlePadPointer(e);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pressure > 0) handlePadPointer(e);
            }}
            onPointerUp={() => setXyPos(null)}
            className="relative w-full h-[148px] rounded-xl bg-gradient-to-b from-[#09090c] to-[#050507] border border-white/[0.08] overflow-hidden cursor-crosshair flex flex-col items-center justify-center touch-none"
          >
            {/* L - R Stereo Pan Center Track */}
            <div className="absolute inset-x-4 top-[36%] flex items-center gap-2 pointer-events-none opacity-45">
              <span className="text-[9px] font-mono text-white/70">L</span>
              <div className="flex-1 h-[1px] bg-white/15 relative">
                <span className="absolute left-1/2 -top-1 w-[1px] h-2.5 bg-white/35" />
              </div>
              <span className="text-[9px] font-mono text-white/70">R</span>
            </div>

            {/* Side calibration gauge rails */}
            <div className="hidden sm:flex absolute left-3 top-6 bottom-6 w-2 border-l border-white/10 flex-col justify-between pointer-events-none">
              <span className="w-1.5 h-[1px] bg-white/20" />
              <span className="w-1.5 h-[1px] bg-white/20" />
              <span className="w-1.5 h-[1px] bg-white/20" />
            </div>
            <div className="hidden sm:flex absolute right-3 top-6 bottom-6 w-2 border-r border-white/10 flex-col justify-between items-end pointer-events-none">
              <span className="w-1.5 h-[1px] bg-white/20" />
              <span className="w-1.5 h-[1px] bg-white/20" />
              <span className="w-1.5 h-[1px] bg-white/20" />
            </div>

            {/* Quadrant Labels matching Screenshot 8 */}
            <div className="absolute top-3 left-1/4 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[10px] font-black tracking-widest text-white/60">FILTER</div>
              <div className="text-[9px] font-semibold text-white/35">PITCH</div>
            </div>
            <div className="absolute top-3 left-3/4 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[10px] font-black tracking-widest text-white/60">TREMOLO</div>
              <div className="text-[9px] font-semibold text-white/35">PHASER</div>
            </div>
            <div className="absolute bottom-3 left-1/4 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[10px] font-black tracking-widest text-white/60">DISTORT</div>
              <div className="text-[9px] font-semibold text-white/35">CRUSH</div>
            </div>
            <div className="absolute bottom-3 left-3/4 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[10px] font-black tracking-widest text-white/60">REVERB</div>
              <div className="text-[9px] font-semibold text-white/35">REVERB</div>
            </div>

            {/* Center Label & Space Throw Button */}
            <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-auto">
              <span className="px-3.5 py-1 rounded-full bg-[#15151a] border border-white/10 text-[10px] font-extrabold tracking-[0.2em] text-white/70 pointer-events-none">
                {activeZoneName}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (slapBoost > 1) {
                    onChangeParam('reverbSize', Math.min(7.5, 2.5 + slapBoost * 1.1));
                    onChangeParam('delayMix', Math.min(80, 22 + slapBoost * 12));
                  }
                  onSpaceThrow();
                }}
                className="px-4 py-1.5 rounded-full bg-white text-black font-black text-[10px] tracking-wider shadow-[0_0_24px_rgba(255,255,255,0.35)] hover:bg-[#FACC15] transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>
                  <span className="text-[#B48A1E]">SPACE THROW ({slapBoost}×)</span> · SLAP HARD TO TRIGGER
                </span>
              </button>
            </div>

            {/* SVG Gesture Trail & Active Reticle */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {xyTrail.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#FACC15"
                  strokeOpacity="0.55"
                  strokeWidth="0.6"
                  points={xyTrail.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                />
              )}
            </svg>
            {xyPos && (
              <div
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-[#FACC15] bg-[#FACC15]/25 shadow-[0_0_16px_rgba(250,204,21,0.8)] pointer-events-none"
                style={{ left: `${xyPos.x * 100}%`, top: `${xyPos.y * 100}%` }}
              />
            )}
          </div>
        )}

        {/* MODE 3: POLYPHONIC AFTERTOUCH TELEMETRY */}
        {mode === 'aftertouch' && (
          <div className="h-[148px] rounded-xl bg-[#0b0b10] border border-sky-500/35 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-sky-300">Polyphonic MPE Aftertouch Surface</div>
                <div className="text-[10px] text-white/55">
                  Hold any key or pad for 200ms and drag without lifting to modulate live sound per note
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                Pitch Bend Range: ±{Math.round(params.pitchBendRange)} st
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="text-xs font-bold text-sky-300">↑ Vibrato</div>
                <div className="text-[10px] text-white/60">Organic LFO (0–68¢)</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="text-xs font-bold text-orange-300">↓ Volume</div>
                <div className="text-[10px] text-white/60">Smooth Soften (-72%)</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="text-xs font-bold text-[#D4AF37]">← Cutoff · → Drive</div>
                <div className="text-[10px] text-white/60">Per-Voice Tone + Bend</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="text-xs font-bold text-emerald-300">Right-Click / 2-Finger</div>
                <div className="text-[10px] text-white/60">Hold-Latch &amp; FX Freeze</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
