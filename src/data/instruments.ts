export type InstrumentId =
  | 'Grand Piano'
  | 'Warm Oud'
  | 'Electric Rhodes'
  | 'Ney Flute'
  | 'Analog Synth'
  | 'Sitar & Tanpura'
  | 'Bowed Cello'
  | 'Crystal Bowls';

export interface InstrumentDefinition {
  id: InstrumentId;
  name: string;
  subtitle: string;
  badge: string;
  engineLabel: string;
  recommendedSkin: string;
  category: 'Acoustic' | 'World Strings' | 'Wind & Bowls' | 'Synth & Electric';
  description: string;
}

export const INSTRUMENTS: InstrumentDefinition[] = [
  {
    id: 'Grand Piano',
    name: 'Grand Piano',
    subtitle: 'Concert Hammer-Struck Engine',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Harmonic Piano Synth',
    recommendedSkin: 'classic',
    category: 'Acoustic',
    description: 'Multi-partial acoustic piano synthesis with hammer transient, velocity brightness scaling, and microtonal tuning.',
  },
  {
    id: 'Warm Oud',
    name: 'Warm Oud',
    subtitle: 'Fretless Pluck & Body Resonance',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Plucked String Synth',
    recommendedSkin: 'oud',
    category: 'World Strings',
    description: 'Rich double-course middle eastern lute timbre with wooden soundboard formant and expressive pitch glide.',
  },
  {
    id: 'Electric Rhodes',
    name: 'Electric Rhodes',
    subtitle: 'Tine Bell & Warm Suitcase',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio FM Tine Synth',
    recommendedSkin: 'rhodes',
    category: 'Synth & Electric',
    description: 'Glassy FM tine chime layered over warm fundamental sustain — built for chords, Neo-Soul, and Jazz Maqam.',
  },
  {
    id: 'Ney Flute',
    name: 'Ney Flute',
    subtitle: 'Breathy Reed Wind & Vibrato',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Breath + Formant Synth',
    recommendedSkin: 'ney',
    category: 'Wind & Bowls',
    description: 'Evocative Turkish & Arabic reed flute with airy breath noise attack and natural throat vibrato.',
  },
  {
    id: 'Analog Synth',
    name: 'Analog Synth',
    subtitle: 'Detuned Supersaw & Ladder Lead',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Dual-Osc Synth',
    recommendedSkin: 'moog',
    category: 'Synth & Electric',
    description: 'Lush detuned dual saw/triangle oscillators wired directly into the Sonic Engine resonant filter & tape drive.',
  },
  {
    id: 'Sitar & Tanpura',
    name: 'Sitar & Tanpura',
    subtitle: 'Jawari Buzz & Sympathetic Ring',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Jawari Harmonic Synth',
    recommendedSkin: 'saz',
    category: 'World Strings',
    description: 'Shimmering metallic upper partials modeled on bridge-buzz Jawari resonance with long sympathetic sustain.',
  },
  {
    id: 'Bowed Cello',
    name: 'Bowed Cello',
    subtitle: 'Warm Rosin String Ensemble',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Bowed String Synth',
    recommendedSkin: 'strings',
    category: 'World Strings',
    description: 'Slow bowed attack with rich odd/even string overtones — responsive to aftertouch vertical vibrato.',
  },
  {
    id: 'Crystal Bowls',
    name: 'Crystal Bowls',
    subtitle: 'Pure Singing Harmonic Overtones',
    badge: 'SYNTH ENGINE',
    engineLabel: 'Web Audio Pure Overtones Synth',
    recommendedSkin: 'aurora',
    category: 'Wind & Bowls',
    description: 'Meditative quartz & Tibetan bowl partials with bell-like bloom and ultra-smooth stereo sustain.',
  },
];

export interface PianoSkinDef {
  id: string;
  name: string;
  swatch: string;
  tag: string;
}

export const PIANO_SKINS: PianoSkinDef[] = [
  { id: 'classic', name: 'Concert Classic', swatch: '#d4af37', tag: 'Ivory & Gold' },
  { id: 'obsidian', name: 'Obsidian Noir', swatch: '#52525a', tag: 'Studio Matte' },
  { id: 'aftertouch', name: 'Aftertouch Telemetry', swatch: '#38bdf8', tag: 'MPE Zones' },
  { id: 'midnight', name: 'Midnight Indigo', swatch: '#3a4680', tag: 'HDR P3' },
  { id: 'rosegold', name: 'Rose Gold', swatch: '#c9a496', tag: 'Warm Luxe' },
  { id: 'emerald', name: 'Emerald Velvet', swatch: '#2c6b50', tag: 'Royal' },
  { id: 'royal', name: 'Royal Amethyst', swatch: '#574080', tag: 'Imperial' },
  { id: 'neon', name: 'Neon Cyber', swatch: '#22d3ee', tag: 'Glow' },
  { id: 'cyberpunk', name: 'Cyberpunk Edge', swatch: '#e879f9', tag: 'Synthwave' },
  { id: 'oud', name: 'Mother-of-Pearl Oud', swatch: '#bcaf8c', tag: 'Acoustic' },
  { id: 'saz', name: 'Anatolian Saz', swatch: '#e2c086', tag: 'Fretted' },
  { id: 'ney', name: 'Reed Ney Bamboo', swatch: '#e0b468', tag: 'Wind' },
  { id: 'strings', name: 'Crimson Bowed Strings', swatch: '#7c3f28', tag: 'Orchestral' },
  { id: 'rhodes', name: 'Suitcase Rhodes', swatch: '#3e504e', tag: 'Vintage' },
  { id: 'moog', name: 'Warm Analog Moog', swatch: '#b9b2a0', tag: 'Synth' },
  { id: 'harpsi', name: 'Baroque Harpsichord', swatch: '#34343a', tag: 'Inverted' },
  { id: 'aurora', name: 'Aurora Crystal', swatch: '#6ee7b7', tag: 'Healing' },
  { id: 'sakura', name: 'Sakura Blossom', swatch: '#d9a9b9', tag: 'Pastel' },
  { id: 'abyss', name: 'Teal Abyss', swatch: '#106860', tag: 'Deep' },
  { id: 'desert', name: 'Sahara Sandstone', swatch: '#cdb086', tag: 'Warm' },
  { id: 'cymatics', name: 'Gold Cymatics', swatch: '#d4af37', tag: 'Sacred' },
  { id: 'gamelan', name: 'Bronze Gamelan', swatch: '#dfbe5a', tag: 'Metallic' },
  { id: 'carbon', name: 'Carbon Weave', swatch: '#ef4444', tag: 'Sport' },
  { id: 'arctic', name: 'Arctic Frost', swatch: '#93c5fd', tag: 'Ice P3' },
  { id: 'copper', name: 'Patina Copper', swatch: '#8ce1c3', tag: 'Artisan' },
  { id: 'vapor', name: 'Vaporwave Lilac', swatch: '#a78bfa', tag: 'Retro' },
  { id: 'mono', name: 'Minimal Mono', swatch: '#e4e4e7', tag: 'Clean' },
  { id: 'candy', name: 'Rose Candy', swatch: '#f472b6', tag: 'Playful' },
  { id: 'harp', name: 'Gilded Concert Harp', swatch: '#fbbf24', tag: 'Acoustic' },
  { id: 'guitar', name: 'Spruce Guitar', swatch: '#d97706', tag: 'Plucked' },
  { id: 'archana', name: 'Archana Temple', swatch: '#eab308', tag: 'Sacred' },
  { id: 'kalimba', name: 'Steel Kalimba', swatch: '#c06c4a', tag: 'Thumb Piano' },
  { id: 'koto', name: 'Silk Koto', swatch: '#e2d0b6', tag: 'Eastern' },
  { id: 'wood', name: 'Burl Walnut', swatch: '#8b5e34', tag: 'Craft' },
  { id: 'wooden', name: 'Aged Oak', swatch: '#a16207', tag: 'Natural' },
  { id: 'organ', name: 'Cathedral Organ', swatch: '#f6f1de', tag: 'Classical' },
  { id: 'ivory', name: 'Pure Studio Ivory', swatch: '#f8fafc', tag: 'Bright' },
  { id: 'gold', name: '24K Sovereign Gold', swatch: '#facc15', tag: 'Luxury' },
  { id: 'ocean', name: 'Deep Ocean', swatch: '#0284c7', tag: 'Ambient' },
  { id: 'galaxy', name: 'Nebula Galaxy', swatch: '#7c3aed', tag: 'Cosmos' },
  { id: 'glass', name: 'Refractive Glass', swatch: '#cbd5e1', tag: 'Translucent' },
  { id: 'fire', name: 'Ember Flame', swatch: '#f97316', tag: 'Fiery' },
  { id: 'rainbow', name: 'Harmonic Spectrum', swatch: '#ec4899', tag: 'Chroma' },
  { id: 'kids', name: 'Playful Solfege', swatch: '#22c55e', tag: 'Learning' },
];
