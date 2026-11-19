import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { Timestamp, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import {
  PaymentRequestRecord,
  PublicPricingSettings,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscriptionRecord,
  evaluateSubscriptionState,
} from '../lib/instapayDomain';
import {
  dismissRenewalNotice,
  downgradeExpiredSubscription,
  subscribePublicPricing,
  subscribeUserPaymentRequests,
} from '../lib/instapayService';
import { trackEvent } from '../lib/analytics';

interface EffectiveSubscriptionState {
  effectivePlan: SubscriptionPlan;
  effectiveStatus: SubscriptionStatus;
  isPro: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  profile: UserSubscriptionRecord | null;
  isAdmin: boolean;
  pricing: PublicPricingSettings | null;
  pricingLoaded: boolean;
  subscriptionState: EffectiveSubscriptionState;
  userRequests: PaymentRequestRecord[];
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string>;
  dismissNotice: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toDateOrNull(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserSubscriptionRecord | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [pricing, setPricing] = useState<PublicPricingSettings | null>(null);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [userRequests, setUserRequests] = useState<PaymentRequestRecord[]>([]);

  // Subscribe to public admin-configured pricing
  useEffect(() => {
    const unsub = subscribePublicPricing(
      (data) => {
        setPricing(data);
        setPricingLoaded(true);
      },
      () => {
        setPricingLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Firebase Auth state & ensure user profile document exists
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setHasAdminDoc(false);
        setUserRequests([]);
        setAuthReady(true);
        return;
      }

      const userPath = `users/${fbUser.uid}`;
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists() && fbUser.emailVerified) {
          await setDoc(userRef, {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: (fbUser.displayName || fbUser.email || 'Studio Musician').slice(0, 120),
            role: 'user',
            subscriptionPlan: 'free',
            subscriptionStatus: 'free',
            subscriptionStartedAt: null,
            subscriptionExpiresAt: null,
            renewalNoticeDismissed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        } catch (wrapped) {
          setAuthError(wrapped instanceof Error ? wrapped.message : String(wrapped));
        }
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to signed-in user's profile, admin record, and own payment requests
  useEffect(() => {
    if (!authReady || !user) return;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          return;
        }
        const d = snap.data();
        const rec: UserSubscriptionRecord = {
          uid: String(d.uid || user.uid),
          email: String(d.email || user.email || ''),
          displayName: String(d.displayName || user.displayName || ''),
          role: d.role === 'admin' ? 'admin' : 'user',
          subscriptionPlan: (d.subscriptionPlan || 'free') as SubscriptionPlan,
          subscriptionStatus: (d.subscriptionStatus || 'free') as SubscriptionStatus,
          subscriptionStartedAt: toDateOrNull(d.subscriptionStartedAt),
          subscriptionExpiresAt: toDateOrNull(d.subscriptionExpiresAt),
          renewalNoticeDismissed: Boolean(d.renewalNoticeDismissed),
        };
        setProfile(rec);

        if (
          (rec.subscriptionPlan === 'pro_monthly' || rec.subscriptionPlan === 'pro_lifetime') &&
          rec.subscriptionStatus === 'active'
        ) {
          trackEvent(
            'subscription_activated',
            { plan: rec.subscriptionPlan },
            { oncePerSessionKey: `sub_active:${rec.subscriptionPlan}` }
          );
        }

        // Automatically downgrade expired monthly subscriptions in Firestore
        if (
          rec.subscriptionPlan === 'pro_monthly' &&
          rec.subscriptionStatus === 'active' &&
          rec.subscriptionExpiresAt &&
          rec.subscriptionExpiresAt.getTime() <= Date.now()
        ) {
          void downgradeExpiredSubscription(user.uid, rec.email || user.email || '').catch(() => {});
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        } catch {
          // ignore surface crash on transient listener teardown
        }
      }
    );

    const unsubAdmin = onSnapshot(
      doc(db, 'admins', user.uid),
      (snap) => {
        setHasAdminDoc(snap.exists());
      },
      () => {
        setHasAdminDoc(false);
      }
    );

    const unsubReqs = subscribeUserPaymentRequests(
      user.uid,
      (rows) => setUserRequests(rows),
      () => setUserRequests([])
    );

    return () => {
      unsubProfile();
      unsubAdmin();
      unsubReqs();
    };
  }, [authReady, user]);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    const isBootstrap = (user.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    return isBootstrap || hasAdminDoc;
  }, [user, hasAdminDoc]);

  const subscriptionState = useMemo(() => {
    if (!profile) {
      return evaluateSubscriptionState('free', 'free', null, pricing?.renewalReminderDays || 5);
    }
    return evaluateSubscriptionState(
      profile.subscriptionPlan,
      profile.subscriptionStatus,
      profile.subscriptionExpiresAt,
      pricing?.renewalReminderDays || 5
    );
  }, [profile, pricing]);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    trackEvent('signup_started', { provider: 'google' });
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        trackEvent('signup_completed', { provider: 'google' });
      }
      return cred.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
      return null;
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setProfile(null);
      setHasAdminDoc(false);
      setUserRequests([]);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('يرجى تسجيل الدخول أولاً.');
    }
    return auth.currentUser.getIdToken();
  }, []);

  const dismissNotice = useCallback(async () => {
    if (!user) return;
    await dismissRenewalNotice(user.uid);
  }, [user]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        profile,
        isAdmin,
        pricing,
        pricingLoaded,
        subscriptionState,
        userRequests,
        signInWithGoogle,
        signOutUser,
        getIdToken,
        dismissNotice,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
