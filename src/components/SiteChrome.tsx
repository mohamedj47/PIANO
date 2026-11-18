import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Crown,
  LogIn,
  LogOut,
  Piano,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SiteChromeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const SiteChrome: React.FC<SiteChromeProps> = ({ currentPath, onNavigate, children }) => {
  const {
    user,
    authBusy,
    isAdmin,
    subscriptionState,
    profile,
    signInWithGoogle,
    signOutUser,
  } = useAuth();

  const navLinks = [
    { path: '/piano', label: 'Piano Studio' },
    { path: '/guides', label: 'Guides' },
    { path: '/pricing', label: 'Pricing & Upgrade' },
    { path: '/about', label: 'About' },
  ];

  const planLabel =
    subscriptionState.effectivePlan === 'pro_lifetime'
      ? 'Pro Lifetime'
      : subscriptionState.effectivePlan === 'pro_monthly'
      ? 'Pro Monthly'
      : 'Free Plan';

  return (
    <div className="min-h-screen bg-[#050505] text-[#F6F4EE] flex flex-col">
      <header className="sticky top-0 z-40 h-16 bg-[#09090b]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('/piano')}
          className="flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <img src="/logo-dark.webp" alt="MaqAmir" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
          <span className="brand-font text-base sm:text-lg font-extrabold tracking-tight text-white">
            MaqAmir<span className="text-[#D4AF37]">.</span>
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => {
            const active =
              currentPath === link.path || (link.path === '/pricing' && currentPath === '/pro');
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => onNavigate(link.path)}
                className={`text-xs font-bold uppercase tracking-wider transition whitespace-nowrap shrink-0 ${
                  active ? 'text-[#FACC15]' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('/admin/payments')}
                className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  currentPath === '/admin/payments' || currentPath === '/admin'
                    ? 'text-[#FACC15]'
                    : 'text-emerald-300/85 hover:text-emerald-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Payments</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/admin/payment-settings')}
                className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  currentPath === '/admin/payment-settings'
                    ? 'text-[#FACC15]'
                    : 'text-emerald-300/85 hover:text-emerald-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Payment Settings</span>
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/pricing')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-white/90 hover:border-[#D4AF37]/50 whitespace-nowrap"
                title={user.email || ''}
              >
                {subscriptionState.isPro && <Crown className="w-3.5 h-3.5 text-[#FACC15]" />}
                <span className="max-w-[130px] truncate">{profile?.displayName || user.email}</span>
                <span className="text-white/35">·</span>
                <span className={subscriptionState.isPro ? 'text-[#FACC15]' : 'text-white/60'}>
                  {planLabel}
                </span>
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void signOutUser()}
                className="px-2.5 sm:px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[11px] sm:text-xs font-semibold text-white/80 flex items-center gap-1.5 whitespace-nowrap"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/15 border border-white/15 text-[11px] sm:text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('/piano')}
            className="px-2.5 sm:px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Piano className="w-3.5 h-3.5" />
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>
        </div>
      </header>

      {/* Renewal / Expiry Alert Banner */}
      {user && (subscriptionState.isExpiringSoon || subscriptionState.isExpired) && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            {subscriptionState.isExpired ? (
              <span>
                انتهى اشتراك Pro Monthly وتمت إعادة الحساب إلى الخطة المجانية (Free Plan). يمكنك تقديم طلب تجديد يدوي عبر InstaPay في أي وقت.
              </span>
            ) : (
              <span>
                تنبيه: اشتراك Pro Monthly ينتهي خلال{' '}
                <strong className="tabular-nums">{subscriptionState.daysRemaining}</strong> أيام. قدّم طلب تجديد يدوي قبل الانتهاء لاستمرار المزايا.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/pricing')}
            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black font-extrabold text-xs whitespace-nowrap"
          >
            تجديد الاشتراك عبر InstaPay
          </button>
        </div>
      )}

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
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('/admin/payments')}
                className="text-emerald-300/80 hover:text-emerald-200"
              >
                Admin Console
              </button>
            )}
          </div>
          <div className="text-[11px] text-white/40">
            Microtonal World Music Workstation · 199 Scales · 13 Realms
          </div>
        </div>
      </footer>
    </div>
  );
};
