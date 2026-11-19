declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventName =
  | 'page_view'
  | 'studio_open'
  | 'piano_interaction'
  | 'instrument_selected'
  | 'lesson_view'
  | 'share_clicked'
  | 'signup_started'
  | 'signup_completed'
  | 'pricing_view'
  | 'checkout_started'
  | 'payment_submitted'
  | 'subscription_activated';

const CONSENT_STORAGE_KEY = 'maqamir_consent';
const BLOCKED_PII_KEYS = new Set([
  'email',
  'useremail',
  'uid',
  'token',
  'idtoken',
  'referencenumber',
  'proofimageurl',
  'ipaaddress',
  'transfernumber',
  'phone',
  'password',
]);

let gaMeasurementId: string | null =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_GA4_MEASUREMENT_ID?.trim() ||
  null;
let gaScriptLoaded = false;
let gaBootstrapped = false;
const sessionDedupSet = new Set<string>();
let lastPagePath: string | null = null;
let lastPianoInteractionAt = 0;

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(decision: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    // storage disabled
  }
  if (decision === 'accepted') {
    void initAnalytics();
  }
}

export function getConsentDecision(): 'accepted' | 'declined' | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'accepted' || val === 'declined') return val;
    return null;
  } catch {
    return null;
  }
}

function sanitizeParams(raw?: Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> {
  if (!raw) return {};
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null) continue;
    const lowered = k.toLowerCase();
    if (BLOCKED_PII_KEYS.has(lowered)) continue;
    clean[k] = typeof v === 'string' ? v.slice(0, 140) : v;
  }
  return clean;
}

function injectGaScript(measurementId: string): void {
  if (typeof document === 'undefined' || gaScriptLoaded) return;
  if (!/^G-[A-Z0-9]+$/i.test(measurementId)) return;

  gaScriptLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export async function initAnalytics(): Promise<void> {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  if (!gaMeasurementId && !gaBootstrapped) {
    gaBootstrapped = true;
    try {
      const resp = await fetch('/api/analytics-config');
      if (resp.ok) {
        const data = (await resp.json()) as { ga4MeasurementId?: string | null };
        if (data?.ga4MeasurementId && /^G-[A-Z0-9]+$/i.test(data.ga4MeasurementId)) {
          gaMeasurementId = data.ga4MeasurementId;
        }
      }
    } catch {
      // safe no-op when analytics config endpoint is unavailable
    }
  }

  if (gaMeasurementId) {
    injectGaScript(gaMeasurementId);
  }
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params?: Record<string, string | number | boolean | undefined>,
  options?: { oncePerSessionKey?: string }
): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  if (options?.oncePerSessionKey) {
    if (sessionDedupSet.has(options.oncePerSessionKey)) return;
    sessionDedupSet.add(options.oncePerSessionKey);
  }

  // Throttle high-frequency note strikes so audio synthesis stays zero-overhead
  if (eventName === 'piano_interaction') {
    const now = Date.now();
    if (now - lastPianoInteractionAt < 15000) return;
    lastPianoInteractionAt = now;
  }

  if (gaMeasurementId && !gaScriptLoaded) {
    injectGaScript(gaMeasurementId);
  }

  const safe = sanitizeParams(params);
  if (typeof window.gtag === 'function' && gaMeasurementId) {
    window.gtag('event', eventName, safe);
  }
}

export function trackPageView(pathname: string, title?: string): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  if (pathname.startsWith('/admin')) return;
  if (lastPagePath === pathname) return;
  lastPagePath = pathname;

  void initAnalytics().then(() => {
    trackEvent('page_view', {
      page_path: pathname,
      page_title: title || document.title,
    });
  });
}
