import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getNoteTuningInfo, RootNote, WorldScale } from '../../data/scales';
import { InstrumentId } from '../../data/instruments';

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_AFTER_WHITE: Record<number, number> = {
  0: 1, // C# after C
  2: 3, // D# after D
  5: 6, // F# after F
  7: 8, // G# after G
  9: 10, // A# after A
};

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export interface LatchedNoteChip {
  noteId: string;
  midiNote: number;
  label: string;
  routedToFx: boolean;
}

interface PianoKeyboardStageProps {
  skin: string;
  instrument: InstrumentId;
  scale: WorldScale;
  rootNote: RootNote;
  baseTuningHz: number;
  octaveOffset: number;
  onChangeOctaveOffset: (next: number) => void;
  activeNotes: Set<string>;
  latchedNotes: LatchedNoteChip[];
  onNoteOn: (noteId: string, midiNote: number, velocity: number, latched?: boolean) => void;
  onNoteOff: (noteId: string, force?: boolean) => void;
  onToggleLatch: (noteId: string, midiNote: number, label: string) => void;
  onAftertouchMove: (noteId: string, dxNorm: number, dyNorm: number) => void;
  visibleOctaves?: number;
  heightClass?: string;
  compactDual?: boolean;
  hideFloatingOctaves?: boolean;
  onSelectOctaveBadge?: (oct: number) => void;
}

interface KeyDef {
  midi: number;
  octave: number;
  semitone: number;
  isBlack: boolean;
  label: string;
  cents: number;
  inScale: boolean;
  whiteIndex: number;
}

export const PianoKeyboardStage: React.FC<PianoKeyboardStageProps> = ({
  skin,
  instrument,
  scale,
  rootNote,
  baseTuningHz,
  octaveOffset,
  onChangeOctaveOffset,
  activeNotes,
  latchedNotes,
  onNoteOn,
  onNoteOff,
  onToggleLatch,
  onAftertouchMove,
  visibleOctaves = 4,
  heightClass = 'h-[186px] sm:h-[208px]',
  hideFloatingOctaves = false,
  onSelectOctaveBadge,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  type ActivePointerRecord = {
    noteId: string;
    midiNote: number;
    label: string;
    startX: number;
    startY: number;
    startedAt: number;
    pointerType: string;
  };
  const pointerNotesRef = useRef<Map<number, ActivePointerRecord>>(new Map());
  const lastPointerInputRef = useRef<{ pointerType: string; button: number }>({
    pointerType: 'mouse',
    button: 0,
  });
  const windowListenersAttachedRef = useRef(false);
  const [aftertouchFeedback, setAftertouchFeedback] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Full 88-key range: A0 (21) through C8 (108)
  const keys = useMemo(() => {
    const result: KeyDef[] = [];
    let whiteCounter = 0;
    for (let midi = 21; midi <= 108; midi++) {
      const semitone = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = !WHITE_SEMITONES.includes(semitone);
      const tuning = getNoteTuningInfo(midi, scale, rootNote, baseTuningHz);
      if (!isBlack) {
        result.push({
          midi,
          octave,
          semitone,
          isBlack: false,
          label: `${NOTE_NAMES[semitone]}${octave}`,
          cents: tuning.cents,
          inScale: tuning.inScale,
          whiteIndex: whiteCounter,
        });
        whiteCounter++;
      } else {
        result.push({
          midi,
          octave,
          semitone,
          isBlack: true,
          label: `${NOTE_NAMES[semitone]}${octave}`,
          cents: tuning.cents,
          inScale: tuning.inScale,
          whiteIndex: whiteCounter - 1,
        });
      }
    }
    return result;
  }, [scale, rootNote, baseTuningHz]);

  const whiteKeys = useMemo(() => keys.filter((k) => !k.isBlack), [keys]);
  const blackKeys = useMemo(() => keys.filter((k) => k.isBlack), [keys]);

  // White key width scaled cleanly to viewport & visibleOctaves
  const whiteKeyPx = useMemo(() => {
    const totalDisplayedWhites = Math.max(14, visibleOctaves * 7);
    if (viewportWidth < 640) return Math.max(36, Math.floor(viewportWidth / 14));
    return Math.max(42, Math.min(58, Math.floor((viewportWidth - 8) / totalDisplayedWhites)));
  }, [visibleOctaves, viewportWidth]);

  const totalWidth = whiteKeys.length * whiteKeyPx;

  // Scroll smoothly when octaveOffset changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const targetWhiteIdx = Math.max(0, 2 + (octaveOffset - 1) * 7);
    el.scrollTo({ left: targetWhiteIdx * whiteKeyPx, behavior: 'smooth' });
  }, [octaveOffset, whiteKeyPx]);

  const latchedMap = useMemo(() => {
    const m = new Map<number, LatchedNoteChip>();
    latchedNotes.forEach((c) => m.set(c.midiNote, c));
    return m;
  }, [latchedNotes]);

  const latchedMapRef = useRef(latchedMap);
  latchedMapRef.current = latchedMap;

  const callbacksRef = useRef({ onNoteOn, onNoteOff, onAftertouchMove, onToggleLatch });
  callbacksRef.current = { onNoteOn, onNoteOff, onAftertouchMove, onToggleLatch };

  const isMidiHeldByOtherPointer = useCallback((midiNote: number, excludePointerId?: number) => {
    for (const [pid, active] of pointerNotesRef.current.entries()) {
      if (pid !== excludePointerId && active.midiNote === midiNote) {
        return true;
      }
    }
    return false;
  }, []);

  const findHitKeyElement = useCallback((clientX: number, clientY: number): HTMLElement | null => {
    const container = scrollContainerRef.current;
    if (!container) return null;
    if (typeof document.elementsFromPoint === 'function') {
      const stack = document.elementsFromPoint(clientX, clientY);
      for (const el of stack) {
        const keyBtn = (el as HTMLElement).closest?.('[data-piano-key="true"]') as HTMLElement | null;
        if (keyBtn && container.contains(keyBtn)) {
          return keyBtn;
        }
      }
      return null;
    }
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const keyBtn = el?.closest?.('[data-piano-key="true"]') as HTMLElement | null;
    return keyBtn && container.contains(keyBtn) ? keyBtn : null;
  }, []);

  const windowHandlersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    blur: () => void;
  } | null>(null);

  const detachWindowListeners = useCallback(() => {
    if (!windowListenersAttachedRef.current || !windowHandlersRef.current) return;
    window.removeEventListener('pointermove', windowHandlersRef.current.move);
    window.removeEventListener('pointerup', windowHandlersRef.current.up);
    window.removeEventListener('pointercancel', windowHandlersRef.current.up);
    window.removeEventListener('blur', windowHandlersRef.current.blur);
    windowListenersAttachedRef.current = false;
  }, []);

  const releasePointer = useCallback(
    (pointerId: number) => {
      const rec = pointerNotesRef.current.get(pointerId);
      if (!rec) return;
      pointerNotesRef.current.delete(pointerId);
      if (pointerNotesRef.current.size === 0) {
        detachWindowListeners();
        setAftertouchFeedback((prev) => (prev !== null ? null : prev));
      }
      if (!isMidiHeldByOtherPointer(rec.midiNote) && !latchedMapRef.current.has(rec.midiNote)) {
        callbacksRef.current.onNoteOff(rec.noteId, false);
      }
    },
    [detachWindowListeners, isMidiHeldByOtherPointer]
  );

  const releaseAllPointers = useCallback(() => {
    if (pointerNotesRef.current.size === 0) return;
    const activeEntries: ActivePointerRecord[] = [];
    pointerNotesRef.current.forEach((rec) => {
      activeEntries.push(rec);
    });
    pointerNotesRef.current.clear();
    detachWindowListeners();
    setAftertouchFeedback((prev) => (prev !== null ? null : prev));
    const releasedMidis = new Set<number>();
    for (const rec of activeEntries) {
      if (releasedMidis.has(rec.midiNote)) continue;
      releasedMidis.add(rec.midiNote);
      if (!latchedMapRef.current.has(rec.midiNote)) {
        callbacksRef.current.onNoteOff(rec.noteId, false);
      }
    }
  }, [detachWindowListeners]);

  if (!windowHandlersRef.current) {
    windowHandlersRef.current = {
      move: () => {},
      up: () => {},
      blur: () => {},
    };
  }

  windowHandlersRef.current.move = (e: PointerEvent) => {
    const rec = pointerNotesRef.current.get(e.pointerId);
    if (!rec) return;

    const hitKeyEl = findHitKeyElement(e.clientX, e.clientY);
    if (hitKeyEl) {
      const nextMidi = Number(hitKeyEl.dataset.midi);
      if (Number.isFinite(nextMidi) && nextMidi !== rec.midiNote) {
        const prevMidi = rec.midiNote;
        const prevNoteId = rec.noteId;
        const nextNoteId = `key-${nextMidi}`;
        const nextLabel = hitKeyEl.dataset.note || rec.label;

        const rect = hitKeyEl.getBoundingClientRect();
        const relY = rect.height > 0 ? Math.max(0.15, Math.min(1, (e.clientY - rect.top) / rect.height)) : 0.7;
        const velocity = Math.max(0.35, Math.min(1, 0.35 + relY * 0.65));

        rec.midiNote = nextMidi;
        rec.noteId = nextNoteId;
        rec.label = nextLabel;
        rec.startX = e.clientX;
        rec.startY = e.clientY;
        rec.startedAt = performance.now();

        if (!isMidiHeldByOtherPointer(prevMidi, e.pointerId) && !latchedMapRef.current.has(prevMidi)) {
          callbacksRef.current.onNoteOff(prevNoteId, false);
        }
        callbacksRef.current.onNoteOn(nextNoteId, nextMidi, velocity, latchedMapRef.current.has(nextMidi));
        setAftertouchFeedback((prev) => (prev !== null ? null : prev));
        return;
      }
    }

    const elapsed = performance.now() - rec.startedAt;
    if (elapsed < 180) return;

    const dxNorm = Math.max(-1, Math.min(1, (e.clientX - rec.startX) / 80));
    const dyNorm = Math.max(-1, Math.min(1, (e.clientY - rec.startY) / 80));
    if (Math.abs(dxNorm) > 0.12 || Math.abs(dyNorm) > 0.12) {
      callbacksRef.current.onAftertouchMove(rec.noteId, dxNorm, dyNorm);
      let dir = '';
      if (Math.abs(dyNorm) >= Math.abs(dxNorm)) {
        dir =
          dyNorm < 0
            ? `↑ Vibrato ${Math.round(Math.abs(dyNorm) * 100)}%`
            : `↓ Volume ${Math.round((1 - dyNorm * 0.72) * 100)}%`;
      } else {
        dir =
          dxNorm < 0
            ? `← Cutoff ${Math.round((1 - Math.abs(dxNorm)) * 100)}%`
            : `→ Drive +${Math.round(dxNorm * 100)}%`;
      }
      setAftertouchFeedback((prev) => (prev === dir ? prev : dir));
    }
  };

  windowHandlersRef.current.up = (e: PointerEvent) => {
    releasePointer(e.pointerId);
  };

  windowHandlersRef.current.blur = () => {
    releaseAllPointers();
  };

  const attachWindowListeners = useCallback(() => {
    if (windowListenersAttachedRef.current || !windowHandlersRef.current) return;
    window.addEventListener('pointermove', windowHandlersRef.current.move);
    window.addEventListener('pointerup', windowHandlersRef.current.up);
    window.addEventListener('pointercancel', windowHandlersRef.current.up);
    window.addEventListener('blur', windowHandlersRef.current.blur);
    windowListenersAttachedRef.current = true;
  }, []);

  useEffect(() => {
    return () => {
      releaseAllPointers();
    };
  }, [releaseAllPointers]);

  const handleKeyPointerDown = useCallback(
    (e: React.PointerEvent, key: KeyDef) => {
      const pointerType = e.pointerType || 'mouse';
      lastPointerInputRef.current = { pointerType, button: e.button };

      // Right-click (button 2) is handled in onContextMenu for mouse only
      if (pointerType === 'mouse' && e.button !== 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.altKey) {
        const noteId = `key-${key.midi}`;
        callbacksRef.current.onToggleLatch(noteId, key.midi, key.label);
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relY = rect.height > 0 ? Math.max(0.15, Math.min(1, (e.clientY - rect.top) / rect.height)) : 0.7;
      const velocity = Math.max(0.35, Math.min(1, 0.35 + relY * 0.65));

      const noteId = `key-${key.midi}`;

      pointerNotesRef.current.set(e.pointerId, {
        noteId,
        midiNote: key.midi,
        label: key.label,
        startX: e.clientX,
        startY: e.clientY,
        startedAt: performance.now(),
        pointerType,
      });
      attachWindowListeners();

      callbacksRef.current.onNoteOn(noteId, key.midi, velocity, latchedMapRef.current.has(key.midi));
    },
    [attachWindowListeners]
  );

  const handleKeyContextMenu = useCallback((e: React.MouseEvent, key: KeyDef) => {
    e.preventDefault();
    e.stopPropagation();

    // Never latch on touch/pen long-press contextmenu (prevents stuck keys when holding a finger)
    const nativePointerType = (e.nativeEvent as unknown as { pointerType?: string })?.pointerType;
    let hasActiveTouchOrPen = false;
    pointerNotesRef.current.forEach((p) => {
      if (p.pointerType !== 'mouse') {
        hasActiveTouchOrPen = true;
      }
    });
    if (
      nativePointerType === 'touch' ||
      nativePointerType === 'pen' ||
      lastPointerInputRef.current.pointerType !== 'mouse' ||
      hasActiveTouchOrPen
    ) {
      return;
    }

    if (lastPointerInputRef.current.button === 2 || e.ctrlKey) {
      callbacksRef.current.onToggleLatch(`key-${key.midi}`, key.midi, key.label);
    }
  }, []);

  const blackWidth = Math.round(whiteKeyPx * 0.62);

  return (
    <div
      data-tour-target="piano-stage"
      data-piano-skin={skin}
      className={`piano-keyboard-stage piano-stage-frame relative w-full ${heightClass} border-t border-white/[0.08] border-b border-[#D4AF37]/45 overflow-hidden select-none`}
    >
      {/* Top Fallboard Specular Rail from PianoStudioImpl-BeuMAIfo.css */}
      <div className="piano-slap-specular-rail pointer-events-none" aria-hidden="true" />
      <div className="piano-fallboard-rail pointer-events-none" aria-hidden="true" />

      {/* Top-Right Octave Navigation Arrows & Aftertouch Live Pill */}
      <div className="absolute top-8 md:top-1.5 right-2 z-30 flex items-center gap-1.5">
        {aftertouchFeedback && (
          <span className="px-2 py-0.5 rounded-full bg-[#09090b]/95 border border-sky-400/50 text-[10px] font-bold text-sky-300 shadow">
            {aftertouchFeedback}
          </span>
        )}
        <div className="inline-flex items-stretch rounded-lg overflow-hidden bg-black/75 border border-white/15 divide-x divide-white/10">
          <button
            type="button"
            onClick={() => onChangeOctaveOffset(Math.max(0, octaveOffset - 1))}
            aria-label="Previous Octave"
            title="Previous Octave"
            className="flex items-center justify-center h-6 w-7 text-white/70 hover:text-[#D4AF37] hover:bg-white/[0.08] transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeOctaveOffset(Math.min(6, octaveOffset + 1))}
            aria-label="Next Octave"
            title="Next Octave"
            className="flex items-center justify-center h-6 w-7 text-white/70 hover:text-[#D4AF37] hover:bg-white/[0.08] transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable 88-Key Piano Keybed */}
      <div
        ref={scrollContainerRef}
        className="piano-keybed-shell w-full h-full overflow-x-auto scrollbar-hide relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="relative h-full touch-none"
          style={{ width: `${totalWidth}px`, touchAction: 'none', WebkitTouchCallout: 'none' }}
        >
          {/* Floating Octave Instrument Pills matching Screenshot 1 & 7 */}
          {!hideFloatingOctaves &&
            [1, 2, 3, 4, 5, 6, 7].map((oct) => {
              const cWhiteIdx = 2 + (oct - 1) * 7 + 1.5;
              const leftPx = cWhiteIdx * whiteKeyPx;
              return (
                <button
                  key={oct}
                  type="button"
                  onClick={() => {
                    onChangeOctaveOffset(Math.max(0, Math.min(6, oct)));
                    onSelectOctaveBadge?.(oct);
                  }}
                  title={`Focus Octave ${oct} (${instrument})`}
                  className="piano-octave-pill piano-octave-label-ui absolute top-2 z-20 px-2.5 py-0.5 rounded-full border border-white/15 text-[9px] font-bold tracking-wider text-white/90 flex items-center gap-1.5 shadow-lg transition cursor-pointer whitespace-nowrap"
                  style={{
                    left: `${leftPx}px`,
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(180deg, rgba(24,24,30,0.95) 0%, rgba(8,8,11,0.98) 100%)',
                  }}
                >
                  <span className="piano-octave-island-num w-3.5 h-3.5 rounded-full bg-white/10 text-[8px] flex items-center justify-center text-[#D4AF37]">
                    {oct}
                  </span>
                  <img
                    src="/art/sm/945678a22.png"
                    alt=""
                    className="w-2.5 h-2.5 rounded-full opacity-80 hidden sm:inline-block"
                  />
                  <span className="piano-octave-island-sep w-[1px] h-2.5 bg-white/15" />
                  <span className="piano-octave-island-name uppercase">{instrument}</span>
                </button>
              );
            })}

          {/* White Keys */}
          <div className="flex h-full touch-none" style={{ touchAction: 'none' }}>
            {whiteKeys.map((k) => {
              const noteId = `key-${k.midi}`;
              const isActive = activeNotes.has(noteId);
              const isLatched = latchedMap.has(k.midi);
              const hasMicrotone = Math.abs(k.cents) >= 5;
              return (
                <button
                  key={k.midi}
                  type="button"
                  data-piano-key="true"
                  data-midi={k.midi}
                  data-note={k.label}
                  data-cents={k.cents}
                  aria-label={k.label}
                  onPointerDown={(e) => handleKeyPointerDown(e, k)}
                  onContextMenu={(e) => handleKeyContextMenu(e, k)}
                  style={{
                    width: `${whiteKeyPx}px`,
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  className={`piano-key-base-white relative h-full shrink-0 border-r border-black/25 rounded-b-md transition-transform duration-75 cursor-pointer flex flex-col justify-end items-center pb-2 touch-none select-none ${
                    isActive || isLatched
                      ? 'piano-key-pressed-white translate-y-[2px]'
                      : 'piano-key-idle-white'
                  }`}
                >
                  <span className="piano-key-finish piano-key-finish--white piano-key-finish--premium pointer-events-none" />
                  <span className="piano-key-tint-overlay absolute inset-0 pointer-events-none opacity-0 rounded-b-md" />

                  {(isActive || isLatched) && (
                    <span className="piano-key-pressed-overlay-white absolute inset-0 rounded-b-md bg-[#D4AF37]/25 pointer-events-none" />
                  )}

                  {/* Scale Degree / Microtonal Cents Indicator */}
                  <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                    {isLatched && <Lock className="w-2.5 h-2.5 text-[#D4AF37]" />}
                    {hasMicrotone && (
                      <span className="px-1 rounded bg-amber-500/90 text-[8px] font-black text-black leading-tight">
                        {k.cents > 0 ? `+${k.cents}¢` : `${k.cents}¢`}
                      </span>
                    )}
                    {k.inScale && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          k.semitone === 0 && k.octave === 4
                            ? 'bg-[#D4AF37]'
                            : 'bg-[#D4AF37]/65'
                        }`}
                      />
                    )}
                    <span className="text-[9px] font-semibold text-black/55">
                      {k.semitone === 0 ? k.label : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Black Keys */}
          {blackKeys.map((k) => {
            const noteId = `key-${k.midi}`;
            const isActive = activeNotes.has(noteId);
            const isLatched = latchedMap.has(k.midi);
            const hasMicrotone = Math.abs(k.cents) >= 5;
            const leftPx = (k.whiteIndex + 1) * whiteKeyPx - blackWidth / 2;
            return (
              <button
                key={k.midi}
                type="button"
                data-piano-key="true"
                data-midi={k.midi}
                data-note={k.label}
                data-cents={k.cents}
                aria-label={k.label}
                onPointerDown={(e) => handleKeyPointerDown(e, k)}
                onContextMenu={(e) => handleKeyContextMenu(e, k)}
                style={{
                  left: `${leftPx}px`,
                  width: `${blackWidth}px`,
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                }}
                className={`piano-key-base-black absolute top-0 h-[62%] z-10 rounded-b-md transition-transform duration-75 cursor-pointer flex flex-col justify-end items-center pb-1.5 touch-none select-none ${
                  isActive || isLatched
                    ? 'piano-key-pressed-black translate-y-[2px]'
                    : 'piano-key-idle-black'
                }`}
              >
                <span className="piano-key-finish piano-key-finish--black piano-key-finish--premium pointer-events-none" />
                <span className="piano-key-tint-overlay absolute inset-0 pointer-events-none opacity-0 rounded-b-md" />
                {(isActive || isLatched) && (
                  <span className="piano-key-pressed-overlay-black absolute inset-0 rounded-b-md bg-[#D4AF37]/30 pointer-events-none" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                  {isLatched && <Lock className="w-2.5 h-2.5 text-[#D4AF37]" />}
                  {hasMicrotone && (
                    <span className="px-1 rounded bg-amber-400 text-[7px] font-black text-black leading-tight">
                      {k.cents > 0 ? `+${k.cents}` : k.cents}
                    </span>
                  )}
                  {k.inScale && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { BLACK_AFTER_WHITE };
