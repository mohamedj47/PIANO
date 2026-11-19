import { SupportedLocale } from './seoMeta';

export interface LocalizedShowcaseContent {
  locale: SupportedLocale;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
  eyebrow: string;
  h1: string;
  lead: string;
  primaryCta: string;
  secondaryCta: string;
  highlightsTitle: string;
  highlights: Array<{ title: string; body: string }>;
  linksTitle: string;
  links: Array<{ path: string; label: string; desc: string }>;
}

export const LOCALE_OPTIONS: Array<{ locale: SupportedLocale; code: string; path: string; label: string }> = [
  { locale: 'en', code: 'EN', path: '/', label: 'English' },
  { locale: 'ar', code: 'AR', path: '/ar', label: 'العربية' },
  { locale: 'es', code: 'ES', path: '/es', label: 'Español' },
  { locale: 'fr', code: 'FR', path: '/fr', label: 'Français' },
  { locale: 'de', code: 'DE', path: '/de', label: 'Deutsch' },
];

export const LOCALIZED_SHOWCASES: Record<Exclude<SupportedLocale, 'en'>, LocalizedShowcaseContent> = {
  ar: {
    locale: 'ar',
    nativeLabel: 'العربية',
    dir: 'rtl',
    eyebrow: 'استوديو البيانو والمقامات الشرقية التفاعلي',
    h1: 'اعزف البيانو أونلاين واستكشف المقامات العربية والربع تون في متصفحك',
    lead: 'منصة MAQAMIR تجمع بين البيانو التفاعلي، العود، الناي، محرك المؤثرات الصوتية ذي الـ 52 معاملًا، وأكثر من 140 سلمًا ومقامًا عالميًا بضبط دقيق للربع تون (-50 سنت) بدون الحاجة إلى تثبيت أي برنامج.',
    primaryCta: 'افتح استوديو البيانو الآن',
    secondaryCta: 'استكشف باقات Pro و InstaPay',
    highlightsTitle: 'ما الذي يميز استوديو مقامير؟',
    highlights: [
      {
        title: 'ضبط ميكروتونال أصيل للمقامات (-50 سنت)',
        body: 'اعزف مقامات الراست والبياتي والصبا والسيكاه والحجاز والنهاوند بضبط دقيق للنغمات المحايدة، مع الانتقال الفوري لدرجة الركوز دون تشويش.',
      },
      {
        title: '8 آلات مدمجة و13 عالمًا موسيقيًا',
        body: 'تنقل بين الجراند بيانو، العود الدافئ، الناي، الفينتدج رودس، السيتار، التشيللو، وأحواض الكريستال، أو افتح لوحة الـ DJ والمانديلا وعالم Qiano.',
      },
      {
        title: 'تسجيل فوري وإنقاذ آخر 30 ثانية',
        body: 'سجل عزفك أو استعد آخر 30 ثانية من المرتجلات عبر ميزة 30s Rescue وصدّر مقطوعاتك بصيغة WAV أو MIDI مجانًا.',
      },
    ],
    linksTitle: 'روابط سريعة داخل المنصة',
    links: [
      { path: '/piano?scale=0-rast&instrument=Warm+Oud', label: 'تجربة مقام راست على العود', desc: 'ابدأ فورًا بمقام الراست والربع تون' },
      { path: '/guides', label: 'الدليل التعليمي (6 أجزاء)', desc: 'شروحات المقامات، الكوردات، ومحرك الصوت' },
      { path: '/pricing', label: 'الباقات والترقية عبر InstaPay', desc: 'الخطة المجانية وباقات Pro الشهرية والدائمة' },
    ],
  },
  es: {
    locale: 'es',
    nativeLabel: 'Español',
    dir: 'ltr',
    eyebrow: 'Estudio Musical Interactivo Online',
    h1: 'Toca el Piano Online Gratis y Explora Escalas Microtonales en MAQAMIR',
    lead: 'Un estudio de piano virtual y DAW en el navegador diseñado para músicos, estudiantes y productores: 8 instrumentos sintetizados por Web Audio, más de 140 escalas mundiales y 13 mundos interactivos sin descargas.',
    primaryCta: 'Abrir Estudio de Piano',
    secondaryCta: 'Ver Guías de Piano',
    highlightsTitle: 'Herramientas diseñadas para crear y aprender',
    highlights: [
      {
        title: 'Teclado expresivo y compatibilidad MIDI',
        body: 'Toca desde tu teclado QWERTY (teclas A–L y barra espaciadora para sustain), pantalla táctil o conecta cualquier teclado USB/Bluetooth MIDI.',
      },
      {
        title: 'Escalas occidentales, Maqam y Raga',
        body: 'Cambia al instante entre modos mayores/menores, maqamat árabes con cuartos de tono (-50¢), makams turcos y ragas indios.',
      },
      {
        title: 'Motor Sónico de 52 parámetros y grabación WAV/MIDI',
        body: 'Sculpe reverb, filtro resonante, saturación analógica y captura improvisaciones recientes con la función 30s Rescue.',
      },
    ],
    linksTitle: 'Explora MAQAMIR',
    links: [
      { path: '/online-piano', label: 'Piano Virtual Online', desc: 'Atajos, dinámicas y pieles HD' },
      { path: '/learn-piano', label: 'Aprender Piano Paso a Paso', desc: 'Notas musicales, Do central y acordes' },
      { path: '/pricing', label: 'Planes Free y Pro', desc: 'Acceso gratuito y funciones avanzadas' },
    ],
  },
  fr: {
    locale: 'fr',
    nativeLabel: 'Français',
    dir: 'ltr',
    eyebrow: 'Studio Musical Interactif en Ligne',
    h1: 'Jouez du Piano en Ligne et Explorez les Gammes du Monde sur MAQAMIR',
    lead: 'Un piano virtuel et station audio numérique directement dans votre navigateur : 8 instruments synthétisés, plus de 140 gammes microtonales et occidentales, 13 univers musicaux et export WAV/MIDI.',
    primaryCta: 'Ouvrir le Studio Piano',
    secondaryCta: 'Parcourir les Guides',
    highlightsTitle: 'Conçu pour l’apprentissage et la scène',
    highlights: [
      {
        title: 'Clavier réactif & support Web MIDI',
        body: 'Jouez à la souris, sur écran tactile, au clavier d’ordinateur ou via votre contrôleur MIDI USB sans latence superflue.',
      },
      {
        title: 'Microtonalité authentique (-50 cents)',
        body: 'Passez des gammes majeures et mineures aux maqams arabes (Rast, Bayati, Hijaz), makams turcs 53-TET et ragas indiens.',
      },
      {
        title: 'Enregistrement et récupération 30s Rescue',
        body: 'Ne perdez plus une idée mélodique : capturez vos 30 dernières secondes de jeu et exportez en WAV ou MIDI.',
      },
    ],
    linksTitle: 'Accès rapide',
    links: [
      { path: '/online-piano', label: 'Piano Virtuel en Ligne', desc: 'Découvrir le clavier et les réglages' },
      { path: '/virtual-instruments', label: '8 Instruments Synthétisés', desc: 'Grand Piano, Oud, Ney, Rhodes et plus' },
      { path: '/pricing', label: 'Tarifs Free & Pro', desc: 'Comparer les fonctionnalités' },
    ],
  },
  de: {
    locale: 'de',
    nativeLabel: 'Deutsch',
    dir: 'ltr',
    eyebrow: 'Interaktives Browser-Musikstudio',
    h1: 'Online Klavier Spielen & Mikrotonale Tonleitern Entdecken mit MAQAMIR',
    lead: 'Ein reaktionsschnelles virtuelles Klavier und Web-Audio-Studio direkt im Browser — mit 8 synthetisierten Instrumenten, über 140 Welt-Tonleitern, 13 Performance-Realms und WAV/MIDI-Export.',
    primaryCta: 'Klavierstudio Starten',
    secondaryCta: 'Anleitungen Lesen',
    highlightsTitle: 'Funktionen für Lernende, Komponisten & Live-Performances',
    highlights: [
      {
        title: 'Tastatur-, Touch- & USB-MIDI-Steuerung',
        body: 'Sofort spielbar per Computertastatur, Touchscreen oder angeschlossenem MIDI-Controller inklusive Sustain-Funktion.',
      },
      {
        title: 'Über 140 Tonleitern inklusive Vierteltönen',
        body: 'Wechsle nahtlos zwischen Dur/Moll, Blues, arabischem Maqam, türkischem 53-TET Makam, indischem Raga und K-EDO-Stimmungen.',
      },
      {
        title: '52-Parameter Sonic Engine & 30s Rescue',
        body: 'Forme Filter, Hall, Chorus sowie Delay in Echtzeit und sichere spontane Improvisationen als WAV oder Standard-MIDI.',
      },
    ],
    linksTitle: 'Direkteinstiege',
    links: [
      { path: '/online-piano', label: 'Virtuelles Online-Klavier', desc: 'Tastatur-Layouts und Spielhilfen' },
      { path: '/music-theory', label: 'Musiktheorie & Skalen', desc: 'Intervalle, Akkorde und Mikrotonalität' },
      { path: '/pricing', label: 'Free & Pro Tarife', desc: 'Funktionsvergleich ansehen' },
    ],
  },
};
