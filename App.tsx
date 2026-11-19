import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { getArticleBySlug } from './src/data/articles';
import { syncClientSeo } from './src/lib/seoClient';
import { trackPageView } from './src/lib/analytics';

const PianoStudioPage = lazy(() =>
  import('./src/pages/PianoStudioPage').then((m) => ({ default: m.PianoStudioPage }))
);
const AboutPage = lazy(() =>
  import('./src/pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const GuidesPage = lazy(() =>
  import('./src/pages/GuidesPage').then((m) => ({ default: m.GuidesPage }))
);
const ArticlePage = lazy(() =>
  import('./src/pages/ArticlePage').then((m) => ({ default: m.ArticlePage }))
);
const ProPage = lazy(() =>
  import('./src/pages/ProPage').then((m) => ({ default: m.ProPage }))
);
const PricingPage = lazy(() =>
  import('./src/pages/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const AdminPaymentsPage = lazy(() =>
  import('./src/pages/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage }))
);
const AdminPaymentSettingsPage = lazy(() =>
  import('./src/pages/AdminPaymentSettingsPage').then((m) => ({
    default: m.AdminPaymentSettingsPage,
  }))
);
const OnlinePianoPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.OnlinePianoPage }))
);
const VirtualInstrumentsPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.VirtualInstrumentsPage }))
);
const MusicStudioPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.MusicStudioPage }))
);
const LearnPianoPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.LearnPianoPage }))
);
const MusicTheoryPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.MusicTheoryPage }))
);
const NotFoundPage = lazy(() =>
  import('./src/pages/LandingPages').then((m) => ({ default: m.NotFoundPage }))
);
const LocalizedLandingPage = lazy(() =>
  import('./src/pages/LocalizedLandingPage').then((m) => ({ default: m.LocalizedLandingPage }))
);

function normalizeRoute(pathWithSearch: string): string {
  const [pathname] = pathWithSearch.split(/[?#]/);
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return '/';
  if (clean === '/piano') return '/piano';
  if (clean === '/online-piano') return '/online-piano';
  if (clean === '/virtual-instruments') return '/virtual-instruments';
  if (clean === '/music-studio') return '/music-studio';
  if (clean === '/learn-piano') return '/learn-piano';
  if (clean === '/music-theory') return '/music-theory';
  if (clean === '/guides') return '/guides';
  if (clean.startsWith('/guides/')) {
    const slug = clean.slice('/guides/'.length);
    if (getArticleBySlug(slug)) return `/guides/${slug}`;
    return '/404';
  }
  if (clean === '/about') return '/about';
  if (clean === '/pro') return '/pro';
  if (clean === '/pricing') return '/pricing';
  if (clean === '/ar' || clean === '/es' || clean === '/fr' || clean === '/de') return clean;
  if (clean === '/admin' || clean === '/admin/payments') return '/admin/payments';
  if (clean === '/admin/payment-settings') return '/admin/payment-settings';
  return '/404';
}

const PageLoaderFallback = () => (
  <div className="min-h-screen bg-[#050505] text-[#F6F4EE] flex items-center justify-center">
    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
      MAQAMIR Studio
    </div>
  </div>
);

export default function App() {
  const [route, setRoute] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizeRoute(window.location.pathname) : '/'
  );

  const navigate = useCallback((path: string) => {
    const next = normalizeRoute(path);
    setRoute(next);
    if (typeof window !== 'undefined') {
      const targetUrl = path.startsWith('/') ? path : next;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    syncClientSeo(route);
    trackPageView(route);
  }, [route]);

  let content: React.ReactNode;
  if (route === '/online-piano') content = <OnlinePianoPage onNavigate={navigate} />;
  else if (route === '/virtual-instruments') content = <VirtualInstrumentsPage onNavigate={navigate} />;
  else if (route === '/music-studio') content = <MusicStudioPage onNavigate={navigate} />;
  else if (route === '/learn-piano') content = <LearnPianoPage onNavigate={navigate} />;
  else if (route === '/music-theory') content = <MusicTheoryPage onNavigate={navigate} />;
  else if (route === '/about') content = <AboutPage onNavigate={navigate} />;
  else if (route === '/guides') content = <GuidesPage onNavigate={navigate} />;
  else if (route.startsWith('/guides/')) {
    content = <ArticlePage slug={route.slice('/guides/'.length)} onNavigate={navigate} />;
  } else if (route === '/ar' || route === '/es' || route === '/fr' || route === '/de') {
    content = <LocalizedLandingPage locale={route.slice(1) as 'ar' | 'es' | 'fr' | 'de'} onNavigate={navigate} />;
  } else if (route === '/pro') content = <ProPage onNavigate={navigate} />;
  else if (route === '/pricing') content = <PricingPage onNavigate={navigate} />;
  else if (route === '/admin/payments') content = <AdminPaymentsPage onNavigate={navigate} />;
  else if (route === '/admin/payment-settings') content = <AdminPaymentSettingsPage onNavigate={navigate} />;
  else if (route === '/404') content = <NotFoundPage onNavigate={navigate} />;
  else content = <PianoStudioPage onNavigate={navigate} />;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageLoaderFallback />}>{content}</Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}
