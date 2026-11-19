# Security Specification — MaqAmir InstaPay & Pro Subscriptions

## Data Invariants
1. **No Self-Upgrade / No Self-Admin / No Email Spoofing**: On creation, a user profile must have `role == "user"`, `subscriptionPlan == "free"`, `subscriptionStatus == "free"`, `subscriptionStartedAt == null`, `subscriptionExpiresAt == null`, and `email == request.auth.token.email`. Users may never upgrade their own `subscriptionPlan` or `role`, or spoof another user's email.
2. **Server-Time Integrity**: All `createdAt`, `updatedAt`, `reviewedAt`, `approvedAt`, and `subscriptionStartedAt` fields must equal `request.time`. Admin activation of `pro_monthly` is bounded in `firestore.rules` to `request.time + 30 days` (or active expiry `+ 30 days` for renewal, +/- 120s tolerance) and computed on the Node server via `POST /api/payments/approve`.
3. **Price Snapshot & Proof Integrity on Request Creation**: A newly created `payment_requests/{requestId}` document must have `status == "pending"`, `adminConfirmedTransfer == false`, `reviewedBy == ""`, `reviewedAt == null`, `userEmail == request.auth.token.email`, `proofImageUrl` matching server-generated `/api/uploads/proofs/proof_<uid>_<ts>_<hex>.(png|jpg|webp)`, and `amount == priceSnapshot` matching `/payment_settings/public_pricing`.
4. **Terminal State Locking & Mandatory Checklist**: Once a payment request becomes `"approved"` or `"rejected"`, it can never transition back to `"pending"` or be approved a second time. Approval requires `adminConfirmedTransfer == true` and atomic verification of `priceSnapshot`. Active `pro_lifetime` users cannot be downgraded by a `pro_monthly` approval.
5. **Reference, Order & Pending Request Uniqueness**: Submitting a payment request atomically creates `/used_references/{referenceKey}` (`status: "pending"`), `/used_orders/{orderNumber}`, and `/pending_locks/{userId}`. Duplicate concurrent pending orders per user and reuse of any pending, approved, or rejected `referenceKey` are blocked atomically.
6. **Private Proof Storage & Authenticated Streaming**: Payment proof images are stored outside `public/` in `uploads/proofs/` and streamed exclusively through `GET /api/uploads/proofs/:filename?requestId=<id>` after verifying a valid Firebase ID token, Firestore ownership or verified Admin status, and exact `proofImageUrl` match.
7. **Pro-Gated AI Endpoint**: `POST /api/ai/assist` requires a verified Firebase ID token, server-side Firestore verification of an active non-expired Pro subscription, and per-user/IP rate limiting.
8. **Admin Isolation & Full Audit Trail**: Only verified admins (`mohamedmaqled66@gmail.com` with `email_verified == true`, or listed in `/admins/{uid}`) may read all users/requests/audit logs, write `/payment_settings/*`, approve/reject payments, or grant/revoke admins. Every lifecycle event (`request_created`, `proof_uploaded`, `approved`, `rejected`, `subscription_activated`, `subscription_expired`, `settings_updated`, `admin_granted`, `admin_revoked`) is recorded in append-only `/payment_audit_logs`.

## Dirty Dozen+ Attack Payloads (Must Return PERMISSION_DENIED or 401/403)
1. Regular user creates `/users/{uid}` with `subscriptionPlan: "pro_lifetime"` or spoofed `email` -> DENIED.
2. Regular user updates `/users/{uid}` setting `role: "admin"` -> DENIED.
3. Regular user updates `/users/{uid}` setting `subscriptionPlan: "pro_monthly"` or extending `subscriptionExpiresAt` -> DENIED.
4. Regular user creates `/payment_requests/{id}` with `status: "approved"`, spoofed `userEmail`, or invalid `proofImageUrl` -> DENIED.
5. Regular user creates `/payment_requests/{id}` with tampered `amount` or `priceSnapshot != public_pricing` -> DENIED.
6. Regular user submits a second concurrent pending `/payment_requests/{id}` while `/pending_locks/{uid}` exists -> DENIED.
7. Any user reuses a `referenceKey` belonging to an existing `pending`, `approved`, or `rejected` `/used_references/{key}` -> DENIED.
8. Unauthenticated or non-owner user fetches `/api/uploads/proofs/:filename` or attempts `../` path traversal -> 400/401/403.
9. Free, unauthenticated, or expired user calls `POST /api/ai/assist` -> 401/403.
10. Regular user writes `/payment_settings/*` or reads `/payment_audit_logs/*` -> DENIED.
11. Admin approves an already `"approved"`/`"rejected"` request or without `adminConfirmedTransfer == true` -> DENIED.
12. Malicious admin client attempts to set `pro_monthly` expiry 10 years in the future -> DENIED by `duration.value(30, 'd')` server-time rule.
