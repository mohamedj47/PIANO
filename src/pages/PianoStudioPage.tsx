import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StudioHeader } from '../components/studio/StudioHeader';
import { QuickActionsDeck } from '../components/studio/QuickActionsDeck';
import { LatchedNoteChip, PianoKeyboardStage } from '../components/studio/PianoKeyboardStage';
import { SonicEnginePanel, SonicPanelMode } from '../components/studio/SonicEnginePanel';
import { RealmsGallery } from '../components/studio/RealmsGallery';
import { RealmsStage } from '../components/studio/RealmsStage';
import { DrawerTabId, TransportBottomBar } from '../components/studio/TransportBottomBar';
import { StudioDrawers } from '../components/studio/StudioDrawers';
import { OnboardingTutorial } from '../components/studio/OnboardingTutorial';
import { CookieConsentBanner } from '../components/studio/CookieConsentBanner';
import {
  DEFAULT_SONIC_PARAMS,
  SONIC_PRESETS,
  SonicParamId,
  SonicParams,
} from '../data/sonicParams';
import { RootNote, WORLD_SCALES, WorldScale } from '../data/scales';
import { INSTRUMENTS, InstrumentId } from '../data/instruments';
import { REALMS, RealmDefinition, RealmId, resolveRealmFromQuery } from '../data/realms';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import {
  audioEngine,
  RecordedNoteEvent,
  SavedRecording,
} from '../audio/MaqAmirAudioEngine';
import { getConsentDecision, setAnalyticsConsent, trackEvent } from '../lib/analytics';

const KEYBOARD_NOTE_OFFSETS: Record<string, number> = {
  a: 0,  // C
  w: 1,  // C#
  s: 2,  // D
  e: 3,  // Eb
  d: 4,  // E
  f: 5,  // F
  t: 6,  // F#
  g: 7,  // G
  y: 8,  // Ab
  h: 9,  // A
  u: 10, // Bb
  j: 11, // B
  k: 12, // C+1
  o: 13, // C#+1
  l: 14, // D+1
  p: 15, // Eb+1
  ';': 16,
};

interface HistorySnapshot {
  params: SonicParams;
  scaleId: string;
  rootNote: RootNote;
  instrument: InstrumentId;
  presetName: string;
}

interface PianoStudioPageProps {
  onNavigate: (path: string) => void;
}

export const PianoStudioPage: React.FC<PianoStudioPageProps> = ({ onNavigate }) => {
  const [instrument, setInstrument] = useState<InstrumentId>(() => {
    if (typeof window === 'undefined') return 'Grand Piano';
    const q = new URLSearchParams(window.location.search).get('instrument')?.trim().toLowerCase();
    if (!q) return 'Grand Piano';
    const found = INSTRUMENTS.find((i) => i.id.toLowerCase() === q || i.name.toLowerCase() === q);
    return found ? found.id : 'Grand Piano';
  });
  const [pianoSkin, setPianoSkin] = useState<string>(() => {
    if (typeof window === 'undefined') return 'classic';
    const q = new URLSearchParams(window.location.search).get('instrument')?.trim().toLowerCase();
    const found = q
      ? INSTRUMENTS.find((i) => i.id.toLowerCase() === q || i.name.toLowerCase() === q)
      : null;
    return found ? found.recommendedSkin : 'classic';
  });
  const [scale, setScale] = useState<WorldScale>(() => {
    if (typeof window === 'undefined') return WORLD_SCALES[0];
    const q = new URLSearchParams(window.location.search).get('scale')?.trim().toLowerCase();
    if (!q) return WORLD_SCALES[0];
    const found = WORLD_SCALES.find(
      (s) => s.id.toLowerCase() === q || s.name.toLowerCase() === q
    );
    return found || WORLD_SCALES[0];
  }); // Rast default
  const [rootNote, setRootNote] = useState<RootNote>('C');
  const [octaveOffset, setOctaveOffset] = useState<number>(3);
  const [params, setParams] = useState<SonicParams>({ ...DEFAULT_SONIC_PARAMS });
  const [presetName, setPresetName] = useState<string>('CUSTOM');
  const [lockedParams, setLockedParams] = useState<Set<SonicParamId>>(new Set());
  const [sonicMode, setSonicMode] = useState<SonicPanelMode>('sliders');

  const [activeRealm, setActiveRealm] = useState<RealmId>(() => {
    if (typeof window === 'undefined') return 'play';
    const params = new URLSearchParams(window.location.search);
    return resolveRealmFromQuery(params.get('realm')) || 'play';
  });
  const [activeDrawer, setActiveDrawer] = useState<DrawerTabId>(null);

  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [latchedNotes, setLatchedNotes] = useState<LatchedNoteChip[]>([]);
  const [sustainActive, setSustainActive] = useState(false);
  const [sustainLatched, setSustainLatched] = useState(false);

  // Beat & Loop
  const [bpm, setBpm] = useState(120);
  const [beatPlaying, setBeatPlaying] = useState(false);
  const [beatPattern, setBeatPattern] = useState('maqsum');
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [loopRecording, setLoopRecording] = useState(false);
  const [loopEvents, setLoopEvents] = useState<Array<{ midi: number; delayMs: number }>>([]);
  const [loopPlaying, setLoopPlaying] = useState(false);
  const loopStartTimeRef = useRef(0);

  // Recording & Rescue
  const [isRecording, setIsRecording] = useState(false);
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MIDI & UI chrome
  const [midiInputs, setMidiInputs] = useState<string[]>([]);
  const [lastMidiEvent, setLastMidiEvent] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTour, setShowTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('maqamir_tour_completed') !== '1';
    } catch {
      return false;
    }
  });
  const [tourStep, setTourStep] = useState(0);
  const [showConsent, setShowConsent] = useState<boolean>(() => getConsentDecision() === null);

  useEffect(() => {
    trackEvent('studio_open', { instrument, scale: scale.name }, { oncePerSessionKey: 'studio_open' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Undo / Redo History
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  const pushSnapshot = useCallback(
    (nextInst = instrument, nextScale = scale, nextRoot = rootNote, nextParams = params, nextLabel = presetName) => {
      setHistory((prev) => [
        ...prev.slice(-19),
        {
          params: { ...nextParams },
          scaleId: nextScale.id,
          rootNote: nextRoot,
          instrument: nextInst,
          presetName: nextLabel,
        },
      ]);
      setRedoStack([]);
    },
    [instrument, scale, rootNote, params, presetName]
  );

  // Sync audioEngine DSP params
  useEffect(() => {
    audioEngine.applyParams(params);
  }, [params]);

  // Sync sustain pedal to engine
  useEffect(() => {
    const active = sustainActive || sustainLatched;
    audioEngine.sustainActive = active;
    if (!active) {
      audioEngine.releaseSustained();
    }
  }, [sustainActive, sustainLatched]);

  // Live-retune active/sustained/latched voices immediately when scale or root changes
  useEffect(() => {
    audioEngine.retuneActiveVoices(scale, rootNote);
  }, [scale, rootNote]);

  // Core Note Handlers
  const handleNoteOn = useCallback(
    (
      noteId: string,
      midiNote: number,
      velocity = 0.85,
      latched = false,
      extraDetuneCents = 0,
      overrideFreqHz?: number
    ) => {
      audioEngine.noteOn(
        noteId,
        midiNote,
        scale,
        rootNote,
        instrument,
        velocity,
        latched,
        extraDetuneCents,
        overrideFreqHz
      );
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });
      trackEvent('piano_interaction', { instrument, scale: scale.name });
      if (loopRecording) {
        const delayMs = performance.now() - loopStartTimeRef.current;
        setLoopEvents((prev) => [...prev, { midi: midiNote, delayMs }]);
      }
    },
    [scale, rootNote, instrument, loopRecording]
  );

  const handleNoteOff = useCallback((noteId: string, force = false) => {
    audioEngine.noteOff(noteId, force);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
    if (force) {
      setLatchedNotes((prev) => prev.filter((c) => c.noteId !== noteId));
    }
  }, []);

  const handleToggleLatch = useCallback(
    (noteId: string, midiNote: number, label: string) => {
      setLatchedNotes((prev) => {
        const exists = prev.find((c) => c.noteId === noteId);
        if (exists) {
          audioEngine.setVoiceLatched(noteId, false);
          audioEngine.noteOff(noteId, true);
          setActiveNotes((s) => {
            const ns = new Set(s);
            ns.delete(noteId);
            return ns;
          });
          return prev.filter((c) => c.noteId !== noteId);
        } else {
          audioEngine.noteOn(noteId, midiNote, scale, rootNote, instrument, 0.85, true);
          audioEngine.setVoiceLatched(noteId, true);
          return [...prev, { noteId, midiNote, label, routedToFx: true }];
        }
      });
    },
    [scale, rootNote, instrument]
  );

  const handleToggleChipRoute = useCallback((noteId: string) => {
    setLatchedNotes((prev) =>
      prev.map((c) => {
        if (c.noteId !== noteId) return c;
        const nextRouted = !c.routedToFx;
        audioEngine.setVoiceFxRouting(noteId, nextRouted);
        return { ...c, routedToFx: nextRouted };
      })
    );
  }, []);

  const handleAftertouchMove = useCallback((noteId: string, dxNorm: number, dyNorm: number) => {
    audioEngine.updateAftertouch(noteId, dxNorm, dyNorm);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const downKeys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        setSustainActive(true);
        return;
      }
      if (k === 'z') {
        setOctaveOffset((o) => Math.max(0, o - 1));
        return;
      }
      if (k === 'x') {
        setOctaveOffset((o) => Math.min(6, o + 1));
        return;
      }
      if (k in KEYBOARD_NOTE_OFFSETS && !downKeys.has(k)) {
        downKeys.add(k);
        const midi = (octaveOffset + 1) * 12 + KEYBOARD_NOTE_OFFSETS[k];
        if (midi >= 21 && midi <= 108) {
          handleNoteOn(`kbd-${k}`, midi, e.shiftKey ? 0.98 : 0.85);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.code === 'Space') {
        setSustainActive(false);
        return;
      }
      if (k in KEYBOARD_NOTE_OFFSETS) {
        downKeys.delete(k);
        handleNoteOff(`kbd-${k}`, false);
      }
    };

    const onWindowBlur = () => {
      downKeys.forEach((k) => handleNoteOff(`kbd-${k}`, false));
      downKeys.clear();
      setSustainActive(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [octaveOffset, handleNoteOn, handleNoteOff]);

  // Full Web MIDI Packet Handler (Note On/Off, Velocity, CC64 Sustain, CC1 Mod Wheel, 14-bit Pitch Bend)
  const handleMidiPacket = useCallback(
    (data: Uint8Array | number[]) => {
      if (!data || data.length < 2) return;
      const status = data[0] & 0xf0;
      const d1 = data[1];
      const d2 = data.length > 2 ? data[2] : 0;

      if (status === 0x90 && d2 > 0) {
        handleNoteOn(`midi-${d1}`, d1, d2 / 127);
        setLastMidiEvent(`Note On MIDI ${d1} · Vel ${d2}`);
      } else if (status === 0x80 || (status === 0x90 && d2 === 0)) {
        handleNoteOff(`midi-${d1}`, false);
        setLastMidiEvent(`Note Off MIDI ${d1}`);
      } else if (status === 0xb0 && d1 === 64) {
        const down = d2 >= 64;
        setSustainActive(down);
        setLastMidiEvent(`CC64 Sustain ${down ? 'ON' : 'OFF'}`);
      } else if (status === 0xb0 && d1 === 1) {
        const norm = Math.max(0, Math.min(1, d2 / 127));
        audioEngine.applyMidiModWheel(norm);
        setLastMidiEvent(`CC1 Mod Wheel ${Math.round(norm * 100)}%`);
      } else if (status === 0xe0 && data.length >= 3) {
        const bend14 = ((d2 << 7) | d1) - 8192;
        const norm = Math.max(-1, Math.min(1, bend14 / 8192));
        audioEngine.applyMidiPitchBend(norm);
        setLastMidiEvent(`Pitch Bend ${norm >= 0 ? '+' : ''}${norm.toFixed(2)}`);
      }
    },
    [handleNoteOn, handleNoteOff]
  );

  useEffect(() => {
    (window as unknown as { __maqamirHandleMidiPacket?: (d: number[]) => void }).__maqamirHandleMidiPacket =
      (bytes) => handleMidiPacket(bytes);
    return () => {
      delete (window as unknown as { __maqamirHandleMidiPacket?: (d: number[]) => void }).__maqamirHandleMidiPacket;
    };
  }, [handleMidiPacket]);

  const scanMidiDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      showToast('Web MIDI API unavailable in this browser context');
      return;
    }
    try {
      const access = await (navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccess> }).requestMIDIAccess();
      const bindInputs = () => {
        const names: string[] = [];
        access.inputs.forEach((input) => {
          names.push(input.name || 'MIDI Device');
          input.onmidimessage = (msg) => {
            if (msg.data) handleMidiPacket(msg.data);
          };
        });
        setMidiInputs(names);
      };
      bindInputs();
      access.onstatechange = bindInputs;
    } catch {
      showToast('MIDI access permission declined or unavailable');
    }
  }, [handleMidiPacket, showToast]);

  const handleScanBluetoothMidi = useCallback(async () => {
    const nav = navigator as Navigator & {
      bluetooth?: {
        requestDevice: (opts: { filters: Array<{ services: string[] }> }) => Promise<{ name?: string; id: string }>;
      };
    };
    if (!nav.bluetooth?.requestDevice) {
      showToast('Web Bluetooth MIDI requires HTTPS Chrome/Edge hardware support');
      setActiveDrawer('pro');
      return;
    }
    try {
      const dev = await nav.bluetooth.requestDevice({
        filters: [{ services: ['03b80e5a-ede8-4b33-a751-6ce34ec4c700'] }],
      });
      const label = dev.name || `BLE MIDI (${dev.id.slice(0, 6)})`;
      setMidiInputs((prev) => (prev.includes(label) ? prev : [...prev, label]));
      showToast(`Connected Bluetooth MIDI: ${label}`);
    } catch {
      showToast('Bluetooth MIDI pairing cancelled or no BLE MIDI controller found');
    }
  }, [showToast]);

  // Web MIDI Support on Mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return;
    let disposed = false;
    (navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccess> })
      .requestMIDIAccess()
      .then((access) => {
        if (disposed) return;
        const bindInputs = () => {
          const names: string[] = [];
          access.inputs.forEach((input) => {
            names.push(input.name || 'MIDI Device');
            input.onmidimessage = (msg) => {
              if (msg.data) handleMidiPacket(msg.data);
            };
          });
          setMidiInputs(names);
        };
        bindInputs();
        access.onstatechange = bindInputs;
      })
      .catch(() => {
        // user declined MIDI permission or unsupported
      });
    return () => {
      disposed = true;
    };
  }, [handleMidiPacket]);

  // Beat / Metronome Sequencer Loop
  useEffect(() => {
    if (!beatPlaying && !metronomeOn) return;
    const stepMs = Math.max(85, Math.round((60000 / bpm) / 2)); // eighth-note grid
    let step = 0;
    const timer = window.setInterval(() => {
      const stepInBar = step % 8;
      if (metronomeOn && step % 2 === 0) {
        audioEngine.playMetronomeClick(stepInBar === 0);
      }
      if (beatPlaying) {
        if (beatPattern === 'maqsum') {
          if (stepInBar === 0 || stepInBar === 4) audioEngine.triggerDrumOrPad('dum', scale, rootNote, 60);
          else if (stepInBar === 1 || stepInBar === 3 || stepInBar === 6) audioEngine.triggerDrumOrPad('tak', scale, rootNote, 60);
        } else if (beatPattern === 'baladi') {
          if (stepInBar === 0 || stepInBar === 1 || stepInBar === 4) audioEngine.triggerDrumOrPad('dum', scale, rootNote, 60);
          else if (stepInBar === 3 || stepInBar === 6) audioEngine.triggerDrumOrPad('tak', scale, rootNote, 60);
        } else if (beatPattern === 'malfuf') {
          if (stepInBar % 4 === 0) audioEngine.triggerDrumOrPad('dum', scale, rootNote, 60);
          else if (stepInBar % 4 === 1 || stepInBar % 4 === 3) audioEngine.triggerDrumOrPad('tak', scale, rootNote, 60);
        } else {
          if (stepInBar % 2 === 0) audioEngine.triggerDrumOrPad('kick', scale, rootNote, 60);
          if (stepInBar === 2 || stepInBar === 6) audioEngine.triggerDrumOrPad('clap', scale, rootNote, 60);
          audioEngine.triggerDrumOrPad('hihat', scale, rootNote, 60);
        }
      }
      step++;
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [beatPlaying, metronomeOn, bpm, beatPattern, scale, rootNote]);

  // Loop playback engine
  useEffect(() => {
    if (!loopPlaying || loopEvents.length === 0) return;
    const maxLen = Math.max(1200, loopEvents[loopEvents.length - 1].delayMs + 400);
    const schedulePass = () => {
      loopEvents.forEach((ev, idx) => {
        setTimeout(() => {
          const id = `loop-${idx}-${ev.midi}`;
          handleNoteOn(id, ev.midi, 0.78);
          setTimeout(() => handleNoteOff(id, true), 260);
        }, ev.delayMs);
      });
    };
    schedulePass();
    const interval = window.setInterval(schedulePass, maxLen);
    return () => window.clearInterval(interval);
  }, [loopPlaying, loopEvents, handleNoteOn, handleNoteOff]);

  // Sync URL query ?realm=... cleanly when activeRealm changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const def = REALMS.find((r) => r.id === activeRealm);
    if (!def) return;
    const url = new URL(window.location.href);
    if (activeRealm === 'play') {
      url.searchParams.delete('realm');
    } else {
      url.searchParams.set('realm', def.queryParam);
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }, [activeRealm]);

  // Onboarding tour realm preview sync
  useEffect(() => {
    if (!showTour) return;
    const target = TUTORIAL_STEPS[tourStep]?.targetRealm;
    if (target) {
      setActiveRealm(target);
    }
    if (tourStep === 7) {
      setSonicMode('xy');
    } else if (tourStep === 0 || tourStep === 1 || tourStep === 6) {
      setSonicMode('sliders');
    }
  }, [showTour, tourStep]);

  const handleCloseTour = () => {
    setShowTour(false);
    setActiveRealm('play');
    setSonicMode('sliders');
    try {
      localStorage.setItem('maqamir_tour_completed', '1');
    } catch {
      // ignore storage errors
    }
  };

  // Studio actions
  const handleSelectInstrument = (next: InstrumentId) => {
    pushSnapshot();
    setInstrument(next);
    const instDef = INSTRUMENTS.find((i) => i.id === next);
    if (instDef) setPianoSkin(instDef.recommendedSkin);
    trackEvent('instrument_selected', { instrument: next, source: 'studio' });
  };

  const handleMagicShuffle = () => {
    pushSnapshot();
    const randScale = WORLD_SCALES[Math.floor(Math.random() * WORLD_SCALES.length)];
    const randInst = INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)];
    const randPreset = SONIC_PRESETS[Math.floor(Math.random() * SONIC_PRESETS.length)];
    setScale(randScale);
    setInstrument(randInst.id);
    setPianoSkin(randInst.recommendedSkin);
    const nextParams = { ...DEFAULT_SONIC_PARAMS, ...randPreset.overrides };
    lockedParams.forEach((id) => {
      nextParams[id] = params[id];
    });
    setParams(nextParams);
    setPresetName(randPreset.label);
    showToast(`Magic Shuffle: ${randScale.name} · ${randInst.name} · ${randPreset.name}`);
  };

  const handleToggleMasterRecord = async () => {
    if (!isRecording) {
      const ok = audioEngine.startMasterRecording();
      if (ok) {
        setIsRecording(true);
        showToast('Recording live studio output...');
      } else {
        showToast('Audio recording unavailable in this browser');
      }
    } else {
      const res = await audioEngine.stopMasterRecording();
      setIsRecording(false);
      if (res) {
        setRecordings((prev) => [
          {
            id: `rec-${Date.now()}`,
            name: `Studio Take ${prev.length + 1}`,
            createdAt: new Date().toLocaleTimeString(),
            durationSec: res.durationSec,
            kind: 'audio',
            scaleName: `${scale.name} (${rootNote})`,
            instrument,
            audioUrl: res.url,
            blob: res.blob,
          },
          ...prev,
        ]);
        showToast('Saved live take to Library');
      }
    }
  };

  const handleToggleMicRecord = async () => {
    if (!isMicRecording) {
      const ok = await audioEngine.startMicRecording();
      if (ok) {
        setIsMicRecording(true);
        showToast('Recording microphone input...');
      } else {
        showToast('Microphone permission declined or unavailable');
      }
    } else {
      const res = await audioEngine.stopMicRecording();
      setIsMicRecording(false);
      if (res) {
        setRecordings((prev) => [
          {
            id: `mic-${Date.now()}`,
            name: `Mic Layer ${prev.length + 1}`,
            createdAt: new Date().toLocaleTimeString(),
            durationSec: res.durationSec,
            kind: 'mic',
            scaleName: `${scale.name} (${rootNote})`,
            instrument: 'Microphone',
            audioUrl: res.url,
            blob: res.blob,
          },
          ...prev,
        ]);
        showToast('Saved microphone layer to Library');
      }
    }
  };

  const handleRescue30s = () => {
    const events = audioEngine.getRetrospectiveRescueEvents();
    if (events.length === 0) {
      showToast('Play a few notes first — 30s Rescue captures your recent performance');
      return;
    }
    const dur = Math.max(1, (events[events.length - 1].startTimeMs + events[events.length - 1].durationMs) / 1000);
    setRecordings((prev) => [
      {
        id: `rescue-${Date.now()}`,
        name: `30s Rescue #${prev.length + 1}`,
        createdAt: new Date().toLocaleTimeString(),
        durationSec: dur,
        kind: 'rescue-midi',
        scaleName: `${scale.name} (${rootNote})`,
        instrument,
        midiEvents: events,
      },
      ...prev,
    ]);
    setActiveDrawer('library');
    showToast(`Rescued ${events.length} notes from the last 30 seconds!`);
  };

  const handleReplayMidiEvents = (events: RecordedNoteEvent[]) => {
    events.forEach((ev, idx) => {
      setTimeout(() => {
        const id = `replay-${idx}-${ev.midiNote}`;
        handleNoteOn(id, ev.midiNote, ev.velocity);
        setTimeout(() => handleNoteOff(id, true), Math.max(100, ev.durationMs));
      }, ev.startTimeMs);
    });
  };

  const handlePlayDemoTaqsim = () => {
    const pattern = [0, 1, 2, 3, 4, 3, 2, 0];
    pattern.forEach((degIdx, step) => {
      const deg = scale.degrees[degIdx % scale.degrees.length];
      const midi = 60 + deg;
      setTimeout(() => {
        const id = `demo-${step}-${midi}`;
        handleNoteOn(id, midi, 0.8);
        setTimeout(() => handleNoteOff(id, true), 280);
      }, step * 300);
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [
      ...r,
      { params, scaleId: scale.id, rootNote, instrument, presetName },
    ]);
    setHistory((h) => h.slice(0, -1));
    setParams(prev.params);
    setInstrument(prev.instrument);
    setRootNote(prev.rootNote);
    setPresetName(prev.presetName);
    const foundScale = WORLD_SCALES.find((s) => s.id === prev.scaleId);
    if (foundScale) setScale(foundScale);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [
      ...h,
      { params, scaleId: scale.id, rootNote, instrument, presetName },
    ]);
    setRedoStack((r) => r.slice(0, -1));
    setParams(next.params);
    setInstrument(next.instrument);
    setRootNote(next.rootNote);
    setPresetName(next.presetName);
    const foundScale = WORLD_SCALES.find((s) => s.id === next.scaleId);
    if (foundScale) setScale(foundScale);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const highlightedTourTarget = showTour ? TUTORIAL_STEPS[tourStep]?.highlightSelector : undefined;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#F6F4EE] flex flex-col justify-between overflow-x-hidden">
      {/* Main Studio Shell */}
      <div className="flex-1 flex flex-col">
        <StudioHeader
          currentRoute="/piano"
          onNavigate={onNavigate}
          instrument={instrument}
          onSelectInstrument={handleSelectInstrument}
          pianoSkin={pianoSkin}
          onSelectSkin={setPianoSkin}
          scale={scale}
          rootNote={rootNote}
          onSelectScale={(s) => {
            pushSnapshot();
            setScale(s);
          }}
          onSelectRoot={(r) => {
            pushSnapshot();
            setRootNote(r);
          }}
          onResetStudio={() => {
            pushSnapshot();
            setParams({ ...DEFAULT_SONIC_PARAMS });
            setPresetName('CLEAN');
            audioEngine.releaseAllVoices();
            setLatchedNotes([]);
            showToast('Studio Sonic Engine Reset');
          }}
          onStartTour={() => {
            setTourStep(0);
            setShowTour(true);
          }}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          midiConnectedCount={midiInputs.length}
        />

        <QuickActionsDeck
          instrument={instrument}
          onQuickGrandPiano={() => {
            handleSelectInstrument('Grand Piano');
            setActiveRealm('play');
          }}
          onSelectAcousticPreset={(inst) => {
            handleSelectInstrument(inst);
            setActiveRealm('play');
          }}
          onMagicShuffle={handleMagicShuffle}
          onOpenCuratedPresets={() => setActiveDrawer('sounds')}
          isRecording={isRecording}
          onToggleRecord={handleToggleMasterRecord}
          onToggleMicRecord={handleToggleMicRecord}
          onRescue30s={handleRescue30s}
          onOpenRealmsTheater={() => setActiveRealm('piano')}
          onOpenAskAmir={() => setActiveDrawer((d) => (d === 'ask-amir' ? null : 'ask-amir'))}
          sustainActive={sustainActive}
          sustainLatched={sustainLatched}
          onToggleSustain={() => setSustainActive((s) => !s)}
          onLatchSustain={() => setSustainLatched((s) => !s)}
          onOpenCustomize={() => setActiveDrawer((d) => (d === 'inst' ? null : 'inst'))}
          highlightedTarget={highlightedTourTarget}
        />

        {/* Piano Keyboard Stage */}
        <PianoKeyboardStage
          skin={pianoSkin}
          instrument={instrument}
          scale={scale}
          rootNote={rootNote}
          baseTuningHz={params.baseTuning}
          octaveOffset={octaveOffset}
          onChangeOctaveOffset={setOctaveOffset}
          onSelectOctaveBadge={(oct) => showToast(`Focused Octave ${oct} · ${instrument}`)}
          activeNotes={activeNotes}
          latchedNotes={latchedNotes}
          onNoteOn={(id, midi, vel, latched) => handleNoteOn(id, midi, vel, latched)}
          onNoteOff={handleNoteOff}
          onToggleLatch={handleToggleLatch}
          onAftertouchMove={handleAftertouchMove}
          visibleOctaves={4}
        />

        {/* Sonic Engine & 2D Gesture Pad */}
        <SonicEnginePanel
          params={params}
          onChangeParam={(id, value) => {
            setParams((prev) => ({ ...prev, [id]: value }));
            setPresetName('CUSTOM');
          }}
          onApplyAllParams={(next, label = 'CUSTOM') => {
            pushSnapshot();
            setParams(next);
            setPresetName(label);
          }}
          presetName={presetName}
          lockedParams={lockedParams}
          onToggleLockParam={(id) =>
            setLockedParams((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          latchedNotes={latchedNotes}
          onToggleChipRoute={handleToggleChipRoute}
          onUnlatchNote={(id) => handleNoteOff(id, true)}
          mode={sonicMode}
          onChangeMode={setSonicMode}
          onSpaceThrow={() => {
            setParams((prev) => ({ ...prev, reverbMix: 62, reverbSize: 4.5, delayMix: 34 }));
            handlePlayDemoTaqsim();
            showToast('Space Throw Triggered — Cathedral Reverb + Maqam Cascade');
          }}
        />

        {/* Interactive Musical Realms Strip */}
        <RealmsGallery
          activeRealm={activeRealm}
          onSelectRealm={(realm: RealmDefinition) => {
            setActiveRealm(realm.id);
            if (realm.defaultInstrument) {
              setInstrument(realm.defaultInstrument as InstrumentId);
            }
            if (realm.defaultScale) {
              const s = WORLD_SCALES.find((w) => w.name === realm.defaultScale);
              if (s) setScale(s);
            }
          }}
        />
      </div>

      {/* Specialized Realm Workspace Stage (Piano Dual, DJ Deck, Mandala, Qiano, etc.) */}
      {activeRealm !== 'play' && (
        <RealmsStage
          realmId={activeRealm}
          onExitRealm={() => setActiveRealm('play')}
          onSwitchRealm={(id) => setActiveRealm(id)}
          skin={pianoSkin}
          instrument={instrument}
          scale={scale}
          rootNote={rootNote}
          params={params}
          onChangeParam={(id, value) => {
            setParams((prev) => ({ ...prev, [id]: value }));
            setPresetName('CUSTOM');
          }}
          onApplyAllParams={(next, label = 'CUSTOM') => {
            pushSnapshot();
            setParams(next);
            setPresetName(label);
          }}
          presetName={presetName}
          lockedParams={lockedParams}
          onToggleLockParam={(id) =>
            setLockedParams((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          activeNotes={activeNotes}
          latchedNotes={latchedNotes}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          onToggleLatch={handleToggleLatch}
          onToggleChipRoute={handleToggleChipRoute}
          onAftertouchMove={handleAftertouchMove}
          bpm={bpm}
          onChangeBpm={setBpm}
          isRecording={isRecording}
          onToggleRecord={handleToggleMasterRecord}
        />
      )}

      {/* Active Studio Drawer */}
      <StudioDrawers
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        instrument={instrument}
        onSelectInstrument={handleSelectInstrument}
        pianoSkin={pianoSkin}
        onSelectSkin={setPianoSkin}
        scale={scale}
        rootNote={rootNote}
        onSelectScale={(s) => {
          pushSnapshot();
          setScale(s);
        }}
        onSelectRoot={(r) => {
          pushSnapshot();
          setRootNote(r);
        }}
        bpm={bpm}
        onChangeBpm={setBpm}
        beatPlaying={beatPlaying}
        onToggleBeat={() => setBeatPlaying((b) => !b)}
        beatPattern={beatPattern}
        onChangeBeatPattern={setBeatPattern}
        metronomeOn={metronomeOn}
        onToggleMetronome={() => setMetronomeOn((m) => !m)}
        loopRecording={loopRecording}
        onToggleLoopRecording={() => {
          if (!loopRecording) {
            setLoopEvents([]);
            loopStartTimeRef.current = performance.now();
            setLoopRecording(true);
            showToast('Playing notes now — capturing Loop phrase...');
          } else {
            setLoopRecording(false);
            setLoopPlaying(true);
          }
        }}
        loopPlaying={loopPlaying}
        onToggleLoopPlaying={() => setLoopPlaying((p) => !p)}
        hasLoopEvents={loopEvents.length > 0}
        isRecording={isRecording}
        onToggleMasterRecord={handleToggleMasterRecord}
        isMicRecording={isMicRecording}
        onToggleMicRecord={handleToggleMicRecord}
        onRescue30s={handleRescue30s}
        recordings={recordings}
        onDeleteRecording={(id) => setRecordings((prev) => prev.filter((r) => r.id !== id))}
        onReplayMidiEvents={handleReplayMidiEvents}
        onApplyPreset={(next, label) => {
          pushSnapshot();
          setParams(next);
          setPresetName(label);
        }}
        onPlayDemoTaqsim={handlePlayDemoTaqsim}
        midiInputs={midiInputs}
        lastMidiEvent={lastMidiEvent}
        onRescanMidi={() => void scanMidiDevices()}
        onScanBluetoothMidi={() => void handleScanBluetoothMidi()}
        onNavigatePro={() => onNavigate('/pro')}
        onSwitchRealm={(id) => {
          setActiveDrawer(null);
          if (REALMS.some((r) => r.id === id)) setActiveRealm(id);
        }}
      />

      {/* Bottom Transport Dock */}
      <TransportBottomBar
        activeDrawer={activeDrawer}
        onToggleDrawer={(tab) => setActiveDrawer((cur) => (cur === tab ? null : tab))}
        beatPlaying={beatPlaying}
        isRecording={isRecording}
        recordingsCount={recordings.length}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        midiCount={midiInputs.length}
        onScanBluetoothMidi={() => void handleScanBluetoothMidi()}
      />

      {/* 8-Step Onboarding Tour */}
      {showTour && (
        <OnboardingTutorial
          stepIndex={tourStep}
          onStepChange={setTourStep}
          onClose={handleCloseTour}
          onOpenGuides={() => {
            handleCloseTour();
            onNavigate('/guides');
          }}
        />
      )}

      {/* Cookie Analytics Consent Banner */}
      <CookieConsentBanner
        visible={showConsent}
        onAccept={() => {
          setShowConsent(false);
          setAnalyticsConsent('accepted');
        }}
        onDecline={() => {
          setShowConsent(false);
          setAnalyticsConsent('declined');
        }}
        onLearnMore={() => onNavigate('/about')}
      />

      {/* Studio Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 inset-x-0 mx-auto w-fit max-w-[92vw] z-50 px-4 py-2 rounded-full bg-[#121218]/95 border border-[#D4AF37]/60 text-xs font-semibold text-[#FACC15] shadow-2xl pointer-events-none text-center">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
