import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Crown,
  Eye,
  Infinity as InfinityIcon,
  LogIn,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { useAuth } from '../context/AuthContext';
import { PlanType } from '../lib/instapayDomain';
import { InstapayCheckoutModal } from '../components/billing/InstapayCheckoutModal';
import { AuthenticatedProofImage } from '../components/billing/AuthenticatedProofImage';
import { trackEvent } from '../lib/analytics';

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const PricingPage: React.FC<{ onNavigate: (path: string) => void; routePath?: string }> = ({
  onNavigate,
  routePath = '/pricing',
}) => {
  const {
    user,
    authReady,
    authBusy,
    profile,
    isAdmin,
    pricing,
    pricingLoaded,
    subscriptionState,
    userRequests,
    signInWithGoogle,
  } = useAuth();

  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);
  const [checkoutRenewal, setCheckoutRenewal] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<string | null>(null);
  const [previewProof, setPreviewProof] = useState<{ url: string; requestId: string } | null>(null);

  useEffect(() => {
    trackEvent('pricing_view', { path: routePath }, { oncePerSessionKey: `pricing:${routePath}` });
  }, [routePath]);

  const openCheckout = (plan: PlanType, isRenewal = false) => {
    trackEvent('checkout_started', { plan_type: plan, is_renewal: isRenewal });
    setSubmittedOrder(null);
    setCheckoutPlan(plan);
    setCheckoutRenewal(isRenewal);
  };

  const currentPlanTitle =
    subscriptionState.effectivePlan === 'pro_lifetime'
      ? 'Pro Lifetime (دائم)'
      : subscriptionState.effectivePlan === 'pro_monthly'
      ? 'Pro Monthly (30 يوم)'
      : 'Free Plan';

  const canRenewMonthly =
    subscriptionState.effectivePlan === 'pro_monthly' || subscriptionState.isExpired;

  return (
    <SiteChrome currentPath={routePath} onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Pricing &amp; Upgrade · InstaPay Manual Checkout
            </div>
            <h1 className="brand-font text-3xl sm:text-5xl font-black text-white">
              باقات MaqAmir Piano Studio
            </h1>
            <p className="text-sm text-white/65 leading-relaxed">
              استمتع بجميع المقامات والآلات والـ 13 عالمًا موسيقيًا مجانًا، أو قم بالترقية إلى Pro Monthly أو Pro Lifetime عبر التحويل اليدوي InstaPay مع مراجعة وتفعيل آمن من الإدارة.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/admin/payments')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/25 text-xs font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Payment Requests</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/admin/payment-settings')}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white hover:border-[#D4AF37]/50 text-xs font-bold flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-[#D4AF37]" />
                <span>Payment Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Pending submission banner */}
        {submittedOrder && (
          <div className="rounded-2xl bg-amber-500/10 border border-[#D4AF37]/60 p-4 flex items-start gap-3 text-xs text-amber-100">
            <Clock className="w-5 h-5 text-[#FACC15] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-sm text-white">
                تم استلام طلب الدفع (<span className="font-mono">{submittedOrder}</span>) — قيد المراجعة
              </div>
              <p className="text-white/75">
                حالة طلبك الآن <strong>Pending</strong>. لن يتم تفعيل اشتراك Pro تلقائيًا قبل مراجعة الإدارة لوصول المبلغ فعليًا إلى الحساب.
              </p>
            </div>
          </div>
        )}

        {/* Current Subscription Status Card */}
        <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6">
          {!authReady ? (
            <div className="text-xs text-white/60">جاري التحقق من حالة الحساب...</div>
          ) : !user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-white">حالة الاشتراك الحالية</h2>
                <p className="text-xs text-white/65">
                  سجّل الدخول بحساب Google لعرض باقتك الحالية، تاريخ الانتهاء، وإرسال طلب ترقية عبر InstaPay.
                </p>
              </div>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void signInWithGoogle()}
                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-2 shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-center">
              <div className="lg:col-span-2 space-y-1.5">
                <div className="text-xs text-white/50">
                  الحساب: <span className="text-white/85 font-semibold">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Crown
                    className={`w-5 h-5 ${
                      subscriptionState.isPro ? 'text-[#FACC15]' : 'text-white/35'
                    }`}
                  />
                  <h2 className="text-xl font-black text-white">{currentPlanTitle}</h2>
                </div>
                <div className="text-xs text-white/65">
                  {subscriptionState.effectivePlan === 'pro_lifetime'
                    ? 'اشتراك دائم (Lifetime) — مفعل بشكل دائم بدون تاريخ انتهاء.'
                    : subscriptionState.effectivePlan === 'pro_monthly'
                    ? `نشط حاليًا · متبقي ${subscriptionState.daysRemaining} يوم.`
                    : subscriptionState.isExpired
                    ? 'انتهى اشتراك Pro Monthly وعاد الحساب إلى النسخة المجانية.'
                    : 'أنت تستخدم النسخة المجانية (Community Free).'}
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-white/50">تاريخ التفعيل</div>
                <div className="font-mono font-bold text-white tabular-nums">
                  {formatDate(profile?.subscriptionStartedAt || null)}
                </div>
                <div className="text-white/50 pt-1">تاريخ الانتهاء</div>
                <div className="font-mono font-bold text-[#FACC15] tabular-nums">
                  {subscriptionState.effectivePlan === 'pro_lifetime'
                    ? 'دائم (لا ينتهي)'
                    : formatDate(profile?.subscriptionExpiresAt || null)}
                </div>
              </div>

              <div className="flex flex-wrap lg:justify-end gap-2">
                {canRenewMonthly && pricing && (
                  <button
                    type="button"
                    onClick={() => openCheckout('pro_monthly', true)}
                    className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تقديم طلب تجديد يدوي</span>
                  </button>
                )}
                {subscriptionState.isExpiringSoon && (
                  <div className="w-full lg:text-right text-[11px] text-amber-300 flex items-center lg:justify-end gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>الاشتراك على وشك الانتهاء</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Unconfigured pricing notice */}
        {pricingLoaded && !pricing && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/35 p-5 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-100">
            <div className="space-y-1">
              <div className="font-extrabold text-sm text-amber-200">
                لم يتم ضبط الأسعار وبيانات InstaPay بعد
              </div>
              <p className="text-amber-100/75">
                الأسعار غير ثابتة في الكود ويتم تحديدها حصريًا من لوحة Payment Settings بواسطة مسؤول الإدارة.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('/admin/payment-settings')}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-extrabold"
              >
                إعداد الأسعار وبيانات InstaPay الآن
              </button>
            )}
          </div>
        )}

        {/* 3 Plans Grid: Free Plan, Pro Monthly, Pro Lifetime */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Free Plan */}
          <div className="p-6 rounded-2xl bg-[#0e0e13] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-white/55">
                Free Plan · للجميع
              </div>
              <div className="text-3xl font-black text-white tabular-nums">
                0 <span className="text-xs font-normal text-white/50">/ مجاني دائمًا</span>
              </div>
              <ul className="space-y-2.5 text-xs text-white/75">
                {[
                  '199 عالم ومقام موسيقي ميكروتونال',
                  '8 آلات موسيقية + 44 مظهر بيانو',
                  'جميع الـ 13 عالمًا تفاعليًا و DJ Matrix',
                  '52 منزلق معالجة صوتية Sonic Engine',
                  'تصدير WAV & MIDI + دعم Web MIDI',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/piano')}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              تشغيل الاستوديو مجانًا
            </button>
          </div>

          {/* 2. Pro Monthly */}
          <div className="p-6 rounded-2xl bg-[#131217] border border-[#D4AF37]/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#FACC15]">
                  Pro Monthly
                </span>
                <span className="text-[11px] font-semibold text-white/65">30 يومًا من الموافقة</span>
              </div>
              <div className="text-3xl font-black text-white tabular-nums">
                {pricing ? (
                  <>
                    {pricing.monthlyPrice}{' '}
                    <span className="text-sm font-bold text-[#FACC15]">{pricing.currency}</span>
                    <span className="text-xs font-normal text-white/55"> / 30 يومًا</span>
                  </>
                ) : (
                  <span className="text-base font-bold text-white/50">بانتظار ضبط السعر من الإدارة</span>
                )}
              </div>
              <ul className="space-y-2.5 text-xs text-white/85">
                {[
                  'كل مزايا Free Plan مشمولة بالكامل',
                  'صلاحية Ask Amir AI الذكية لبناء الأصوات والمقامات',
                  'بنك إعدادات مخصصة غير محدود + حفظ الأنماط',
                  'إشعار مبكر قبل انتهاء الـ 30 يومًا وتجديد يدوي مرن',
                  'تفعيل رسمي بعد مراجعة تحويل InstaPay',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FACC15] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              disabled={!pricing || subscriptionState.effectivePlan === 'pro_lifetime'}
              onClick={() =>
                openCheckout(
                  'pro_monthly',
                  subscriptionState.effectivePlan === 'pro_monthly' || subscriptionState.isExpired
                )
              }
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] disabled:opacity-45 text-black text-xs font-extrabold transition"
            >
              {subscriptionState.effectivePlan === 'pro_lifetime'
                ? 'لديك اشتراك Lifetime دائم'
                : subscriptionState.effectivePlan === 'pro_monthly'
                ? 'طلب تجديد شهري عبر InstaPay'
                : 'ترقية إلى Pro Monthly عبر InstaPay'}
            </button>
          </div>

          {/* 3. Pro Lifetime */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1e190b] to-[#0e0e13] border border-[#D4AF37] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#FACC15] flex items-center gap-1.5">
                  <InfinityIcon className="w-4 h-4" />
                  <span>Pro Lifetime</span>
                </span>
                <span className="text-[11px] font-bold text-[#FACC15]">دائم · دفعة واحدة</span>
              </div>
              <div className="text-3xl font-black text-white tabular-nums">
                {pricing ? (
                  <>
                    {pricing.lifetimePrice}{' '}
                    <span className="text-sm font-bold text-[#FACC15]">{pricing.currency}</span>
                    <span className="text-xs font-normal text-white/55"> / لمرة واحدة</span>
                  </>
                ) : (
                  <span className="text-base font-bold text-white/50">بانتظار ضبط السعر من الإدارة</span>
                )}
              </div>
              <ul className="space-y-2.5 text-xs text-white/85">
                {[
                  'شراء لمرة واحدة — تفعيل دائم لا ينتهي أبدًا',
                  'جميع مزايا Pro الحالية والتحديثات القادمة',
                  'أولوية توليد الباتشات الصوتية via Ask Amir AI',
                  'وصول مبكر لحزم الـ K-EDO والراجا الجديدة',
                  'تفعيل دائم بعد تأكيد استلام التحويل عبر InstaPay',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#FACC15] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              disabled={!pricing || subscriptionState.effectivePlan === 'pro_lifetime'}
              onClick={() => openCheckout('pro_lifetime', false)}
              className="w-full py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#fde047] disabled:opacity-45 text-black text-xs font-extrabold transition"
            >
              {subscriptionState.effectivePlan === 'pro_lifetime'
                ? 'مفعل بالفعل (Lifetime Active)'
                : 'شراء Pro Lifetime عبر InstaPay'}
            </button>
          </div>
        </section>

        {/* Free vs Pro Comparison Table */}
        <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-white">
              Free vs. Pro Feature Breakdown · مقارنة المزايا
            </h2>
            <span className="text-[11px] text-white/50">
              All core playing, scales, realms &amp; WAV/MIDI exports stay free
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/55">
                  <th className="py-2.5 pr-4">Capability</th>
                  <th className="py-2.5 px-3">Free Studio</th>
                  <th className="py-2.5 px-3 text-[#FACC15]">Pro Monthly (30d)</th>
                  <th className="py-2.5 pl-3 text-[#FACC15]">Pro Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {[
                  ['8 Web Audio Instruments & 44 Keybed Skins', 'Included', 'Included', 'Included'],
                  ['140+ World Scales, Maqam (-50¢), Ragas & K-EDO', 'Included', 'Included', 'Included'],
                  ['13 Interactive Realms & DJ Performance Matrix', 'Included', 'Included', 'Included'],
                  ['52-Parameter Sonic Engine & WAV/MIDI Export', 'Included', 'Included', 'Included'],
                  ['Ask Amir AI Producer Sound & Maqam Architect', '—', 'Included', 'Included'],
                  ['Unlimited Custom Preset Banks & Early Updates', '—', 'Included', 'Permanent'],
                ].map(([label, freeCol, monCol, lifeCol]) => (
                  <tr key={label}>
                    <td className="py-2.5 pr-4 font-medium text-white">{label}</td>
                    <td className="py-2.5 px-3 text-white/65">{freeCol}</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-semibold">{monCol}</td>
                    <td className="py-2.5 pl-3 text-[#FACC15] font-semibold">{lifeCol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* User Payment Requests History */}
        {user && (
          <section className="rounded-2xl bg-[#0e0e13] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">طلبات الدفع الخاصة بك</h2>
              <span className="text-xs text-white/50 tabular-nums">{userRequests.length} طلبات</span>
            </div>
            {userRequests.length === 0 ? (
              <p className="text-xs text-white/55">
                لم تقم بتقديم أي طلب دفع عبر InstaPay بعد. اختر الباقة المناسبة أعلاه للبدء.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="py-2 pr-4">Order #</th>
                      <th className="py-2 pr-4">Plan</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Reference #</th>
                      <th className="py-2 pr-4">Receipt</th>
                      <th className="py-2 pr-4">Submitted</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userRequests.map((req) => (
                      <tr key={req.id} className="text-white/85">
                        <td className="py-2.5 pr-4 font-mono tabular-nums">{req.orderNumber}</td>
                        <td className="py-2.5 pr-4">
                          {req.planType === 'pro_lifetime' ? 'Pro Lifetime' : 'Pro Monthly'}
                          {req.isRenewal ? ' (Renewal)' : ''}
                        </td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">
                          {req.amount} {req.currency}
                        </td>
                        <td className="py-2.5 pr-4 font-mono">{req.referenceNumber}</td>
                        <td className="py-2.5 pr-4">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewProof({ url: req.proofImageUrl, requestId: req.id })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[11px]"
                          >
                            <Eye className="w-3 h-3 text-[#D4AF37]" />
                            <span>View</span>
                          </button>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-white/60">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="py-2.5">
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <Check className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                              <Clock className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                              {req.rejectionReason ? ` — ${req.rejectionReason}` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <InstapayCheckoutModal
        open={Boolean(checkoutPlan)}
        planType={checkoutPlan || 'pro_monthly'}
        isRenewal={checkoutRenewal}
        pricing={pricing}
        onClose={() => setCheckoutPlan(null)}
        onSuccess={(orderNum) => {
          setCheckoutPlan(null);
          setSubmittedOrder(orderNum);
        }}
      />

      {previewProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90"
          onClick={() => setPreviewProof(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-2xl bg-[#0e0e13] border border-[#D4AF37]/40 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewProof(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-black/80 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthenticatedProofImage
              proofImageUrl={previewProof.url}
              requestId={previewProof.requestId}
            />
          </div>
        </div>
      )}
    </SiteChrome>
  );
};
