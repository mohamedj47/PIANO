import React from 'react';
import { ArrowRight, Piano } from 'lucide-react';

interface SiteChromeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const SiteChrome: React.FC<SiteChromeProps> = ({ currentPath, onNavigate, children }) => {
  const navLinks = [
    { path: '/piano', label: 'Piano Studio' },
    { path: '/guides', label: 'Guides' },
    { path: '/pro', label: 'Pro' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F6F4EE] flex flex-col">
      <header className="sticky top-0 z-40 h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('/piano')}
          className="flex items-center gap-2.5"
        >
          <img src="/logo-dark.webp" alt="MaqAmir" className="w-7 h-7 object-contain" />
          <span className="brand-font text-lg font-extrabold tracking-tight text-white">
            MaqAmir<span className="text-[#D4AF37]">.</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => onNavigate(link.path)}
              className={`text-xs font-bold uppercase tracking-wider transition ${
                currentPath === link.path
                  ? 'text-[#FACC15]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate('/piano')}
          className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5 transition"
        >
          <Piano className="w-3.5 h-3.5" />
          <span>Open Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 bg-[#08080b] py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-dark.webp" alt="MaqAmir" className="w-5 h-5 object-contain" />
            <span className="brand-font text-sm font-bold text-white/90">
              MaqAmir<span className="text-[#D4AF37]">.</span> Piano Studio
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-white/55">
            {navLinks.map((l) => (
              <button
                key={l.path}
                type="button"
                onClick={() => onNavigate(l.path)}
                className="hover:text-[#D4AF37]"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-white/40">
            Microtonal World Music Workstation · 140+ Scales · 13 Realms
          </div>
        </div>
      </footer>
    </div>
  );
};
