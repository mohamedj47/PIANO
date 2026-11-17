import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Disc3,
  Headphones,
  Repeat,
  SlidersHorizontal,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { DJ_STARTER_KITS, REALMS, RealmId } from '../../data/realms';
import { getKEdoStepInfo, getNoteTuningInfo, RootNote, WorldScale } from '../../data/scales';
import { InstrumentId } from '../../data/instruments';
import { LatchedNoteChip, PianoKeyboardStage } from './PianoKeyboardStage';
import { SonicEnginePanel, SonicPanelMode } from './SonicEnginePanel';
import { SonicParamId, SonicParams } from '../../data/sonicParams';
import { audioEngine } from '../../audio/MaqAmirAudioEngine';

interface RealmsStageProps {
  realmId: Exclude<RealmId, 'play'>;
  onExitRealm: () => void;
  onSwitchRealm: (id: RealmId) => void;
  skin: string;
  instrument: InstrumentId;
  scale: WorldScale;
  rootNote: RootNote;
  params: SonicParams;
  onChangeParam: (id: SonicParamId, value: number) => void;
  onApplyAllParams: (next: SonicParams, presetLabel?: string) => void;
  presetName: string;
  lockedParams: Set<SonicParamId>;
  onToggleLockParam: (id: SonicParamId) => void;
  activeNotes: Set<string>;
  latchedNotes: LatchedNoteChip[];
  onNoteOn: (noteId: string, midiNote: number, velocity: number, latched?: boolean, extraDetuneCents?: number, overrideFreqHz?: number) => void;
  onNoteOff: (noteId: string, force?: boolean) => void;
  onToggleLatch: (noteId: string, midiNote: number, label: string) => void;
  onToggleChipRoute: (noteId: string) => void;
  onAftertouchMove: (noteId: string, dxNorm: number, dyNorm: number) => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
}

const MANDALA_STAFF_NOTES = [
  'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3',
  'C3',
  'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2', 'C2',
];

export const RealmsStage: React.FC<RealmsStageProps> = ({
  realmId,
  onExitRealm,
  onSwitchRealm,
  skin,
  instrument,
  scale,
  rootNote,
  params,
  onChangeParam,
  onApplyAllParams,
  presetName,
  lockedParams,
  onToggleLockParam,
  activeNotes,
  latchedNotes,
  onNoteOn,
  onNoteOff,
  onToggleLatch,
  onToggleChipRoute,
  onAftertouchMove,
  bpm,
  onChangeBpm,
  isRecording,
  onToggleRecord,
}) => {
  const [showControlCenter, setShowControlCenter] = useState(false);

  // Dual piano manual state
  const [topManualOct, setTopManualOct] = useState(4);
  const [bottomManualOct, setBottomManualOct] = useState(2);
  const [manualSpan, setManualSpan] = useState<2 | 3 | 4>(3);

  // DJ Performance Deck state
  const [djKitIdx, setDjKitIdx] = useState(0);
  const [djLayout, setDjLayout] = useState<'6x2' | '4x3' | '5+7' | 'vinyl'>('6x2');
  const [djOctavesSpan, setDjOctavesSpan] = useState<1 | 2 | 3 | 4>(2);
  const [djBaseOctave, setDjBaseOctave] = useState(3);
  const [djChannel, setDjChannel] = useState(2);
  const [djLoopPads, setDjLoopPads] = useState<Set<number>>(new Set());
  const [djActivePads, setDjActivePads] = useState<Set<number>>(new Set());
  const [armPadRec, setArmPadRec] = useState(false);
  const [recordingPadIdx, setRecordingPadIdx] = useState<number | null>(null);
  const [customPads, setCustomPads] = useState<Set<number>>(new Set());
  const [sonicMode, setSonicMode] = useState<SonicPanelMode>('sliders');
  const [turntableDegA, setTurntableDegA] = useState(0);
  const [turntableDegB, setTurntableDegB] = useState(0);
  const djPadPointerRef = useRef<Map<number, { idx: number; noteId: string; startX: number; startY: number }>>(new Map());

  // Qiano K-EDO state
  const [kEdo, setKEdo] = useState<17 | 19 | 24 | 31 | 48 | 53>(24);

  // Mandala & Continuous String state
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);
  const [activeStaffIdx, setActiveStaffIdx] = useState<number | null>(null);
  const [glissandoPos, setGlissandoPos] = useState<{ x: number; y: number } | null>(null);
  const ribbonAnchorRef = useRef<{ noteId: string; startX: number } | null>(null);
  const loopIntervalRef = useRef<number | null>(null);

  const currentKit = DJ_STARTER_KITS[djKitIdx];
  const currentRealm = REALMS.find((r) => r.id === realmId) || REALMS[1];

  const computeDjPadMidi = (idx: number, baseMidi?: number) => {
    const octOffset = (idx % djOctavesSpan) * 12;
    return (baseMidi || 60) + (djBaseOctave - 3) * 12 + octOffset;
  };

  // DJ looped pads engine synchronized to BPM
  useEffect(() => {
    if (djLoopPads.size === 0) {
      if (loopIntervalRef.current) window.clearInterval(loopIntervalRef.current);
      return;
    }
    const stepMs = Math.max(120, Math.round(60000 / bpm / 2));
    let step = 0;
    loopIntervalRef.current = window.setInterval(() => {
      const kit = DJ_STARTER_KITS[djKitIdx];
      djLoopPads.forEach((padIdx) => {
        const pad = kit.pads[padIdx];
        if (!pad) return;
        if (pad.type === 'drum' || step % 2 === 0) {
          if (audioEngine.hasCustomPadSample(padIdx)) {
            audioEngine.playCustomPadSample(padIdx, 0.85, Math.pow(2, (djBaseOctave - 3)));
          } else {
            audioEngine.triggerDrumOrPad(pad.soundId, scale, rootNote, computeDjPadMidi(padIdx, pad.midiNote));
          }
          setDjActivePads((prev) => new Set(prev).add(padIdx));
          setTimeout(() => {
            setDjActivePads((prev) => {
              const next = new Set(prev);
              next.delete(padIdx);
              return next;
            });
          }, 110);
        }
      });
      step++;
    }, stepMs);
    return () => {
      if (loopIntervalRef.current) window.clearInterval(loopIntervalRef.current);
    };
  }, [djLoopPads, bpm, djKitIdx, djBaseOctave, djOctavesSpan, scale, rootNote]);

  // Scale notes across 2 octaves for geometric realms
  const geometricNotes = useMemo(() => {
    const out: Array<{ midi: number; label: string; degreeIdx: number }> = [];
    for (let oct = 3; oct <= 5; oct++) {
      scale.degrees.forEach((deg, idx) => {
        const midi = (oct + 1) * 12 + deg;
        const info = getNoteTuningInfo(midi, scale, rootNote, params.baseTuning);
        out.push({ midi, label: info.noteLabel, degreeIdx: idx });
      });
    }
    return out;
  }, [scale, rootNote, params.baseTuning]);

  // Parametric Archimedean spiral SVG path for Meend Spiral realm
  const meendSpiralPath = useMemo(() => {
    const pts: string[] = [];
    const turns = 2.7;
    const total = 96;
    for (let i = 0; i <= total; i++) {
      const t = i / total;
      const theta = t * turns * Math.PI * 2 - Math.PI / 2;
      const r = 18 + t * 145;
      const x = 200 + Math.cos(theta) * r;
      const y = 200 + Math.sin(theta) * r;
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  const triggerDjPad = async (idx: number) => {
    if (armPadRec) {
      if (recordingPadIdx === idx) {
        const ok = await audioEngine.stopPadSampleCapture(idx);
        setRecordingPadIdx(null);
        setArmPadRec(false);
        if (ok) {
          setCustomPads((prev) => new Set(prev).add(idx));
          audioEngine.playCustomPadSample(idx, 0.9, Math.pow(2, djBaseOctave - 3));
        }
        return;
      } else {
        setRecordingPadIdx(idx);
        await audioEngine.startPadSampleCapture(true);
        return;
      }
    }

    const pad = currentKit.pads[idx];
    if (!pad) return;
    if (audioEngine.hasCustomPadSample(idx)) {
      audioEngine.playCustomPadSample(idx, 0.9, Math.pow(2, djBaseOctave - 3));
    } else {
      const shiftedMidi = computeDjPadMidi(idx, pad.midiNote);
      audioEngine.triggerDrumOrPad(pad.soundId, scale, rootNote, shiftedMidi);
    }
    setDjActivePads((prev) => new Set(prev).add(idx));
    setTimeout(() => {
      setDjActivePads((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }, 150);
  };

  const toggleDjLoopPad = (idx: number) => {
    setDjLoopPads((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Top Control Center Modal for quick realm switching & manual span settings
  const renderControlCenterModal = () =>
    showControlCenter && (
      <>
        <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setShowControlCenter(false)} />
        <div className="fixed right-4 top-14 z-50 w-80 max-h-[82vh] overflow-y-auto rounded-2xl bg-[#101015] border border-[#D4AF37]/50 p-3 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
              Realm Control Center
            </span>
            <button
              type="button"
              onClick={() => setShowControlCenter(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {realmId === 'piano' && (
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Dual Manual Octave Ranges
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Span:</span>
                <div className="flex gap-1">
                  {([2, 3, 4] as const).map((span) => (
                    <button
                      key={span}
                      type="button"
                      onClick={() => setManualSpan(span)}
                      className={`px-2 py-0.5 rounded font-bold ${
                        manualSpan === span ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/75'
                      }`}
                    >
                      {span} Oct
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Upper ({topManualOct}):</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setTopManualOct(Math.max(1, topManualOct - 1))} className="px-2 py-0.5 rounded bg-white/10">&lt;</button>
                  <button type="button" onClick={() => setTopManualOct(Math.min(5, topManualOct + 1))} className="px-2 py-0.5 rounded bg-white/10">&gt;</button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Lower ({bottomManualOct}):</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setBottomManualOct(Math.max(1, bottomManualOct - 1))} className="px-2 py-0.5 rounded bg-white/10">&lt;</button>
                  <button type="button" onClick={() => setBottomManualOct(Math.min(5, bottomManualOct + 1))} className="px-2 py-0.5 rounded bg-white/10">&gt;</button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            {REALMS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSwitchRealm(r.id);
                  setShowControlCenter(false);
                }}
                className={`p-2 rounded-lg border text-left transition ${
                  r.id === realmId
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                    : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{r.name}</div>
                <div className="text-[9px] text-white/50 truncate">{r.subtitle}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowControlCenter(false);
              onExitRealm();
            }}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
          >
            Exit to Main Studio
          </button>
        </div>
      </>
    );

  // =========================================================================
  // REALM: PIANO DUAL GRAND MANUALS (full-bleed edge-to-edge matching image (3).png)
  // =========================================================================
  if (realmId === 'piano') {
    const dualSkin = skin === 'classic' ? 'midnight' : skin;
    return (
      <div className="fixed inset-0 z-40 bg-[#050507] flex flex-col justify-between select-none">
        {/* Corner Minimal Controls Overlay matching Screenshot 3 */}
        <button
          type="button"
          onClick={onToggleRecord}
          title="Record Dual Piano Performance"
          className={`fixed top-2.5 left-2.5 z-50 w-8 h-8 rounded-lg flex items-center justify-center border shadow-lg transition ${
            isRecording
              ? 'bg-red-500/30 border-red-500 text-red-400 animate-pulse'
              : 'bg-[#121216]/90 border-white/15 text-red-500 hover:border-red-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        </button>

        <div className="fixed top-2.5 right-2.5 z-50 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowControlCenter(!showControlCenter)}
            className="w-8 h-8 rounded-lg bg-[#121216]/90 border border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shadow-lg hover:bg-[#D4AF37]/20"
            title="Control Center & Octave Ranges"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onExitRealm}
            title="Exit Piano Realm"
            className="w-8 h-8 rounded-lg bg-[#121216]/90 border border-white/15 flex items-center justify-center text-white/75 hover:text-white shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Full-bleed Top Manual */}
        <div className="flex-1 min-h-0">
          <PianoKeyboardStage
            skin={dualSkin}
            instrument={instrument}
            scale={scale}
            rootNote={rootNote}
            baseTuningHz={params.baseTuning}
            octaveOffset={topManualOct}
            onChangeOctaveOffset={setTopManualOct}
            activeNotes={activeNotes}
            latchedNotes={latchedNotes}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
            onToggleLatch={onToggleLatch}
            onAftertouchMove={onAftertouchMove}
            visibleOctaves={manualSpan}
            heightClass="h-full"
            hideFloatingOctaves
          />
        </div>

        {/* Full-bleed Bottom Manual */}
        <div className="flex-1 min-h-0 border-t-2 border-black">
          <PianoKeyboardStage
            skin={dualSkin}
            instrument={instrument}
            scale={scale}
            rootNote={rootNote}
            baseTuningHz={params.baseTuning}
            octaveOffset={bottomManualOct}
            onChangeOctaveOffset={setBottomManualOct}
            activeNotes={activeNotes}
            latchedNotes={latchedNotes}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
            onToggleLatch={onToggleLatch}
            onAftertouchMove={onAftertouchMove}
            visibleOctaves={manualSpan}
            heightClass="h-full"
            hideFloatingOctaves
          />
        </div>

        {renderControlCenterModal()}
      </div>
    );
  }

  // =========================================================================
  // REALM: DJ PERFORMANCE DECK (matches image (4).png)
  // =========================================================================
  if (realmId === 'dj') {
    const renderDjPad = (pad: typeof currentKit.pads[number], idx: number) => {
      const isActive = djActivePads.has(idx);
      const isLooped = djLoopPads.has(idx);
      const isRec = recordingPadIdx === idx;
      const hasCustom = customPads.has(idx);
      const padMidi = computeDjPadMidi(idx, pad.midiNote);
      const noteInfo = pad.midiNote ? getNoteTuningInfo(padMidi, scale, rootNote, params.baseTuning) : null;

      return (
        <div
          key={pad.label}
          data-testid={`dj-pad-${idx}`}
          onPointerDown={(e) => {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
            const noteId = `djpad-${idx}`;
            djPadPointerRef.current.set(e.pointerId, {
              idx,
              noteId,
              startX: e.clientX,
              startY: e.clientY,
            });
            void triggerDjPad(idx);
          }}
          onPointerMove={(e) => {
            const rec = djPadPointerRef.current.get(e.pointerId);
            if (!rec) return;
            const dxNorm = Math.max(-1, Math.min(1, (e.clientX - rec.startX) / 70));
            const dyNorm = Math.max(-1, Math.min(1, (e.clientY - rec.startY) / 70));
            if (Math.abs(dxNorm) > 0.1 || Math.abs(dyNorm) > 0.1) {
              onAftertouchMove(rec.noteId, dxNorm, dyNorm);
            }
          }}
          onPointerUp={(e) => {
            djPadPointerRef.current.delete(e.pointerId);
          }}
          className={`relative min-h-[104px] sm:min-h-[124px] rounded-xl border p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-75 ${
            isRec
              ? 'bg-red-950/60 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.45)] animate-pulse'
              : isActive
              ? 'bg-[#242014] border-[#FACC15] shadow-[0_0_22px_rgba(250,204,21,0.35)] scale-[0.97]'
              : isLooped
              ? 'bg-[#171822] border-cyan-400/70'
              : armPadRec
              ? 'bg-gradient-to-b from-[#1f1315] to-[#0a0a0e] border-red-400/50 hover:border-red-400'
              : 'bg-gradient-to-b from-[#15151b] to-[#0a0a0e] border-white/[0.12] hover:border-[#D4AF37]/50'
          }`}
        >
          <span className="text-[9px] text-white/25 text-center">^</span>
          <div className="absolute top-2 left-2 flex items-center gap-1">
            {noteInfo && (
              <span className="px-1 py-0.5 rounded bg-white/[0.06] text-[8.5px] font-mono text-white/75">
                {noteInfo.noteLabel}
              </span>
            )}
            {hasCustom && (
              <button
                type="button"
                title="Clear Custom Sample"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  audioEngine.clearCustomPadSample(idx);
                  setCustomPads((prev) => {
                    const next = new Set(prev);
                    next.delete(idx);
                    return next;
                  });
                }}
                className="px-1 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[8px] font-bold text-emerald-300 hover:bg-red-500/30 hover:text-white"
              >
                REC ×
              </button>
            )}
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleDjLoopPad(idx);
            }}
            title="Toggle Beat-Synced Pad Loop"
            className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${
              isLooped
                ? 'bg-cyan-400 border-cyan-300 text-black'
                : 'bg-black/60 border-white/20 text-white/45 hover:text-white'
            }`}
          >
            <Repeat className="w-2.5 h-2.5" />
          </button>

          <div className="flex items-center justify-between text-white/20 text-[10px]">
            <span>&lt;</span>
            <div className="text-center px-1">
              <div className="text-[11px] font-black tracking-wide text-white leading-tight">
                {isRec ? 'RECORDING...' : pad.label}
              </div>
              <div className="text-[9px] font-semibold mt-0.5" style={{ color: pad.color }}>
                {armPadRec && !isRec ? 'Tap to Sample' : pad.sub}
              </div>
            </div>
            <span>&gt;</span>
          </div>

          <span className="text-[9px] text-white/25 text-center">v</span>
        </div>
      );
    };

    const colsClass =
      djLayout === '6x2'
        ? 'grid-cols-3 sm:grid-cols-6'
        : 'grid-cols-3 sm:grid-cols-4';

    return (
      <div className="fixed inset-0 z-40 bg-[#050507] flex flex-col justify-between overflow-y-auto select-none">
        {/* Top DJ Performance Deck Header */}
        <div className="px-3 py-1.5 bg-[#09090c] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleRecord}
              className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                isRecording ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-white/20 bg-black'
              }`}
              title="Record Live DJ Performance"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </button>
            <span className="text-[11px] font-black tracking-widest uppercase text-white">
              DJ PERFORMANCE DECK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-white/85">
              {instrument}
            </span>
          </div>

          <div className="hidden lg:block text-[10px] font-bold tracking-[0.22em] text-[#D4AF37]">
            MAQAMIR DJ MATRIX · ↑VIB ↓FLT ↔BEND
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* BPM Control */}
            <div className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-black border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <input
                type="number"
                min={60}
                max={180}
                value={bpm}
                onChange={(e) => onChangeBpm(Math.max(60, Math.min(180, Number(e.target.value) || 120)))}
                className="w-9 bg-transparent text-center focus:outline-none text-white"
              />
              <span className="text-[9px] text-white/60">BPM</span>
            </div>

            {/* Matrix Layout Switcher */}
            <button
              type="button"
              data-testid="dj-layout-toggle"
              onClick={() =>
                setDjLayout((prev) =>
                  prev === '6x2' ? '4x3' : prev === '4x3' ? '5+7' : prev === '5+7' ? 'vinyl' : '6x2'
                )
              }
              className="px-2.5 h-7 rounded-full bg-[#0f1f24] border border-cyan-500/40 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20"
            >
              {djLayout === 'vinyl' ? 'Dual Vinyl' : `${djLayout} Matrix`}
            </button>

            {/* Arm Sample Record */}
            <button
              type="button"
              onClick={() => {
                if (recordingPadIdx !== null) {
                  void audioEngine.stopPadSampleCapture(recordingPadIdx).then((ok) => {
                    if (ok) setCustomPads((prev) => new Set(prev).add(recordingPadIdx));
                    setRecordingPadIdx(null);
                  });
                }
                setArmPadRec((a) => !a);
              }}
              className={`px-2.5 h-7 rounded-full border text-[10px] font-bold transition ${
                armPadRec || recordingPadIdx !== null
                  ? 'bg-red-500/25 border-red-400 text-red-300 animate-pulse'
                  : 'bg-white/[0.04] border-white/15 text-white/75 hover:border-red-400/50'
              }`}
              title="Arm live sample capture onto any DJ pad"
            >
              {recordingPadIdx !== null ? 'STOP REC' : armPadRec ? 'PICK PAD' : 'ARM REC'}
            </button>

            {/* Octave Range Arrows */}
            <div className="hidden sm:flex items-center gap-1 px-2 h-7 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-white/80">
              <button type="button" onClick={() => setDjBaseOctave(Math.max(1, djBaseOctave - 1))}>
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span>Oct {djBaseOctave}-{djBaseOctave + djOctavesSpan - 1}</span>
              <button type="button" onClick={() => setDjBaseOctave(Math.min(6, djBaseOctave + 1))}>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* 1 Oct / 2 Oct / 3 Oct / 4 Oct */}
            <div className="hidden md:flex items-center rounded-lg bg-white/[0.04] border border-white/10 p-0.5">
              {([1, 2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDjOctavesSpan(n)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    djOctavesSpan === n ? 'bg-[#D4AF37] text-black' : 'text-white/65 hover:text-white'
                  }`}
                >
                  {n} Oct
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowControlCenter(!showControlCenter)}
              className="w-7 h-7 rounded-lg bg-[#141418] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]"
              title="Switch Realm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExitRealm}
              className="px-2.5 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Pad Grid or Dual Vinyl Turntables (-14° 3D Perspective Dive + 12x 30° Sectors) */}
        <div className="px-3 py-2 flex-1 flex flex-col justify-center">
          {/* Quick Starter Kits + Stop Loops + Channel Cues Strip */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 max-w-[1380px] mx-auto w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45 mr-1">
                Kits:
              </span>
              {DJ_STARTER_KITS.map((kit, i) => (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => {
                    setDjKitIdx(i);
                    onChangeBpm(kit.bpm);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    djKitIdx === i
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FACC15]'
                      : 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {kit.name}
                </button>
              ))}
              {djLoopPads.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDjLoopPads(new Set())}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30"
                >
                  Stop All Loops ({djLoopPads.size})
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-cyan-400 mr-1" />
              <span className="text-[10px] text-white/50">CH - {djChannel} +</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    setDjChannel(ch);
                    audioEngine.setCueChannel(ch);
                  }}
                  className={`w-5 h-5 rounded text-[10px] font-bold ${
                    djChannel === ch
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/[0.05] text-white/60 hover:text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {djLayout === 'vinyl' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
              {[
                { deck: 'DECK A', deg: turntableDegA, setDeg: setTurntableDegA, sound: 'scratch', midi: 48 },
                { deck: 'DECK B', deg: turntableDegB, setDeg: setTurntableDegB, sound: 'riser', midi: 55 },
              ].map((d) => (
                <div
                  key={d.deck}
                  className="rounded-2xl bg-[#101015] border border-[#D4AF37]/40 p-4 flex flex-col items-center gap-3"
                >
                  <div className="flex items-center justify-between w-full text-xs font-bold text-[#D4AF37]">
                    <span>{d.deck} · DUAL VINYL DECK</span>
                    <span className="text-white/55">12 Sectors (30° · -14° 3D Dive)</span>
                  </div>
                  <div style={{ perspective: '900px' }}>
                    <div
                      onPointerDown={(e) => {
                        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                        audioEngine.triggerDrumOrPad(d.sound, scale, rootNote, d.midi);
                      }}
                      onPointerMove={(e) => {
                        if (e.buttons === 0 && e.pressure === 0) return;
                        d.setDeg((prev) => prev + e.movementX * 2.2);
                        if (Math.abs(e.movementX) > 4) {
                          audioEngine.triggerDrumOrPad('scratch', scale, rootNote, d.midi);
                        }
                      }}
                      style={{ transform: `rotateX(14deg) rotate(${d.deg}deg)` }}
                      className="w-52 h-52 rounded-full bg-gradient-to-br from-[#1f1f24] via-[#09090b] to-[#1a1a20] border-4 border-[#D4AF37]/60 shadow-[0_14px_34px_rgba(212,175,55,0.22)] flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
                    >
                      <img
                        src="/images/realms/dj-realm-vinyl.webp"
                        alt={d.deck}
                        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                      />
                      {/* 12 Clockwise 30° Harmonic Sector Dividers */}
                      {Array.from({ length: 12 }, (_, sec) => (
                        <div
                          key={sec}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            const degOffset = scale.degrees[sec % scale.degrees.length];
                            const sectorMidi = d.midi + degOffset;
                            const id = `vinyl-${d.deck}-${sec}`;
                            onNoteOn(id, sectorMidi, 0.85);
                            setTimeout(() => onNoteOff(id, true), 260);
                          }}
                          style={{ transform: `rotate(${sec * 30}deg)` }}
                          className="absolute inset-0 flex justify-center pointer-events-auto cursor-pointer"
                        >
                          <span className="w-[1px] h-1/2 bg-white/15 origin-bottom" />
                        </div>
                      ))}
                      <Disc3 className="relative z-10 w-20 h-20 text-[#D4AF37]/75 pointer-events-none" />
                    </div>
                  </div>
                  <div className="text-[10px] text-white/55">
                    Tap any 30° wedge to trigger scale degree · Drag platter to scratch
                  </div>
                </div>
              ))}
            </div>
          ) : djLayout === '5+7' ? (
            <div className="space-y-2.5 w-full max-w-[1380px] mx-auto" data-testid="dj-5-plus-7-matrix">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {currentKit.pads.slice(0, 5).map((pad, idx) => renderDjPad(pad, idx))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {currentKit.pads.slice(5, 12).map((pad, offsetIdx) => renderDjPad(pad, 5 + offsetIdx))}
              </div>
            </div>
          ) : (
            <div className={`grid ${colsClass} gap-2.5 w-full max-w-[1380px] mx-auto`}>
              {currentKit.pads.map((pad, idx) => renderDjPad(pad, idx))}
            </div>
          )}
        </div>

        {/* Embedded Lower DJ Gesture Pad / Sonic Engine Bar matching Screenshot 4 */}
        <div className="border-t border-[#D4AF37]/40 bg-[#060609]">
          <div className="px-3 py-1 bg-[#0b0b10] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSonicMode('xy')}
                className={`px-2 py-0.5 rounded font-bold border ${
                  sonicMode === 'xy' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/[0.04] text-white/75 border-white/10'
                }`}
              >
                GESTURE PAD
              </button>
              <button
                type="button"
                onClick={() => setSonicMode('sliders')}
                className={`px-2 py-0.5 rounded font-bold border ${
                  sonicMode === 'sliders' ? 'bg-[#D4AF37]/20 text-[#FACC15] border-[#D4AF37]/50' : 'bg-white/[0.04] text-white/75 border-white/10'
                }`}
              >
                FX &amp; SAMPLES ({djLoopPads.size})
              </button>
              <button
                type="button"
                onClick={() => setSonicMode('aftertouch')}
                className={`px-2 py-0.5 rounded font-bold border ${
                  sonicMode === 'aftertouch' ? 'bg-sky-500/20 text-sky-300 border-sky-400/50' : 'bg-white/[0.04] text-white/75 border-white/10'
                }`}
              >
                AFTERTOUCH
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/55 font-mono">
              <span>Z1: Filter×Resonance</span>
              <span>·</span>
              <span>Z2: Speed×Pitch</span>
              <span>·</span>
              <span>Z3: Reverb×Reverb</span>
              <span>·</span>
              <span>Z4: Crush×Crush</span>
            </div>
          </div>

          <SonicEnginePanel
            params={params}
            onChangeParam={onChangeParam}
            onApplyAllParams={onApplyAllParams}
            presetName={presetName}
            lockedParams={lockedParams}
            onToggleLockParam={onToggleLockParam}
            latchedNotes={latchedNotes}
            onToggleChipRoute={onToggleChipRoute}
            onUnlatchNote={(id) => onNoteOff(id, true)}
            mode={sonicMode}
            onChangeMode={setSonicMode}
            compactEmbed
            onSpaceThrow={() => {
              onChangeParam('reverbMix', 65);
              onChangeParam('delayMix', 42);
              triggerDjPad(11);
            }}
          />
        </div>
        {renderControlCenterModal()}
      </div>
    );
  }

  // =========================================================================
  // REALM: QIANO K-EDO MICROTONAL LATTICE
  // =========================================================================
  if (realmId === 'qiano') {
    const steps = Array.from({ length: kEdo + 1 }, (_, i) => i);
    return (
      <div className="fixed inset-0 z-40 bg-[#050507] flex flex-col justify-between p-4 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <div className="text-sm font-black tracking-wider uppercase text-[#FACC15]">
              Qiano · {kEdo}-EDO Microtonal Division Lattice
            </div>
            <div className="text-xs text-white/60">
              Each step equals {(1200 / kEdo).toFixed(2)} cents · True microtonal Web Audio oscillators
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([17, 19, 24, 31, 48, 53] as const).map((edo) => (
              <button
                key={edo}
                type="button"
                onClick={() => setKEdo(edo)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  kEdo === edo
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-white/5 border-white/10 text-white/75'
                }`}
              >
                {edo}-EDO
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowControlCenter(!showControlCenter)}
              className="w-8 h-8 rounded-lg bg-[#141418] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]"
              title="Control Center"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onExitRealm}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Exit Stage
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 content-center">
          {steps.map((stepIdx) => {
            const edoInfo = getKEdoStepInfo(stepIdx, kEdo, rootNote, params.baseTuning, 4);
            const noteId = `qiano-${kEdo}-${stepIdx}`;
            const isActive = activeNotes.has(noteId);
            return (
              <button
                key={stepIdx}
                type="button"
                onPointerDown={() =>
                  onNoteOn(noteId, edoInfo.nearestMidi, 0.85, false, edoInfo.detuneCents, edoInfo.freq)
                }
                onPointerUp={() => onNoteOff(noteId, true)}
                onPointerLeave={() => onNoteOff(noteId, true)}
                className={`p-3 rounded-xl border text-center transition ${
                  isActive
                    ? 'bg-[#D4AF37] text-black border-[#FACC15] scale-95'
                    : 'bg-[#111116] border-white/10 hover:border-[#D4AF37]/60 text-white'
                }`}
              >
                <div className="text-xs font-black">Step {stepIdx}</div>
                <div className="text-[10px] opacity-75 font-mono">
                  {Math.round(edoInfo.centsFromRoot)}¢ · {edoInfo.freq.toFixed(1)}Hz
                </div>
              </button>
            );
          })}
        </div>
        {renderControlCenterModal()}
      </div>
    );
  }

  // =========================================================================
  // INTERACTIVE MANDALA (matches image (5).png) & WORLD GEOMETRIC REALMS
  // =========================================================================
  return (
    <div className="fixed inset-0 z-40 bg-[#050508] flex flex-col justify-between overflow-hidden select-none">
      {/* Minimal Corner Floating Controls matching Screenshot 5 */}
      <button
        type="button"
        onClick={onToggleRecord}
        className={`fixed top-3 left-3 z-50 w-9 h-9 rounded-lg border flex items-center justify-center shadow-xl ${
          isRecording ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-red-500/45 bg-[#121216]/90'
        }`}
        title="Record Realm Performance"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
      </button>

      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowControlCenter(!showControlCenter)}
          className="w-9 h-9 rounded-lg bg-[#121216]/90 border border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 shadow-xl"
          title="Control Center — Switch Among 13 Realms"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onExitRealm}
          className="px-3 h-9 rounded-lg bg-[#121216]/90 border border-white/15 hover:bg-white/15 text-xs font-bold text-white shadow-xl"
        >
          Exit Realm
        </button>
      </div>

      {/* Main Cosmic Visual Stage */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {/* Background Atmospheric Artwork (subtle, non-intrusive) */}
        <img
          src={currentRealm.image}
          alt={currentRealm.name}
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
        />

        {/* Horizontal Pitch Staff Lines + Left Note Labels matching Screenshot 5 (Mandala & Spiral realms) */}
        {(realmId === 'mandala' ||
          realmId === 'arabesque' ||
          realmId === 'vortex' ||
          realmId === 'meend_spiral' ||
          realmId === 'aura_bowls') && (
          <>
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {MANDALA_STAFF_NOTES.map((label, idx) => {
                const isTonic = label === 'C3';
                const isActive = activeStaffIdx === idx;
                return (
                  <div key={label} className="relative flex items-center w-full px-3">
                    <span
                      className={`text-[9px] font-mono w-7 shrink-0 ${
                        isTonic
                          ? 'text-[#D4AF37] font-bold'
                          : isActive
                          ? 'text-white font-bold'
                          : 'text-white/25'
                      }`}
                    >
                      {label}
                    </span>
                    <div
                      className={`flex-1 h-[1px] transition-all ${
                        isTonic
                          ? 'bg-[#D4AF37]/45'
                          : isActive
                          ? 'bg-sky-400/75'
                          : 'bg-white/[0.04]'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Interactive Geometry Layer */}
            <div className="relative z-10 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
                {/* Mandala 6-Petal Sacred Geometry matching Screenshot 5 */}
                {realmId === 'mandala' && (
                  <g opacity="0.72">
                    <circle cx="200" cy="200" r="165" fill="none" stroke="#D4AF37" strokeOpacity="0.22" strokeWidth="1" />
                    <circle cx="200" cy="200" r="82" fill="none" stroke="#60A5FA" strokeOpacity="0.22" strokeWidth="1" />
                    <circle cx="200" cy="200" r="40" fill="none" stroke="#D4AF37" strokeOpacity="0.35" strokeWidth="1" />
                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                      <g key={deg} transform={`rotate(${deg} 200 200)`}>
                        <path
                          d="M200,200 Q232,120 200,36 Q168,120 200,200 Z"
                          fill="none"
                          stroke="#D4AF37"
                          strokeOpacity="0.24"
                          strokeWidth="1"
                        />
                        <path
                          d="M200,200 Q220,145 200,90 Q180,145 200,200 Z"
                          fill="none"
                          stroke="#60A5FA"
                          strokeOpacity="0.25"
                          strokeWidth="1"
                        />
                      </g>
                    ))}
                  </g>
                )}

                {/* Arabesque 12-Point Islamic Girih Star Tessellation */}
                {realmId === 'arabesque' && (
                  <g opacity="0.82">
                    <circle cx="200" cy="200" r="172" fill="none" stroke="#34D399" strokeOpacity="0.32" strokeWidth="1.2" />
                    <circle cx="200" cy="200" r="118" fill="none" stroke="#D4AF37" strokeOpacity="0.28" strokeWidth="1" />
                    {[0, 30, 60, 90].map((rot) => (
                      <rect
                        key={rot}
                        x="94"
                        y="94"
                        width="212"
                        height="212"
                        fill="none"
                        stroke={rot % 60 === 0 ? '#D4AF37' : '#34D399'}
                        strokeOpacity="0.3"
                        strokeWidth="1.1"
                        transform={`rotate(${rot} 200 200)`}
                      />
                    ))}
                    <polygon
                      points="200,48 228,172 352,200 228,228 200,352 172,228 48,200 172,172"
                      fill="none"
                      stroke="#34D399"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                    />
                  </g>
                )}

                {/* Vortex Orbital Resonance Attractors */}
                {realmId === 'vortex' && (
                  <g opacity="0.8">
                    <circle cx="200" cy="200" r="170" fill="none" stroke="#A78BFA" strokeOpacity="0.26" strokeDasharray="8 6" strokeWidth="1.4" />
                    <circle cx="200" cy="200" r="126" fill="none" stroke="#8B5CF6" strokeOpacity="0.4" strokeDasharray="14 6" strokeWidth="1.4" />
                    <circle cx="200" cy="200" r="82" fill="none" stroke="#C4B5FD" strokeOpacity="0.48" strokeDasharray="5 5" strokeWidth="1.2" />
                    {[0, 45, 90, 135].map((deg) => (
                      <ellipse
                        key={deg}
                        cx="200"
                        cy="200"
                        rx="168"
                        ry="62"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeOpacity="0.22"
                        strokeWidth="1"
                        transform={`rotate(${deg} 200 200)`}
                      />
                    ))}
                  </g>
                )}

                {/* Meend Spiral Continuous Archimedean Spiral */}
                {realmId === 'meend_spiral' && (
                  <g opacity="0.88">
                    <path
                      d={meendSpiralPath}
                      fill="none"
                      stroke="#FB7185"
                      strokeOpacity="0.55"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d={meendSpiralPath}
                      fill="none"
                      stroke="#FACC15"
                      strokeOpacity="0.2"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Aura Bowls Concentric Crystal Singing Rings */}
                {realmId === 'aura_bowls' && (
                  <g opacity="0.85">
                    {[168, 136, 104, 72].map((r, i) => (
                      <circle
                        key={r}
                        cx="200"
                        cy="200"
                        r={r}
                        fill="none"
                        stroke={i % 2 === 0 ? '#2DD4BF' : '#D4AF37'}
                        strokeOpacity={0.22 + i * 0.1}
                        strokeWidth={1.6 - i * 0.2}
                      />
                    ))}
                  </g>
                )}

                {/* Interactive Note Nodes arranged around the Geometry */}
                {geometricNotes.slice(0, 12).map((item, idx) => {
                  const angle = (idx / 12) * Math.PI * 2 - Math.PI / 2;
                  const radius =
                    realmId === 'meend_spiral'
                      ? 46 + idx * 11
                      : realmId === 'vortex'
                      ? 84 + (idx % 3) * 41
                      : realmId === 'aura_bowls'
                      ? 76 + (idx % 2) * 78
                      : 145;
                  const cx = 200 + Math.cos(angle) * radius;
                  const cy = 200 + Math.sin(angle) * radius;
                  const noteId = `realm-${realmId}-${item.midi}`;
                  const active = activeNotes.has(noteId) || pulseIndex === idx;
                  return (
                    <g
                      key={idx}
                      onPointerDown={() => {
                        setPulseIndex(idx);
                        setActiveStaffIdx(idx % MANDALA_STAFF_NOTES.length);
                        onNoteOn(noteId, item.midi, 0.9);
                      }}
                      onPointerEnter={(e) => {
                        if (e.buttons > 0) {
                          setPulseIndex(idx);
                          setActiveStaffIdx(idx % MANDALA_STAFF_NOTES.length);
                          onNoteOn(noteId, item.midi, 0.82);
                        }
                      }}
                      onPointerUp={() => {
                        setPulseIndex(null);
                        onNoteOff(noteId, true);
                      }}
                      onPointerLeave={() => {
                        setPulseIndex(null);
                        onNoteOff(noteId, true);
                      }}
                      className="cursor-pointer"
                    >
                      <line
                        x1="200"
                        y1="200"
                        x2={cx}
                        y2={cy}
                        stroke={active ? '#FACC15' : currentRealm.accentHex}
                        strokeOpacity={active ? 0.9 : 0.25}
                        strokeWidth={active ? 2.5 : 1}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={active ? 22 : 16}
                        fill={active ? currentRealm.accentHex : 'rgba(15,16,22,0.85)'}
                        stroke={active ? '#FACC15' : currentRealm.accentHex}
                        strokeOpacity={active ? 1 : 0.45}
                        strokeWidth={active ? 2.2 : 1.1}
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill={active ? '#000' : '#F6F4EE'}
                        style={{ pointerEvents: 'none' }}
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}

                {/* Center Tonic Resonator */}
                <circle
                  cx="200"
                  cy="200"
                  r="18"
                  fill="#18160d"
                  stroke="#D4AF37"
                  strokeWidth="1.8"
                  className="cursor-pointer"
                  onPointerDown={() => onNoteOn(`realm-${realmId}-root`, 48, 0.95)}
                  onPointerUp={() => onNoteOff(`realm-${realmId}-root`, true)}
                />
                <text
                  x="200"
                  y="204"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#D4AF37"
                  style={{ pointerEvents: 'none' }}
                >
                  {rootNote}
                </text>
              </svg>

              {/* Quick Solfeggio & Binaural Healing Controls on Aura Bowls Realm */}
              {realmId === 'aura_bowls' && (
                <div className="absolute -bottom-10 inset-x-0 mx-auto w-fit flex items-center justify-center gap-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onChangeParam('baseTuning', params.baseTuning === 432 ? 440 : 432)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                      params.baseTuning === 432
                        ? 'bg-teal-400 text-black border-teal-300'
                        : 'bg-black/80 text-teal-200 border-teal-400/40'
                    }`}
                  >
                    {params.baseTuning === 432 ? '432Hz Active' : 'Switch to 432Hz'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeParam('binauralBeat', params.binauralBeat > 0.5 ? 0 : 7.5)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                      params.binauralBeat > 0.5
                        ? 'bg-[#D4AF37] text-black border-[#FACC15]'
                        : 'bg-black/80 text-[#FACC15] border-[#D4AF37]/40'
                    }`}
                  >
                    {params.binauralBeat > 0.5 ? `Binaural ${params.binauralBeat.toFixed(1)}Hz` : 'Enable 7.5Hz Binaural'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* String & Continuous Ribbon Realms (Guitouch, Cellomir, Silk River, Sitabla) */}
        {(realmId === 'guitouch' ||
          realmId === 'cellomir' ||
          realmId === 'silk_river' ||
          realmId === 'sitabla') && (
          <div className="relative z-10 w-full max-w-5xl px-4 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((stringIdx) => {
              const stringBaseMidi = 40 + stringIdx * 5;
              const isContinuous = realmId === 'cellomir' || realmId === 'silk_river';
              const continuousId = `str-${stringIdx}-0`;
              return (
                <div
                  key={stringIdx}
                  data-testid={`realm-string-${stringIdx}`}
                  onPointerDown={(e) => {
                    if (!isContinuous) return;
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                    ribbonAnchorRef.current = { noteId: continuousId, startX: x };
                    setGlissandoPos({ x, y });
                    const fretFloat = x * 7;
                    const lowerIdx = Math.floor(fretFloat);
                    const degOffset = scale.degrees[lowerIdx % scale.degrees.length];
                    const midi = stringBaseMidi + degOffset + (lowerIdx >= scale.degrees.length ? 12 : 0);
                    onNoteOn(continuousId, midi, Math.max(0.45, Math.min(0.98, 1 - y * 0.45)));
                  }}
                  onPointerMove={(e) => {
                    if (!isContinuous || (e.buttons === 0 && e.pressure === 0)) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                    setGlissandoPos({ x, y });
                    const anchor = ribbonAnchorRef.current;
                    if (anchor && anchor.noteId === continuousId) {
                      const semiOffset = (x - anchor.startX) * 12;
                      audioEngine.glideVoicePitch(continuousId, semiOffset, y);
                    }
                  }}
                  onPointerUp={() => {
                    setGlissandoPos(null);
                    if (isContinuous && ribbonAnchorRef.current?.noteId === continuousId) {
                      ribbonAnchorRef.current = null;
                      onNoteOff(continuousId, true);
                    }
                  }}
                  onPointerCancel={() => {
                    setGlissandoPos(null);
                    if (isContinuous) onNoteOff(continuousId, true);
                  }}
                  className="relative h-14 rounded-xl bg-[#0e0f15]/90 border border-white/10 flex items-center overflow-hidden touch-none"
                >
                  <div
                    className="absolute inset-x-0 h-[2px] opacity-60 pointer-events-none"
                    style={{ backgroundColor: currentRealm.accentHex }}
                  />
                  {isContinuous && glissandoPos && ribbonAnchorRef.current?.noteId === continuousId && (
                    <div
                      className="absolute top-1 bottom-1 w-1.5 rounded-full bg-[#FACC15] shadow-[0_0_12px_#FACC15] pointer-events-none"
                      style={{ left: `${glissandoPos.x * 100}%` }}
                    />
                  )}
                  <div className="relative z-10 w-full grid grid-cols-8 h-full">
                    {Array.from({ length: 8 }, (_, fret) => {
                      const degOffset = scale.degrees[fret % scale.degrees.length];
                      const midi = stringBaseMidi + degOffset + (fret >= scale.degrees.length ? 12 : 0);
                      const info = getNoteTuningInfo(midi, scale, rootNote, params.baseTuning);
                      const noteId = isContinuous ? continuousId : `str-${stringIdx}-${fret}`;
                      const active = activeNotes.has(noteId);
                      return (
                        <button
                          key={fret}
                          type="button"
                          onPointerDown={(e) => {
                            if (isContinuous) return; // handled seamlessly on parent continuous ribbon
                            e.stopPropagation();
                            onNoteOn(noteId, midi, 0.85);
                          }}
                          onPointerUp={() => !isContinuous && onNoteOff(noteId, true)}
                          onPointerLeave={() => !isContinuous && onNoteOff(noteId, true)}
                          className={`h-full border-r border-white/[0.07] flex flex-col items-center justify-center transition ${
                            active ? 'bg-[#D4AF37]/30 text-[#FACC15]' : 'hover:bg-white/[0.06] text-white/75'
                          }`}
                        >
                          <span className="text-xs font-bold">{info.noteLabel}</span>
                          {info.cents !== 0 && (
                            <span className="text-[9px] text-amber-300">
                              {info.cents > 0 ? `+${info.cents}¢` : `${info.cents}¢`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {realmId === 'sitabla' && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {[
                  { name: 'TABLA DHA (Bayan+Dayan)', sound: 'dum' },
                  { name: 'TABLA NA (Treble)', sound: 'tak' },
                  { name: 'TABLA TIN (Resonant)', sound: 'kick' },
                  { name: 'GHUNGROO SHAKER', sound: 'hihat' },
                ].map((drum) => (
                  <button
                    key={drum.name}
                    type="button"
                    onPointerDown={() => audioEngine.triggerDrumOrPad(drum.sound, scale, rootNote, 60)}
                    className="px-4 py-3 rounded-full bg-[#1a1320] border border-pink-500/50 text-xs font-bold text-pink-200 hover:bg-pink-500/20 active:scale-95 transition flex items-center gap-2"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {drum.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Realm Quick Chord & Panic Bar */}
      <div className="px-4 py-2 bg-[#09090c] border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="font-bold uppercase tracking-wider text-white/80" style={{ color: currentRealm.accentHex }}>
            {currentRealm.name} Realm
          </span>
          <span className="hidden sm:inline">· Tuned to {scale.name} ({rootNote})</span>
        </div>
        <button
          type="button"
          onClick={() => audioEngine.releaseAllVoices()}
          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
        >
          Panic / All Notes Off
        </button>
      </div>
      {renderControlCenterModal()}
    </div>
  );
};
