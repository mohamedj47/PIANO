import { EDUCATIONAL_ARTICLES, getArticleBySlug } from '../data/articles';

export const CANONICAL_ORIGIN = 'https://piano-eta-ivory.vercel.app';
export const SITE_NAME = 'MAQAMIR';
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/images/multicultural-piano.png`;

export type SupportedLocale = 'en' | 'ar' | 'es' | 'fr' | 'de';

export interface RouteMetadata {
  canonicalPath: string;
  canonicalUrl: string;
  title: string;
  description: string;
  ogType: 'website' | 'article';
  ogImage: string;
  robots: 'index, follow' | 'noindex, nofollow';
  lang: SupportedLocale;
  dir: 'ltr' | 'rtl';
  httpStatus: 200 | 404;
  hreflangs?: Array<{ hreflang: string; href: string }>;
  jsonLd: Array<Record<string, unknown>>;
  crawlerSummaryHeading: string;
  crawlerSummaryBody: string;
}

const LOCALIZED_HUBS: Array<{ hreflang: string; path: string }> = [
  { hreflang: 'x-default', path: '/' },
  { hreflang: 'en', path: '/' },
  { hreflang: 'ar', path: '/ar' },
  { hreflang: 'es', path: '/es' },
  { hreflang: 'fr', path: '/fr' },
  { hreflang: 'de', path: '/de' },
];

export const STATIC_INDEXABLE_PATHS = [
  '/',
  '/piano',
  '/online-piano',
  '/virtual-instruments',
  '/music-studio',
  '/learn-piano',
  '/music-theory',
  '/guides',
  '/pricing',
  '/about',
  '/ar',
  '/es',
  '/fr',
  '/de',
] as const;

export function getAllSitemapPaths(): string[] {
  const articlePaths = EDUCATIONAL_ARTICLES.map((a) => `/guides/${a.slug}`);
  return [...STATIC_INDEXABLE_PATHS, ...articlePaths];
}

function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MAQAMIR',
    url: CANONICAL_ORIGIN,
    logo: `${CANONICAL_ORIGIN}/logo-dark.webp`,
    description:
      'MAQAMIR is an interactive online piano studio, microtonal world music workstation, and browser DAW featuring 140+ world scales, synthesized instruments, and real-time audio effects.',
  };
}

function buildWebApplicationJsonLd(pageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MAQAMIR Interactive Piano Studio',
    alternateName: 'MaqAmir Piano Studio',
    url: pageUrl,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires Web Audio API; optional Web MIDI API',
    inLanguage: ['en', 'ar', 'es', 'fr', 'de'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free Community Studio with optional Pro Monthly and Pro Lifetime upgrades',
    },
    featureList: [
      'Interactive virtual piano keyboard with velocity dynamics',
      '140+ world scales and microtonal Arabic Maqam, Turkish Makam, Persian Dastgah, and Indian Raga tunings',
      '8 Web Audio synthesized instruments and 44 visual keybed skins',
      '13 performance realms including Dual Piano, DJ 6x2 Deck, Qiano K-EDO, and Mandala',
      '52-parameter real-time Sonic Engine DSP and 2D XY Gesture Pad',
      'Live recording, 30s retrospective MIDI rescue, WAV and MIDI export',
    ],
  };
}

function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${CANONICAL_ORIGIN}${item.path}`,
    })),
  };
}

export function normalizePathname(rawPath: string): string {
  const [pathname] = (rawPath || '/').split(/[?#]/);
  const clean = pathname.replace(/\/+$/, '') || '/';
  return clean;
}

export function getRouteMetadata(rawPath: string): RouteMetadata {
  const clean = normalizePathname(rawPath);

  if (clean === '/' || clean === '/piano') {
    const canonicalPath = clean === '/' ? '/' : '/piano';
    const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath === '/' ? '' : canonicalPath}`;
    return {
      canonicalPath,
      canonicalUrl,
      title: 'MAQAMIR — Interactive Online Piano Studio & Microtonal Music Workstation',
      description:
        'Play piano online free with MAQAMIR. Explore 8 synthesized instruments, 140+ world scales & microtonal Maqamat, 13 interactive realms, a 52-parameter Sonic Engine, WAV/MIDI export, and Web MIDI support.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      hreflangs: LOCALIZED_HUBS.map((h) => ({
        hreflang: h.hreflang,
        href: `${CANONICAL_ORIGIN}${h.path === '/' ? '' : h.path}`,
      })),
      jsonLd: [buildOrganizationJsonLd(), buildWebApplicationJsonLd(canonicalUrl)],
      crawlerSummaryHeading: 'MAQAMIR — Interactive Online Piano Studio & World Music Workstation',
      crawlerSummaryBody:
        'Play interactive virtual piano directly in your browser with 8 Web Audio instruments, 140+ world scales and microtonal Arabic Maqam quarter-tones, 13 performance realms, 52 DSP parameters, Web MIDI, and WAV/MIDI export.',
    };
  }

  if (clean === '/online-piano') {
    const url = `${CANONICAL_ORIGIN}/online-piano`;
    return {
      canonicalPath: '/online-piano',
      canonicalUrl: url,
      title: 'Play Piano Online Free — Interactive Virtual Piano Keyboard | MAQAMIR',
      description:
        'Play an expressive online piano keyboard in your browser with computer keyboard shortcuts, touchscreen velocity, sustain pedal, 44 keybed skins, and instant recording.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/piano-studio.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildWebApplicationJsonLd(url),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Online Piano', path: '/online-piano' },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Can I play piano online without downloading an app?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. MAQAMIR Piano Studio runs natively inside modern desktop and mobile browsers via Web Audio synthesis with zero downloads.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does the MAQAMIR virtual piano support computer keyboards and USB MIDI?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Play with QWERTY shortcuts (A–L white keys, W/E/T/Y/U/O/P black keys, Space sustain) or plug in any Web MIDI controller.',
              },
            },
          ],
        },
      ],
      crawlerSummaryHeading: 'Play Piano Online Free — MAQAMIR Virtual Keyboard',
      crawlerSummaryBody:
        'Responsive 88-key range virtual piano in the browser with computer keyboard mapping, touch velocity, Web MIDI support, sustain latch, and instant WAV/MIDI export.',
    };
  }

  if (clean === '/virtual-instruments') {
    const url = `${CANONICAL_ORIGIN}/virtual-instruments`;
    return {
      canonicalPath: '/virtual-instruments',
      canonicalUrl: url,
      title: 'Virtual Instruments & 44 Piano Skins Online | MAQAMIR',
      description:
        'Perform with 8 Web Audio harmonic instruments — Grand Piano, Warm Oud, Electric Rhodes, Ney Flute, Analog Synth, Sitar & Tanpura, Bowed Cello, and Crystal Bowls — plus 44 UHD visual skins.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/guitouch.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildWebApplicationJsonLd(url),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Virtual Instruments', path: '/virtual-instruments' },
        ]),
      ],
      crawlerSummaryHeading: '8 Browser-Synthesized Instruments & 44 Keybed Themes',
      crawlerSummaryBody:
        'Switch between Grand Piano, Warm Oud, Electric Rhodes, Ney Flute, Analog Synth, Sitar & Tanpura, Bowed Cello, and Crystal Bowls shaped in real time through the Sonic Engine.',
    };
  }

  if (clean === '/music-studio') {
    const url = `${CANONICAL_ORIGIN}/music-studio`;
    return {
      canonicalPath: '/music-studio',
      canonicalUrl: url,
      title: 'Online Music Studio, 13 Realms & 52-Parameter Sonic Engine | MAQAMIR',
      description:
        'Compose and sculpt sound inside a browser DAW with 13 interactive musical realms, DJ 6x2 pad matrix, Dual Vinyl turntables, 52 DSP parameters, 30s MIDI rescue, and WAV export.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/synth-lab.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildWebApplicationJsonLd(url),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Music Studio', path: '/music-studio' },
        ]),
      ],
      crawlerSummaryHeading: 'MAQAMIR Browser DAW & 13 Expressive Realms',
      crawlerSummaryBody:
        'Explore the 52-parameter Sonic Engine, 2D XY Gesture Pad, Dual Piano Stage, DJ Performance Deck, Qiano K-EDO lattice, Mandala strings, and 30-second retrospective recording.',
    };
  }

  if (clean === '/learn-piano') {
    const url = `${CANONICAL_ORIGIN}/learn-piano`;
    return {
      canonicalPath: '/learn-piano',
      canonicalUrl: url,
      title: 'Learn Piano Online Free — Interactive Lessons, Paths & Exercises | MAQAMIR',
      description:
        'Start learning piano step by step with guided exercises, keyboard note diagrams, chord formulas, daily beginner practice tips, and interactive studio sessions.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/piano-realm-dual.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: 'MAQAMIR Interactive Piano & Music Learning Hub',
          description:
            'Structured beginner piano tutorials, note reading guides, chord fundamentals, and microtonal scale workshops paired with an interactive browser studio.',
          url,
          educationalLevel: 'Beginner to Advanced',
          isAccessibleForFree: true,
        },
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Learn Piano', path: '/learn-piano' },
        ]),
      ],
      crawlerSummaryHeading: 'Learn Piano Online with Interactive Guided Exercises',
      crawlerSummaryBody:
        'Step-by-step tutorials covering Middle C orientation, piano note reading, major/minor triads, QWERTY practice routines, and 6-part handbook mastery.',
    };
  }

  if (clean === '/music-theory') {
    const url = `${CANONICAL_ORIGIN}/music-theory`;
    return {
      canonicalPath: '/music-theory',
      canonicalUrl: url,
      title: 'Music Theory, Scales, Chords & Microtonal Maqam Explorer | MAQAMIR',
      description:
        'Study Western modes, Arabic Maqamat (-50c quarter-tones), Turkish 53-TET Makams, Persian Dastgahs, Indian Shruti Ragas, and K-EDO harmonic lattices interactively.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/arabesque.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: 'MAQAMIR World Music Theory & Microtonality Encyclopedia',
          url,
          isAccessibleForFree: true,
        },
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Music Theory', path: '/music-theory' },
        ]),
      ],
      crawlerSummaryHeading: 'World Music Theory: Modes, Chords & Microtonal Maqam Systems',
      crawlerSummaryBody:
        'Explore 140+ interactive scales with live cent-offset visualizers across Arabic Maqam, Turkish Makam, Persian Dastgah, Indian Raga, Jazz, and K-EDO systems.',
    };
  }

  if (clean === '/guides') {
    const url = `${CANONICAL_ORIGIN}/guides`;
    return {
      canonicalPath: '/guides',
      canonicalUrl: url,
      title: 'Guides, Piano Lessons & 6-Part Studio Mastery Handbook | MAQAMIR',
      description:
        'Master microtonal quarter-tones, piano keyboard notes, major & minor chords, polyphonic aftertouch, Sonic Engine DSP, and 30s MIDI rescue with MAQAMIR Guides.',
      ogType: 'website',
      ogImage: `${CANONICAL_ORIGIN}/images/realms/piano-studio.webp`,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ]),
      ],
      crawlerSummaryHeading: 'MAQAMIR Piano Guides & 6-Part Studio Handbook',
      crawlerSummaryBody:
        'Curated learning paths, beginner piano articles, and interactive 12-lesson handbook across scales, realms, DSP synthesis, and studio recording.',
    };
  }

  if (clean.startsWith('/guides/')) {
    const slug = clean.slice('/guides/'.length);
    const article = getArticleBySlug(slug);
    if (article) {
      const url = `${CANONICAL_ORIGIN}/guides/${article.slug}`;
      return {
        canonicalPath: `/guides/${article.slug}`,
        canonicalUrl: url,
        title: `${article.title} | MAQAMIR`,
        description: article.description,
        ogType: 'article',
        ogImage: `${CANONICAL_ORIGIN}${article.heroImage}`,
        robots: 'index, follow',
        lang: 'en',
        dir: 'ltr',
        httpStatus: 200,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.description,
            image: `${CANONICAL_ORIGIN}${article.heroImage}`,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: { '@type': 'Organization', name: 'MAQAMIR Music Education Team' },
            publisher: {
              '@type': 'Organization',
              name: 'MAQAMIR',
              logo: { '@type': 'ImageObject', url: `${CANONICAL_ORIGIN}/logo-dark.webp` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          },
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: article.shortTitle, path: `/guides/${article.slug}` },
          ]),
          ...(article.faq.length > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: article.faq.map((f) => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: { '@type': 'Answer', text: f.answer },
                  })),
                },
              ]
            : []),
        ],
        crawlerSummaryHeading: article.title,
        crawlerSummaryBody: article.description,
      };
    }
  }

  if (clean === '/about') {
    const url = `${CANONICAL_ORIGIN}/about`;
    return {
      canonicalPath: '/about',
      canonicalUrl: url,
      title: 'About MAQAMIR — Microtonal World Music Workstation',
      description:
        'Discover the heritage, Web Audio engineering, 140+ world scales, and multicultural music mission behind MAQAMIR Piano Studio.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]),
      ],
      crawlerSummaryHeading: 'About MAQAMIR — Microtonal World Music Workstation',
      crawlerSummaryBody:
        'Built for performers, students, and composers across Western, Arabic Maqam, Turkish Makam, Persian Dastgah, and Indian Raga traditions.',
    };
  }

  if (clean === '/pricing' || clean === '/pro') {
    const url = `${CANONICAL_ORIGIN}/pricing`;
    return {
      canonicalPath: '/pricing',
      canonicalUrl: url,
      title: 'Pricing & Upgrade — Free, Pro Monthly & Pro Lifetime | MAQAMIR',
      description:
        'Start playing MAQAMIR free with 140+ scales and 13 musical realms, or upgrade to Pro Monthly or Pro Lifetime via manual InstaPay transfer.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ]),
      ],
      crawlerSummaryHeading: 'MAQAMIR Plans: Free Studio, Pro Monthly & Pro Lifetime',
      crawlerSummaryBody:
        'Play core instruments, 140+ scales, 13 realms, and WAV/MIDI export free, or upgrade to Pro Monthly (30 days) or Pro Lifetime via verified InstaPay checkout.',
    };
  }

  // Multilingual localized entry pages
  if (clean === '/ar') {
    const url = `${CANONICAL_ORIGIN}/ar`;
    return {
      canonicalPath: '/ar',
      canonicalUrl: url,
      title: 'مقامير MAQAMIR — بيانو أونلاين وتجربة المقامات العربية والربع تون',
      description:
        'اعزف البيانو أونلاين مجانًا مع استوديو مقامير التفاعلي: مقامات عربية وربع تون (-50 سنت)، 8 آلات موسيقية، 13 عالمًا تفاعليًا، ومحرك مؤثرات صوتية متكامل.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'ar',
      dir: 'rtl',
      httpStatus: 200,
      hreflangs: LOCALIZED_HUBS.map((h) => ({
        hreflang: h.hreflang,
        href: `${CANONICAL_ORIGIN}${h.path === '/' ? '' : h.path}`,
      })),
      jsonLd: [buildWebApplicationJsonLd(url)],
      crawlerSummaryHeading: 'مقامير — استوديو البيانو التفاعلي والمقامات الشرقية أونلاين',
      crawlerSummaryBody:
        'منصة موسيقية متكاملة في المتصفح لعزف البيانو والعود والناي واستكشاف أكثر من 140 مقامًا وسلمًا موسيقيًا مع إمكانية الترقية عبر InstaPay.',
    };
  }

  if (clean === '/es') {
    const url = `${CANONICAL_ORIGIN}/es`;
    return {
      canonicalPath: '/es',
      canonicalUrl: url,
      title: 'MAQAMIR — Piano Virtual Online Gratis, Escalas del Mundo y Estudio DAW',
      description:
        'Toca el piano online gratis en tu navegador con MAQAMIR: 8 instrumentos sintetizados, más de 140 escalas del mundo y microtonales, 13 mundos musicales y exportación WAV/MIDI.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'es',
      dir: 'ltr',
      httpStatus: 200,
      hreflangs: LOCALIZED_HUBS.map((h) => ({
        hreflang: h.hreflang,
        href: `${CANONICAL_ORIGIN}${h.path === '/' ? '' : h.path}`,
      })),
      jsonLd: [buildWebApplicationJsonLd(url)],
      crawlerSummaryHeading: 'MAQAMIR — Estudio Interactivo de Piano Online y Música del Mundo',
      crawlerSummaryBody:
        'Explora el teclado virtual, acordes, maqamat microtonales y motor sónico de 52 parámetros directamente desde tu navegador.',
    };
  }

  if (clean === '/fr') {
    const url = `${CANONICAL_ORIGIN}/fr`;
    return {
      canonicalPath: '/fr',
      canonicalUrl: url,
      title: 'MAQAMIR — Piano Virtuel en Ligne Gratuit, Gammes Microtonales et Studio DAW',
      description:
        'Jouez du piano en ligne gratuitement avec MAQAMIR : 8 instruments synthétisés, plus de 140 gammes mondiales et quarts de ton, 13 univers musicaux et export WAV/MIDI.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'fr',
      dir: 'ltr',
      httpStatus: 200,
      hreflangs: LOCALIZED_HUBS.map((h) => ({
        hreflang: h.hreflang,
        href: `${CANONICAL_ORIGIN}${h.path === '/' ? '' : h.path}`,
      })),
      jsonLd: [buildWebApplicationJsonLd(url)],
      crawlerSummaryHeading: 'MAQAMIR — Studio de Piano en Ligne et Musique Microtonale',
      crawlerSummaryBody:
        'Jouez, enregistrez et explorez les maqams orientaux, ragas et modes occidentaux directement dans votre navigateur.',
    };
  }

  if (clean === '/de') {
    const url = `${CANONICAL_ORIGIN}/de`;
    return {
      canonicalPath: '/de',
      canonicalUrl: url,
      title: 'MAQAMIR — Online Klavier Kostenlos Spielen, Welt-Tonleitern & Browser-DAW',
      description:
        'Spiele kostenlos virtuelles Klavier im Browser mit MAQAMIR: 8 Web-Audio-Instrumente, über 140 Welt-Tonleitern, 13 Performance-Realms, 52-Parameter-Sonic-Engine und WAV/MIDI-Export.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      lang: 'de',
      dir: 'ltr',
      httpStatus: 200,
      hreflangs: LOCALIZED_HUBS.map((h) => ({
        hreflang: h.hreflang,
        href: `${CANONICAL_ORIGIN}${h.path === '/' ? '' : h.path}`,
      })),
      jsonLd: [buildWebApplicationJsonLd(url)],
      crawlerSummaryHeading: 'MAQAMIR — Interaktives Online-Klavierstudio & Mikrotonale Workstation',
      crawlerSummaryBody:
        'Entdecke virtuelles Klavier, Maqam-Vierteltöne, Ragas, Synthesizer und Studio-Aufnahme direkt im Webbrowser.',
    };
  }

  // Private admin console routes — strictly noindex
  if (clean === '/admin' || clean === '/admin/payments' || clean === '/admin/payment-settings') {
    const url = `${CANONICAL_ORIGIN}${clean}`;
    return {
      canonicalPath: clean,
      canonicalUrl: url,
      title: 'Admin Console | MAQAMIR',
      description: 'Private administrative console for MAQAMIR payment verification.',
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'noindex, nofollow',
      lang: 'en',
      dir: 'ltr',
      httpStatus: 200,
      jsonLd: [],
      crawlerSummaryHeading: 'MAQAMIR Admin Console',
      crawlerSummaryBody: 'Authentication required.',
    };
  }

  // Fallback 404 Not Found
  return {
    canonicalPath: '/404',
    canonicalUrl: `${CANONICAL_ORIGIN}/404`,
    title: 'Page Not Found (404) | MAQAMIR',
    description: 'The requested page could not be found on MAQAMIR Piano Studio.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'noindex, nofollow',
    lang: 'en',
    dir: 'ltr',
    httpStatus: 404,
    jsonLd: [],
    crawlerSummaryHeading: '404 — Page Not Found | MAQAMIR',
    crawlerSummaryBody: 'Return to the MAQAMIR interactive online piano studio, guides, or pricing.',
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function injectServerMetadata(rawHtml: string, requestUrl: string): { html: string; status: 200 | 404 } {
  const meta = getRouteMetadata(requestUrl);

  const headTags: string[] = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`,
  ];

  if (meta.hreflangs) {
    for (const h of meta.hreflangs) {
      headTags.push(
        `<link rel="alternate" hreflang="${escapeHtml(h.hreflang)}" href="${escapeHtml(h.href)}" />`
      );
    }
  }

  for (const schema of meta.jsonLd) {
    const safeJson = JSON.stringify(schema).replace(/</g, '\\u003c');
    headTags.push(`<script type="application/ld+json">${safeJson}</script>`);
  }

  let html = rawHtml.replace(
    /<html\s+lang="[^"]*"\s+dir="[^"]*"/,
    `<html lang="${meta.lang}" dir="${meta.dir}"`
  );

  html = html.replace(
    /<!-- MAQAMIR_SEO_HEAD_START -->[\s\S]*?<!-- MAQAMIR_SEO_HEAD_END -->/,
    `<!-- MAQAMIR_SEO_HEAD_START -->\n  ${headTags.join('\n  ')}\n  <!-- MAQAMIR_SEO_HEAD_END -->`
  );

  const noscriptSummary = `<noscript><main style="max-width:780px;margin:48px auto;padding:24px;color:#f6f4ee;font-family:Inter,sans-serif"><h1>${escapeHtml(
    meta.crawlerSummaryHeading
  )}</h1><p>${escapeHtml(
    meta.crawlerSummaryBody
  )}</p><nav style="margin-top:16px"><a href="/" style="color:#D4AF37;margin-right:16px">Studio</a><a href="/online-piano" style="color:#D4AF37;margin-right:16px">Online Piano</a><a href="/virtual-instruments" style="color:#D4AF37;margin-right:16px">Instruments</a><a href="/music-studio" style="color:#D4AF37;margin-right:16px">Music Studio</a><a href="/learn-piano" style="color:#D4AF37;margin-right:16px">Learn Piano</a><a href="/music-theory" style="color:#D4AF37;margin-right:16px">Music Theory</a><a href="/guides" style="color:#D4AF37;margin-right:16px">Guides</a><a href="/pricing" style="color:#D4AF37">Pricing</a></nav></main></noscript>`;

  html = html.replace('<div id="root"></div>', `<div id="root">${noscriptSummary}</div>`);

  return { html, status: meta.httpStatus };
}

export function buildSitemapXml(): string {
  const paths = getAllSitemapPaths();
  const urls = paths.map((p) => {
    const loc = `${CANONICAL_ORIGIN}${p === '/' ? '' : p}`;
    const priority =
      p === '/' || p === '/online-piano'
        ? '1.0'
        : p === '/virtual-instruments' ||
          p === '/music-studio' ||
          p === '/learn-piano' ||
          p === '/music-theory' ||
          p === '/guides'
        ? '0.9'
        : p.startsWith('/guides/')
        ? '0.8'
        : '0.7';
    const changefreq = p.startsWith('/guides/') ? 'monthly' : 'weekly';
    return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    '\n'
  )}\n</urlset>\n`;
}

export function buildRobotsTxt(): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /api/uploads/proofs/',
    '',
    `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
}
