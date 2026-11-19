import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Play, Share2 } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { EDUCATIONAL_ARTICLES, getArticleBySlug } from '../data/articles';
import { ShareStudioModal } from '../components/growth/ShareStudioModal';
import { trackEvent } from '../lib/analytics';

interface ArticlePageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug, onNavigate }) => {
  const article = getArticleBySlug(slug);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!article) return;
    trackEvent(
      'lesson_view',
      {
        lesson_slug: article.slug,
        lesson_category: article.category,
      },
      { oncePerSessionKey: `lesson:${article.slug}` }
    );
  }, [article]);

  if (!article) {
    return null;
  }

  const related = EDUCATIONAL_ARTICLES.filter((a) => article.relatedSlugs.includes(a.slug));

  return (
    <SiteChrome currentPath={`/guides/${article.slug}`} onNavigate={onNavigate}>
      <article className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/55">
          <button type="button" onClick={() => onNavigate('/')} className="hover:text-[#D4AF37]">
            Home
          </button>
          <span>/</span>
          <button type="button" onClick={() => onNavigate('/guides')} className="hover:text-[#D4AF37]">
            Guides
          </button>
          <span>/</span>
          <span className="text-white/85">{article.shortTitle}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4 border-b border-white/10 pb-8">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
            {article.category} · {article.readingMinutes} min read · Updated {article.updatedAt}
          </div>
          <h1 className="brand-font text-3xl sm:text-5xl font-black text-white leading-[1.1]">
            {article.title}
          </h1>
          <p className="text-sm sm:text-base text-white/75 leading-relaxed">
            {article.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-white/50">
              Editorial: <strong className="text-white/80">MAQAMIR Music Education Team</strong>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Share Guide</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(article.studioHref)}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{article.studioCtaLabel}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Visual Hero + Highlighted Notes Bar */}
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0e0e13]">
          <img
            src={article.heroImage}
            alt={article.heroAlt}
            referrerPolicy="no-referrer"
            className="w-full h-60 sm:h-72 object-cover"
          />
          <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              <strong className="text-white">Focus Notes / Pattern:</strong>{' '}
              <span className="font-mono text-[#FACC15]">{article.highlightedNotes.join(' · ')}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(article.studioHref)}
              className="text-xs font-extrabold text-[#FACC15] hover:underline flex items-center gap-1"
            >
              <span>Test live on keyboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body Sections */}
        <div className="space-y-10">
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-4">
              <h2 className="brand-font text-xl sm:text-2xl font-extrabold text-white">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-sm sm:text-base text-white/75 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.keyTakeaways && section.keyTakeaways.length > 0 && (
                <ul className="rounded-xl bg-[#0e0e13] border border-white/10 p-5 space-y-2.5">
                  {section.keyTakeaways.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/85">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.studioTip && (
                <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 text-xs sm:text-sm text-amber-100">
                  <strong className="text-[#FACC15]">Studio Tip:</strong> {section.studioTip}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Practical Studio Exercises */}
        {article.exercises.length > 0 && (
          <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
                  Practice Drills
                </div>
                <h2 className="text-xl font-extrabold text-white mt-0.5">
                  Hands-On Exercises for MAQAMIR Studio
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(article.studioHref)}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Practice Session</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.exercises.map((ex) => (
                <div
                  key={ex.title}
                  className="p-4 rounded-xl bg-black/45 border border-white/10 space-y-2.5"
                >
                  <div className="text-sm font-bold text-white">{ex.title}</div>
                  <div className="text-xs text-[#D4AF37]">{ex.goal}</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-white/70 leading-relaxed">
                    {ex.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {article.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="brand-font text-xl sm:text-2xl font-extrabold text-white">
              Quick Questions
            </h2>
            <div className="space-y-3">
              {article.faq.map((item) => (
                <div
                  key={item.question}
                  className="p-4 rounded-xl bg-[#0e0e13] border border-white/10 space-y-1.5"
                >
                  <h3 className="text-sm font-bold text-white">{item.question}</h3>
                  <p className="text-xs sm:text-sm text-white/65 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="border-t border-white/10 pt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <span>Continue Learning</span>
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('/guides')}
                className="text-xs font-bold text-white/65 hover:text-[#FACC15] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Guides</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <button
                  key={rel.slug}
                  type="button"
                  onClick={() => onNavigate(`/guides/${rel.slug}`)}
                  className="text-left p-4 rounded-xl bg-[#0e0e13] border border-white/10 hover:border-[#D4AF37]/50 transition space-y-1.5"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    {rel.category} · {rel.readingMinutes}m
                  </div>
                  <div className="text-xs font-extrabold text-white leading-snug">
                    {rel.shortTitle}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </article>

      <ShareStudioModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sharePath={`/guides/${article.slug}`}
        shareTitle={article.title}
        shareContextLabel={`Share "${article.shortTitle}"`}
      />
    </SiteChrome>
  );
};
