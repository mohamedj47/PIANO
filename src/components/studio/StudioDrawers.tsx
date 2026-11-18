import React, { useState } from 'react';
import {
  Activity,
  Check,
  Crown,
  Download,
  History,
  Loader2,
  Mic,
  Music,
  Play,
  Repeat,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { DrawerTabId } from './TransportBottomBar';
import { INSTRUMENTS, InstrumentId, PIANO_SKINS } from '../../data/instruments';
import { RootNote, WORLD_SCALES, WorldScale } from '../../data/scales';
import { DEFAULT_SONIC_PARAMS, SONIC_PRESETS, SonicParams } from '../../data/sonicParams';
import {
  encodeStandardMidiFile,
  encodeWavFromEvents,
  RecordedNoteEvent,
  SavedRecording,
} from '../../audio/MaqAmirAudioEngine';
import { RealmId } from '../../data/realms';
import { useAuth } from '../../context/AuthContext';

export interface AiSuggestion {
  reply: string;
  recommendedScale: string;
  recommendedRoot?: string;
  recommendedInstrument: string;
  recommendedRealm?: string;
  suggestedBpm?: number;
  presetName: string;
  sonicPatch?: Partial<SonicParams>;
}

interface StudioDrawersProps {
  activeDrawer: DrawerTabId;
  onClose: () => void;
  instrument: InstrumentId;
  onSelectInstrument: (inst: InstrumentId) => void;
  pianoSkin: string;
  onSelectSkin: (skinId: string) => void;
  scale: WorldScale;
  rootNote: RootNote;
  onSelectScale: (scale: WorldScale) => void;
  onSelectRoot: (root: RootNote) => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  beatPlaying: boolean;
  onToggleBeat: () => void;
  beatPattern: string;
  onChangeBeatPattern: (pattern: string) => void;
  metronomeOn: boolean;
  onToggleMetronome: () => void;
  loopRecording: boolean;
  onToggleLoopRecording: () => void;
  loopPlaying: boolean;
  onToggleLoopPlaying: () => void;
  hasLoopEvents: boolean;
  isRecording: boolean;
  onToggleMasterRecord: () => void;
  isMicRecording: boolean;
  onToggleMicRecord: () => void;
  onRescue30s: () => void;
  recordings: SavedRecording[];
  onDeleteRecording: (id: string) => void;
  onReplayMidiEvents: (events: RecordedNoteEvent[]) => void;
  onApplyPreset: (next: SonicParams, label: string) => void;
  onPlayDemoTaqsim: () => void;
  midiInputs: string[];
  lastMidiEvent: string | null;
  onRescanMidi: () => void;
  onScanBluetoothMidi: () => void;
  onNavigatePro: () => void;
  onSwitchRealm: (id: RealmId) => void;
}

const BEAT_PATTERNS = [
  { id: 'maqsum', name: 'Maqsum 4/4', desc: 'Classic Arabic D-T-T-D-T pulse' },
  { id: 'baladi', name: 'Baladi 4/4', desc: 'Earthy Cairo double-Dum groove' },
  { id: 'malfuf', name: 'Malfuf 2/4', desc: 'Fast whirling folk pulse' },
  { id: 'house', name: 'Club 4/4', desc: 'Tight electronic four-on-the-floor' },
];

export const StudioDrawers: React.FC<StudioDrawersProps> = ({
  activeDrawer,
  onClose,
  instrument,
  onSelectInstrument,
  pianoSkin,
  onSelectSkin,
  scale,
  rootNote,
  onSelectScale,
  onSelectRoot,
  bpm,
  onChangeBpm,
  beatPlaying,
  onToggleBeat,
  beatPattern,
  onChangeBeatPattern,
  metronomeOn,
  onToggleMetronome,
  loopRecording,
  onToggleLoopRecording,
  loopPlaying,
  onToggleLoopPlaying,
  hasLoopEvents,
  isRecording,
  onToggleMasterRecord,
  isMicRecording,
  onToggleMicRecord,
  onRescue30s,
  recordings,
  onDeleteRecording,
  onReplayMidiEvents,
  onApplyPreset,
  onPlayDemoTaqsim,
  midiInputs,
  lastMidiEvent,
  onRescanMidi,
  onScanBluetoothMidi,
  onNavigatePro,
  onSwitchRealm,
}) => {
  const { subscriptionState, profile } = useAuth();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<Array<{ user: string; suggestion: AiSuggestion }>>([]);

  if (!activeDrawer) return null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleAskAmir = async (promptText: string) => {
    const q = promptText.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          currentScale: scale.name,
          currentInstrument: instrument,
          currentRealm: 'play',
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.suggestion) {
        throw new Error(data.error || 'AI service returned an error.');
      }
      setAiHistory((prev) => [...prev, { user: q, suggestion: data.suggestion }]);
      setAiPrompt('');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Ask Amir assistant.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiPatch = (sug: AiSuggestion) => {
    const qScale = sug.recommendedScale.toLowerCase().trim();
    const matchedScale =
      WORLD_SCALES.find((s) => s.name.toLowerCase() === qScale) ||
      WORLD_SCALES.find((s) => s.name.toLowerCase().includes(qScale));
    if (matchedScale) onSelectScale(matchedScale);
    if (sug.recommendedRoot) {
      const rootMatch = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].find(
        (r) => r.toLowerCase() === sug.recommendedRoot?.toLowerCase()
      ) as RootNote | undefined;
      if (rootMatch) onSelectRoot(rootMatch);
    }
    const matchedInst = INSTRUMENTS.find(
      (i) => i.name.toLowerCase() === sug.recommendedInstrument.toLowerCase()
    );
    if (matchedInst) onSelectInstrument(matchedInst.id);
    if (sug.suggestedBpm) onChangeBpm(sug.suggestedBpm);
    if (sug.sonicPatch) {
      onApplyPreset({ ...DEFAULT_SONIC_PARAMS, ...sug.sonicPatch }, sug.presetName || 'AI PATCH');
    }
    if (sug.recommendedRealm && sug.recommendedRealm !== 'play') {
      onSwitchRealm(sug.recommendedRealm as RealmId);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-[70px] z-40 px-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto max-w-4xl mx-auto rounded-t-2xl bg-[#101015]/95 backdrop-blur-xl border border-[#D4AF37]/40 border-b-0 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] p-4 max-h-[60vh] overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
            {activeDrawer === 'beat' && <><Activity className="w-4 h-4" /> Beat &amp; Rhythm Sequencer</>}
            {activeDrawer === 'loop' && <><Repeat className="w-4 h-4" /> Live Performance Looper</>}
            {activeDrawer === 'inst' && <><Music className="w-4 h-4" /> Synthesized Instruments &amp; Skins</>}
            {activeDrawer === 'sounds' && <><Sparkles className="w-4 h-4" /> Sonic Presets &amp; Taqsim Audition</>}
            {activeDrawer === 'rec' && <><Mic className="w-4 h-4" /> Recording Studio &amp; 30s Rescue</>}
            {activeDrawer === 'library' && <><Download className="w-4 h-4" /> Recording Library &amp; WAV/MIDI Export</>}
            {activeDrawer === 'pro' && <><Crown className="w-4 h-4" /> Pro Hardware, MIDI &amp; Upgrades</>}
            {activeDrawer === 'ask-amir' && <><Sparkles className="w-4 h-4" /> Ask Amir · AI Maqam &amp; Sound Designer</>}
          </div>
          <button
            type="button"
            aria-label="Close Drawer"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DRAWER: BEAT SEQUENCER */}
        {activeDrawer === 'beat' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleBeat}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                    beatPlaying
                      ? 'bg-red-500 text-white'
                      : 'bg-[#D4AF37] text-black hover:bg-[#FACC15]'
                  }`}
                >
                  {beatPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{beatPlaying ? 'Stop Groove' : 'Play Rhythm'}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleMetronome}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                    metronomeOn
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/75'
                  }`}
                >
                  Metronome: {metronomeOn ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Tempo:</span>
                <input
                  type="range"
                  min={60}
                  max={170}
                  value={bpm}
                  onChange={(e) => onChangeBpm(Number(e.target.value))}
                  className="accent-[#D4AF37]"
                />
                <span className="text-xs font-mono font-bold text-[#FACC15] w-14">{bpm} BPM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BEAT_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChangeBeatPattern(p.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    beatPattern === p.id
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                      : 'bg-white/[0.03] border-white/10 text-white/75 hover:border-white/25'
                  }`}
                >
                  <div className="text-xs font-bold">{p.name}</div>
                  <div className="text-[10px] text-white/55 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DRAWER: LOOPER */}
        {activeDrawer === 'loop' && (
          <div className="space-y-3">
            <p className="text-xs text-white/70">
              Record a musical phrase on the keyboard and loop it seamlessly synced to {bpm} BPM while you solo over top.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleLoopRecording}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  loopRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {loopRecording ? 'Finish Loop Capture' : 'Capture Note Loop'}
              </button>

              <button
                type="button"
                disabled={!hasLoopEvents}
                onClick={onToggleLoopPlaying}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40 ${
                  loopPlaying
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                {loopPlaying ? 'Stop Loop Playback' : 'Play Captured Loop'}
              </button>
            </div>
          </div>
        )}

        {/* DRAWER: INSTRUMENTS & SKINS */}
        {activeDrawer === 'inst' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {INSTRUMENTS.map((item) => {
                const active = item.id === instrument;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectInstrument(item.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      active
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/80 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </div>
                    <div className="text-[10px] text-[#D4AF37] mt-0.5">{item.subtitle}</div>
                    <div className="text-[9px] text-white/45 mt-1">{item.engineLabel}</div>
                  </button>
                );
              })}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/55 mb-2">
                UHD Keybed Skins ({PIANO_SKINS.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PIANO_SKINS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSkin(s.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                      pianoSkin === s.id
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.swatch }} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRAWER: SOUNDS & PRESETS */}
        {activeDrawer === 'sounds' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-white/75">
                Audition current Maqam <strong className="text-[#D4AF37]">{scale.name}</strong> in {rootNote} or apply Sonic Engine presets:
              </div>
              <button
                type="button"
                onClick={onPlayDemoTaqsim}
                className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Audition {scale.name} Phrase
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SONIC_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onApplyPreset({ ...DEFAULT_SONIC_PARAMS, ...p.overrides }, p.label)}
                  className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/60 text-left transition"
                >
                  <div className="text-xs font-bold text-[#FACC15]">{p.label}</div>
                  <div className="text-[11px] text-white mt-0.5">{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DRAWER: RECORDING STUDIO */}
        {activeDrawer === 'rec' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={onToggleMasterRecord}
                className={`p-3.5 rounded-xl border text-left transition ${
                  isRecording
                    ? 'bg-red-500/20 border-red-500 text-white'
                    : 'bg-white/[0.04] border-white/10 hover:border-red-400/60 text-white'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isRecording ? 'animate-ping' : ''}`} />
                  {isRecording ? 'Stop Studio Master Record' : 'Start Live Studio Record'}
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  Captures Web Audio master stereo mix directly into your vault
                </div>
              </button>

              <button
                type="button"
                onClick={onToggleMicRecord}
                className={`p-3.5 rounded-xl border text-left transition ${
                  isMicRecording
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-white/[0.04] border-white/10 hover:border-amber-400/60 text-white'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  {isMicRecording ? 'Stop Microphone Take' : 'Record Microphone Vocals/Oud'}
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  Uses browser microphone input for vocal taqsim or acoustic layer
                </div>
              </button>

              <button
                type="button"
                onClick={onRescue30s}
                className="p-3.5 rounded-xl border bg-[#D4AF37]/10 border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 text-left transition"
              >
                <div className="text-xs font-extrabold text-[#FACC15] flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  30s Retrospective Rescue
                </div>
                <div className="text-[10px] text-white/70 mt-1">
                  Saves the last 30 seconds of notes you played as replayable MIDI + WAV
                </div>
              </button>
            </div>
          </div>
        )}

        {/* DRAWER: RECORDING LIBRARY */}
        {activeDrawer === 'library' && (
          <div className="space-y-2.5">
            {recordings.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/55">
                No saved takes yet. Hit <strong>Record</strong> or <strong>30s Rescue</strong> after playing a phrase!
              </div>
            ) : (
              <div className="space-y-2">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{rec.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase text-[#D4AF37]">
                          {rec.kind}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/55">
                        {rec.scaleName} · {rec.instrument} · {rec.durationSec.toFixed(1)}s · {rec.createdAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.audioUrl && (
                        <audio controls src={rec.audioUrl} className="h-8 max-w-[200px]" />
                      )}
                      {rec.midiEvents && rec.midiEvents.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => onReplayMidiEvents(rec.midiEvents!)}
                            className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-black text-[10px] font-bold flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Replay
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadBlob(
                                encodeWavFromEvents(rec.midiEvents!),
                                `${rec.name.replace(/\s+/g, '_')}.wav`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                          >
                            WAV
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadBlob(
                                encodeStandardMidiFile(rec.midiEvents!, bpm),
                                `${rec.name.replace(/\s+/g, '_')}.mid`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                          >
                            .MID
                          </button>
                        </>
                      )}
                      {rec.blob && !rec.midiEvents && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadBlob(rec.blob!, `${rec.name.replace(/\s+/g, '_')}.webm`)
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
                        >
                          Audio
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteRecording(rec.id)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DRAWER: PRO & HARDWARE */}
        {activeDrawer === 'pro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-white">Hardware Web MIDI &amp; BLE Status</div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onRescanMidi}
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white"
                  >
                    Rescan USB MIDI
                  </button>
                  <button
                    type="button"
                    onClick={onScanBluetoothMidi}
                    className="px-2 py-1 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[10px] font-bold text-sky-300"
                  >
                    Connect BLE MIDI
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-white/65">
                {midiInputs.length > 0
                  ? `Connected MIDI Controllers: ${midiInputs.join(', ')}`
                  : 'No external USB/Bluetooth MIDI keyboard detected. Connect a controller or play using your computer keyboard (A–L, W/E/T/Y/U).'}
              </div>
              {lastMidiEvent && (
                <div
                  data-testid="last-midi-event"
                  className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10.5px] font-mono text-[#FACC15]"
                >
                  Last MIDI: {lastMidiEvent}
                </div>
              )}
              <div className="text-[10px] text-white/45">
                Supports Note On/Off, Velocity, CC64 Sustain, CC1 Mod Wheel, 14-bit Pitch Bend · Shortcuts: [A–L, W–P] · Octave [Z/X] · Sustain [Space]
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-transparent border border-[#D4AF37]/40 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-[#FACC15]">MaqAmir Pro Studio</div>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-[#D4AF37]/40 text-[10px] font-bold text-[#FACC15]">
                    {subscriptionState.effectivePlan === 'pro_lifetime'
                      ? 'PRO LIFETIME'
                      : subscriptionState.effectivePlan === 'pro_monthly'
                      ? 'PRO MONTHLY'
                      : 'FREE PLAN'}
                  </span>
                </div>
                <div className="text-[11px] text-white/75 mt-1">
                  {subscriptionState.effectivePlan === 'pro_lifetime'
                    ? 'اشتراكك الدائم مفعّل مدى الحياة بدون تاريخ انتهاء.'
                    : subscriptionState.effectivePlan === 'pro_monthly' && profile?.subscriptionExpiresAt
                    ? `اشتراك Pro الشهري مفعّل حتى ${profile.subscriptionExpiresAt.toLocaleDateString('en-GB')}.`
                    : 'قم بالترقية إلى Pro Monthly (30 يومًا) أو Pro Lifetime عبر التحويل اليدوي InstaPay.'}
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigatePro}
                className="self-start px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-extrabold hover:bg-[#FACC15]"
              >
                {subscriptionState.effectivePlan === 'pro_monthly'
                  ? 'Renew / View Pricing'
                  : subscriptionState.effectivePlan === 'pro_lifetime'
                  ? 'Manage Subscription'
                  : 'Upgrade via InstaPay'}
              </button>
            </div>
          </div>
        )}

        {/* DRAWER: ASK AMIR AI ASSISTANT */}
        {activeDrawer === 'ask-amir' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                'Warm Egyptian Rast Oud with atmospheric desert reverb',
                'Midnight Anatolian Hicaz Ney Flute for meditation',
                'Dawn Indian Raga Bhairav Sitar with deep shimmer',
                'Analog Synth Hijaz Kar bassline at 124 BPM',
              ].map((presetQ) => (
                <button
                  key={presetQ}
                  type="button"
                  onClick={() => handleAskAmir(presetQ)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-[#D4AF37]/20 border border-white/10 text-[10px] text-white/80 hover:text-[#FACC15]"
                >
                  {presetQ}
                </button>
              ))}
            </div>

            {aiError && (
              <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-200">
                {aiError}
              </div>
            )}

            {aiHistory.length > 0 && (
              <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                {aiHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.04] border border-[#D4AF37]/30 space-y-2"
                  >
                    <div className="text-[10px] text-white/50">You: {item.user}</div>
                    <div className="text-xs text-white/90 leading-relaxed">{item.suggestion.reply}</div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#FACC15] font-bold">
                          {item.suggestion.recommendedScale}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white">
                          {item.suggestion.recommendedInstrument}
                        </span>
                        {item.suggestion.suggestedBpm && (
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white">
                            {item.suggestion.suggestedBpm} BPM
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => applyAiPatch(item.suggestion)}
                        className="px-3 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-[11px] font-extrabold"
                      >
                        Apply "{item.suggestion.presetName}"
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAmir(aiPrompt);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask Amir to design a Maqam patch, suggest progressions, or configure FX..."
                className="flex-1 h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="h-9 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] disabled:opacity-45 text-black text-xs font-extrabold flex items-center gap-1.5"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Ask Amir</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
