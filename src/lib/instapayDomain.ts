export type PlanType = 'pro_monthly' | 'pro_lifetime';
export type SubscriptionPlan = 'free' | PlanType;
export type SubscriptionStatus = 'free' | 'active' | 'expired';
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PublicPricingSettings {
  monthlyPrice: number;
  lifetimePrice: number;
  currency: string;
  renewalReminderDays: number;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface InstapaySettings {
  ipaAddress: string;
  accountHolderName: string;
  transferNumber: string;
  instructions: string;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface UserSubscriptionRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  renewalNoticeDismissed: boolean;
}

export interface PaymentRequestRecord {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  planType: PlanType;
  isRenewal: boolean;
  amount: number;
  currency: string;
  referenceNumber: string;
  referenceKey: string;
  proofImageUrl: string;
  status: PaymentRequestStatus;
  rejectionReason: string;
  reviewedBy: string;
  reviewedByEmail: string;
  reviewedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const MAX_PROOF_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_PROOF_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MONTHLY_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeReferenceKey(referenceNumber: string): string {
  return referenceNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MQ-${suffix}`;
}

export function computeMonthlyExpiryDate(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + MONTHLY_DURATION_MS);
}

export function evaluateSubscriptionState(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  expiresAt: Date | null,
  reminderDays: number = 5,
  now: Date = new Date()
): {
  effectivePlan: SubscriptionPlan;
  effectiveStatus: SubscriptionStatus;
  isPro: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
} {
  if (plan === 'pro_lifetime' && status === 'active') {
    return {
      effectivePlan: 'pro_lifetime',
      effectiveStatus: 'active',
      isPro: true,
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
    };
  }

  if (plan === 'pro_monthly' && status === 'active') {
    if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
      return {
        effectivePlan: 'free',
        effectiveStatus: 'expired',
        isPro: false,
        isExpired: true,
        isExpiringSoon: false,
        daysRemaining: 0,
      };
    }
    const msLeft = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    return {
      effectivePlan: 'pro_monthly',
      effectiveStatus: 'active',
      isPro: true,
      isExpired: false,
      isExpiringSoon: daysRemaining <= Math.max(1, reminderDays),
      daysRemaining,
    };
  }

  return {
    effectivePlan: 'free',
    effectiveStatus: status === 'expired' ? 'expired' : 'free',
    isPro: false,
    isExpired: status === 'expired',
    isExpiringSoon: false,
    daysRemaining: null,
  };
}

export function detectImageMimeFromMagicBytes(buf: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (buf.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function validateProofImageDataUrl(dataUrl: string): {
  ok: true;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  bytes: Uint8Array;
  ext: 'png' | 'jpg' | 'webp';
} | {
  ok: false;
  error: string;
} {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { ok: false, error: 'Missing proof image data.' };
  }
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return {
      ok: false,
      error: 'Unsupported file format. Only PNG, JPG/JPEG, and WebP images are allowed.',
    };
  }
  const declared = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const base64 = match[2];
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes <= 0 || approxBytes > MAX_PROOF_FILE_BYTES) {
    return {
      ok: false,
      error: 'Proof image must be between 1 byte and 2 MB.',
    };
  }

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    return { ok: false, error: 'Corrupted base64 image payload.' };
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  if (bytes.length > MAX_PROOF_FILE_BYTES) {
    return { ok: false, error: 'Proof image exceeds 2 MB limit.' };
  }

  const detected = detectImageMimeFromMagicBytes(bytes);
  if (!detected || detected !== declared) {
    return {
      ok: false,
      error: 'File content does not match declared PNG/JPEG/WebP image signature.',
    };
  }

  const ext = detected === 'image/png' ? 'png' : detected === 'image/jpeg' ? 'jpg' : 'webp';
  return { ok: true, mimeType: detected, bytes, ext };
}
