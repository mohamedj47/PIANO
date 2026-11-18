import React, { useCallback, useEffect, useState } from 'react';
import { PianoStudioPage } from './src/pages/PianoStudioPage';
import { AboutPage } from './src/pages/AboutPage';
import { GuidesPage } from './src/pages/GuidesPage';
import { ProPage } from './src/pages/ProPage';
import { PricingPage } from './src/pages/PricingPage';
import { AdminPaymentsPage } from './src/pages/AdminPaymentsPage';
import { AdminPaymentSettingsPage } from './src/pages/AdminPaymentSettingsPage';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';

function normalizeRoute(pathWithSearch: string): string {
  const [pathname] = pathWithSearch.split('?');
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/piano') return '/piano';
  if (clean === '/about') return '/about';
  if (clean === '/guides') return '/guides';
  if (clean === '/pro') return '/pro';
  if (clean === '/pricing') return '/pricing';
  if (clean === '/admin' || clean === '/admin/payments') return '/admin/payments';
  if (clean === '/admin/payment-settings') return '/admin/payment-settings';
  return '/piano';
}

const ROUTE_TITLES: Record<string, string> = {
  '/piano': 'Piano Studio — Online Microtonal Piano, 135+ World Scales & DAW | MaqAmir',
  '/about': 'About MaqAmir — Microtonal World Music Studio',
  '/guides': 'Guides & 6-Part Handbook | MaqAmir',
  '/pro': 'MaqAmir Pro Studio — Pricing & Upgrade via InstaPay',
  '/pricing': 'Pricing & Upgrade — Free, Pro Monthly & Pro Lifetime | MaqAmir',
  '/admin/payments': 'Admin Payment Requests — InstaPay Review Console | MaqAmir',
  '/admin/payment-settings': 'Payment Settings — InstaPay Configuration | MaqAmir',
};

export default function App() {
  const [route, setRoute] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizeRoute(window.location.pathname) : '/piano'
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
    document.title = ROUTE_TITLES[route] || ROUTE_TITLES['/piano'];
  }, [route]);

  let content: React.ReactNode;
  if (route === '/about') content = <AboutPage onNavigate={navigate} />;
  else if (route === '/guides') content = <GuidesPage onNavigate={navigate} />;
  else if (route === '/pro') content = <ProPage onNavigate={navigate} />;
  else if (route === '/pricing') content = <PricingPage onNavigate={navigate} />;
  else if (route === '/admin/payments') content = <AdminPaymentsPage onNavigate={navigate} />;
  else if (route === '/admin/payment-settings') content = <AdminPaymentSettingsPage onNavigate={navigate} />;
  else content = <PianoStudioPage onNavigate={navigate} />;

  return (
    <ErrorBoundary>
      <AuthProvider>{content}</AuthProvider>
    </ErrorBoundary>
  );
}
