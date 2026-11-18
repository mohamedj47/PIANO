import {
  Timestamp,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  InstapaySettings,
  PaymentRequestRecord,
  PlanType,
  PublicPricingSettings,
  UserSubscriptionRecord,
  computeMonthlyExpiryDate,
  generateOrderNumber,
  normalizeReferenceKey,
} from './instapayDomain';

export interface AuditLogRecord {
  id: string;
  action: 'approved' | 'rejected' | 'settings_updated' | 'admin_granted' | 'admin_revoked';
  requestId: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  planType: string;
  amount: number;
  currency: string;
  referenceNumber: string;
  adminUid: string;
  adminEmail: string;
  note: string;
  createdAt: Date | null;
}

export interface AdminRoleRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt: Date | null;
}

function toDateOrNull(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

function mapPaymentRequest(id: string, d: Record<string, unknown>): PaymentRequestRecord {
  return {
    id,
    orderNumber: String(d.orderNumber || ''),
    userId: String(d.userId || ''),
    userName: String(d.userName || ''),
    userEmail: String(d.userEmail || ''),
    planType: (d.planType === 'pro_lifetime' ? 'pro_lifetime' : 'pro_monthly') as PlanType,
    isRenewal: Boolean(d.isRenewal),
    amount: Number(d.amount || 0),
    currency: String(d.currency || ''),
    referenceNumber: String(d.referenceNumber || ''),
    referenceKey: String(d.referenceKey || ''),
    proofImageUrl: String(d.proofImageUrl || ''),
    status: (d.status === 'approved' || d.status === 'rejected' ? d.status : 'pending'),
    rejectionReason: String(d.rejectionReason || ''),
    reviewedBy: String(d.reviewedBy || ''),
    reviewedByEmail: String(d.reviewedByEmail || ''),
    reviewedAt: toDateOrNull(d.reviewedAt),
    createdAt: toDateOrNull(d.createdAt),
    updatedAt: toDateOrNull(d.updatedAt),
  };
}

export function subscribePublicPricing(
  onData: (pricing: PublicPricingSettings | null) => void,
  onError?: (err: Error) => void
) {
  const path = 'payment_settings/public_pricing';
  return onSnapshot(
    doc(db, 'payment_settings', 'public_pricing'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        monthlyPrice: Number(d.monthlyPrice || 0),
        lifetimePrice: Number(d.lifetimePrice || 0),
        currency: String(d.currency || ''),
        renewalReminderDays: Number(d.renewalReminderDays || 5),
        updatedBy: String(d.updatedBy || ''),
        updatedAt: d.updatedAt,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function fetchInstapaySettings(): Promise<InstapaySettings | null> {
  const path = 'payment_settings/instapay';
  try {
    const snap = await getDoc(doc(db, 'payment_settings', 'instapay'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      ipaAddress: String(d.ipaAddress || ''),
      accountHolderName: String(d.accountHolderName || ''),
      transferNumber: String(d.transferNumber || ''),
      instructions: String(d.instructions || ''),
      updatedBy: String(d.updatedBy || ''),
      updatedAt: d.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePaymentSettings(params: {
  adminUid: string;
  adminEmail: string;
  monthlyPrice: number;
  lifetimePrice: number;
  currency: string;
  renewalReminderDays: number;
  ipaAddress: string;
  accountHolderName: string;
  transferNumber: string;
  instructions: string;
}): Promise<void> {
  const batch = writeBatch(db);
  const logRef = doc(collection(db, 'payment_audit_logs'));

  batch.set(doc(db, 'payment_settings', 'public_pricing'), {
    monthlyPrice: Number(params.monthlyPrice),
    lifetimePrice: Number(params.lifetimePrice),
    currency: params.currency.trim().toUpperCase().slice(0, 12),
    renewalReminderDays: Math.max(1, Math.min(30, Math.round(params.renewalReminderDays))),
    updatedBy: params.adminUid,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'payment_settings', 'instapay'), {
    ipaAddress: params.ipaAddress.trim().slice(0, 160),
    accountHolderName: params.accountHolderName.trim().slice(0, 120),
    transferNumber: params.transferNumber.trim().slice(0, 60),
    instructions: params.instructions.trim().slice(0, 2000),
    updatedBy: params.adminUid,
    updatedAt: serverTimestamp(),
  });

  batch.set(logRef, {
    action: 'settings_updated',
    requestId: 'payment_settings',
    orderNumber: '-',
    userId: params.adminUid,
    userEmail: params.adminEmail,
    planType: 'settings',
    amount: Number(params.monthlyPrice),
    currency: params.currency.trim().toUpperCase().slice(0, 12),
    referenceNumber: params.ipaAddress.trim().slice(0, 80),
    adminUid: params.adminUid,
    adminEmail: params.adminEmail,
    note: `Monthly=${params.monthlyPrice}, Lifetime=${params.lifetimePrice}, IPA=${params.ipaAddress.trim()}`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'payment_settings');
  }
}

export async function uploadProofImage(idToken: string, dataUrl: string): Promise<string> {
  const resp = await fetch('/api/uploads/proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ dataUrl }),
  });
  const body = await resp.json();
  if (!resp.ok || !body?.proofImageUrl) {
    throw new Error(body?.error || 'Failed to upload transfer proof image.');
  }
  return String(body.proofImageUrl);
}

export async function submitPaymentRequest(params: {
  uid: string;
  userName: string;
  userEmail: string;
  planType: PlanType;
  isRenewal: boolean;
  amount: number;
  currency: string;
  referenceNumber: string;
  proofImageUrl: string;
  orderNumber?: string;
}): Promise<{ id: string; orderNumber: string }> {
  const referenceKey = normalizeReferenceKey(params.referenceNumber);
  if (referenceKey.length < 4 || referenceKey.length > 80) {
    throw new Error('رقم العملية المرجعي يجب أن يكون 4 أحرف/أرقام على الأقل.');
  }

  // Pre-check if this transaction reference was already approved
  const usedSnap = await getDoc(doc(db, 'used_references', referenceKey)).catch((error) =>
    handleFirestoreError(error, OperationType.GET, `used_references/${referenceKey}`)
  );
  if (usedSnap.exists()) {
    throw new Error('رقم العملية المرجعي هذا تم اعتماده مسبقًا ولا يمكن استخدامه مرة أخرى.');
  }

  const reqRef = doc(collection(db, 'payment_requests'));
  const orderNumber = (params.orderNumber && /^MQ-[A-Z0-9]{6,12}$/.test(params.orderNumber))
    ? params.orderNumber
    : generateOrderNumber();

  try {
    await setDoc(reqRef, {
      orderNumber,
      userId: params.uid,
      userName: params.userName.trim().slice(0, 120) || params.userEmail,
      userEmail: params.userEmail.trim().slice(0, 254),
      planType: params.planType,
      isRenewal: Boolean(params.isRenewal),
      amount: Number(params.amount),
      currency: params.currency.trim().slice(0, 12),
      referenceNumber: params.referenceNumber.trim().slice(0, 80),
      referenceKey,
      proofImageUrl: params.proofImageUrl,
      status: 'pending',
      rejectionReason: '',
      reviewedBy: '',
      reviewedByEmail: '',
      reviewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: reqRef.id, orderNumber };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `payment_requests/${reqRef.id}`);
  }
}

export function subscribeUserPaymentRequests(
  uid: string,
  onData: (rows: PaymentRequestRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, 'payment_requests'),
    where('userId', '==', uid),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((docSnap) => mapPaymentRequest(docSnap.id, docSnap.data()))
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'payment_requests');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export function subscribeAllPaymentRequests(
  onData: (rows: PaymentRequestRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((docSnap) => mapPaymentRequest(docSnap.id, docSnap.data())));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'payment_requests');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export function subscribeAuditLogs(
  onData: (rows: AuditLogRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'payment_audit_logs'), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            action: data.action,
            requestId: String(data.requestId || ''),
            orderNumber: String(data.orderNumber || ''),
            userId: String(data.userId || ''),
            userEmail: String(data.userEmail || ''),
            planType: String(data.planType || ''),
            amount: Number(data.amount || 0),
            currency: String(data.currency || ''),
            referenceNumber: String(data.referenceNumber || ''),
            adminUid: String(data.adminUid || ''),
            adminEmail: String(data.adminEmail || ''),
            note: String(data.note || ''),
            createdAt: toDateOrNull(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'payment_audit_logs');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export function subscribeAdminList(
  onData: (rows: AdminRoleRecord[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, 'admins'),
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            email: String(data.email || ''),
            grantedBy: String(data.grantedBy || ''),
            createdAt: toDateOrNull(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'admins');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export function subscribeAllUsers(
  onData: (rows: UserSubscriptionRecord[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    query(collection(db, 'users'), limit(150)),
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            email: String(data.email || ''),
            displayName: String(data.displayName || ''),
            role: data.role === 'admin' ? 'admin' : 'user',
            subscriptionPlan: data.subscriptionPlan || 'free',
            subscriptionStatus: data.subscriptionStatus || 'free',
            subscriptionStartedAt: toDateOrNull(data.subscriptionStartedAt),
            subscriptionExpiresAt: toDateOrNull(data.subscriptionExpiresAt),
            renewalNoticeDismissed: Boolean(data.renewalNoticeDismissed),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function approvePaymentRequest(params: {
  adminUid: string;
  adminEmail: string;
  request: PaymentRequestRecord;
}): Promise<void> {
  const { adminUid, adminEmail, request } = params;
  if (request.status !== 'pending') {
    throw new Error('لا يمكن اعتماد طلب تم البت فيه بالفعل.');
  }

  // Verify reference hasn't already been used
  const usedSnap = await getDoc(doc(db, 'used_references', request.referenceKey)).catch((error) =>
    handleFirestoreError(error, OperationType.GET, `used_references/${request.referenceKey}`)
  );
  if (usedSnap.exists()) {
    throw new Error('رقم العملية المرجعي معتمد مسبقًا لطلب آخر ولا يمكن تكرار الاعتماد.');
  }

  const userRef = doc(db, 'users', request.userId);
  const userSnap = await getDoc(userRef).catch((error) =>
    handleFirestoreError(error, OperationType.GET, `users/${request.userId}`)
  );
  if (!userSnap.exists()) {
    throw new Error('لم يتم العثور على حساب المستخدم في قاعدة البيانات.');
  }

  const existingUserData = userSnap.data();
  const now = new Date();
  let nextExpiry: Timestamp | null = null;
  if (request.planType === 'pro_monthly') {
    // If renewing before expiry, extend 30 days from current active expiry; otherwise 30 days from approval
    const currentExpiry = toDateOrNull(existingUserData.subscriptionExpiresAt);
    const baseDate =
      existingUserData.subscriptionPlan === 'pro_monthly' &&
      existingUserData.subscriptionStatus === 'active' &&
      currentExpiry &&
      currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;
    nextExpiry = Timestamp.fromDate(computeMonthlyExpiryDate(baseDate));
  }

  const batch = writeBatch(db);
  const reqRef = doc(db, 'payment_requests', request.id);
  const usedRef = doc(db, 'used_references', request.referenceKey);
  const logRef = doc(collection(db, 'payment_audit_logs'));

  batch.update(reqRef, {
    status: 'approved',
    rejectionReason: '',
    reviewedBy: adminUid,
    reviewedByEmail: adminEmail,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(usedRef, {
    referenceKey: request.referenceKey,
    referenceNumber: request.referenceNumber,
    requestId: request.id,
    userId: request.userId,
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
  });

  batch.update(userRef, {
    subscriptionPlan: request.planType,
    subscriptionStatus: 'active',
    subscriptionStartedAt: serverTimestamp(),
    subscriptionExpiresAt: nextExpiry,
    renewalNoticeDismissed: false,
    updatedAt: serverTimestamp(),
  });

  batch.set(logRef, {
    action: 'approved',
    requestId: request.id,
    orderNumber: request.orderNumber,
    userId: request.userId,
    userEmail: request.userEmail,
    planType: request.planType,
    amount: request.amount,
    currency: request.currency,
    referenceNumber: request.referenceNumber,
    adminUid,
    adminEmail,
    note:
      request.planType === 'pro_lifetime'
        ? 'Approved Pro Lifetime permanent activation'
        : `Approved Pro Monthly (30 days${nextExpiry ? ` until ${nextExpiry.toDate().toISOString().slice(0, 10)}` : ''})`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payment_requests/${request.id}`);
  }
}

export async function rejectPaymentRequest(params: {
  adminUid: string;
  adminEmail: string;
  request: PaymentRequestRecord;
  reason: string;
}): Promise<void> {
  const { adminUid, adminEmail, request, reason } = params;
  const cleanReason = reason.trim().slice(0, 500);
  if (!cleanReason) {
    throw new Error('يرجى كتابة سبب الرفض قبل رفض الطلب.');
  }
  if (request.status !== 'pending') {
    throw new Error('تم البت في هذا الطلب مسبقًا.');
  }

  const batch = writeBatch(db);
  const reqRef = doc(db, 'payment_requests', request.id);
  const logRef = doc(collection(db, 'payment_audit_logs'));

  batch.update(reqRef, {
    status: 'rejected',
    rejectionReason: cleanReason,
    reviewedBy: adminUid,
    reviewedByEmail: adminEmail,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(logRef, {
    action: 'rejected',
    requestId: request.id,
    orderNumber: request.orderNumber,
    userId: request.userId,
    userEmail: request.userEmail,
    planType: request.planType,
    amount: request.amount,
    currency: request.currency,
    referenceNumber: request.referenceNumber,
    adminUid,
    adminEmail,
    note: cleanReason,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payment_requests/${request.id}`);
  }
}

export async function downgradeExpiredSubscription(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      subscriptionPlan: 'free',
      subscriptionStatus: 'expired',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function dismissRenewalNotice(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      renewalNoticeDismissed: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function grantAdminAccess(params: {
  adminUid: string;
  adminEmail: string;
  targetUid: string;
  targetEmail: string;
}): Promise<void> {
  const batch = writeBatch(db);
  const targetUid = params.targetUid.trim();
  const targetEmail = params.targetEmail.trim();
  if (!targetUid || !targetEmail) throw new Error('UID and email are required.');

  batch.set(doc(db, 'admins', targetUid), {
    uid: targetUid,
    email: targetEmail,
    grantedBy: params.adminUid,
    createdAt: serverTimestamp(),
  });

  const userRef = doc(db, 'users', targetUid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    batch.update(userRef, {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(collection(db, 'payment_audit_logs')), {
    action: 'admin_granted',
    requestId: targetUid,
    orderNumber: '-',
    userId: targetUid,
    userEmail: targetEmail,
    planType: 'admin_role',
    amount: 0,
    currency: '-',
    referenceNumber: '-',
    adminUid: params.adminUid,
    adminEmail: params.adminEmail,
    note: `Granted admin access to ${targetEmail}`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${targetUid}`);
  }
}

export async function revokeAdminAccess(params: {
  adminUid: string;
  adminEmail: string;
  targetUid: string;
  targetEmail: string;
}): Promise<void> {
  if (params.targetUid === params.adminUid) {
    throw new Error('لا يمكنك إزالة صلاحية الإدارة من حسابك الحالي.');
  }
  const batch = writeBatch(db);
  batch.delete(doc(db, 'admins', params.targetUid));

  const userRef = doc(db, 'users', params.targetUid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    batch.update(userRef, {
      role: 'user',
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(collection(db, 'payment_audit_logs')), {
    action: 'admin_revoked',
    requestId: params.targetUid,
    orderNumber: '-',
    userId: params.targetUid,
    userEmail: params.targetEmail,
    planType: 'admin_role',
    amount: 0,
    currency: '-',
    referenceNumber: '-',
    adminUid: params.adminUid,
    adminEmail: params.adminEmail,
    note: `Revoked admin access from ${params.targetEmail}`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${params.targetUid}`);
  }
}
