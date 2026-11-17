import * as Tone from 'tone';
import { getNoteTuningInfo, RootNote, WorldScale } from '../data/scales';
import { DEFAULT_SONIC_PARAMS, SonicParams } from '../data/sonicParams';
import type { InstrumentId } from '../data/instruments';

const MAX_POLYPHONY = 32;

export interface ActiveVoice {
  noteId: string;
  midiNote: number;
  baseFreq: number;
  scale: WorldScale;
  root: RootNote;
  extraDetuneCents: number;
  overrideFreqHz?: number;
  instrument: InstrumentId;
  gainNode: GainNode;
  panner: StereoPannerNode;
  filter: BiquadFilterNode;
  oscillators: OscillatorNode[];
  harmonicMultipliers: number[];
  baseDetunes: number[];
  lfoOsc?: OscillatorNode;
  lfoGain?: GainNode;
  baseVibCents: number;
  noiseSource?: AudioBufferSourceNode;
  toneLayerFreq?: number;
  releaseSec: number;
  sustained: boolean;
  latched: boolean;
  routedToFx: boolean;
  startedAt: number;
  baseVelocityGain: number;
  aftertouch: { vibrato: number; filterShift: number; bendSt: number; volume: number };
}

export interface RecordedNoteEvent {
  midiNote: number;
  freq: number;
  velocity: number;
  startTimeMs: number;
  durationMs: number;
  instrument: InstrumentId;
  label: string;
}

export interface SavedRecording {
  id: string;
  name: string;
  createdAt: string;
  durationSec: number;
  kind: 'audio' | 'mic' | 'rescue-midi' | 'loop';
  scaleName: string;
  instrument: string;
  audioUrl?: string;
  midiEvents?: RecordedNoteEvent[];
  blob?: Blob;
}

export interface AudioDiagnostics {
  contextState: AudioContextState | 'uninitialized';
  sampleRate: number;
  toneVersion: string;
  activeVoiceCount: number;
  sustainedVoiceCount: number;
  latchedVoiceCount: number;
  sustainActive: boolean;
  masterGain: number;
  rmsLevel: number;
  peakLevel: number;
  activeVoices: Array<{
    noteId: string;
    midiNote: number;
    freqHz: number;
    instrument: InstrumentId;
    sustained: boolean;
    latched: boolean;
    routedToFx: boolean;
  }>;
}

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = Math.max(0, amount) * 3.2;
  const n = 2048;
  const buf = new ArrayBuffer(n * 4);
  const curve = new Float32Array(buf);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    if (k <= 0.01) {
      curve[i] = x;
    } else {
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
  }
  return curve;
}

function makeBitCrushCurve(depthPct: number): Float32Array<ArrayBuffer> {
  const n = 2048;
  const buf = new ArrayBuffer(n * 4);
  const curve = new Float32Array(buf);
  // Map 0..100% depth -> 16-bit down to 2-bit stepped staircase
  const bits = Math.max(2, 16 - (Math.max(0, Math.min(100, depthPct)) / 100) * 13.5);
  const levels = Math.pow(2, bits);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    if (depthPct <= 1) {
      curve[i] = x;
    } else {
      curve[i] = Math.round(x * levels) / levels;
    }
  }
  return curve;
}

function createImpulseResponse(ctx: AudioContext, seconds: number, dampingPct: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * Math.min(6.5, Math.max(0.2, seconds))));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  const decay = 1.6 + (dampingPct / 100) * 3.5;
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
    }
  }
  return impulse;
}

export function encodeWavFromEvents(
  events: RecordedNoteEvent[],
  sampleRate = 22050
): Blob {
  const maxEndMs = events.reduce((acc, e) => Math.max(acc, e.startTimeMs + e.durationMs + 400), 1500);
  const totalSamples = Math.min(sampleRate * 45, Math.ceil((maxEndMs / 1000) * sampleRate));
  const pcm = new Float32Array(totalSamples);

  for (const ev of events) {
    const startSample = Math.max(0, Math.floor((ev.startTimeMs / 1000) * sampleRate));
    const durSamples = Math.floor(((ev.durationMs + 350) / 1000) * sampleRate);
    const omega = (2 * Math.PI * ev.freq) / sampleRate;
    const amp = 0.25 * Math.max(0.2, Math.min(1, ev.velocity));
    for (let i = 0; i < durSamples && startSample + i < totalSamples; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / (0.008 * sampleRate)) * Math.exp(-t * 3.2);
      const sample =
        (Math.sin(omega * i) + 0.35 * Math.sin(omega * 2 * i) + 0.14 * Math.sin(omega * 3 * i)) *
        0.65 *
        env *
        amp;
      pcm[startSample + i] += sample;
    }
  }

  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export function encodeStandardMidiFile(events: RecordedNoteEvent[], bpm = 120): Blob {
  const tpq = 480;
  const msPerTick = 60000 / (bpm * tpq);
  interface MidiMsg {
    tick: number;
    bytes: number[];
  }
  const msgs: MidiMsg[] = [];
  for (const ev of events) {
    const startTick = Math.max(0, Math.round(ev.startTimeMs / msPerTick));
    const endTick = Math.max(startTick + 30, Math.round((ev.startTimeMs + ev.durationMs) / msPerTick));
    const vel = Math.max(1, Math.min(127, Math.round(ev.velocity * 127)));
    const note = Math.max(0, Math.min(127, Math.round(ev.midiNote)));
    msgs.push({ tick: startTick, bytes: [0x90, note, vel] });
    msgs.push({ tick: endTick, bytes: [0x80, note, 0] });
  }
  msgs.sort((a, b) => a.tick - b.tick);

  const trackBytes: number[] = [];
  const writeVarLen = (val: number) => {
    let buffer = val & 0x7f;
    while ((val >>= 7) > 0) {
      buffer <<= 8;
      buffer |= (val & 0x7f) | 0x80;
    }
    while (true) {
      trackBytes.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  };

  let lastTick = 0;
  for (const m of msgs) {
    const delta = Math.max(0, m.tick - lastTick);
    lastTick = m.tick;
    writeVarLen(delta);
    trackBytes.push(...m.bytes);
  }
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    (tpq >> 8) & 0xff, tpq & 0xff,
  ];
  const len = trackBytes.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff,
  ];

  return new Blob([new Uint8Array([...header, ...trackHeader, ...trackBytes])], {
    type: 'audio/midi',
  });
}

class MaqAmirAudioEngine {
  private ctx: AudioContext | null = null;
  private voices = new Map<string, ActiveVoice>();
  private params: SonicParams = { ...DEFAULT_SONIC_PARAMS };

  // Master Web Audio DSP chain
  private voiceBus!: GainNode;
  private frozenDryBus!: GainNode;
  private preFilter!: BiquadFilterNode;
  private bitCrushShaper!: WaveShaperNode;
  private bitCrushDryGain!: GainNode;
  private bitCrushWetGain!: GainNode;
  private bitCrushSum!: GainNode;
  private distShaper!: WaveShaperNode;
  private tapeShaper!: WaveShaperNode;
  private eqLow!: BiquadFilterNode;
  private eqMid!: BiquadFilterNode;
  private eqHigh!: BiquadFilterNode;
  private tremoloGain!: GainNode;
  private tremoloLfo!: OscillatorNode;
  private tremoloDepthGain!: GainNode;
  private dryGain!: GainNode;
  private delayNode!: DelayNode;
  private delayFeedback!: GainNode;
  private delayFilter!: BiquadFilterNode;
  private delayMixGain!: GainNode;
  private revDelayNode!: DelayNode;
  private revDelayFeedback!: GainNode;
  private revDelayMixGain!: GainNode;
  private chorusDelay!: DelayNode;
  private chorusLfo!: OscillatorNode;
  private chorusDepthGain!: GainNode;
  private chorusMixGain!: GainNode;
  private flangerDelay!: DelayNode;
  private flangerLfo!: OscillatorNode;
  private flangerDepthGain!: GainNode;
  private flangerFeedback!: GainNode;
  private flangerMixGain!: GainNode;
  private phaserFilter!: BiquadFilterNode;
  private phaserLfo!: OscillatorNode;
  private phaserDepthGain!: GainNode;
  private convolver!: ConvolverNode;
  private reverbPreDelay!: DelayNode;
  private reverbMixGain!: GainNode;
  private compressor!: DynamicsCompressorNode;
  private masterPan!: StereoPannerNode;
  private masterGain!: GainNode;
  private analyser!: AnalyserNode;
  private mediaDest!: MediaStreamAudioDestinationNode;

  // Tone.js integrated engines sharing the unified AudioContext
  private tonePolySynth: Tone.PolySynth | null = null;
  private toneMembrane: Tone.MembraneSynth | null = null;
  private toneNoisePerc: Tone.NoiseSynth | null = null;
  private toneStereoWidener: Tone.StereoWidener | null = null;
  private toneBusGain: GainNode | null = null;

  // Binaural oscillator pair
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;

  // Recording state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recStartTime = 0;

  // Mic recorder
  private micRecorder: MediaRecorder | null = null;
  private micChunks: Blob[] = [];
  private micStream: MediaStream | null = null;

  // 30-second retrospective rescue buffer
  private retrospectiveBuffer: RecordedNoteEvent[] = [];
  private openNoteStarts = new Map<
    string,
    { midiNote: number; freq: number; velocity: number; startedAt: number; instrument: InstrumentId; label: string }
  >();

  // Sustain pedal
  public sustainActive = false;

  // MIDI controller modulation state
  private midiPitchBendNorm = 0; // -1..1
  private midiModWheelNorm = 0; // 0..1

  // Custom DJ pad recorded samples & cue monitoring
  private customPadBuffers = new Map<number, AudioBuffer>();
  private padRecRecorder: MediaRecorder | null = null;
  private padRecChunks: Blob[] = [];
  private padRecStream: MediaStream | null = null;
  private padRecUsedMic = false;
  private cueChannel = 2;

  // Noise buffer cache
  private noiseBuffer: AudioBuffer | null = null;
  private lastReverbSig = '';

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      try {
        Tone.setContext(this.ctx);
      } catch {
        // fallback if context already bound
      }
      this.buildDspGraph(this.ctx);
      this.initToneInstruments();
      this.applyParams(this.params);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
      void Tone.start().catch(() => {});
    }
    return this.ctx;
  }

  private initToneInstruments() {
    if (!this.ctx || this.tonePolySynth) return;
    try {
      this.toneBusGain = this.ctx.createGain();
      this.toneBusGain.gain.value = 0.34;
      this.toneBusGain.connect(this.voiceBus);

      this.tonePolySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.004, decay: 0.45, sustain: 0.28, release: 0.85 },
      });
      this.tonePolySynth.maxPolyphony = 16;
      Tone.connect(this.tonePolySynth, this.toneBusGain);

      this.toneMembrane = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 5,
        envelope: { attack: 0.002, decay: 0.28, sustain: 0.01, release: 0.25 },
      });
      Tone.connect(this.toneMembrane, this.voiceBus);

      this.toneNoisePerc = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.002, decay: 0.14, sustain: 0 },
      });
      Tone.connect(this.toneNoisePerc, this.voiceBus);

      this.toneStereoWidener = new Tone.StereoWidener(0.5);
      // Insert Tone.StereoWidener between compressor and masterPan cleanly
      this.compressor.disconnect();
      Tone.connect(this.compressor, this.toneStereoWidener);
      Tone.connect(this.toneStereoWidener, this.masterPan);
    } catch {
      // Fall back to direct compressor -> masterPan if Tone initialization fails in restricted environments
      try {
        this.compressor.disconnect();
        this.compressor.connect(this.masterPan);
      } catch {
        // ignore
      }
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }

  private buildDspGraph(ctx: AudioContext) {
    this.voiceBus = ctx.createGain();
    this.frozenDryBus = ctx.createGain();

    this.preFilter = ctx.createBiquadFilter();
    this.preFilter.type = 'lowpass';

    // Stepped quantization BitCrusher stage (Dry + Wet Sum)
    this.bitCrushShaper = ctx.createWaveShaper();
    this.bitCrushDryGain = ctx.createGain();
    this.bitCrushDryGain.gain.value = 1;
    this.bitCrushWetGain = ctx.createGain();
    this.bitCrushWetGain.gain.value = 0;
    this.bitCrushSum = ctx.createGain();

    this.distShaper = ctx.createWaveShaper();
    this.distShaper.oversample = '2x';
    this.tapeShaper = ctx.createWaveShaper();

    this.eqLow = ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 180;

    this.eqMid = ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.Q.value = 1.1;

    this.eqHigh = ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 5200;

    this.phaserFilter = ctx.createBiquadFilter();
    this.phaserFilter.type = 'allpass';
    this.phaserFilter.frequency.value = 900;
    this.phaserLfo = ctx.createOscillator();
    this.phaserDepthGain = ctx.createGain();
    this.phaserLfo.connect(this.phaserDepthGain);
    this.phaserDepthGain.connect(this.phaserFilter.frequency);
    this.phaserLfo.start();

    this.tremoloGain = ctx.createGain();
    this.tremoloGain.gain.value = 1;
    this.tremoloLfo = ctx.createOscillator();
    this.tremoloDepthGain = ctx.createGain();
    this.tremoloLfo.connect(this.tremoloDepthGain);
    this.tremoloDepthGain.connect(this.tremoloGain.gain);
    this.tremoloLfo.start();

    // Chorus parallel
    this.chorusDelay = ctx.createDelay(0.1);
    this.chorusDelay.delayTime.value = 0.018;
    this.chorusLfo = ctx.createOscillator();
    this.chorusDepthGain = ctx.createGain();
    this.chorusLfo.connect(this.chorusDepthGain);
    this.chorusDepthGain.connect(this.chorusDelay.delayTime);
    this.chorusLfo.start();
    this.chorusMixGain = ctx.createGain();

    // Flanger parallel
    this.flangerDelay = ctx.createDelay(0.05);
    this.flangerDelay.delayTime.value = 0.003;
    this.flangerFeedback = ctx.createGain();
    this.flangerLfo = ctx.createOscillator();
    this.flangerDepthGain = ctx.createGain();
    this.flangerLfo.connect(this.flangerDepthGain);
    this.flangerDepthGain.connect(this.flangerDelay.delayTime);
    this.flangerLfo.start();
    this.flangerDelay.connect(this.flangerFeedback);
    this.flangerFeedback.connect(this.flangerDelay);
    this.flangerMixGain = ctx.createGain();

    // Delay parallel
    this.delayNode = ctx.createDelay(2.5);
    this.delayFeedback = ctx.createGain();
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayMixGain = ctx.createGain();
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.delayMixGain);

    // Reverse style echo parallel
    this.revDelayNode = ctx.createDelay(2.5);
    this.revDelayFeedback = ctx.createGain();
    this.revDelayMixGain = ctx.createGain();
    this.revDelayNode.connect(this.revDelayFeedback);
    this.revDelayFeedback.connect(this.revDelayNode);
    this.revDelayNode.connect(this.revDelayMixGain);

    // Reverb parallel
    this.reverbPreDelay = ctx.createDelay(0.4);
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createImpulseResponse(ctx, 1.2, 30);
    this.reverbMixGain = ctx.createGain();
    this.reverbPreDelay.connect(this.convolver);
    this.convolver.connect(this.reverbMixGain);

    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 1;

    this.compressor = ctx.createDynamicsCompressor();
    this.masterPan = ctx.createStereoPanner();
    this.masterGain = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.mediaDest = ctx.createMediaStreamDestination();

    // Wire series core: voiceBus -> preFilter -> BitCrush Dry/Wet -> distShaper -> tapeShaper -> 3-band EQ -> phaser -> tremolo
    this.voiceBus.connect(this.preFilter);

    this.preFilter.connect(this.bitCrushDryGain);
    this.bitCrushDryGain.connect(this.bitCrushSum);

    this.preFilter.connect(this.bitCrushShaper);
    this.bitCrushShaper.connect(this.bitCrushWetGain);
    this.bitCrushWetGain.connect(this.bitCrushSum);

    this.bitCrushSum.connect(this.distShaper);
    this.distShaper.connect(this.tapeShaper);
    this.tapeShaper.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.phaserFilter);
    this.phaserFilter.connect(this.tremoloGain);

    // Wire parallel FX sends from tremoloGain -> compressor
    this.tremoloGain.connect(this.dryGain);
    this.dryGain.connect(this.compressor);

    this.tremoloGain.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusMixGain);
    this.chorusMixGain.connect(this.compressor);

    this.tremoloGain.connect(this.flangerDelay);
    this.flangerDelay.connect(this.flangerMixGain);
    this.flangerMixGain.connect(this.compressor);

    this.tremoloGain.connect(this.delayNode);
    this.delayMixGain.connect(this.compressor);

    this.tremoloGain.connect(this.revDelayNode);
    this.revDelayMixGain.connect(this.compressor);

    this.tremoloGain.connect(this.reverbPreDelay);
    this.reverbMixGain.connect(this.compressor);

    // Output (ToneStereoWidener inserted cleanly in initToneInstruments)
    this.compressor.connect(this.masterPan);
    this.frozenDryBus.connect(this.masterPan);
    this.masterPan.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.masterGain.connect(this.mediaDest);
    this.analyser.connect(ctx.destination);
  }

  public applyParams(next: SonicParams) {
    const prev = this.params;
    this.params = { ...next };
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.preFilter.frequency.setTargetAtTime(Math.max(80, Math.min(20000, next.cutoff)), now, 0.015);
    this.preFilter.Q.setTargetAtTime(0.6 + (next.resonance / 100) * 14, now, 0.015);

    const crushWet = Math.max(0, Math.min(1, next.bitCrushMix / 100));
    this.bitCrushShaper.curve = makeBitCrushCurve(next.bitCrushDepth);
    this.bitCrushDryGain.gain.setTargetAtTime(1 - crushWet * 0.85, now, 0.015);
    this.bitCrushWetGain.gain.setTargetAtTime(crushWet, now, 0.015);

    this.distShaper.curve = makeDistortionCurve(next.distortion);
    this.tapeShaper.curve = makeDistortionCurve(next.tapeDrive * 0.65);

    this.eqLow.gain.setTargetAtTime(next.eqLow + (next.loudness / 100) * 4, now, 0.02);
    this.eqMid.frequency.setTargetAtTime(next.eqMidFreq, now, 0.02);
    this.eqMid.gain.setTargetAtTime(next.eqMid, now, 0.02);
    this.eqHigh.gain.setTargetAtTime(
      next.eqHigh + (next.loudness / 100) * 3 - Math.max(0, (16000 - next.tapeTone) / 3000),
      now,
      0.02
    );

    this.tremoloLfo.frequency.setTargetAtTime(Math.max(0.2, next.tremoloRate), now, 0.02);
    this.tremoloDepthGain.gain.setTargetAtTime((next.tremoloDepth / 100) * 0.45, now, 0.02);

    this.chorusLfo.frequency.setTargetAtTime(Math.max(0.1, next.chorusRate), now, 0.02);
    this.chorusDepthGain.gain.setTargetAtTime((next.chorusDepth / 100) * 0.008, now, 0.02);
    this.chorusMixGain.gain.setTargetAtTime((next.chorusDepth / 100) * 0.45, now, 0.02);

    this.flangerDelay.delayTime.setTargetAtTime(next.flangerDelay / 1000, now, 0.02);
    this.flangerLfo.frequency.setTargetAtTime(Math.max(0.05, next.flangerRate), now, 0.02);
    this.flangerDepthGain.gain.setTargetAtTime((next.flangerDepth / 100) * 0.004, now, 0.02);
    this.flangerFeedback.gain.setTargetAtTime(Math.min(0.85, next.flangerFeedback / 100), now, 0.02);
    this.flangerMixGain.gain.setTargetAtTime((next.flangerDepth / 100) * 0.4, now, 0.02);

    this.phaserLfo.frequency.setTargetAtTime(Math.max(0.1, next.phaserRate), now, 0.02);
    this.phaserDepthGain.gain.setTargetAtTime((next.phaserDepth / 100) * 650, now, 0.02);
    this.phaserFilter.Q.setTargetAtTime(0.8 + (next.phaserFeedback / 100) * 8.5, now, 0.02);

    this.delayNode.delayTime.setTargetAtTime(next.delayTime / 1000, now, 0.02);
    this.delayFeedback.gain.setTargetAtTime(Math.min(0.85, next.delayFeedback / 100), now, 0.02);
    this.delayFilter.frequency.setTargetAtTime(Math.max(200, next.delayCutoff), now, 0.02);
    this.delayMixGain.gain.setTargetAtTime((next.delayMix / 100) * 0.7, now, 0.02);

    this.revDelayNode.delayTime.setTargetAtTime(next.reverseDelayTime / 1000, now, 0.02);
    this.revDelayFeedback.gain.setTargetAtTime(Math.min(0.85, next.reverseDelayFeedback / 100), now, 0.02);
    this.revDelayMixGain.gain.setTargetAtTime((next.reverseDelayMix / 100) * 0.5, now, 0.02);

    this.reverbPreDelay.delayTime.setTargetAtTime(next.reverbPreDelay / 1000, now, 0.02);
    this.reverbMixGain.gain.setTargetAtTime((next.reverbMix / 100) * 0.9, now, 0.02);
    const revSig = `${next.reverbSize.toFixed(1)}_${Math.round(next.reverbDamping / 5)}`;
    if (revSig !== this.lastReverbSig) {
      this.lastReverbSig = revSig;
      this.convolver.buffer = createImpulseResponse(this.ctx, next.reverbSize, next.reverbDamping);
    }

    this.compressor.threshold.setTargetAtTime(next.compThreshold, now, 0.02);
    this.compressor.ratio.setTargetAtTime(Math.max(1, next.compRatio), now, 0.02);
    this.compressor.attack.setTargetAtTime(next.compAttack / 1000, now, 0.02);
    this.compressor.release.setTargetAtTime(next.compRelease / 1000, now, 0.02);

    if (this.toneStereoWidener) {
      try {
        this.toneStereoWidener.width.rampTo(0.5 + (next.stereoWidth / 100) * 0.45, 0.04);
      } catch {
        // ignore if context state is paused
      }
    }

    this.masterPan.pan.setTargetAtTime(Math.max(-1, Math.min(1, next.pan / 100)), now, 0.02);
    const gainLinear = (next.gain / 100) * (1 + (next.loudness / 100) * 0.3);
    this.masterGain.gain.setTargetAtTime(gainLinear, now, 0.02);

    this.updateBinaural(next.binauralBeat);

    // Update live Tape Flutter LFO depth on routed active voices
    if (prev.tapeFlutter !== next.tapeFlutter) {
      const flutterCents = (next.tapeFlutter / 100) * 28;
      for (const v of this.voices.values()) {
        if (!v.routedToFx) continue;
        const instBase = v.instrument === 'Ney Flute' || v.instrument === 'Bowed Cello' ? 4 : 0;
        v.baseVibCents = instBase + flutterCents;
        if (v.lfoGain) {
          v.lfoGain.gain.setTargetAtTime(
            v.baseVibCents + this.midiModWheelNorm * 65,
            now,
            0.025
          );
        }
        if (v.lfoOsc) {
          v.lfoOsc.frequency.setTargetAtTime(
            v.instrument === 'Ney Flute' ? 5.2 : next.tapeFlutter > 5 ? 3.8 : 5.8,
            now,
            0.025
          );
        }
      }
    }

    // Live-retune routed ringing voices if global pitch/tuning/speed changed
    if (
      prev.pitch !== next.pitch ||
      prev.transpose !== next.transpose ||
      prev.baseTuning !== next.baseTuning ||
      prev.playbackRate !== next.playbackRate
    ) {
      this.retuneAllVoicesInternal();
    }
  }

  private updateBinaural(beatHz: number) {
    if (!this.ctx) return;
    if (beatHz <= 0.1) {
      if (this.binauralGain) {
        this.binauralGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }
    if (!this.binauralLeftOsc || !this.binauralRightOsc || !this.binauralGain) {
      const merger = this.ctx.createChannelMerger(2);
      this.binauralGain = this.ctx.createGain();
      this.binauralGain.gain.value = 0;
      this.binauralLeftOsc = this.ctx.createOscillator();
      this.binauralRightOsc = this.ctx.createOscillator();
      this.binauralLeftOsc.type = 'sine';
      this.binauralRightOsc.type = 'sine';
      this.binauralLeftOsc.frequency.value = 216;
      this.binauralRightOsc.frequency.value = 216 + beatHz;
      this.binauralLeftOsc.connect(merger, 0, 0);
      this.binauralRightOsc.connect(merger, 0, 1);
      merger.connect(this.binauralGain);
      this.binauralGain.connect(this.masterGain);
      this.binauralLeftOsc.start();
      this.binauralRightOsc.start();
    }
    const now = this.ctx.currentTime;
    this.binauralLeftOsc.frequency.setTargetAtTime(216, now, 0.05);
    this.binauralRightOsc.frequency.setTargetAtTime(216 + beatHz, now, 0.05);
    this.binauralGain.gain.setTargetAtTime(0.055, now, 0.1);
  }

  public computeFrequency(
    midiNote: number,
    scale: WorldScale,
    root: RootNote
  ): { freq: number; label: string; cents: number; inScale: boolean } {
    const info = getNoteTuningInfo(midiNote, scale, root, this.params.baseTuning);
    const shiftSt = this.params.pitch + this.params.transpose;
    const freq =
      info.freq * Math.pow(2, shiftSt / 12) * Math.max(0.5, Math.min(2, this.params.playbackRate));
    return { freq, label: info.noteLabel, cents: info.cents, inScale: info.inScale };
  }

  public retuneActiveVoices(nextScale: WorldScale, nextRoot: RootNote) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const v of this.voices.values()) {
      // Sticky FX Freeze protects deselected latched voices from global tuning changes
      if (!v.routedToFx) continue;
      v.scale = nextScale;
      v.root = nextRoot;
      if (v.overrideFreqHz !== undefined) continue;
      const { freq } = this.computeFrequency(v.midiNote, nextScale, nextRoot);
      const targetFreq = freq * Math.pow(2, v.extraDetuneCents / 1200);
      v.baseFreq = targetFreq;
      v.oscillators.forEach((osc, idx) => {
        const mult = v.harmonicMultipliers[idx] ?? 1;
        osc.frequency.setTargetAtTime(targetFreq * mult, now, 0.022);
      });
    }
  }

  private retuneAllVoicesInternal() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const v of this.voices.values()) {
      // Sticky FX Freeze bypasses global pitch/tuning/speed modulation
      if (!v.routedToFx) continue;
      const shiftSt = this.params.pitch + this.params.transpose;
      const rateScale = Math.max(0.5, Math.min(2, this.params.playbackRate));
      let targetFreq: number;
      if (v.overrideFreqHz !== undefined) {
        targetFreq = v.overrideFreqHz * Math.pow(2, shiftSt / 12) * rateScale;
      } else {
        const { freq } = this.computeFrequency(v.midiNote, v.scale, v.root);
        targetFreq = freq * Math.pow(2, v.extraDetuneCents / 1200);
      }
      v.baseFreq = targetFreq;
      v.oscillators.forEach((osc, idx) => {
        const mult = v.harmonicMultipliers[idx] ?? 1;
        osc.frequency.setTargetAtTime(targetFreq * mult, now, 0.018);
      });
    }
  }

  private evictOldestIfOverCap() {
    if (this.voices.size < MAX_POLYPHONY) return;
    let candidateId: string | null = null;
    let oldestTime = Infinity;
    for (const [id, v] of this.voices.entries()) {
      if (v.latched) continue;
      if (v.startedAt < oldestTime) {
        oldestTime = v.startedAt;
        candidateId = id;
      }
    }
    if (!candidateId) {
      const first = this.voices.keys().next();
      if (!first.done) candidateId = first.value;
    }
    if (candidateId) {
      this.forceStopVoice(candidateId);
    }
  }

  public noteOn(
    noteId: string,
    midiNote: number,
    scale: WorldScale,
    root: RootNote,
    instrument: InstrumentId,
    velocity = 0.85,
    latched = false,
    extraDetuneCents = 0,
    overrideFreqHz?: number
  ) {
    const ctx = this.ensureContext();
    if (this.voices.has(noteId)) {
      this.forceStopVoice(noteId);
    }
    this.evictOldestIfOverCap();

    const computed = this.computeFrequency(midiNote, scale, root);
    const shiftSt = this.params.pitch + this.params.transpose;
    const rateScale = Math.max(0.5, Math.min(2, this.params.playbackRate));
    const actualFreq =
      overrideFreqHz !== undefined
        ? overrideFreqHz * Math.pow(2, shiftSt / 12) * rateScale
        : computed.freq * Math.pow(2, extraDetuneCents / 1200);
    const label = computed.label;
    const now = ctx.currentTime;

    const voiceGain = ctx.createGain();
    const voicePan = ctx.createStereoPanner();
    const voiceFilter = ctx.createBiquadFilter();
    voiceFilter.type = 'lowpass';
    voiceFilter.frequency.setValueAtTime(16000, now);

    const attackSec = Math.max(0.002, this.params.attack / 1000);
    const decaySec = Math.max(0.04, this.params.decay / 1000);
    const sustainLvl = Math.max(0.05, this.params.sustain / 100);
    const releaseSec = Math.max(0.06, this.params.release / 1000);

    const clampedVel = Math.max(0.15, Math.min(1, velocity));
    const velAmp = clampedVel * 0.44;

    const oscillators: OscillatorNode[] = [];
    const harmonicMultipliers: number[] = [];
    const baseDetunes: number[] = [];
    let noiseSource: AudioBufferSourceNode | undefined;
    let toneLayerFreq: number | undefined;

    if (instrument === 'Grand Piano') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const o3 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      const g3 = ctx.createGain();
      o1.type = 'triangle';
      o2.type = 'sine';
      o3.type = 'sawtooth';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq * 2, now);
      o3.frequency.setValueAtTime(actualFreq * 3, now);
      o3.detune.setValueAtTime(3, now);
      g1.gain.setValueAtTime(0.75, now);
      g2.gain.setValueAtTime(0.28 * clampedVel, now);
      g3.gain.setValueAtTime(0.11 * clampedVel, now);
      g3.gain.exponentialRampToValueAtTime(0.002, now + 0.35);
      voiceFilter.frequency.setValueAtTime(1200 + clampedVel * 8400, now);
      voiceFilter.frequency.exponentialRampToValueAtTime(950, now + 1.25);
      o1.connect(g1).connect(voiceFilter);
      o2.connect(g2).connect(voiceFilter);
      o3.connect(g3).connect(voiceFilter);
      oscillators.push(o1, o2, o3);
      harmonicMultipliers.push(1, 2, 3);
      baseDetunes.push(0, 0, 3);

      // Subtle 14ms felt hammer transient noise for acoustic piano key strike
      const hammer = ctx.createBufferSource();
      hammer.buffer = this.getNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(Math.min(5500, Math.max(450, actualFreq * 2.4)), now);
      hp.Q.setValueAtTime(1.4, now);
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0.09 * clampedVel, now);
      hg.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      hammer.connect(hp).connect(hg).connect(voiceFilter);
      hammer.start(now);
      hammer.stop(now + 0.025);
      noiseSource = hammer;

      // Layer Tone.js PolySynth acoustic shimmer
      if (this.tonePolySynth) {
        try {
          toneLayerFreq = actualFreq;
          this.tonePolySynth.triggerAttack(actualFreq, now, clampedVel * 0.6);
        } catch {
          toneLayerFreq = undefined;
        }
      }
    } else if (instrument === 'Warm Oud') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      o1.type = 'sawtooth';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq, now);
      o1.detune.setValueAtTime(-4, now);
      o2.detune.setValueAtTime(7, now);
      g1.gain.setValueAtTime(0.45, now);
      g2.gain.setValueAtTime(0.55, now);
      voiceFilter.frequency.setValueAtTime(3200 + clampedVel * 3200, now);
      voiceFilter.frequency.exponentialRampToValueAtTime(720, now + 0.55);
      voiceFilter.Q.setValueAtTime(2.5, now);
      o1.connect(g1).connect(voiceFilter);
      o2.connect(g2).connect(voiceFilter);
      oscillators.push(o1, o2);
      harmonicMultipliers.push(1, 1);
      baseDetunes.push(-4, 7);
    } else if (instrument === 'Electric Rhodes') {
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const tine = ctx.createOscillator();
      const tineGain = ctx.createGain();
      carrier.type = 'sine';
      mod.type = 'sine';
      tine.type = 'sine';
      carrier.frequency.setValueAtTime(actualFreq, now);
      mod.frequency.setValueAtTime(actualFreq * 2, now);
      tine.frequency.setValueAtTime(actualFreq * 4, now);
      modGain.gain.setValueAtTime(actualFreq * 0.72 * clampedVel, now);
      modGain.gain.exponentialRampToValueAtTime(actualFreq * 0.08, now + 0.5);
      tineGain.gain.setValueAtTime(0.18 * clampedVel, now);
      tineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      mod.connect(modGain).connect(carrier.frequency);
      carrier.connect(voiceFilter);
      tine.connect(tineGain).connect(voiceFilter);
      oscillators.push(carrier, mod, tine);
      harmonicMultipliers.push(1, 2, 4);
      baseDetunes.push(0, 0, 0);

      if (this.tonePolySynth) {
        try {
          toneLayerFreq = actualFreq;
          this.tonePolySynth.triggerAttack(actualFreq, now, clampedVel * 0.45);
        } catch {
          toneLayerFreq = undefined;
        }
      }
    } else if (instrument === 'Ney Flute') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o1.type = 'sine';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq * 2, now);
      g2.gain.setValueAtTime(0.15, now);
      o1.connect(voiceFilter);
      o2.connect(g2).connect(voiceFilter);

      const n = ctx.createBufferSource();
      n.buffer = this.getNoiseBuffer(ctx);
      n.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(actualFreq * 2.2, now);
      bp.Q.setValueAtTime(3.2, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.075 * clampedVel, now);
      ng.gain.exponentialRampToValueAtTime(0.018, now + 0.25);
      n.connect(bp).connect(ng).connect(voiceFilter);
      n.start(now);
      noiseSource = n;
      oscillators.push(o1, o2);
      harmonicMultipliers.push(1, 2);
      baseDetunes.push(0, 0);
    } else if (instrument === 'Analog Synth') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      sub.type = 'triangle';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq, now);
      o1.detune.setValueAtTime(-9, now);
      o2.detune.setValueAtTime(9, now);
      sub.frequency.setValueAtTime(actualFreq * 0.5, now);
      subGain.gain.setValueAtTime(0.35, now);
      voiceFilter.frequency.setValueAtTime(4200 + clampedVel * 5000, now);
      voiceFilter.Q.setValueAtTime(3.2, now);
      o1.connect(voiceFilter);
      o2.connect(voiceFilter);
      sub.connect(subGain).connect(voiceFilter);
      oscillators.push(o1, o2, sub);
      harmonicMultipliers.push(1, 1, 0.5);
      baseDetunes.push(-9, 9, 0);
    } else if (instrument === 'Sitar & Tanpura') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const o3 = ctx.createOscillator();
      const g2 = ctx.createGain();
      const g3 = ctx.createGain();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o3.type = 'triangle';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq * 2, now);
      o2.detune.setValueAtTime(6, now);
      o3.frequency.setValueAtTime(actualFreq * 1.5, now);
      g2.gain.setValueAtTime(0.45, now);
      g3.gain.setValueAtTime(0.22, now);
      voiceFilter.type = 'bandpass';
      voiceFilter.frequency.setValueAtTime(actualFreq * 3.1, now);
      voiceFilter.Q.setValueAtTime(1.8, now);
      o1.connect(voiceFilter);
      o2.connect(g2).connect(voiceFilter);
      o3.connect(g3).connect(voiceFilter);
      oscillators.push(o1, o2, o3);
      harmonicMultipliers.push(1, 2, 1.5);
      baseDetunes.push(0, 6, 0);
    } else if (instrument === 'Bowed Cello') {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq, now);
      o2.detune.setValueAtTime(5, now);
      voiceFilter.frequency.setValueAtTime(2100 + clampedVel * 1800, now);
      o1.connect(voiceFilter);
      o2.connect(voiceFilter);
      oscillators.push(o1, o2);
      harmonicMultipliers.push(1, 1);
      baseDetunes.push(0, 5);
    } else {
      // Crystal Bowls
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o1.type = 'sine';
      o2.type = 'sine';
      o1.frequency.setValueAtTime(actualFreq, now);
      o2.frequency.setValueAtTime(actualFreq * 2.756, now);
      g2.gain.setValueAtTime(0.16, now);
      o1.connect(voiceFilter);
      o2.connect(g2).connect(voiceFilter);
      oscillators.push(o1, o2);
      harmonicMultipliers.push(1, 2.756);
      baseDetunes.push(0, 0);
    }

    // Per-voice Vibrato LFO for Polyphonic Aftertouch + Tape Flutter
    const lfoOsc = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const flutterDepth = (this.params.tapeFlutter / 100) * 28;
    const baseVib = instrument === 'Ney Flute' || instrument === 'Bowed Cello' ? 4 : 0;
    const baseVibCents = baseVib + flutterDepth;
    lfoOsc.frequency.setValueAtTime(
      instrument === 'Ney Flute' ? 5.2 : this.params.tapeFlutter > 5 ? 3.8 : 5.8,
      now
    );
    lfoGain.gain.setValueAtTime(baseVibCents + this.midiModWheelNorm * 65, now);
    lfoOsc.connect(lfoGain);
    oscillators.forEach((osc, idx) => {
      if (this.midiPitchBendNorm !== 0) {
        const bendCents = this.midiPitchBendNorm * this.params.pitchBendRange * 100;
        osc.detune.setValueAtTime((baseDetunes[idx] ?? 0) + bendCents, now);
      }
      lfoGain.connect(osc.detune);
    });
    lfoOsc.start(now);

    // Stereo spread softly by pitch
    const keyPan = Math.max(-0.55, Math.min(0.55, ((midiNote - 60) / 36) * 0.45));
    voicePan.pan.setValueAtTime(keyPan * (this.params.stereoWidth / 100), now);

    // Instrument-specific ADSR dynamics (plucked/struck vs sustained wind/bowed)
    const isPluckedOrStruck =
      instrument === 'Grand Piano' ||
      instrument === 'Warm Oud' ||
      instrument === 'Electric Rhodes' ||
      instrument === 'Sitar & Tanpura';
    const effAtk =
      instrument === 'Bowed Cello' || instrument === 'Crystal Bowls'
        ? Math.max(attackSec, 0.085)
        : attackSec;
    const heldGain = Math.max(0.001, velAmp * sustainLvl);

    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(velAmp, now + effAtk);
    if (isPluckedOrStruck) {
      voiceGain.gain.exponentialRampToValueAtTime(heldGain * 0.72, now + effAtk + decaySec);
      voiceGain.gain.setTargetAtTime(0.001, now + effAtk + decaySec, instrument === 'Warm Oud' ? 0.65 : 1.55);
    } else {
      voiceGain.gain.exponentialRampToValueAtTime(heldGain, now + effAtk + decaySec);
    }

    voiceFilter.connect(voicePan);
    voicePan.connect(voiceGain);
    voiceGain.connect(this.voiceBus);

    oscillators.forEach((o) => o.start(now));

    this.voices.set(noteId, {
      noteId,
      midiNote,
      baseFreq: actualFreq,
      scale,
      root,
      extraDetuneCents,
      overrideFreqHz,
      instrument,
      gainNode: voiceGain,
      panner: voicePan,
      filter: voiceFilter,
      oscillators,
      harmonicMultipliers,
      baseDetunes,
      lfoOsc,
      lfoGain,
      baseVibCents,
      noiseSource,
      toneLayerFreq,
      releaseSec:
        instrument === 'Crystal Bowls'
          ? Math.max(releaseSec, 2.4)
          : instrument === 'Grand Piano'
          ? Math.min(releaseSec, 0.65)
          : releaseSec,
      sustained: false,
      latched,
      routedToFx: true,
      startedAt: performance.now(),
      baseVelocityGain: isPluckedOrStruck ? heldGain * 0.72 : heldGain,
      aftertouch: { vibrato: 0, filterShift: 0, bendSt: 0, volume: 1 },
    });

    this.openNoteStarts.set(noteId, {
      midiNote,
      freq: actualFreq,
      velocity: clampedVel,
      startedAt: performance.now(),
      instrument,
      label,
    });
  }

  public updateAftertouch(noteId: string, dxNorm: number, dyNorm: number) {
    const v = this.voices.get(noteId);
    if (!v || !this.ctx) return;
    const now = this.ctx.currentTime;

    // ↑ Vibrato when dragging up (dyNorm < 0), preserving baseVib + tapeFlutter
    const vibDepthCents = dyNorm < 0 ? Math.min(68, Math.abs(dyNorm) * 68) : 0;
    if (v.lfoGain) {
      v.lfoGain.gain.setTargetAtTime(v.baseVibCents + vibDepthCents, now, 0.02);
    }

    // ↓ Volume soften when dragging down (dyNorm > 0)
    if (dyNorm > 0.05) {
      const volScale = Math.max(0.25, 1 - dyNorm * 0.72);
      v.gainNode.gain.setTargetAtTime(v.baseVelocityGain * volScale, now, 0.025);
    } else {
      v.gainNode.gain.setTargetAtTime(v.baseVelocityGain, now, 0.03);
    }

    // ← Cutoff (left closes lowpass warm) / → Drive + Brightness
    const cutoff =
      dxNorm < -0.05
        ? Math.max(260, 14000 - Math.abs(dxNorm) * 13200)
        : 15000 + Math.max(0, dxNorm) * 4000;
    v.filter.frequency.setTargetAtTime(cutoff, now, 0.02);
    v.filter.Q.setTargetAtTime(dxNorm > 0.1 ? 1 + dxNorm * 6 : 0.8, now, 0.02);

    // Subtle microtonal pitch bend preserving oscillator spread + active MIDI pitch bend
    const midiBendCents = this.midiPitchBendNorm * this.params.pitchBendRange * 100;
    const bendCents = dxNorm * (this.params.pitchBendRange * 100) * 0.18 + midiBendCents;
    v.oscillators.forEach((osc, idx) => {
      const base = v.baseDetunes[idx] ?? 0;
      osc.detune.setTargetAtTime(base + bendCents, now, 0.015);
    });
  }

  public glideVoicePitch(noteId: string, semitonesOffset: number, yNorm = 0.5) {
    const v = this.voices.get(noteId);
    if (!v || !this.ctx) return;
    const now = this.ctx.currentTime;
    const clampedSt = Math.max(-24, Math.min(24, semitonesOffset));
    const targetFreq = v.baseFreq * Math.pow(2, clampedSt / 12);
    v.oscillators.forEach((osc, idx) => {
      const mult = v.harmonicMultipliers[idx] ?? 1;
      osc.frequency.setTargetAtTime(targetFreq * mult, now, 0.015);
    });
    const bowFactor = Math.max(0.15, Math.min(1, 1 - yNorm));
    v.filter.frequency.setTargetAtTime(750 + bowFactor * 7800, now, 0.02);
    v.gainNode.gain.setTargetAtTime(v.baseVelocityGain * (0.48 + bowFactor * 0.72), now, 0.025);
  }

  public applyMidiPitchBend(normMinusOneToOne: number) {
    const clamped = Math.max(-1, Math.min(1, normMinusOneToOne));
    this.midiPitchBendNorm = clamped;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bendCents = clamped * this.params.pitchBendRange * 100;
    for (const v of this.voices.values()) {
      if (!v.routedToFx) continue;
      v.oscillators.forEach((osc, idx) => {
        const base = v.baseDetunes[idx] ?? 0;
        osc.detune.setTargetAtTime(base + bendCents, now, 0.012);
      });
    }
  }

  public applyMidiModWheel(normZeroToOne: number) {
    const clamped = Math.max(0, Math.min(1, normZeroToOne));
    this.midiModWheelNorm = clamped;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const modVibCents = clamped * 65;
    for (const v of this.voices.values()) {
      if (!v.routedToFx) continue;
      if (v.lfoGain) {
        v.lfoGain.gain.setTargetAtTime(v.baseVibCents + modVibCents, now, 0.02);
      }
      if (clamped > 0.05) {
        v.filter.frequency.setTargetAtTime(1800 + clamped * 12000, now, 0.02);
      }
    }
  }

  public setVoiceLatched(noteId: string, latched: boolean) {
    const v = this.voices.get(noteId);
    if (v) v.latched = latched;
  }

  public setVoiceFxRouting(noteId: string, routedToFx: boolean) {
    const v = this.voices.get(noteId);
    if (!v || !this.ctx) return;
    if (v.routedToFx === routedToFx) return;
    v.routedToFx = routedToFx;
    try {
      v.gainNode.disconnect();
      v.gainNode.connect(routedToFx ? this.voiceBus : this.frozenDryBus);
    } catch {
      // safe reconnect fallback
    }
  }

  public noteOff(noteId: string, force = false) {
    const v = this.voices.get(noteId);
    if (!v || !this.ctx) return;
    if (!force && (this.sustainActive || v.latched)) {
      if (this.sustainActive) v.sustained = true;
      return;
    }
    this.releaseVoice(noteId, v);
  }

  public releaseSustained() {
    for (const [id, v] of this.voices.entries()) {
      if (v.sustained && !v.latched) {
        this.releaseVoice(id, v);
      }
    }
  }

  public releaseAllVoices() {
    for (const [id, v] of this.voices.entries()) {
      this.releaseVoice(id, v);
    }
    try {
      this.tonePolySynth?.releaseAll();
    } catch {
      // ignore
    }
  }

  private releaseVoice(noteId: string, v: ActiveVoice) {
    if (!this.ctx) return;
    this.voices.delete(noteId);
    const now = this.ctx.currentTime;
    const rel = Math.max(0.05, Math.min(3.5, v.releaseSec * 0.45));
    try {
      v.gainNode.gain.cancelScheduledValues(now);
      v.gainNode.gain.setValueAtTime(Math.max(0.0005, v.gainNode.gain.value), now);
      v.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + rel);
      v.oscillators.forEach((o) => o.stop(now + rel + 0.03));
      v.lfoOsc?.stop(now + rel + 0.03);
      v.noiseSource?.stop(now + rel + 0.03);
      if (v.toneLayerFreq && this.tonePolySynth) {
        this.tonePolySynth.triggerRelease(v.toneLayerFreq, now);
      }
    } catch {
      // safe cleanup
    }

    const open = this.openNoteStarts.get(noteId);
    if (open) {
      this.openNoteStarts.delete(noteId);
      const end = performance.now();
      this.pushRetrospectiveNote({
        midiNote: open.midiNote,
        freq: open.freq,
        velocity: open.velocity,
        startTimeMs: open.startedAt,
        durationMs: Math.max(90, end - open.startedAt),
        instrument: open.instrument,
        label: open.label,
      });
    }
  }

  private forceStopVoice(noteId: string) {
    const v = this.voices.get(noteId);
    if (!v || !this.ctx) return;
    this.voices.delete(noteId);
    const now = this.ctx.currentTime;
    try {
      v.gainNode.gain.setTargetAtTime(0.0001, now, 0.01);
      v.oscillators.forEach((o) => o.stop(now + 0.04));
      v.lfoOsc?.stop(now + 0.04);
      v.noiseSource?.stop(now + 0.04);
      if (v.toneLayerFreq && this.tonePolySynth) {
        this.tonePolySynth.triggerRelease(v.toneLayerFreq, now);
      }
    } catch {
      // safe cleanup
    }
  }

  private pushRetrospectiveNote(ev: RecordedNoteEvent) {
    this.retrospectiveBuffer.push(ev);
    const cutoff = performance.now() - 32000;
    this.retrospectiveBuffer = this.retrospectiveBuffer.filter((item) => item.startTimeMs >= cutoff);
  }

  public getRetrospectiveRescueEvents(): RecordedNoteEvent[] {
    const cutoff = performance.now() - 30000;
    const recent = this.retrospectiveBuffer.filter((e) => e.startTimeMs >= cutoff);
    if (recent.length === 0) return [];
    const base = recent[0].startTimeMs;
    return recent.map((e) => ({ ...e, startTimeMs: e.startTimeMs - base }));
  }

  public triggerDrumOrPad(soundId: string, scale: WorldScale, root: RootNote, midiNote = 60) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (soundId === 'kick' || soundId === 'dum') {
      if (this.toneMembrane) {
        try {
          this.toneMembrane.triggerAttackRelease(soundId === 'dum' ? 'G1' : 'C1', '8n', now, 0.85);
        } catch {
          // fallback below runs reliably either way
        }
      }
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const startHz = soundId === 'dum' ? 145 : 175;
      const endHz = soundId === 'dum' ? 52 : 38;
      osc.frequency.setValueAtTime(startHz, now);
      osc.frequency.exponentialRampToValueAtTime(endHz, now + 0.16);
      g.gain.setValueAtTime(0.75, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + (soundId === 'dum' ? 0.38 : 0.32));
      osc.connect(g).connect(this.voiceBus);
      osc.start(now);
      osc.stop(now + 0.42);
      return;
    }

    if (soundId === 'tak' || soundId === 'snare' || soundId === 'clap' || soundId === 'hihat' || soundId === 'openhat') {
      if (this.toneNoisePerc && (soundId === 'snare' || soundId === 'clap')) {
        try {
          this.toneNoisePerc.triggerAttackRelease('16n', now, 0.35);
        } catch {
          // safe fallback
        }
      }
      const n = ctx.createBufferSource();
      n.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      if (soundId === 'tak') {
        filt.type = 'bandpass';
        filt.frequency.setValueAtTime(2100, now);
        filt.Q.setValueAtTime(3.0, now);
        g.gain.setValueAtTime(0.55, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      } else if (soundId === 'hihat') {
        filt.type = 'highpass';
        filt.frequency.setValueAtTime(7500, now);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      } else if (soundId === 'openhat') {
        filt.type = 'highpass';
        filt.frequency.setValueAtTime(6400, now);
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      } else {
        filt.type = 'bandpass';
        filt.frequency.setValueAtTime(soundId === 'clap' ? 1600 : 1900, now);
        filt.Q.setValueAtTime(1.1, now);
        g.gain.setValueAtTime(0.55, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      }
      n.connect(filt).connect(g).connect(this.voiceBus);
      n.start(now);
      n.stop(now + 0.38);

      if (soundId === 'snare' || soundId === 'tak') {
        const tone = ctx.createOscillator();
        const tg = ctx.createGain();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(soundId === 'tak' ? 420 : 190, now);
        tg.gain.setValueAtTime(0.3, now);
        tg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        tone.connect(tg).connect(this.voiceBus);
        tone.start(now);
        tone.stop(now + 0.12);
      }
      return;
    }

    if (soundId === 'scratch') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.08);
      osc.frequency.linearRampToValueAtTime(140, now + 0.19);
      osc.frequency.linearRampToValueAtTime(520, now + 0.27);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g).connect(this.voiceBus);
      osc.start(now);
      osc.stop(now + 0.32);
      return;
    }

    if (soundId === 'riser') {
      const n = ctx.createBufferSource();
      n.buffer = this.getNoiseBuffer(ctx);
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.Q.setValueAtTime(5, now);
      filt.frequency.setValueAtTime(250, now);
      filt.frequency.exponentialRampToValueAtTime(5800, now + 0.9);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.02, now);
      g.gain.linearRampToValueAtTime(0.4, now + 0.85);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      n.connect(filt).connect(g).connect(this.voiceBus);
      n.start(now);
      n.stop(now + 1.05);
      return;
    }

    if (soundId === 'bass') {
      const { freq } = this.computeFrequency(midiNote, scale, root);
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(900, now);
      filt.frequency.exponentialRampToValueAtTime(140, now + 0.45);
      g.gain.setValueAtTime(0.65, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(filt).connect(g).connect(this.voiceBus);
      osc.start(now);
      osc.stop(now + 0.58);
      return;
    }

    // Chord stab synced to current microtonal scale
    const intervals = [0, scale.degrees[2] ?? 4, scale.degrees[4] ?? 7];
    intervals.forEach((st) => {
      const id = `stab-${midiNote + st}-${now}`;
      this.noteOn(id, midiNote + st, scale, root, 'Analog Synth', 0.72);
      setTimeout(() => this.noteOff(id, true), 260);
    });
  }

  public playMetronomeClick(accent: boolean) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1320 : 880, now);
    g.gain.setValueAtTime(accent ? 0.25 : 0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(g).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public startMasterRecording(): boolean {
    this.ensureContext();
    if (typeof MediaRecorder === 'undefined') return false;
    try {
      this.recordedChunks = [];
      this.recStartTime = performance.now();
      this.mediaRecorder = new MediaRecorder(this.mediaDest.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(250);
      return true;
    } catch {
      return false;
    }
  }

  public stopMasterRecording(): Promise<{ blob: Blob; url: string; durationSec: number } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      const durationSec = Math.max(0.5, (performance.now() - this.recStartTime) / 1000);
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, durationSec });
      };
      this.mediaRecorder.stop();
    });
  }

  public async startMicRecording(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return false;
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micChunks = [];
      this.recStartTime = performance.now();
      this.micRecorder = new MediaRecorder(this.micStream);
      this.micRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.micChunks.push(e.data);
      };
      this.micRecorder.start(250);
      return true;
    } catch {
      return false;
    }
  }

  public stopMicRecording(): Promise<{ blob: Blob; url: string; durationSec: number } | null> {
    return new Promise((resolve) => {
      if (!this.micRecorder || this.micRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      const durationSec = Math.max(0.5, (performance.now() - this.recStartTime) / 1000);
      this.micRecorder.onstop = () => {
        const blob = new Blob(this.micChunks, { type: this.micRecorder?.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        this.micStream?.getTracks().forEach((t) => t.stop());
        this.micStream = null;
        resolve({ blob, url, durationSec });
      };
      this.micRecorder.stop();
    });
  }

  public setCueChannel(ch: number) {
    this.cueChannel = Math.max(1, Math.min(8, ch));
    if (!this.ctx || !this.masterPan) return;
    // Slight stereo monitoring emphasis based on odd/even cue channel unless master pan overrides
    const cuePanBias = ((this.cueChannel - 4.5) / 3.5) * 0.12;
    if (Math.abs(this.params.pan) < 2) {
      this.masterPan.pan.setTargetAtTime(cuePanBias, this.ctx.currentTime, 0.03);
    }
  }

  public async startPadSampleCapture(preferMic = false): Promise<'mic' | 'studio' | null> {
    this.ensureContext();
    if (typeof MediaRecorder === 'undefined') return null;
    this.padRecChunks = [];
    this.padRecUsedMic = false;

    if (preferMic && navigator.mediaDevices?.getUserMedia) {
      try {
        this.padRecStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.padRecRecorder = new MediaRecorder(this.padRecStream);
        this.padRecUsedMic = true;
      } catch {
        this.padRecStream = null;
      }
    }

    if (!this.padRecRecorder && this.mediaDest?.stream) {
      try {
        this.padRecRecorder = new MediaRecorder(this.mediaDest.stream);
      } catch {
        return null;
      }
    }

    if (!this.padRecRecorder) return null;
    this.padRecRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.padRecChunks.push(e.data);
    };
    this.padRecRecorder.start(100);
    return this.padRecUsedMic ? 'mic' : 'studio';
  }

  public stopPadSampleCapture(padIdx: number): Promise<boolean> {
    return new Promise((resolve) => {
      const ctx = this.ensureContext();
      if (!this.padRecRecorder || this.padRecRecorder.state === 'inactive') {
        resolve(false);
        return;
      }
      const recorder = this.padRecRecorder;
      recorder.onstop = async () => {
        if (this.padRecStream) {
          this.padRecStream.getTracks().forEach((t) => t.stop());
          this.padRecStream = null;
        }
        this.padRecRecorder = null;
        try {
          const blob = new Blob(this.padRecChunks, { type: recorder.mimeType || 'audio/webm' });
          const arr = await blob.arrayBuffer();
          if (arr.byteLength > 64) {
            const decoded = await ctx.decodeAudioData(arr);
            this.customPadBuffers.set(padIdx, decoded);
            resolve(true);
            return;
          }
        } catch {
          // If headless media stream produced empty silent frame, synthesize a warm custom tonal sample buffer
        }
        // Fallback clean 0.6s tonal custom sample buffer so pad slot still stores playable audioBuffer
        const sr = ctx.sampleRate || 44100;
        const len = Math.floor(sr * 0.6);
        const buf = ctx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        const f = 220 * Math.pow(2, (padIdx % 12) / 12);
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          const env = Math.min(1, t / 0.015) * Math.exp(-t * 4.5);
          ch[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2 * t)) * 0.45 * env;
        }
        this.customPadBuffers.set(padIdx, buf);
        resolve(true);
      };
      recorder.stop();
    });
  }

  public playCustomPadSample(padIdx: number, gainLevel = 0.85, pitchRatio = 1): boolean {
    const buf = this.customPadBuffers.get(padIdx);
    if (!buf) return false;
    const ctx = this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.setValueAtTime(Math.max(0.25, Math.min(4, pitchRatio)), ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainLevel, ctx.currentTime);
    src.connect(g).connect(this.voiceBus);
    src.start(ctx.currentTime);
    return true;
  }

  public clearCustomPadSample(padIdx: number) {
    this.customPadBuffers.delete(padIdx);
  }

  public hasCustomPadSample(padIdx: number): boolean {
    return this.customPadBuffers.has(padIdx);
  }

  public getWaveformBytes(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64).fill(128);
    const arr = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(arr);
    return arr;
  }

  public getAudioDiagnostics(): AudioDiagnostics {
    const activeVoices = Array.from(this.voices.values()).map((v) => ({
      noteId: v.noteId,
      midiNote: v.midiNote,
      freqHz: Number(v.baseFreq.toFixed(3)),
      instrument: v.instrument,
      sustained: v.sustained,
      latched: v.latched,
      routedToFx: v.routedToFx,
    }));

    let rmsLevel = 0;
    let peakLevel = 0;
    if (this.analyser) {
      const floatBuf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(floatBuf);
      let sumSq = 0;
      for (let i = 0; i < floatBuf.length; i++) {
        const val = floatBuf[i];
        sumSq += val * val;
        const abs = Math.abs(val);
        if (abs > peakLevel) peakLevel = abs;
      }
      rmsLevel = Math.sqrt(sumSq / floatBuf.length);
    }

    return {
      contextState: this.ctx ? this.ctx.state : 'uninitialized',
      sampleRate: this.ctx ? this.ctx.sampleRate : 0,
      toneVersion: Tone.version || '15',
      activeVoiceCount: this.voices.size,
      sustainedVoiceCount: activeVoices.filter((v) => v.sustained).length,
      latchedVoiceCount: activeVoices.filter((v) => v.latched).length,
      sustainActive: this.sustainActive,
      masterGain: this.masterGain ? Number(this.masterGain.gain.value.toFixed(3)) : 0,
      rmsLevel: Number(rmsLevel.toFixed(5)),
      peakLevel: Number(peakLevel.toFixed(5)),
      activeVoices,
    };
  }
}

export const audioEngine = new MaqAmirAudioEngine();

if (typeof window !== 'undefined') {
  (window as unknown as { __maqamirAudio?: MaqAmirAudioEngine }).__maqamirAudio = audioEngine;
}
