import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Save, Settings, ShieldCheck } from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { AdminGuard } from '../components/admin/AdminGuard';
import { useAuth } from '../context/AuthContext';
import { fetchInstapaySettings, savePaymentSettings } from '../lib/instapayService';

export const AdminPaymentSettingsPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const { user, isAdmin, pricing } = useAuth();
  const [ipaAddress, setIpaAddress] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [lifetimePrice, setLifetimePrice] = useState('');
  const [renewalReminderDays, setRenewalReminderDays] = useState('5');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    fetchInstapaySettings()
      .then((inst) => {
        if (inst) {
          setIpaAddress(inst.ipaAddress);
          setAccountHolderName(inst.accountHolderName);
          setTransferNumber(inst.transferNumber);
          setInstructions(inst.instructions);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'تعذر تحميل إعدادات الدفع.');
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (pricing) {
      setCurrency(pricing.currency || 'EGP');
      setMonthlyPrice(String(pricing.monthlyPrice));
      setLifetimePrice(String(pricing.lifetimePrice));
      setRenewalReminderDays(String(pricing.renewalReminderDays || 5));
    }
  }, [pricing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSavedNotice(false);

    const mPrice = Number(monthlyPrice);
    const lPrice = Number(lifetimePrice);
    const remDays = Number(renewalReminderDays);
    if (!Number.isFinite(mPrice) || mPrice <= 0 || !Number.isFinite(lPrice) || lPrice <= 0) {
      setError('يجب إدخال أسعار صحيحة أكبر من صفر لكل من الباقة الشهرية وباقة مدى الحياة.');
      return;
    }
    if (ipaAddress.trim().length < 3 || accountHolderName.trim().length < 2 || transferNumber.trim().length < 3) {
      setError('يرجى استكمال عنوان InstaPay (IPA) واسم صاحب الحساب ورقم التحويل.');
      return;
    }

    setSaving(true);
    try {
      await savePaymentSettings({
        adminUid: user.uid,
        adminEmail: user.email || '',
        monthlyPrice: mPrice,
        lifetimePrice: lPrice,
        currency: currency.trim() || 'EGP',
        renewalReminderDays: Number.isFinite(remDays) ? remDays : 5,
        ipaAddress,
        accountHolderName,
        transferNumber,
        instructions,
      });
      setSavedNotice(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ إعدادات الدفع.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard currentPath="/admin/payment-settings" onNavigate={onNavigate}>
      <SiteChrome currentPath="/admin/payment-settings" onNavigate={onNavigate}>
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Admin Console · Payment Settings
              </div>
              <h1 className="brand-font text-2xl sm:text-3xl font-black text-white mt-1">
                إعدادات InstaPay والأسعار
              </h1>
              <p className="text-xs text-white/60 mt-1">
                يتم حفظ جميع بيانات التحويل وأسعار الباقات في Firestore ولا توجد أي قيم ثابتة في الواجهة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/payments')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Payment Requests</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-[#0e0e13] border border-white/10 p-10 flex items-center justify-center gap-2 text-xs text-white/60">
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <span>جاري تحميل الإعدادات...</span>
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-[#FACC15] border-b border-white/10 pb-2">
                  بيانات حساب InstaPay
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">InstaPay Payment Address (IPA) *</span>
                    <input
                      type="text"
                      required
                      value={ipaAddress}
                      onChange={(e) => setIpaAddress(e.target.value)}
                      placeholder="username@instapay"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">اسم صاحب الحساب *</span>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="الاسم كما يظهر في InstaPay"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">رقم التحويل أو بيانات الحساب *</span>
                    <input
                      type="text"
                      required
                      value={transferNumber}
                      onChange={(e) => setTransferNumber(e.target.value)}
                      placeholder="010XXXXXXXX أو رقم الحساب"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">العملة (Currency) *</span>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="EGP"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </label>
                </div>

                <label className="space-y-1.5 block text-xs">
                  <span className="font-bold text-white/80">تعليمات التحويل للمستخدم</span>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="اكتب تعليمات التحويل الواضحة للمستخدم (مثل: قم بالتحويل ثم أرفق الرقم المرجعي وصورة الإيصال)..."
                    className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-[#FACC15] border-b border-white/10 pb-2">
                  أسعار الباقات وإعدادات التجديد
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">سعر Pro Monthly (30 يوم) *</span>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">سعر Pro Lifetime (دائم) *</span>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      value={lifetimePrice}
                      onChange={(e) => setLifetimePrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="font-bold text-white/80">التنبيه قبل الانتهاء (أيام) *</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={renewalReminderDays}
                      onChange={(e) => setRenewalReminderDays(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/40 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}
              {savedNotice && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم حفظ إعدادات InstaPay وأسعار الباقات في Firestore وتسجيل العملية في Audit Log.</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] disabled:opacity-60 text-black text-xs font-extrabold flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ Payment Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </SiteChrome>
    </AdminGuard>
  );
};
