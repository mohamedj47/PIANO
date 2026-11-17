export interface TutorialStep {
  step: number;
  title: string;
  body: string;
  targetRealm?: 'play' | 'piano' | 'dj' | 'mandala';
  highlightSelector?: string;
  cardPosition: 'center' | 'top-right';
  iconName: 'piano' | 'sparkles' | 'theater' | 'dj' | 'mandala' | 'mic' | 'aftertouch' | 'gesture';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 1,
    title: '1 · Grand Piano & Touch Velocity 🎹',
    body: 'Tap Piano anytime to load the concert Grand Piano, or press and hold to choose curated acoustic presets and keyboard splits. Tap keys lightly with your fingertip for soft pianissimo, or strike with a wider finger surface for bold fortissimo.',
    targetRealm: 'play',
    highlightSelector: '[data-tour-target="deck-piano"]',
    cardPosition: 'center',
    iconName: 'piano',
  },
  {
    step: 2,
    title: '2 · Instant Magic Shuffle ✨',
    body: 'Tap Magic to instantly shuffle a complete world scale, multi-octave instruments, key percussion, and studio FX into one harmonious setup. Press and hold to browse 350+ curated presets or describe a custom sound to the AI Builder.',
    targetRealm: 'play',
    highlightSelector: '[data-tour-target="deck-magic"]',
    cardPosition: 'center',
    iconName: 'sparkles',
  },
  {
    step: 3,
    title: '3 · Piano Realm — Dual Grand Manuals 🎼',
    body: 'Tap the Performance (Theater) icon in the studio deck anytime to enter Piano Realm — a full-screen dual-manual grand piano stage with 135 UHD Display-P3 & HDR skins. Shift octave ranges (< / >), select 2–4 octaves per manual, and sweep cross-manual glissandos.',
    targetRealm: 'piano',
    highlightSelector: '[data-tour-target="deck-realms"]',
    cardPosition: 'center',
    iconName: 'theater',
  },
  {
    step: 4,
    title: '4 · DJ Realm — Square Pads & Starter Kits 🎧',
    body: 'Perform on 1:1 square DJ pads (4×3 portrait, 6×2 landscape, 5+7) or the Dual Vinyl Turntable Keybed (12 clockwise 30° sectors with scratch torque & -14° 3D dive). Load a 1-tap DJ Starter Kit, record live input loops to any locked pad, route 1–8CH headphone cues, and sculpt 49 vertical sliders with Sticky FX Freeze.',
    targetRealm: 'dj',
    cardPosition: 'center',
    iconName: 'dj',
  },
  {
    step: 5,
    title: '5 · Mandala & 25+ Musical Realms ✦',
    body: 'Strum and swirl across luminous 6-way kaleidoscopic Mandala strings. Tap the top-right Control Center icon anytime to switch between Piano, DJ, Play, Mandala, Silk River, Desert Oud, Santur, Sitar, Kora, Aura Bowls, Qiano (4–48 EDO), and interactive realms.',
    targetRealm: 'mandala',
    cardPosition: 'top-right',
    iconName: 'mandala',
  },
  {
    step: 6,
    title: '6 · Instant Record & 30s Rescue 🎙️',
    body: 'Tap Record to capture live studio audio instantly, or press and hold to open recording modes — rescue the last 30 seconds you just played with Retrospective Capture, record interactive MIDI Replays, or launch quantized Pro Record.',
    targetRealm: 'play',
    highlightSelector: '[data-tour-target="deck-record"]',
    cardPosition: 'center',
    iconName: 'mic',
  },
  {
    step: 7,
    title: '7 · Polyphonic Aftertouch & Hold-Latch ⚡',
    body: 'Hold any key for 300ms and slide without lifting for Polyphonic Aftertouch (↑ Vibrato, ↓ Volume, ← Cutoff, → Drive). Hold 2 stationary fingers for 250ms (or tap the top third / right-click on desktop) to latch a key hands-free, or drag 2 fingers for Stereo Pan & Drive and lift both to lock those parameters into the latched key.',
    targetRealm: 'play',
    highlightSelector: '[data-tour-target="piano-stage"]',
    cardPosition: 'center',
    iconName: 'aftertouch',
  },
  {
    step: 8,
    title: '8 · 2D Gesture Pad & Slap FX 🎛️',
    body: 'Draw across the 2D X/Y Gesture Pad or switch to the Vertical Sliders view (with 420ms value popovers and Sticky FX Freeze on deselected latched key chips) to sweep Filter, Resonance, Reverb, and Drive in real time across 4 quadrant zones or 1–4 finger gestures.',
    targetRealm: 'play',
    highlightSelector: '[data-tour-target="gesture-pad-toggle"]',
    cardPosition: 'center',
    iconName: 'gesture',
  },
];
