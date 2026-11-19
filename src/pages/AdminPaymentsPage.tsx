import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  History,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { SiteChrome } from '../components/SiteChrome';
import { AdminGuard } from '../components/admin/AdminGuard';
import { AuthenticatedProofImage } from '../components/billing/AuthenticatedProofImage';
import { useAuth } from '../context/AuthContext';
import { PaymentRequestRecord, UserSubscriptionRecord } from '../lib/instapayDomain';
import {
  AdminRoleRecord,
  AuditLogRecord,
  approvePaymentRequest,
  grantAdminAccess,
  rejectPaymentRequest,
  revokeAdminAccess,
  subscribeAdminList,
  subscribeAllPaymentRequests,
  subscribeAllUsers,
  subscribeAuditLogs,
} from '../lib/instapayService';

function formatDateTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminPaymentsPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const { user, isAdmin, pricing, getIdToken } = useAuth();
  const [tab, setTab] = useState<'requests' | 'audit' | 'users'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [requests, setRequests] = useState<PaymentRequestRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [users, setUsers] = useState<UserSubscriptionRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRoleRecord[]>([]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<PaymentRequestRecord | null>(null);
  const [approveConfirmed, setApproveConfirmed] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<PaymentRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewProof, setPreviewProof] = useState<{ url: string; requestId: string } | null>(null);

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = subscribeAllPaymentRequests(setRequests, (e) => setActionError(e.message));
    const u2 = subscribeAuditLogs(setLogs, (e) => setActionError(e.message));
    const u3 = subscribeAllUsers(setUsers, (e) => setActionError(e.message));
    const u4 = subscribeAdminList(setAdmins, (e) => setActionError(e.message));
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [isAdmin]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.referenceNumber.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests]
  );

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !approveTarget || !approveConfirmed) return;
    setActionError(null);
    setActionSuccess(null);
    setBusyId(approveTarget.id);
    try {
      const idToken = await getIdToken();
      await approvePaymentRequest({
        idToken,
        request: approveTarget,
        adminConfirmedTransfer: true,
      });
      setActionSuccess(
        `تم اعتماد الطلب ${approveTarget.orderNumber} وتفعيل ${
          approveTarget.planType === 'pro_lifetime' ? 'Pro Lifetime' : 'Pro Monthly (30 يوم)'
        } للمستخدم ${approveTarget.userEmail} بتوقيت الخادم الموثق.`
      );
      setApproveTarget(null);
      setApproveConfirmed(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'تعذر اعتماد الطلب.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rejectTarget) return;
    setActionError(null);
    setActionSuccess(null);
    setBusyId(rejectTarget.id);
    try {
      await rejectPaymentRequest({
        adminUid: user.uid,
        adminEmail: user.email || '',
        request: rejectTarget,
        reason: rejectReason,
      });
      setActionSuccess(`تم رفض الطلب ${rejectTarget.orderNumber} وتسجيل السبب في سجل المراجعة.`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'تعذر رفض الطلب.');
    } finally {
      setBusyId(null);
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await grantAdminAccess({
        adminUid: user.uid,
        adminEmail: user.email || '',
        targetUid: newAdminUid,
        targetEmail: newAdminEmail,
      });
      setActionSuccess(`تمت ترقية ${newAdminEmail} لصلاحية Admin.`);
      setNewAdminUid('');
      setNewAdminEmail('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'تعذر إضافة المسؤول.');
    }
  };

  const currentCatalogPriceFor = (r: PaymentRequestRecord): number | null => {
    if (!pricing) return null;
    return r.planType === 'pro_lifetime' ? pricing.lifetimePrice : pricing.monthlyPrice;
  };

  return (
    <AdminGuard currentPath="/admin/payments" onNavigate={onNavigate}>
      <SiteChrome currentPath="/admin/payments" onNavigate={onNavigate}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Payment Requests
              </div>
              <h1 className="brand-font text-2xl sm:text-3xl font-black text-white mt-1">
                مراجعة طلبات InstaPay والاشتراكات
              </h1>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/payment-settings')}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span>Payment Settings</span>
            </button>
          </div>

          {/* Section Switch Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                tab === 'requests'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/[0.05] text-white/75 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Payment Requests ({pendingCount} Pending)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('audit')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                tab === 'audit'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/[0.05] text-white/75 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                tab === 'users'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/[0.05] text-white/75 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users &amp; Admins ({users.length})</span>
            </button>
          </div>

          {actionError && (
            <div className="rounded-xl bg-red-500/15 border border-red-500/40 px-4 py-3 text-xs text-red-200">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200">
              {actionSuccess}
            </div>
          )}

          {/* TAB 1: PAYMENT REQUESTS */}
          {tab === 'requests' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/10">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition ${
                        statusFilter === st ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث بالبريد، الاسم، المرجع، أو رقم الطلب..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e0e13] border border-white/10 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="rounded-2xl bg-[#0e0e13] border border-white/10 p-10 text-center text-xs text-white/55">
                  لا توجد طلبات دفع مطابقة للتصفية الحالية.
                </div>
              ) : (
                <div className="rounded-2xl bg-[#0e0e13] border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/55">
                        <th className="py-3 px-4">المستخدم</th>
                        <th className="py-3 px-4">الباقة</th>
                        <th className="py-3 px-4">القيمة</th>
                        <th className="py-3 px-4">الرقم المرجعي / الطلب</th>
                        <th className="py-3 px-4">إثبات التحويل</th>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4 text-right">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRequests.map((r) => {
                        const catalogPrice = currentCatalogPriceFor(r);
                        const priceChanged =
                          catalogPrice !== null && catalogPrice !== r.priceSnapshot;
                        return (
                          <tr key={r.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{r.userName}</div>
                              <div className="text-white/55 font-mono text-[11px]">{r.userEmail}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#FACC15]">
                                {r.planType === 'pro_lifetime' ? 'Pro Lifetime' : 'Pro Monthly'}
                              </div>
                              {r.isRenewal && <div className="text-[11px] text-amber-300">Renewal</div>}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold tabular-nums text-white">
                              <div>
                                {r.priceSnapshot} {r.currency}
                              </div>
                              {priceChanged && (
                                <div className="text-[10px] text-amber-300 font-normal">
                                  Current price: {catalogPrice} {pricing?.currency}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-white">{r.referenceNumber}</div>
                              <div className="font-mono text-[11px] text-white/50">{r.orderNumber}</div>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewProof({ url: r.proofImageUrl, requestId: r.id })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[11px] font-semibold text-white"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>عرض الإيصال</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 tabular-nums text-white/65">
                              {formatDateTime(r.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              {r.status === 'pending' && (
                                <span className="text-amber-300 font-bold">Pending</span>
                              )}
                              {r.status === 'approved' && (
                                <div className="text-emerald-400 font-bold">
                                  Approved
                                  <div className="text-[10px] text-white/45 font-normal">
                                    by {r.reviewedByEmail}
                                  </div>
                                </div>
                              )}
                              {r.status === 'rejected' && (
                                <div className="text-red-400 font-bold">
                                  Rejected
                                  {r.rejectionReason && (
                                    <div className="text-[10px] text-red-200/75 font-normal max-w-[180px] truncate">
                                      {r.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {r.status === 'pending' ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={busyId === r.id}
                                    onClick={() => {
                                      setApproveTarget(r);
                                      setApproveConfirmed(false);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1 whitespace-nowrap"
                                  >
                                    {busyId === r.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    <span>Approve Payment</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === r.id}
                                    onClick={() => {
                                      setRejectTarget(r);
                                      setRejectReason('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-red-600/85 hover:bg-red-500 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject Payment</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-white/40 text-[11px]">مكتمل المراجعة</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT LOG */}
          {tab === 'audit' && (
            <div className="rounded-2xl bg-[#0e0e13] border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/55">
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor (Admin/System)</th>
                    <th className="py-3 px-4">Target User</th>
                    <th className="py-3 px-4">Order / Ref</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="text-white/80">
                      <td className="py-2.5 px-4 font-mono font-bold uppercase text-[#FACC15]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        {log.adminEmail || 'User / Server'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">{log.userEmail}</td>
                      <td className="py-2.5 px-4 font-mono">
                        {log.orderNumber} · {log.referenceNumber}
                      </td>
                      <td className="py-2.5 px-4 text-white/65">{log.note}</td>
                      <td className="py-2.5 px-4 tabular-nums text-white/55">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/50">
                        لا توجد سجلات حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: USERS & ADMINS */}
          {tab === 'users' && (
            <div className="space-y-6">
              <form
                onSubmit={handleGrantAdmin}
                className="rounded-2xl bg-[#0e0e13] border border-white/10 p-5 flex flex-wrap items-end gap-3 text-xs"
              >
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="font-bold text-white/80 block">Target User UID</label>
                  <input
                    type="text"
                    required
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    placeholder="Firebase Auth UID"
                    className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-white font-mono focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="font-bold text-white/80 block">Target Email</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black font-extrabold flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>منح صلاحية Admin</span>
                </button>
              </form>

              <div className="rounded-2xl bg-[#0e0e13] border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/55">
                      <th className="py-3 px-4">User / UID</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => {
                      const hasAdminGrant = admins.some((a) => a.uid === u.uid);
                      return (
                        <tr key={u.uid} className="text-white/85">
                          <td className="py-2.5 px-4">
                            <div className="font-bold">{u.displayName}</div>
                            <div className="font-mono text-[10px] text-white/45">{u.uid}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono">{u.email}</td>
                          <td className="py-2.5 px-4 font-mono">
                            {hasAdminGrant || u.role === 'admin' ? 'admin' : 'user'}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-[#FACC15]">
                            {u.subscriptionPlan} ({u.subscriptionStatus})
                          </td>
                          <td className="py-2.5 px-4 tabular-nums text-white/60">
                            {u.subscriptionPlan === 'pro_lifetime'
                              ? 'Lifetime'
                              : formatDateTime(u.subscriptionExpiresAt)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {hasAdminGrant && u.uid !== user?.uid && (
                              <button
                                type="button"
                                onClick={() =>
                                  user &&
                                  void revokeAdminAccess({
                                    adminUid: user.uid,
                                    adminEmail: user.email || '',
                                    targetUid: u.uid,
                                    targetEmail: u.email,
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-200 text-[11px]"
                              >
                                سحب صلاحية Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Verified Approval Confirmation Modal */}
        {approveTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleConfirmApprove}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e0e13] border border-emerald-500/40 p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>تأكيد اعتماد الدفع ({approveTarget.orderNumber})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setApproveTarget(null)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-black/40 border border-white/10 p-3">
                <div>
                  <span className="text-white/50 block">المستخدم</span>
                  <span className="font-mono font-bold text-white">{approveTarget.userEmail}</span>
                </div>
                <div>
                  <span className="text-white/50 block">الباقة</span>
                  <span className="font-bold text-[#FACC15]">
                    {approveTarget.planType === 'pro_lifetime'
                      ? 'Pro Lifetime (دائم)'
                      : 'Pro Monthly (30 يوم بتوقيت الخادم)'}
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">المبلغ المثبّت (Price Snapshot)</span>
                  <span className="font-mono font-bold text-emerald-300 tabular-nums">
                    {approveTarget.priceSnapshot} {approveTarget.currency}
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">الرقم المرجعي</span>
                  <span className="font-mono font-bold text-white">
                    {approveTarget.referenceNumber}
                  </span>
                </div>
              </div>

              {(() => {
                const catalogPrice = currentCatalogPriceFor(approveTarget);
                if (catalogPrice !== null && catalogPrice !== approveTarget.priceSnapshot) {
                  return (
                    <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 flex items-start gap-2 text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        تنبيه: السعر الحالي للباقة في الإعدادات هو {catalogPrice} {pricing?.currency}، بينما أنشئ هذا الطلب عند سعر {approveTarget.priceSnapshot} {approveTarget.currency}.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="rounded-xl bg-black/50 border border-white/10 p-2 flex justify-center">
                <AuthenticatedProofImage
                  proofImageUrl={approveTarget.proofImageUrl}
                  requestId={approveTarget.id}
                  className="max-h-56 w-auto rounded-lg object-contain"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveConfirmed}
                  onChange={(e) => setApproveConfirmed(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="text-white/90 leading-relaxed font-semibold">
                  أؤكد أنني راجعت الإيصال وتحققّت من وصول التحويل الفعلي على حساب InstaPay بنفس المبلغ المثبّت ({approveTarget.priceSnapshot} {approveTarget.currency}) والرقم المرجعي ({approveTarget.referenceNumber}).
                </span>
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApproveTarget(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 font-bold text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!approveConfirmed || busyId === approveTarget.id}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 font-extrabold text-white flex items-center gap-1.5"
                >
                  {busyId === approveTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>تأكيد Approve Payment</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reject Reason Modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleConfirmReject}
              className="w-full max-w-md rounded-2xl bg-[#0e0e13] border border-red-500/40 p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white">
                  رفض طلب الدفع {rejectTarget.orderNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/65">
                لن يتم تفعيل Pro للمستخدم {rejectTarget.userEmail}. يرجى توضيح سبب الرفض ليظهر للمستخدم وفي سجل المراجعة.
              </p>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: لم يصل التحويل بنفس المبلغ أو الرقم المرجعي غير مطابق..."
                className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-red-400 p-3 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-xs font-bold text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busyId === rejectTarget.id}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-extrabold text-white"
                >
                  تأكيد Reject Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Proof Image Zoom Modal (Authenticated Stream) */}
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
    </AdminGuard>
  );
};
