import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ImagePlus,
  Loader2,
  LogIn,
  ShieldAlert,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  InstapaySettings,
  MAX_PROOF_FILE_BYTES,
  PlanType,
  PublicPricingSettings,
  generateOrderNumber,
} from '../../lib/instapayDomain';
import {
  fetchInstapaySettings,
  submitPaymentRequest,
  uploadProofImage,
} from '../../lib/instapayService';

interface InstapayCheckoutModalProps {
  open: boolean;
  planType: PlanType;
  isRenewal: boolean;
  pricing: PublicPricingSettings | null;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

export const InstapayCheckoutModal: React.FC<InstapayCheckoutModalProps> = ({
  open,
  planType,
  isRenewal,
  pricing,
  onClose,
  onSuccess,
}) => {
  const { user, profile, getIdToken, signInWithGoogle, authBusy } = useAuth();
  const [instapay, setInstapay] = useState<InstapaySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [previewOrderNumber, setPreviewOrderNumber] = useState(() => generateOrderNumber());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofDataUrl, setProofDataUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPreviewOrderNumber(generateOrderNumber());
    setReferenceNumber('');
    setProofDataUrl('');
    setProofFileName('');
    setSubmitError(null);
    setSettingsError(null);

    if (!user) {
      setInstapay(null);
      return;
    }

    setLoadingSettings(true);
    fetchInstapaySettings()
      .then((data) => setInstapay(data))
      .catch((err) => {
        setSettingsError(err instanceof Error ? err.message : 'تعذر تحميل بيانات التحويل.');
      })
      .finally(() => setLoadingSettings(false));
  }, [open, user]);

  if (!open) return null;

  const amount =
    pricing && (planType === 'pro_monthly' ? pricing.monthlyPrice : pricing.lifetimePrice);

  const copyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setSubmitError('نوع الملف غير مدعوم. يرجى رفع صورة PNG أو JPG أو WebP فقط.');
      return;
    }
    if (file.size > MAX_PROOF_FILE_BYTES) {
      setSubmitError('حجم الصورة يجب ألا يتجاوز 2 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofDataUrl(reader.result);
        setProofFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pricing || !amount || !instapay) return;
    setSubmitError(null);

    const refClean = referenceNumber.trim();
    if (refClean.length < 4) {
      setSubmitError('يرجى إدخال رقم العملية المرجعي للتحويل (4 أحرف/أرقام على الأقل).');
      return;
    }
    if (!proofDataUrl) {
      setSubmitError('يرجى رفع صورة إثبات التحويل قبل إرسال الطلب.');
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      const uploadedUrl = await uploadProofImage(idToken, proofDataUrl);
      const res = await submitPaymentRequest({
        uid: user.uid,
        userName: profile?.displayName || user.displayName || user.email || 'User',
        userEmail: user.email || '',
        planType,
        isRenewal,
        amount,
        currency: pricing.currency,
        referenceNumber: refClean,
        proofImageUrl: uploadedUrl,
        orderNumber: previewOrderNumber,
      });
      onSuccess(res.orderNumber);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'فشل إرسال طلب الدفع.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e0e13] border border-[#D4AF37]/40 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {isRenewal ? 'تجديد اشتراك Pro عبر InstaPay' : 'الدفع اليدوي عبر InstaPay'}
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {planType === 'pro_monthly'
                ? 'Pro Monthly — 30 يومًا من تاريخ موافقة الإدارة'
                : 'Pro Lifetime — شراء لمرة واحدة وتفعيل دائم'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!user ? (
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-5 text-center space-y-3">
              <p className="text-sm text-white/80">
                يجب تسجيل الدخول بحساب Google أولاً لربط الطلب بحسابك وتفعيل Pro بعد مراجعة الإدارة.
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
          ) : loadingSettings ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-white/60">
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <span>جاري تحميل بيانات التحويل...</span>
            </div>
          ) : settingsError || !pricing || !instapay ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="space-y-1">
                <div className="font-bold">بيانات الدفع غير مكتملة بعد</div>
                <p className="text-amber-100/80">
                  {settingsError || 'لم يقم المسؤول بإعداد بيانات InstaPay والأسعار من لوحة Payment Settings بعد.'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order Summary & Locked Price */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#15151c] border border-white/10 p-3.5 text-xs">
                <div>
                  <div className="text-white/50">رقم الطلب الفريد (Order Reference)</div>
                  <div className="font-mono font-bold text-white mt-0.5 tabular-nums">
                    {previewOrderNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/50">المبلغ المطلوب تحويله</div>
                  <div className="text-base font-black text-[#FACC15] mt-0.5 tabular-nums">
                    {amount} {pricing.currency}
                  </div>
                </div>
              </div>

              {/* Dynamic InstaPay Transfer Details (from Firestore) */}
              <div className="rounded-xl bg-[#121218] border border-[#D4AF37]/30 p-4 space-y-3 text-xs">
                <div className="font-bold text-[#FACC15]">بيانات التحويل عبر InstaPay</div>

                <div className="flex items-center justify-between gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/5">
                  <div>
                    <span className="text-white/50 block">InstaPay Address (IPA)</span>
                    <span className="font-mono font-bold text-white">{instapay.ipaAddress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyValue('ipa', instapay.ipaAddress)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold flex items-center gap-1"
                  >
                    {copiedKey === 'ipa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'ipa' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-white/50 block">اسم صاحب الحساب</span>
                    <span className="font-bold text-white">{instapay.accountHolderName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/5">
                    <div>
                      <span className="text-white/50 block">رقم التحويل</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        {instapay.transferNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyValue('num', instapay.transferNumber)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px]"
                    >
                      {copiedKey === 'num' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {instapay.instructions && (
                  <div className="text-white/75 leading-relaxed bg-black/30 rounded-lg p-2.5 border border-white/5 whitespace-pre-line">
                    {instapay.instructions}
                  </div>
                )}
              </div>

              {/* Reference Number Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/85">
                  رقم العملية المرجعي للتحويل (InstaPay Reference Number) *
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={80}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="مثال: IPN-94827165"
                  className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                />
              </div>

              {/* Proof Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/85">
                  صورة إثبات التحويل (PNG, JPG, WebP · بحد أقصى 2MB) *
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 hover:border-[#D4AF37]/60 bg-black/40 p-4 cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {proofDataUrl ? (
                    <div className="w-full space-y-2 text-center">
                      <img
                        src={proofDataUrl}
                        alt="Transfer proof preview"
                        className="max-h-40 mx-auto rounded-lg border border-white/10 object-contain"
                      />
                      <div className="text-[11px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{proofFileName} (اضغط لتغيير الصورة)</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-[#D4AF37]" />
                      <span className="text-xs text-white/70">اضغط لرفع صورة إيصال InstaPay</span>
                    </>
                  )}
                </label>
              </div>

              {submitError && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/40 px-3.5 py-2.5 text-xs text-red-200">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-white/50">
                  يُحفظ الطلب بحالة Pending ولا يتم تفعيل Pro إلا بعد مراجعة الإدارة ومطابقة المبلغ.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] disabled:opacity-60 text-black text-xs font-extrabold whitespace-nowrap flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'جاري الإرسال...' : 'إرسال طلب الدفع للمراجعة'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
