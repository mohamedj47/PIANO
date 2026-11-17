export type SonicParamId =
  | 'pitch'
  | 'reverbSize'
  | 'reverbMix'
  | 'reverbDamping'
  | 'reverbPreDelay'
  | 'delayTime'
  | 'delayMix'
  | 'delayFeedback'
  | 'delayCutoff'
  | 'cutoff'
  | 'resonance'
  | 'distortion'
  | 'eqLow'
  | 'eqMid'
  | 'eqHigh'
  | 'eqMidFreq'
  | 'tapeDrive'
  | 'tapeFlutter'
  | 'tapeTone'
  | 'tremoloDepth'
  | 'tremoloRate'
  | 'chorusDepth'
  | 'chorusRate'
  | 'compThreshold'
  | 'compRatio'
  | 'compAttack'
  | 'compRelease'
  | 'attack'
  | 'decay'
  | 'sustain'
  | 'release'
  | 'bitCrushDepth'
  | 'bitCrushMix'
  | 'stereoWidth'
  | 'loudness'
  | 'reverseDelayTime'
  | 'reverseDelayMix'
  | 'reverseDelayFeedback'
  | 'flangerRate'
  | 'flangerDepth'
  | 'flangerFeedback'
  | 'flangerDelay'
  | 'phaserRate'
  | 'phaserDepth'
  | 'phaserFeedback'
  | 'baseTuning'
  | 'binauralBeat'
  | 'playbackRate'
  | 'transpose'
  | 'pitchBendRange'
  | 'pan'
  | 'gain';

export type SonicParams = Record<SonicParamId, number>;

export interface SonicParamDef {
  id: SonicParamId;
  label: string;
  group: 'pitch' | 'reverb' | 'delay' | 'filter' | 'eq' | 'tape' | 'mod' | 'comp' | 'env' | 'crush' | 'space' | 'tuning';
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  unit: string;
  format: (v: number) => string;
  keyCapable?: boolean;
}

export const SONIC_PARAM_DEFS: SonicParamDef[] = [
  { id: 'pitch', label: 'PITCH', group: 'pitch', min: -12, max: 12, step: 0.1, defaultVal: 0, unit: 'st', format: (v) => `${v >= 0 && v !== 0 ? '+' : ''}${v.toFixed(1)} st`, keyCapable: true },
  { id: 'reverbSize', label: 'Rev size', group: 'reverb', min: 0.1, max: 8.0, step: 0.1, defaultVal: 1.2, unit: 's', format: (v) => `${v.toFixed(1)}` },
  { id: 'reverbMix', label: 'Rev mix', group: 'reverb', min: 0, max: 100, step: 1, defaultVal: 6, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'reverbDamping', label: 'Rev damp', group: 'reverb', min: 0, max: 100, step: 1, defaultVal: 30, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'reverbPreDelay', label: 'Pre-Dly', group: 'reverb', min: 0, max: 250, step: 1, defaultVal: 20, unit: 'ms', format: (v) => `${Math.round(v)}ms` },
  { id: 'delayTime', label: 'Dly Time', group: 'delay', min: 10, max: 1000, step: 5, defaultVal: 300, unit: 'ms', format: (v) => `${Math.round(v)}ms` },
  { id: 'delayMix', label: 'Dly Mix', group: 'delay', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'delayFeedback', label: 'Feedbk', group: 'delay', min: 0, max: 85, step: 1, defaultVal: 20, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'delayCutoff', label: 'Dly Tone', group: 'delay', min: 200, max: 18000, step: 50, defaultVal: 16000, unit: 'Hz', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}` },
  { id: 'cutoff', label: 'Filter', group: 'filter', min: 80, max: 20000, step: 20, defaultVal: 20000, unit: 'Hz', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`, keyCapable: true },
  { id: 'resonance', label: 'Res', group: 'filter', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'distortion', label: 'Dist', group: 'filter', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'eqLow', label: 'Low', group: 'eq', min: -12, max: 12, step: 0.5, defaultVal: 0, unit: 'dB', format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)}dB` },
  { id: 'eqMid', label: 'Mid', group: 'eq', min: -12, max: 12, step: 0.5, defaultVal: 0, unit: 'dB', format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)}dB` },
  { id: 'eqHigh', label: 'High', group: 'eq', min: -12, max: 12, step: 0.5, defaultVal: 0, unit: 'dB', format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)}dB` },
  { id: 'eqMidFreq', label: 'Mid Freq', group: 'eq', min: 200, max: 6000, step: 50, defaultVal: 1500, unit: 'Hz', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}` },
  { id: 'tapeDrive', label: 'Drive', group: 'tape', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'tapeFlutter', label: 'Flutter', group: 'tape', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'tapeTone', label: 'Tone', group: 'tape', min: 400, max: 18000, step: 100, defaultVal: 16000, unit: 'Hz', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}` },
  { id: 'tremoloDepth', label: 'Trem D', group: 'mod', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%`, keyCapable: true },
  { id: 'tremoloRate', label: 'Trem R', group: 'mod', min: 0.5, max: 20, step: 0.2, defaultVal: 4.0, unit: 'Hz', format: (v) => `${v.toFixed(1)}Hz` },
  { id: 'chorusDepth', label: 'Cho D', group: 'mod', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'chorusRate', label: 'Cho R', group: 'mod', min: 0.1, max: 8, step: 0.1, defaultVal: 0.5, unit: 'Hz', format: (v) => `${v.toFixed(1)}Hz` },
  { id: 'compThreshold', label: 'Thresh', group: 'comp', min: -40, max: 0, step: 1, defaultVal: 0, unit: 'dB', format: (v) => `${Math.round(v)}dB` },
  { id: 'compRatio', label: 'Ratio', group: 'comp', min: 1, max: 20, step: 0.5, defaultVal: 1, unit: ':1', format: (v) => `${Math.round(v)}:1` },
  { id: 'compAttack', label: 'Comp Atk', group: 'comp', min: 1, max: 200, step: 1, defaultVal: 10, unit: 'ms', format: (v) => `${Math.round(v)}ms` },
  { id: 'compRelease', label: 'Comp Rel', group: 'comp', min: 10, max: 1000, step: 10, defaultVal: 100, unit: 'ms', format: (v) => `${Math.round(v)}ms` },
  { id: 'attack', label: 'Attack', group: 'env', min: 1, max: 2000, step: 1, defaultVal: 1, unit: 'ms', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`, keyCapable: true },
  { id: 'decay', label: 'Decay', group: 'env', min: 50, max: 5000, step: 10, defaultVal: 300, unit: 's', format: (v) => `${(v / 1000).toFixed(1)}s` },
  { id: 'sustain', label: 'Sustain', group: 'env', min: 0, max: 100, step: 1, defaultVal: 80, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'release', label: 'Release', group: 'env', min: 50, max: 5000, step: 10, defaultVal: 2000, unit: 's', format: (v) => `${(v / 1000).toFixed(1)}s`, keyCapable: true },
  { id: 'bitCrushDepth', label: 'BC Depth', group: 'crush', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'bitCrushMix', label: 'BC Mix', group: 'crush', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'stereoWidth', label: 'Width', group: 'space', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'loudness', label: 'Loudness', group: 'space', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'reverseDelayTime', label: 'Rev Time', group: 'delay', min: 100, max: 2000, step: 25, defaultVal: 500, unit: 'ms', format: (v) => `${Math.round(v)}ms` },
  { id: 'reverseDelayMix', label: 'Rev Mix', group: 'delay', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'reverseDelayFeedback', label: 'Rev Fdbk', group: 'delay', min: 0, max: 85, step: 1, defaultVal: 30, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'flangerRate', label: 'Rate', group: 'mod', min: 0.05, max: 5, step: 0.05, defaultVal: 0.3, unit: 'Hz', format: (v) => `${v.toFixed(1)}Hz` },
  { id: 'flangerDepth', label: 'Depth', group: 'mod', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'flangerFeedback', label: 'Flg Fdbk', group: 'mod', min: 0, max: 85, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'flangerDelay', label: 'Offset', group: 'mod', min: 0.5, max: 15, step: 0.5, defaultVal: 3.0, unit: 'ms', format: (v) => `${v.toFixed(1)}ms` },
  { id: 'phaserRate', label: 'Pha Rate', group: 'mod', min: 0.1, max: 8, step: 0.1, defaultVal: 0.5, unit: 'Hz', format: (v) => `${v.toFixed(1)}Hz` },
  { id: 'phaserDepth', label: 'Pha D', group: 'mod', min: 0, max: 100, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'phaserFeedback', label: 'Pha F', group: 'mod', min: 0, max: 85, step: 1, defaultVal: 0, unit: '%', format: (v) => `${Math.round(v)}%` },
  { id: 'baseTuning', label: 'Tuning', group: 'tuning', min: 415, max: 465, step: 1, defaultVal: 440, unit: 'Hz', format: (v) => `${Math.round(v)}Hz` },
  { id: 'binauralBeat', label: 'Binaural', group: 'tuning', min: 0, max: 40, step: 0.5, defaultVal: 0, unit: 'Hz', format: (v) => v <= 0.1 ? 'OFF' : `${v.toFixed(1)}Hz` },
  { id: 'playbackRate', label: 'Speed', group: 'tuning', min: 0.5, max: 2.0, step: 0.05, defaultVal: 1.0, unit: 'x', format: (v) => `${v.toFixed(2)}×` },
  { id: 'transpose', label: 'Transpose', group: 'tuning', min: -12, max: 12, step: 1, defaultVal: 0, unit: 'st', format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)} st` },
  { id: 'pitchBendRange', label: 'Range', group: 'tuning', min: 1, max: 24, step: 1, defaultVal: 12, unit: 'st', format: (v) => `±${Math.round(v)}` },
  { id: 'pan', label: 'Pan', group: 'space', min: -100, max: 100, step: 1, defaultVal: 0, unit: '', format: (v) => Math.abs(v) < 2 ? 'C' : v < 0 ? `L${Math.abs(Math.round(v))}` : `R${Math.round(v)}`, keyCapable: true },
  { id: 'gain', label: 'Master', group: 'space', min: 0, max: 100, step: 1, defaultVal: 72, unit: '%', format: (v) => `${Math.round(v)}%` },
];

export const DEFAULT_SONIC_PARAMS: SonicParams = SONIC_PARAM_DEFS.reduce((acc, def) => {
  acc[def.id] = def.defaultVal;
  return acc;
}, {} as SonicParams);

export interface SonicPreset {
  id: 'clean' | '1' | '2' | '3';
  label: string;
  name: string;
  overrides: Partial<SonicParams>;
}

export const SONIC_PRESETS: SonicPreset[] = [
  {
    id: 'clean',
    label: 'CLEAN',
    name: 'Clean Concert Acoustic',
    overrides: {},
  },
  {
    id: '1',
    label: '1',
    name: 'Desert Shimmer Hall',
    overrides: {
      reverbSize: 3.4,
      reverbMix: 38,
      reverbDamping: 42,
      delayMix: 22,
      delayTime: 375,
      delayFeedback: 35,
      chorusDepth: 25,
      stereoWidth: 45,
      release: 2800,
    },
  },
  {
    id: '2',
    label: '2',
    name: 'Warm Vintage Tape',
    overrides: {
      tapeDrive: 35,
      tapeFlutter: 28,
      tapeTone: 5200,
      cutoff: 6400,
      resonance: 18,
      eqLow: 3.5,
      eqHigh: -2.0,
      reverbMix: 18,
      tremoloDepth: 20,
      tremoloRate: 3.2,
    },
  },
  {
    id: '3',
    label: '3',
    name: 'Healing 432Hz Ethereal',
    overrides: {
      baseTuning: 432,
      binauralBeat: 7.5,
      attack: 120,
      release: 3800,
      reverbSize: 5.2,
      reverbMix: 52,
      phaserDepth: 30,
      phaserRate: 0.3,
      stereoWidth: 65,
    },
  },
];
