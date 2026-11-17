import React, { useCallback, useEffect, useState } from 'react';
import { PianoStudioPage } from './src/pages/PianoStudioPage';
import { AboutPage } from './src/pages/AboutPage';
import { GuidesPage } from './src/pages/GuidesPage';
import { ProPage } from './src/pages/ProPage';
import { PricingPage } from './src/pages/PricingPage';

function normalizeRoute(pathWithSearch: string): string {
  const [pathname] = pathWithSearch.split('?');
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/piano') return '/piano';
  if (clean === '/about') return '/about';
  if (clean === '/guides') return '/guides';
  if (clean === '/pro') return '/pro';
  if (clean === '/pricing') return '/pricing';
  return '/piano';
}

const ROUTE_TITLES: Record<string, string> = {
  '/piano': 'Piano Studio — Online Microtonal Piano, 135+ World Scales & DAW | MaqAmir',
  '/about': 'About MaqAmir — Microtonal World Music Studio',
  '/guides': 'Guides & 6-Part Handbook | MaqAmir',
  '/pro': 'MaqAmir Pro Studio — Unlock Full Microtonal Workstation',
  '/pricing': 'Pricing — Free Browser Studio | MaqAmir',
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

  if (route === '/about') return <AboutPage onNavigate={navigate} />;
  if (route === '/guides') return <GuidesPage onNavigate={navigate} />;
  if (route === '/pro') return <ProPage onNavigate={navigate} />;
  if (route === '/pricing') return <PricingPage onNavigate={navigate} />;
  return <PianoStudioPage onNavigate={navigate} />;
}
