import React from 'react';
import { ArrowRight, Globe2, Play } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { LOCALIZED_SHOWCASES, LOCALE_OPTIONS } from '../lib/i18n';
import { SupportedLocale } from '../lib/seoMeta';

interface LocalizedLandingPageProps {
  locale: Exclude<SupportedLocale, 'en'>;
  onNavigate: (path: string) => void;
}

export const LocalizedLandingPage: React.FC<LocalizedLandingPageProps> = ({
  locale,
  onNavigate,
}) => {
  const copy = LOCALIZED_SHOWCASES[locale];
  const currentPath = `/${locale}`;

  return (
    <SiteChrome currentPath={currentPath} onNavigate={onNavigate}>
      <div dir={copy.dir} className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-14">
        {/* Language Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Globe2 className="w-4 h-4 text-[#D4AF37]" />
            <span>MAQAMIR International · {copy.nativeLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {LOCALE_OPTIONS.map((opt) => (
              <button
                key={opt.locale}
                type="button"
                onClick={() => onNavigate(opt.path)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  opt.locale === locale
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-white/[0.05] text-white/70 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
              {copy.eyebrow}
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-[1.15]">
              {copy.h1}
            </h1>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">{copy.lead}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/piano')}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-sm font-extrabold flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{copy.primaryCta}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(locale === 'ar' ? '/pricing' : '/guides')}
                className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-bold text-white"
              >
                {copy.secondaryCta}
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-[#0e0e13]">
              <img
                src="/images/multicultural-piano.png"
                alt={copy.h1}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Key Value Pillars */}
        <section className="space-y-5">
          <h2 className="brand-font text-2xl font-extrabold text-white">
            {copy.highlightsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {copy.highlights.map((h) => (
              <div
                key={h.title}
                className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-2.5"
              >
                <h3 className="text-base font-extrabold text-white">{h.title}</h3>
                <p className="text-xs text-white/65 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-white">{copy.linksTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {copy.links.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="text-start p-5 rounded-2xl bg-[#0e0e13] border border-white/10 hover:border-[#D4AF37]/50 transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-extrabold text-white">{item.label}</div>
                  <div className="text-xs text-white/55 mt-1">{item.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  );
};
