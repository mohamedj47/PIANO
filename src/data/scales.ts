export type ScaleCategory =
  | 'Arabic Maqam'
  | 'Turkish Makam'
  | 'Persian Dastgah'
  | 'Indian Raga'
  | 'Western & Modes'
  | 'Jazz & Blues'
  | 'World & Folk'
  | 'K-EDO & Just';

export const SCALE_CATEGORIES: ScaleCategory[] = [
  'Arabic Maqam',
  'Turkish Makam',
  'Persian Dastgah',
  'Indian Raga',
  'Western & Modes',
  'Jazz & Blues',
  'World & Folk',
  'K-EDO & Just',
];

export interface WorldScale {
  id: string;
  name: string;
  category: ScaleCategory;
  /** Cents offset per chromatic degree relative to root (index 0..11) */
  centsOffsets: number[];
  /** Scale degrees (0..11) highlighted in this scale */
  degrees: number[];
  description: string;
  edo?: number;
}

export const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type RootNote = (typeof ROOT_NOTES)[number];

const RAW_SCALES: Array<{
  name: string;
  category: ScaleCategory;
  degrees: number[];
  cents: number[];
  desc: string;
  edo?: number;
}> = [
  // ARABIC MAQAMAT (36)
  { name: 'Rast', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50], desc: 'Foundational Arabic maqam with neutral 3rd & 7th (-50¢)' },
  { name: 'Bayati', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Expressive lyrical maqam with quarter-flat 2nd (-50¢)' },
  { name: 'Hijaz', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, +15, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0], desc: 'Iconic augmented 2nd between 2nd & 3rd degrees' },
  { name: 'Saba', category: 'Arabic Maqam', degrees: [0, 2, 3, 4, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Deeply melancholic maqam with diminished 4th' },
  { name: 'Nahawand', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Arabic harmonic minor equivalent, warm and dramatic' },
  { name: 'Kurd', category: 'Arabic Maqam', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Modern Arabic Phrygian-family maqam' },
  { name: 'Ajam', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Bright major-character Arabic maqam' },
  { name: 'Sikah', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, -50, 0, 0, -50, 0], desc: 'Starts on a neutral half-flat tonic' },
  { name: 'Huzam', category: 'Arabic Maqam', degrees: [0, 2, 3, 6, 7, 8, 11], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Sikah base with Hijaz upper tetrachord' },
  { name: 'Iraq', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, -50, 0, 0, 0, 0, -50, 0], desc: 'Classical Baghdad & Levant neutral-interval maqam' },
  { name: 'Hijaz Kar', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +10, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0], desc: 'Double-Hijaz symmetrical Ottoman/Arabic maqam' },
  { name: 'Suznak', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 8, 11], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, 0], desc: 'Rast lower jins with Hijaz upper jins' },
  { name: 'Nairuz', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, -50, 0, 0], desc: 'Rast lower jins with Bayati upper jins' },
  { name: 'Yakah', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50], desc: 'Low-register Rast family maqam' },
  { name: 'Mahur', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, 0], desc: 'Rast with natural 7th ascending' },
  { name: 'Athar Kurd', category: 'Arabic Maqam', degrees: [0, 1, 3, 6, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Exotic Kurd + Nawa Athar hybrid' },
  { name: 'Nawa Athar', category: 'Arabic Maqam', degrees: [0, 2, 3, 6, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Dramatic double-augmented 2nd scale' },
  { name: 'Nakriz', category: 'Arabic Maqam', degrees: [0, 2, 3, 6, 7, 9, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Rich modal Dorian with raised 4th' },
  { name: 'Shawq Afza', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ajam lower with Hijaz upper' },
  { name: 'Zanjaran', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Hijaz lower with Ajam upper' },
  { name: 'Farahfaza', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Natural minor Nahawand variant' },
  { name: 'Rahat al-Arwah', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Huzam transposed to B half-flat' },
  { name: 'Shadd Araban', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Low Hijaz Kar descending' },
  { name: 'Jiharkah', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Warm F-centered Rast cousin' },
  { name: 'Mustaar', category: 'Arabic Maqam', degrees: [0, 3, 4, 5, 7, 9, 10], cents: [0, 0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Sikah with augmented 2nd above tonic' },
  { name: 'Lami', category: 'Arabic Maqam', degrees: [0, 1, 3, 5, 6, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Iraqi Locrian-Kurd maqam' },
  { name: 'Awj', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, -50, 0, 0, 0, 0], desc: 'High-register Sikah-Iraq modulation' },
  { name: 'Bayati Shuri', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 6, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Bayati lower + Hijaz on 4th' },
  { name: 'Hussaini', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, -50, 0, 0], desc: 'Soaring melodic Bayati-Ussak relative' },
  { name: 'Bastanikar', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 6, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, -50, 0, 0], desc: 'Sikah + Saba upper progression' },
  { name: 'Suzidil', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, -25, 0, 0], desc: 'Ottoman-Arabic compound Hijaz' },
  { name: 'Tarz Jadid', category: 'Arabic Maqam', degrees: [0, 1, 3, 5, 6, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Rare Kurd + Hijaz compound' },
  { name: 'Hijazayn', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, +10, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0], desc: 'Dual Hijaz on 1st and 5th' },
  { name: 'Muhayyar', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, -50, 0, 0], desc: 'Octave-descending Bayati' },
  { name: 'Saba Zamzam', category: 'Arabic Maqam', degrees: [0, 1, 3, 4, 7, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: '12-TET Saba without quarter-tones' },
  { name: 'Sazkar', category: 'Arabic Maqam', degrees: [0, 3, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50], desc: 'Rast with raised 2nd' },

  // TURKISH MAKAMS (22 - 53-TET comma precision)
  { name: 'Ussak (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: '2-comma flat 2nd (-34¢) Turkish classical scale' },
  { name: 'Huseyni (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, -34, 0, 0], desc: 'Pastoral Anatolian 5th-dominant makam' },
  { name: 'Hicaz (Makam)', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 9, 10], cents: [0, +13, 0, 0, -13, 0, 0, 0, 0, -22, 0, 0], desc: '5-comma/12-comma Turkish Hicaz intonation' },
  { name: 'Hicaz Humayun', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, +13, 0, 0, -13, 0, 0, 0, 0, 0, 0, 0], desc: 'Hicaz lower + Buselik on 4th' },
  { name: 'Uzzal (Makam)', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 9, 10], cents: [0, +13, 0, 0, -13, 0, 0, 0, 0, -34, 0, 0], desc: 'Hicaz pentachord + Ussak on 5th' },
  { name: 'Zirguleli Hicaz', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +13, 0, 0, -13, 0, 0, 0, +13, 0, 0, -13], desc: 'Symmetrical Turkish Hicaz' },
  { name: 'Segah (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -22, 0, 0, -22, 0, 0, 0, 0, -22, 0], desc: 'Ottoman Segah with 1-comma Bakiye flats' },
  { name: 'Rast (Makam)', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, +4, 0, -22, -2, 0, +2, 0, +6, 0, -22], desc: '53-TET Turkish Rast with Segah & Evic (-22¢)' },
  { name: 'Nihavend (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, +4, 0, -6, -2, 0, +2, 0, -6, 0, +4], desc: 'Pythagorean Turkish minor makam' },
  { name: 'Kurdilihicazkar', category: 'Turkish Makam', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0, 0, -12, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Late Ottoman romantic Kurdi makam' },
  { name: 'Acemasiran', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, +4, 0, +8, -2, 0, +2, 0, +6, 0, +10], desc: 'Pythagorean major Turkish makam' },
  { name: 'Buselik (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, +4, 0, -6, -2, 0, +2, 0, -6, 0, +10], desc: 'Clean Pythagorean natural minor' },
  { name: 'Karcigar', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 6, 9, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ussak lower + Hicaz on Neva' },
  { name: 'Saba (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 4, 7, 8, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Turkish Saba with 2-comma Segah' },
  { name: 'Neva (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, -22, 0, 0], desc: 'Ussak lower + Rast on 4th' },
  { name: 'Gerdaniye', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, -22, 0, 0, 0, 0, -22, 0, 0], desc: 'High-register Rast with Acem' },
  { name: 'Sultan-i Yegah', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, +4, 0, -6, 0, 0, 0, 0, 0, 0, 0], desc: 'Dede Efendi compound Buselik makam' },
  { name: 'Sedaraban', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +13, 0, 0, -13, 0, 0, 0, 0, 0, 0, 0], desc: 'Compound descending Hicaz' },
  { name: 'Evcara', category: 'Turkish Makam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, 0, -22, 0, 0, 0, 0, -22, 0, 0, 0, 0], desc: 'F# half-sharp compound makam' },
  { name: 'Ferahnak', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, -22, 0, 0, 0, 0, 0, 0, -22, 0, 0], desc: 'Iraqi/Segah radiant major-ish makam' },
  { name: 'Bayati Araban', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ussak + Zirguleli Hicaz compound' },
  { name: 'Isfahan (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -34, 0, 0, 0, 0, 0, 0, -34, 0, 0], desc: 'Lyrical Istanbul classical makam' },

  // PERSIAN DASTGAHS (12)
  { name: 'Shur (Dastgah)', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Mother of Persian classical music with Koron 2nd' },
  { name: 'Mahur (Dastgah)', category: 'Persian Dastgah', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Regal Persian major mode' },
  { name: 'Segah (Dastgah)', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -45, 0, 0, -45, 0, 0, 0, 0, -45, 0], desc: 'Contemplative Koron-rich dastgah' },
  { name: 'Chahargah', category: 'Persian Dastgah', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Heroic Persian dastgah with 2nd & 6th Koron' },
  { name: 'Homayun', category: 'Persian Dastgah', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Royal contemplative dastgah with Koron 2nd & natural 3rd' },
  { name: 'Nava (Dastgah)', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -40, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Intimate nocturnal Persian dastgah' },
  { name: 'Rast-Panjgah', category: 'Persian Dastgah', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, -45, 0, 0, 0, 0, 0, 0, 0], desc: 'Grand encyclopedic Persian dastgah' },
  { name: 'Abu-Ata', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Avaz of Shur emphasizing 4th degree' },
  { name: 'Dashti', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Folk-inspired pastoral Persian Avaz' },
  { name: 'Bayat-e Tork', category: 'Persian Dastgah', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, 0, 0, -45, 0, 0, 0, 0, 0, 0, 0], desc: 'Devotional Avaz of Shur' },
  { name: 'Afshari', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 6, 8, 10], cents: [0, 0, -45, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Plaintive descending Persian Avaz' },
  { name: 'Bayat-e Esfahan', category: 'Persian Dastgah', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Luminous minor Persian mode with Koron 6th' },

  // INDIAN RAGAS (26 - Shruti just intonation)
  { name: 'Raga Bhairav', category: 'Indian Raga', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +12, 0, 0, -14, -2, 0, +2, +14, 0, 0, -12], desc: 'Dawn raga with oscillating Komal Re & Dha' },
  { name: 'Raga Yaman', category: 'Indian Raga', degrees: [0, 2, 4, 6, 7, 9, 11], cents: [0, 0, +4, 0, -14, 0, -10, +2, 0, -16, 0, -12], desc: 'Evening Kalyan Thaat raga with Tivra Ma' },
  { name: 'Raga Bhairavi', category: 'Indian Raga', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0, +12, 0, +16, 0, -2, 0, +2, +14, 0, +18, 0], desc: 'All-Komal farewell raga of Hindustani music' },
  { name: 'Raga Todi', category: 'Indian Raga', degrees: [0, 1, 3, 6, 7, 8, 11], cents: [0, +12, 0, +16, 0, 0, -10, +2, +14, 0, 0, -12], desc: 'Late morning austere raga' },
  { name: 'Raga Marwa', category: 'Indian Raga', degrees: [0, 1, 4, 6, 7, 9, 11], cents: [0, +12, 0, 0, -14, 0, -10, 0, 0, -16, 0, -12], desc: 'Dusk raga omitting Pa, emphasizing Re & Dha' },
  { name: 'Raga Poorvi', category: 'Indian Raga', degrees: [0, 1, 4, 6, 7, 8, 11], cents: [0, +12, 0, 0, -14, 0, -10, +2, +14, 0, 0, -12], desc: 'Sunset raga with Komal Re, Dha and Tivra Ma' },
  { name: 'Raga Kafi', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, +4, +16, 0, -2, 0, +2, 0, -16, +18, 0], desc: 'Dorian-family playful spring raga' },
  { name: 'Raga Khamaj', category: 'Indian Raga', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, +4, 0, -14, -2, 0, +2, 0, -16, +18, 0], desc: 'Romantic Mixolydian Thaat raga' },
  { name: 'Raga Bilawal', category: 'Indian Raga', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, +4, 0, -14, -2, 0, +2, 0, -16, 0, -12], desc: 'Morning pure Just-Intonation major thaat' },
  { name: 'Raga Asavari', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, +4, +16, 0, -2, 0, +2, +14, 0, +18, 0], desc: 'Pathos-rich Aeolian thaat raga' },
  { name: 'Raga Darbari Kanada', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, +4, +22, 0, -2, 0, +2, +14, 0, +18, 0], desc: 'Majestic midnight raga with heavy Ga andolan' },
  { name: 'Raga Malkauns', category: 'Indian Raga', degrees: [0, 3, 5, 8, 10], cents: [0, 0, 0, +16, 0, -2, 0, 0, +14, 0, +18, 0], desc: 'Pentatonic deep-night meditative raga' },
  { name: 'Raga Bageshri', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, +4, +16, 0, -2, 0, 0, 0, -16, +18, 0], desc: 'Midnight yearning Kafi-thaat raga' },
  { name: 'Raga Desh', category: 'Indian Raga', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, +4, 0, -14, -2, 0, +2, 0, -16, +18, 0], desc: 'Monsoon patriotic raga' },
  { name: 'Raga Bhopali', category: 'Indian Raga', degrees: [0, 2, 4, 7, 9], cents: [0, 0, +4, 0, -14, 0, 0, +2, 0, -16, 0, 0], desc: 'Pentatonic evening Kalyan raga' },
  { name: 'Raga Hamsadhwani', category: 'Indian Raga', degrees: [0, 2, 4, 7, 11], cents: [0, 0, +4, 0, -14, 0, 0, +2, 0, 0, 0, -12], desc: 'Auspicious Carnatic pentatonic raga' },
  { name: 'Raga Charukesi', category: 'Indian Raga', degrees: [0, 2, 4, 5, 7, 8, 10], cents: [0, 0, +4, 0, -14, -2, 0, +2, +14, 0, +18, 0], desc: 'Melakarta 26: major lower + minor upper' },
  { name: 'Raga Kirwani', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0, 0, +4, +16, 0, -2, 0, +2, +14, 0, 0, -12], desc: 'Carnatic harmonic minor raga' },
  { name: 'Raga Ahir Bhairav', category: 'Indian Raga', degrees: [0, 1, 4, 5, 7, 9, 10], cents: [0, +12, 0, 0, -14, -2, 0, +2, 0, -16, +18, 0], desc: 'Bhairav + Kafi dawn blend' },
  { name: 'Raga Jog', category: 'Indian Raga', degrees: [0, 3, 4, 5, 7, 10], cents: [0, 0, 0, +16, -14, -2, 0, +2, 0, 0, +18, 0], desc: 'Dual-Gandhara night raga' },
  { name: 'Raga Shivaranjani', category: 'Indian Raga', degrees: [0, 2, 3, 7, 9], cents: [0, 0, +4, +16, 0, 0, 0, +2, 0, -16, 0, 0], desc: 'Bittersweet minor pentatonic raga' },
  { name: 'Raga Puriya Dhanashree', category: 'Indian Raga', degrees: [0, 1, 4, 6, 7, 8, 11], cents: [0, +12, 0, 0, -14, 0, -10, +2, +14, 0, 0, -12], desc: 'Rich twilight raga' },
  { name: 'Raga Madhuvanti', category: 'Indian Raga', degrees: [0, 2, 3, 6, 7, 9, 11], cents: [0, 0, +4, +16, 0, 0, -10, +2, 0, -16, 0, -12], desc: 'Afternoon Todi-Yaman hybrid' },
  { name: 'Raga Kalyani', category: 'Indian Raga', degrees: [0, 2, 4, 6, 7, 9, 11], cents: [0, 0, +4, 0, -14, 0, -10, +2, 0, -16, 0, -12], desc: 'Carnatic Melakarta 65 Lydian' },
  { name: 'Raga Mayamalavagowla', category: 'Indian Raga', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +12, 0, 0, -14, -2, 0, +2, +14, 0, 0, -12], desc: 'Foundational Carnatic vocal training raga' },
  { name: 'Raga Mohanam', category: 'Indian Raga', degrees: [0, 2, 4, 7, 9], cents: [0, 0, +4, 0, -14, 0, 0, +2, 0, -16, 0, 0], desc: 'Carnatic pentatonic of joy' },

  // WESTERN & MODES (16)
  { name: 'Equal 12-TET', category: 'Western & Modes', degrees: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Standard Western 12-tone equal temperament' },
  { name: 'Major (Ionian)', category: 'Western & Modes', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Classic bright Western diatonic major scale' },
  { name: 'Natural Minor (Aeolian)', category: 'Western & Modes', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Standard natural minor mode' },
  { name: 'Dorian', category: 'Western & Modes', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Minor mode with bright natural 6th' },
  { name: 'Phrygian', category: 'Western & Modes', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Spanish/Andalusian dark minor mode' },
  { name: 'Lydian', category: 'Western & Modes', degrees: [0, 2, 4, 6, 7, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Dreamy major mode with raised #4' },
  { name: 'Mixolydian', category: 'Western & Modes', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Dominant major mode with b7' },
  { name: 'Locrian', category: 'Western & Modes', degrees: [0, 1, 3, 5, 6, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Half-diminished tense mode' },
  { name: 'Harmonic Minor', category: 'Western & Modes', degrees: [0, 2, 3, 5, 7, 8, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Classical minor with leading tone' },
  { name: 'Melodic Minor', category: 'Western & Modes', degrees: [0, 2, 3, 5, 7, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Jazz/classical minor with major 6th & 7th' },
  { name: 'Harmonic Major', category: 'Western & Modes', degrees: [0, 2, 4, 5, 7, 8, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Major scale with flat 6th' },
  { name: 'Double Harmonic Major', category: 'Western & Modes', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Byzantine / Gypsy major symmetry' },
  { name: 'Hungarian Minor', category: 'Western & Modes', degrees: [0, 2, 3, 6, 7, 8, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Minor with raised 4th and 7th' },
  { name: 'Neapolitan Minor', category: 'Western & Modes', degrees: [0, 1, 3, 5, 7, 8, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Opera-era minor with flat 2nd' },
  { name: 'Neapolitan Major', category: 'Western & Modes', degrees: [0, 1, 3, 5, 7, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Melodic minor with flat 2nd' },
  { name: 'Enigmatic', category: 'Western & Modes', degrees: [0, 1, 4, 6, 8, 10, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Verdi enigmatic modern classical scale' },

  // JAZZ & BLUES (12)
  { name: 'Major Pentatonic', category: 'Jazz & Blues', degrees: [0, 2, 4, 7, 9], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Universal 5-note consonant scale' },
  { name: 'Minor Pentatonic', category: 'Jazz & Blues', degrees: [0, 3, 5, 7, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Classic soul/rock/blues 5-note scale' },
  { name: 'Blues Scale', category: 'Jazz & Blues', degrees: [0, 3, 5, 6, 7, 10], cents: [0,0,0,-20,0,0,0,0,0,0,-15,0], desc: 'Minor pentatonic with blue-note bend shading' },
  { name: 'Major Blues', category: 'Jazz & Blues', degrees: [0, 2, 3, 4, 7, 9], cents: [0,0,0,-15,0,0,0,0,0,0,0,0], desc: 'Gospel & country major blues' },
  { name: 'Lydian Dominant', category: 'Jazz & Blues', degrees: [0, 2, 4, 6, 7, 9, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Acoustic / Bartok / jazz #11 dominant' },
  { name: 'Altered (Super Locrian)', category: 'Jazz & Blues', degrees: [0, 1, 3, 4, 6, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Max tension jazz V7alt scale' },
  { name: 'Whole Tone', category: 'Jazz & Blues', degrees: [0, 2, 4, 6, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Debussy / Monk floating hexatonic' },
  { name: 'Half-Whole Diminished', category: 'Jazz & Blues', degrees: [0, 1, 3, 4, 6, 7, 9, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Symmetric octatonic dominant' },
  { name: 'Whole-Half Diminished', category: 'Jazz & Blues', degrees: [0, 2, 3, 5, 6, 8, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Symmetric octatonic diminished 7th' },
  { name: 'Bebop Dominant', category: 'Jazz & Blues', degrees: [0, 2, 4, 5, 7, 9, 10, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: '8-note Mixolydian with passing major 7th' },
  { name: 'Bebop Major', category: 'Jazz & Blues', degrees: [0, 2, 4, 5, 7, 8, 9, 11], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: '8-note Ionian with passing #5/b6' },
  { name: 'Phrygian Dominant', category: 'Jazz & Blues', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: '5th mode of Harmonic Minor / Freygish' },

  // WORLD & FOLK (16)
  { name: 'Pelog Selisir (Balinese)', category: 'World & Folk', degrees: [0, 1, 3, 7, 8], cents: [0, +25, 0, -15, 0, 0, 0, -10, +20, 0, 0, 0], desc: 'Balinese Gamelan 5-tone unequal tuning' },
  { name: 'Slendro (Javanese)', category: 'World & Folk', degrees: [0, 2, 5, 7, 10], cents: [0, 0, +40, 0, 0, -20, 0, +20, 0, 0, -40, 0], desc: 'Equidistant-ish 5-tone Indonesian Gamelan' },
  { name: 'Hirajoshi (Japanese)', category: 'World & Folk', degrees: [0, 2, 3, 7, 8], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Traditional koto tuning' },
  { name: 'In-Sen (Japanese)', category: 'World & Folk', degrees: [0, 1, 5, 7, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Shakuhachi & shamisen winter mode' },
  { name: 'Iwato (Japanese)', category: 'World & Folk', degrees: [0, 1, 5, 6, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Meditative Zen temple koto scale' },
  { name: 'Yo Scale (Japanese)', category: 'World & Folk', degrees: [0, 2, 5, 7, 9], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Bright Japanese folk pentatonic' },
  { name: 'Chinese Gong (Pentatonic)', category: 'World & Folk', degrees: [0, 2, 4, 7, 9], cents: [0, 0, +4, 0, +8, 0, 0, +2, 0, +6, 0, 0], desc: 'Pythagorean Sanfen Sunyi 5-tone' },
  { name: 'Ethiopian Tizita Major', category: 'World & Folk', degrees: [0, 2, 4, 7, 9], cents: [0, 0, 0, 0, -12, 0, 0, 0, 0, 0, 0, 0], desc: 'Ethiopian nostalgic qenet mode' },
  { name: 'Ethiopian Tizita Minor', category: 'World & Folk', degrees: [0, 2, 3, 7, 8], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Minor qenet nostalgia mode' },
  { name: 'Ethiopian Bati', category: 'World & Folk', degrees: [0, 4, 5, 7, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Warm Ethiopian love-song qenet' },
  { name: 'Ethiopian Ambassel', category: 'World & Folk', degrees: [0, 1, 5, 7, 8], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ancient highland Ethiopian qenet' },
  { name: 'Ethiopian Anchihoye', category: 'World & Folk', degrees: [0, 1, 5, 6, 9], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Sacred Wollo liturgical qenet' },
  { name: 'Flamenco (Andalusian)', category: 'World & Folk', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, +10, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0], desc: 'Cante jondo Phrygian-Hijaz cadential mode' },
  { name: 'Klezmer Ahava Rabbah', category: 'World & Folk', degrees: [0, 1, 4, 5, 7, 8, 10], cents: [0, +8, 0, 0, -8, 0, 0, 0, 0, 0, 0, 0], desc: 'Eastern European Freygish klezmer mode' },
  { name: 'Klezmer Mi Sheberach', category: 'World & Folk', degrees: [0, 2, 3, 6, 7, 9, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ukrainian Dorian with raised 4th' },
  { name: 'Scottish Bagpipe (Mixolydian Just)', category: 'World & Folk', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, +4, 0, -14, -2, 0, +2, 0, -16, -31, 0], desc: 'Harmonic 7th Great Highland pipe tuning' },

  // K-EDO & JUST INTONATION (12)
  { name: '24-EDO Quarter-Tone (Neutral)', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, -50, -50, 0, 0, 0, 0, -50, -50, -50], desc: 'Equal 24 divisions per octave (50¢ steps)', edo: 24 },
  { name: '19-EDO Meantone', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -21, -11, +11, -16, +5, -5, -5, -26, -16, +5, -16], desc: '19 equal divisions per octave (63.2¢/step)', edo: 19 },
  { name: '31-EDO Huygens', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -10, -6, +6, -13, +3, -16, -3, -13, -10, +3, -16], desc: '31 equal divisions per octave (38.7¢/step)', edo: 31 },
  { name: '53-EDO Holdrian Comma', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -13, +4, -10, -14, -2, -11, +2, -13, +6, -10, -12], desc: '53 equal divisions per octave (22.64¢ comma)', edo: 53 },
  { name: '5-Limit Just Intonation', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, +12, +4, +16, -14, -2, -10, +2, +14, -16, +18, -12], desc: 'Pure whole-number harmonic ratios (5/4, 3/2)' },
  { name: 'Pythagorean 3-Limit', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -10, +4, -6, +8, -2, +12, +2, -8, +6, -4, +10], desc: 'Pure 3:2 fifths stacked tuning' },
  { name: '7-Limit Septimal', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, +12, +4, +16, -14, -2, -17, +2, +14, -16, -31, -12], desc: 'Includes pure 7/4 harmonic seventh (-31¢)' },
  { name: 'Werckmeister III', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -10, -8, -6, -10, -2, -12, -4, -8, -12, -4, -8], desc: 'Baroque well-temperament' },
  { name: 'Vallotti Well-Temperament', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -6, -4, -2, -8, +2, -8, -2, -4, -6, 0, -10], desc: '18th-century Italian key-color temperament' },
  { name: 'Quarter-Comma Meantone', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -24, -7, +10, -14, +3, -21, -3, -27, -10, +7, -17], desc: 'Renaissance pure major thirds (-14¢)' },
  { name: 'Wendy Carlos Alpha', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -22, -44, +34, +12, -10, +68, +46, +24, +2, -20, -42], desc: '78¢ non-octave equal step tuning' },
  { name: 'Solfeggio 432Hz Resonance', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [-32, -20, -28, -16, -46, -34, -42, -30, -18, -48, -14, -44], desc: 'Verdi A=432Hz Just Intonation healing alignment' },
];

// Expand with regional variants to exceed 140+ distinct named scales
const EXTRA_VARIANTS: Array<{
  name: string;
  category: ScaleCategory;
  degrees: number[];
  cents: number[];
  desc: string;
  edo?: number;
}> = [
  { name: 'Rast Suzidilara', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, -40], desc: 'Cairo Rast variant with slightly raised Segah' },
  { name: 'Rast Kirdan', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, -50, 0], desc: 'Descending Rast with lowered 7th' },
  { name: 'Bayati Husseini', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, -45, 0, 0], desc: 'Bayati emphasizing 5th degree' },
  { name: 'Hijaz Gharib', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +18, 0, 0, -12, 0, 0, 0, 0, 0, 0, 0], desc: 'Deeply expressive Syrian Hijaz intonation' },
  { name: 'Nahawand Murassah', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 6, 8, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Nahawand with Hijaz modulation on 4th' },
  { name: 'Nahawand Kabir', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Classical Baghdad/Egypt Nahawand' },
  { name: 'Sikah Baladi', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, -50, 0, 0, 0, 0, -50, 0], desc: 'Egyptian folk Sikah tuning' },
  { name: 'Sikah Huzam Iraqi', category: 'Arabic Maqam', degrees: [0, 2, 3, 6, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, -50, 0], desc: 'Baghdad maqam tradition Huzam' },
  { name: 'Ajam Ushayran', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, +4, 0, -8, 0, 0, +2, 0, 0, 0, 0], desc: 'Classical Bb-rooted Ajam' },
  { name: 'Kurd Lami', category: 'Arabic Maqam', degrees: [0, 1, 3, 5, 6, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Iraqi southern Kurd variant' },
  { name: 'Nawa (Arabic)', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Rast on Sol / Bayati on Re' },
  { name: 'Dalanshin', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 8, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, -50, 0], desc: 'Rast upper modulation maqam' },
  { name: 'Shahnaz', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, +10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'High Hijaz Kar descendant' },
  { name: 'Nikriz (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 6, 7, 9, 10], cents: [0, 0, +4, 0, 0, 0, 0, +2, 0, 0, -22, 0], desc: 'Turkish 53-TET Nikriz with Segah-flat 7th' },
  { name: 'Huzzam (Makam)', category: 'Turkish Makam', degrees: [0, 2, 3, 6, 7, 8, 11], cents: [0, 0, -22, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Turkish 1-comma Segah Huzzam' },
  { name: 'Mustear (Makam)', category: 'Turkish Makam', degrees: [0, 3, 4, 5, 7, 9, 10], cents: [0, 0, 0, -22, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Turkish Segah variant' },
  { name: 'Suzinak (Makam)', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 8, 11], cents: [0, 0, +4, 0, -22, 0, 0, +2, 0, 0, 0, 0], desc: 'Turkish Rast + Hicaz compound' },
  { name: 'Acemkurdi', category: 'Turkish Makam', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0, 0, -10, 0, 0, 0, 0, +2, 0, 0, 0, 0], desc: 'Turkish classical Kurdi on Dugah' },
  { name: 'Mahur (Makam)', category: 'Turkish Makam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, +4, 0, +8, -2, 0, +2, 0, +6, 0, +10], desc: 'Turkish Sol-centered Pythagorean major' },
  { name: 'Raga Deshkar', category: 'Indian Raga', degrees: [0, 2, 4, 7, 9], cents: [0, 0, +4, 0, -14, 0, 0, +2, 0, -16, 0, 0], desc: 'Morning pentatonic Bilawal cousin' },
  { name: 'Raga Durga', category: 'Indian Raga', degrees: [0, 2, 5, 7, 9], cents: [0, 0, +4, 0, 0, -2, 0, +2, 0, -16, 0, 0], desc: 'Night pentatonic without Ga & Ni' },
  { name: 'Raga Shankara', category: 'Indian Raga', degrees: [0, 4, 7, 9, 11], cents: [0, 0, 0, 0, -14, 0, 0, +2, 0, -16, 0, -12], desc: 'Heroic late-evening Bilawal raga' },
  { name: 'Raga Bihag', category: 'Indian Raga', degrees: [0, 4, 5, 6, 7, 9, 11], cents: [0, 0, 0, 0, -14, -2, -10, +2, 0, -16, 0, -12], desc: 'Romantic night raga with both Ma' },
  { name: 'Raga Marubihag', category: 'Indian Raga', degrees: [0, 2, 4, 6, 7, 9, 11], cents: [0, 0, +4, 0, -14, 0, -10, +2, 0, -16, 0, -12], desc: 'Evening Kalyan raga with Shuddha/Tivra Ma' },
  { name: 'Raga Miyan Ki Malhar', category: 'Indian Raga', degrees: [0, 2, 3, 5, 7, 9, 10, 11], cents: [0, 0, +4, +16, 0, -2, 0, +2, 0, -16, +18, -12], desc: 'Tansen monsoon raga with dual Ni' },
  { name: 'Raga Megh', category: 'Indian Raga', degrees: [0, 2, 5, 7, 10], cents: [0, 0, +4, 0, 0, -2, 0, +2, 0, 0, +18, 0], desc: 'Thunder-cloud pentatonic monsoon raga' },
  { name: 'Raga Shuddha Sarang', category: 'Indian Raga', degrees: [0, 2, 5, 6, 7, 9, 11], cents: [0, 0, +4, 0, 0, -2, -10, +2, 0, -16, 0, -12], desc: 'Noon raga omitting Ga' },
  { name: 'Raga Multani', category: 'Indian Raga', degrees: [0, 1, 3, 6, 7, 8, 11], cents: [0, +12, 0, +16, 0, 0, -10, +2, +14, 0, 0, -12], desc: 'Afternoon Todi raga' },
  { name: 'Raga Lalit', category: 'Indian Raga', degrees: [0, 1, 4, 5, 6, 8, 11], cents: [0, +12, 0, 0, -14, -2, -10, 0, +14, 0, 0, -12], desc: 'Pre-dawn raga with both Ma & no Pa' },
  { name: 'Raga Bhatiyar', category: 'Indian Raga', degrees: [0, 1, 4, 5, 6, 7, 9, 11], cents: [0, +12, 0, 0, -14, -2, -10, +2, 0, -16, 0, -12], desc: 'Early morning Marwa-thaat raga' },
  { name: 'Prometheus Scale', category: 'Western & Modes', degrees: [0, 2, 4, 6, 9, 10], cents: [0,0,0,0,0,0,0,0,0,0,0,0], desc: 'Scriabin mystic chord hexatonic' },
  { name: 'Acoustic Scale (Overtone)', category: 'Western & Modes', degrees: [0, 2, 4, 6, 7, 9, 10], cents: [0, 0, +4, 0, -14, 0, -49, +2, 0, -16, -31, 0], desc: 'Harmonic series partials 8 through 14' },
  { name: 'Istrian Scale', category: 'World & Folk', degrees: [0, 1, 3, 4, 6, 7], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Croatian/Slovenian narrow 6-note folk mode' },
  { name: 'Maqam Farahnak', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, -50, 0, 0], desc: 'Bright Sikah compound' },
  { name: 'Maqam Ajam Ashiran', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Classical Arabic major on Bb' },
  { name: 'Maqam Hijaz Kar Kurd', category: 'Arabic Maqam', degrees: [0, 1, 3, 5, 7, 8, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Kurd lower + Hijaz Kar cadences' },
  { name: 'Maqam Nishaburak', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 10], cents: [0, 0, -35, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ussak-colored Rast variant' },
  { name: 'Maqam Rahawi', category: 'Arabic Maqam', degrees: [0, 2, 4, 5, 7, 9, 10], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ancient Mesopotamian Rast cousin' },
  { name: 'Maqam Zawil', category: 'Arabic Maqam', degrees: [0, 2, 3, 5, 7, 9, 11], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, -50], desc: 'Rast on C with neutral 3rd & 7th' },
  { name: 'Maqam Zangula', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 9, 11], cents: [0, +12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ancient Baghdad Hijaz precursor' },
  { name: 'Maqam Awj Ara', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 8, 11], cents: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'High Iraqi Sikah-Hijaz compound' },
  { name: 'Maqam Hijazi', category: 'Arabic Maqam', degrees: [0, 1, 4, 5, 7, 9, 10], cents: [0, +10, 0, 0, -10, 0, 0, 0, 0, -50, 0, 0], desc: 'Hijaz lower with Bayati upper' },
  { name: 'Klezmer Misheberach', category: 'World & Folk', degrees: [0, 2, 3, 6, 7, 9, 10], cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], desc: 'Ashkenazi synagogue & klezmer altered Dorian' },
  { name: 'Bohlen-Pierce Lambda', category: 'K-EDO & Just', degrees: [0, 1, 3, 4, 6, 7, 9, 10], cents: [0, -12, -24, +14, 0, -18, +10, -8, +22, +6, -12, +16], desc: 'Tritave 3:1 non-octave experimental tuning' },
  { name: '17-EDO Arabic-Pythagorean', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -29, +12, -18, +6, -6, +24, +6, -24, +18, -12, 0], desc: '17-tone system used by al-Farabi & Safi al-Din', edo: 17 },
  { name: '22-Shruti Hindustani', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, +12, +4, +16, -14, -2, -10, +2, +14, -16, +18, -12], desc: 'Ancient Bharata Natyashastra 22-shruti framework' },
  { name: '48-EDO Microtonal Ultra', category: 'K-EDO & Just', degrees: [0, 2, 4, 5, 7, 9, 11], cents: [0, -25, 0, -25, -50, 0, -25, 0, -25, 0, -50, -25], desc: 'Quarter-quarter-tone 25¢ high-resolution grid', edo: 48 },
];

export const WORLD_SCALES: WorldScale[] = [...RAW_SCALES, ...EXTRA_VARIANTS].map((s, idx) => ({
  id: `${idx}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name: s.name,
  category: s.category,
  centsOffsets: s.cents,
  degrees: s.degrees,
  description: s.desc,
  edo: s.edo,
}));

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const NON_OCTAVE_BP_ID = 'bohlen-pierce-lambda';
const NON_OCTAVE_ALPHA_ID = 'wendy-carlos-alpha';

export function getRootIndex(root: RootNote): number {
  return ROOT_NOTES.indexOf(root);
}

export function getNoteTuningInfo(
  midi: number,
  scale: WorldScale,
  root: RootNote,
  baseTuningHz = 440,
  transposeSemitones = 0,
  pitchSemitones = 0
): { freq: number; cents: number; centsOffset: number; inScale: boolean; degree: number; noteLabel: string } {
  const effectiveMidi = midi + transposeSemitones;
  const rootIdx = getRootIndex(root);
  const semitone = ((effectiveMidi % 12) + 12) % 12;
  const octave = Math.floor(effectiveMidi / 12) - 1;
  const noteLabel = `${NOTE_NAMES[semitone]}${octave}`;

  // True non-octave Bohlen-Pierce Lambda (13 equal steps of a 3:1 tritave = ~146.304¢/step)
  if (scale.id.endsWith(NON_OCTAVE_BP_ID)) {
    const refMidi = 60 + rootIdx;
    const stepDelta = effectiveMidi - refMidi;
    const refFreq = baseTuningHz * Math.pow(2, (refMidi - 69 + pitchSemitones) / 12);
    const freq = refFreq * Math.pow(3, stepDelta / 13);
    const eqFreq = baseTuningHz * Math.pow(2, (effectiveMidi - 69 + pitchSemitones) / 12);
    const cents = Math.round(1200 * Math.log2(freq / eqFreq));
    const bpStep = ((stepDelta % 13) + 13) % 13;
    const inScale = [0, 1, 3, 4, 6, 7, 9, 10, 12].includes(bpStep);
    return { freq, cents, centsOffset: cents, inScale, degree: bpStep % 12, noteLabel };
  }

  // True non-octave Wendy Carlos Alpha (78.0¢ equal step)
  if (scale.id.endsWith(NON_OCTAVE_ALPHA_ID)) {
    const refMidi = 60 + rootIdx;
    const stepDelta = effectiveMidi - refMidi;
    const refFreq = baseTuningHz * Math.pow(2, (refMidi - 69 + pitchSemitones) / 12);
    const freq = refFreq * Math.pow(2, (stepDelta * 78) / 1200);
    const eqFreq = baseTuningHz * Math.pow(2, (effectiveMidi - 69 + pitchSemitones) / 12);
    const cents = Math.round(1200 * Math.log2(freq / eqFreq));
    const degree = ((effectiveMidi % 12) - rootIdx + 12) % 12;
    return { freq, cents, centsOffset: cents, inScale: true, degree, noteLabel };
  }

  const degree = ((effectiveMidi % 12) - rootIdx + 12) % 12;
  const centsOffset = scale.centsOffsets[degree] ?? 0;
  const inScale = scale.degrees.includes(degree);
  const totalSemitones = effectiveMidi - 69 + pitchSemitones + centsOffset / 100;
  const freq = baseTuningHz * Math.pow(2, totalSemitones / 12);
  return { freq, cents: centsOffset, centsOffset, inScale, degree, noteLabel };
}

export function getKEdoStepInfo(
  stepIndex: number,
  kEdo: number,
  root: RootNote,
  baseTuningHz = 440,
  octave = 4
): { freq: number; centsFromRoot: number; nearestMidi: number; detuneCents: number } {
  const rootMidi = (octave + 1) * 12 + getRootIndex(root);
  const rootFreq = baseTuningHz * Math.pow(2, (rootMidi - 69) / 12);
  const centsFromRoot = (stepIndex / kEdo) * 1200;
  const freq = rootFreq * Math.pow(2, stepIndex / kEdo);
  const exactMidi = rootMidi + centsFromRoot / 100;
  const nearestMidi = Math.round(exactMidi);
  const detuneCents = Math.round((exactMidi - nearestMidi) * 100);
  return { freq, centsFromRoot, nearestMidi, detuneCents };
}

export function getScaleOctaveNotes(
  scale: WorldScale,
  root: RootNote,
  octave = 4,
  baseTuningHz = 440
) {
  const rootIdx = getRootIndex(root);
  const baseMidi = (octave + 1) * 12 + rootIdx;
  return scale.degrees.map((deg) => {
    const midi = baseMidi + deg;
    const info = getNoteTuningInfo(midi, scale, root, baseTuningHz);
    return { midi, ...info };
  });
}
