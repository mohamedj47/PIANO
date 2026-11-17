export type RealmId =
  | 'play'
  | 'piano'
  | 'dj'
  | 'qiano'
  | 'mandala'
  | 'guitouch'
  | 'cellomir'
  | 'silk_river'
  | 'sitabla'
  | 'vortex'
  | 'arabesque'
  | 'meend_spiral'
  | 'aura_bowls';

export interface RealmDefinition {
  id: RealmId;
  queryParam: string;
  name: string;
  subtitle: string;
  image: string;
  badgeColor: string;
  accentHex: string;
  interactionHint: string;
  defaultInstrument?: string;
  defaultScale?: string;
  isFullscreenStage?: boolean;
}

export const REALMS: RealmDefinition[] = [
  {
    id: 'play',
    queryParam: 'play_pads',
    name: 'Play',
    subtitle: 'Colorful Sample Pads',
    image: '/images/realms/play_pads.webp',
    badgeColor: '#F59E0B',
    accentHex: '#D4AF37',
    interactionHint: 'Main Concert Piano Stage & Expressive Quick-Trigger Pad Matrix',
    isFullscreenStage: false,
  },
  {
    id: 'piano',
    queryParam: 'piano_keys',
    name: 'Piano',
    subtitle: 'Dual Keybed Deck',
    image: '/images/realms/piano_keys.webp',
    badgeColor: '#D4AF37',
    accentHex: '#FBBF24',
    interactionHint: 'Full-screen dual-manual grand piano stage · Shift octaves or sweep cross-manual glissandos',
    isFullscreenStage: true,
  },
  {
    id: 'dj',
    queryParam: 'dj_pads',
    name: 'DJ',
    subtitle: 'Live Sample Matrix',
    image: '/images/realms/dj_pads.webp',
    badgeColor: '#EF4444',
    accentHex: '#EF4444',
    interactionHint: '6×2, 4×3, 5+7 square DJ matrix & Dual Vinyl Turntable scratch deck with live input capture',
    isFullscreenStage: true,
  },
  {
    id: 'qiano',
    queryParam: 'qiano',
    name: 'Qiano',
    subtitle: 'K-EDO Microtonal',
    image: '/images/realms/qiano.webp',
    badgeColor: '#EAB308',
    accentHex: '#FACC15',
    interactionHint: 'Adaptive K-EDO harmonic lattice (19-EDO, 24-EDO, 31-EDO, 53-EDO Turkish comma grid)',
    defaultScale: '24-EDO Quarter-Tone (Neutral)',
    isFullscreenStage: true,
  },
  {
    id: 'mandala',
    queryParam: 'mandala',
    name: 'Mandala',
    subtitle: 'Sacred Geometry',
    image: '/images/realms/mandala.webp',
    badgeColor: '#3B82F6',
    accentHex: '#60A5FA',
    interactionHint: 'Strum and swirl across luminous 6-way kaleidoscopic Mandala strings',
    defaultInstrument: 'Sitar & Tanpura',
    isFullscreenStage: true,
  },
  {
    id: 'guitouch',
    queryParam: 'guitouch',
    name: 'Guitouch',
    subtitle: 'Expressive Fretboard',
    image: '/images/realms/guitouch.webp',
    badgeColor: '#F97316',
    accentHex: '#FB923C',
    interactionHint: 'Microtonal 6-string Oud/Guitar fretboard — bend pitch vertically, strum across strings',
    defaultInstrument: 'Warm Oud',
    isFullscreenStage: true,
  },
  {
    id: 'cellomir',
    queryParam: 'cellomir',
    name: 'Cellomir',
    subtitle: 'Bowed Strings',
    image: '/images/realms/cellomir.webp',
    badgeColor: '#B45309',
    accentHex: '#F59E0B',
    interactionHint: 'Continuous bowed cello & rabab fingerboard — X glides pitch smoothly, Y controls bow pressure',
    defaultInstrument: 'Bowed Cello',
    isFullscreenStage: true,
  },
  {
    id: 'silk_river',
    queryParam: 'silk_river',
    name: 'Silk River',
    subtitle: 'Fluid Harmonics',
    image: '/images/realms/silk_river.webp',
    badgeColor: '#06B6D4',
    accentHex: '#22D3EE',
    interactionHint: 'Flowing Pentatonic & Ney harmonic ribbons — sweep across luminous silk currents',
    defaultInstrument: 'Ney Flute',
    isFullscreenStage: true,
  },
  {
    id: 'sitabla',
    queryParam: 'sitabla',
    name: 'Sitabla',
    subtitle: 'Sympathetic Strings',
    image: '/images/realms/sitabla.webp',
    badgeColor: '#EC4899',
    accentHex: '#F472B6',
    interactionHint: 'Dual Raga Sitar Tarab strings + interactive Dayan/Bayan Tabla percussion heads',
    defaultInstrument: 'Sitar & Tanpura',
    defaultScale: 'Raga Bhairav',
    isFullscreenStage: true,
  },
  {
    id: 'vortex',
    queryParam: 'vortex',
    name: 'Vortex',
    subtitle: 'Spiral Resonance',
    image: '/images/realms/vortex.webp',
    badgeColor: '#8B5CF6',
    accentHex: '#A78BFA',
    interactionHint: 'Orbital analog poly-synth resonator with spinning harmonic attractors',
    defaultInstrument: 'Analog Synth',
    isFullscreenStage: true,
  },
  {
    id: 'arabesque',
    queryParam: 'arabesque',
    name: 'Arabesque',
    subtitle: 'Star Tessellation',
    image: '/images/realms/arabesque.webp',
    badgeColor: '#10B981',
    accentHex: '#34D399',
    interactionHint: '12-point Islamic geometric star lattice tuned to active Maqam tetrachords (Ajnas)',
    defaultInstrument: 'Warm Oud',
    defaultScale: 'Hijaz',
    isFullscreenStage: true,
  },
  {
    id: 'meend_spiral',
    queryParam: 'meend_spiral',
    name: 'Meend Spiral',
    subtitle: 'Continuous Raga Gliss',
    image: '/images/realms/meend_spiral.webp',
    badgeColor: '#F43F5E',
    accentHex: '#FB7185',
    interactionHint: 'Continuous Golden-Ratio Raga spiral for microtonal Gamak & Meend pitch glides',
    defaultInstrument: 'Sitar & Tanpura',
    defaultScale: 'Raga Yaman',
    isFullscreenStage: true,
  },
  {
    id: 'aura_bowls',
    queryParam: 'aura_bowls',
    name: 'Aura Bowls',
    subtitle: 'Healing Crystal & Binaural',
    image: '/images/realms/aura-bowls-heal.webp',
    badgeColor: '#14B8A6',
    accentHex: '#2DD4BF',
    interactionHint: 'Singing crystal & Tibetan bronze harmonic bowls with Solfeggio / Binaural frequencies',
    defaultInstrument: 'Crystal Bowls',
    isFullscreenStage: true,
  },
];

export function resolveRealmFromQuery(param: string | null): RealmId | null {
  if (!param) return null;
  const clean = param.trim().toLowerCase();
  const match = REALMS.find(
    (r) => r.id === clean || r.queryParam === clean
  );
  return match ? match.id : null;
}

export interface DjStarterKit {
  id: string;
  name: string;
  bpm: number;
  pads: Array<{
    label: string;
    sub: string;
    type: 'drum' | 'chord' | 'bass' | 'perc' | 'fx';
    soundId: string;
    midiNote?: number;
    color: string;
  }>;
}

export const DJ_STARTER_KITS: DjStarterKit[] = [
  {
    id: 'levant-electro',
    name: 'Levant Electro 120',
    bpm: 120,
    pads: [
      { label: 'KICK 808', sub: 'Sub Punch', type: 'drum', soundId: 'kick', color: '#EF4444' },
      { label: 'DARBUKA DUM', sub: 'Deep Doom', type: 'perc', soundId: 'dum', color: '#F59E0B' },
      { label: 'DARBUKA TAK', sub: 'Crisp Rim', type: 'perc', soundId: 'tak', color: '#FBBF24' },
      { label: 'CLAP TRAP', sub: 'Layered', type: 'drum', soundId: 'clap', color: '#EC4899' },
      { label: 'HI-HAT', sub: 'Closed 16th', type: 'drum', soundId: 'hihat', color: '#38BDF8' },
      { label: 'OPEN HAT', sub: 'Shimmer', type: 'drum', soundId: 'openhat', color: '#06B6D4' },
      { label: 'MAQAM STAB I', sub: 'Tonic Triad', type: 'chord', soundId: 'stab1', midiNote: 60, color: '#D4AF37' },
      { label: 'MAQAM STAB IV', sub: 'Jins Pivot', type: 'chord', soundId: 'stab2', midiNote: 65, color: '#D4AF37' },
      { label: 'MAQAM STAB V', sub: 'Dominant', type: 'chord', soundId: 'stab3', midiNote: 67, color: '#D4AF37' },
      { label: 'BASS SUB', sub: 'Rast Root', type: 'bass', soundId: 'bass', midiNote: 36, color: '#8B5CF6' },
      { label: 'VINYL CHIRP', sub: 'Scratch FX', type: 'fx', soundId: 'scratch', color: '#10B981' },
      { label: 'SPACE RISER', sub: 'Sweep Up', type: 'fx', soundId: 'riser', color: '#6366F1' },
    ],
  },
  {
    id: 'raga-dub',
    name: 'Raga Dub & Tabla 96',
    bpm: 96,
    pads: [
      { label: 'TABLA DHA', sub: 'Resonant', type: 'perc', soundId: 'dum', color: '#F97316' },
      { label: 'TABLA NA', sub: 'Bright Ring', type: 'perc', soundId: 'tak', color: '#FACC15' },
      { label: 'TABLA GE', sub: 'Bayan Slide', type: 'perc', soundId: 'kick', color: '#EF4444' },
      { label: 'SHAKER', sub: 'Ghungroo', type: 'drum', soundId: 'hihat', color: '#22D3EE' },
      { label: 'RIM DUB', sub: 'Tape Echo', type: 'drum', soundId: 'snare', color: '#A855F7' },
      { label: 'CYMBAL', sub: 'Manjira', type: 'drum', soundId: 'openhat', color: '#14B8A6' },
      { label: 'TANPURA SA', sub: 'Drone Sa-Pa', type: 'chord', soundId: 'stab1', midiNote: 48, color: '#D4AF37' },
      { label: 'SITAR PHRASE', sub: 'Tivra Glide', type: 'chord', soundId: 'stab2', midiNote: 62, color: '#F59E0B' },
      { label: 'BANSURI ECHO', sub: 'Bamboo Call', type: 'chord', soundId: 'stab3', midiNote: 67, color: '#38BDF8' },
      { label: 'DUB SUB', sub: 'Deep Sine', type: 'bass', soundId: 'bass', midiNote: 36, color: '#6366F1' },
      { label: 'LASER DUB', sub: 'Siren', type: 'fx', soundId: 'riser', color: '#EC4899' },
      { label: 'BACKSPIN', sub: 'Deck Stop', type: 'fx', soundId: 'scratch', color: '#10B981' },
    ],
  },
  {
    id: 'istanbul-house',
    name: 'Istanbul Acid House 126',
    bpm: 126,
    pads: [
      { label: 'HOUSE KICK', sub: '4/4 Club', type: 'drum', soundId: 'kick', color: '#EF4444' },
      { label: 'SNARE 909', sub: 'Punchy', type: 'drum', soundId: 'snare', color: '#F97316' },
      { label: 'CLAP 909', sub: 'Crisp Stereo', type: 'drum', soundId: 'clap', color: '#EC4899' },
      { label: 'CH 909', sub: 'Tight', type: 'drum', soundId: 'hihat', color: '#38BDF8' },
      { label: 'OH 909', sub: 'Offbeat', type: 'drum', soundId: 'openhat', color: '#06B6D4' },
      { label: 'BENDIR', sub: 'Frame Drum', type: 'perc', soundId: 'dum', color: '#F59E0B' },
      { label: 'HICAZ LEAD', sub: 'Quarter Sharp', type: 'chord', soundId: 'stab1', midiNote: 60, color: '#D4AF37' },
      { label: 'SAZ CHORD', sub: 'Metallic', type: 'chord', soundId: 'stab2', midiNote: 64, color: '#FBBF24' },
      { label: 'ACID 303', sub: 'Squeltch', type: 'bass', soundId: 'bass', midiNote: 41, color: '#10B981' },
      { label: 'CHORD STAB', sub: 'Dub Minor', type: 'chord', soundId: 'stab3', midiNote: 67, color: '#A855F7' },
      { label: 'SCRATCH', sub: 'Fader Cut', type: 'fx', soundId: 'scratch', color: '#F43F5E' },
      { label: 'NOISE LIFT', sub: 'Filter Wash', type: 'fx', soundId: 'riser', color: '#3B82F6' },
    ],
  },
];
