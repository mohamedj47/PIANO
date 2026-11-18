import React from 'react';
import { Loader2, LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SiteChrome } from '../SiteChrome';

export const AdminGuard: React.FC<{
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}> = ({ currentPath, onNavigate, children }) => {
  const { user, authReady, authBusy, isAdmin, signInWithGoogle } = useAuth();

  if (!authReady) {
    return (
      <SiteChrome currentPath={currentPath} onNavigate={onNavigate}>
        <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center gap-2 text-xs text-white/60">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>جاري التحقق من صلاحيات الإدارة...</span>
        </div>
      </SiteChrome>
    );
  }

  if (!user) {
    return (
      <SiteChrome currentPath={currentPath} onNavigate={onNavigate}>
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="rounded-2xl bg-[#0e0e13] border border-white/10 p-8 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-[#D4AF37] mx-auto" />
            <h1 className="text-xl font-black text-white">تسجيل دخول المسؤول مطلوب</h1>
            <p className="text-xs text-white/65">
              هذه الصفحة مخصصة لإدارة مدفوعات InstaPay وإعدادات الباقات. يرجى تسجيل الدخول بحساب المسؤول.
            </p>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </SiteChrome>
    );
  }

  if (!isAdmin) {
    return (
      <SiteChrome currentPath={currentPath} onNavigate={onNavigate}>
        <div className="max-w-lg mx-auto px-4 py-20">
          <div
            data-testid="admin-forbidden"
            className="rounded-2xl bg-[#0e0e13] border border-red-500/40 p-8 text-center space-y-4"
          >
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h1 className="text-xl font-black text-white">403 · غير مصرح لك بالوصول</h1>
            <p className="text-xs text-white/70 leading-relaxed">
              الحساب الحالي (<span className="font-mono text-white">{user.email}</span>) لا يملك صلاحية مسؤول الإدارة. الوصول محمي عبر قواعد Firestore الأمنية.
            </p>
            <div className="text-[11px] text-white/45 font-mono break-all">
              UID: {user.uid}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/pricing')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              العودة إلى صفحة الباقات
            </button>
          </div>
        </div>
      </SiteChrome>
    );
  }

  return <>{children}</>;
};
