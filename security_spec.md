# Security Specification — MaqAmir InstaPay & Pro Subscriptions

## Data Invariants
1. **No Self-Upgrade / No Self-Admin**: On creation, a user profile must have `role == "user"`, `subscriptionPlan == "free"`, `subscriptionStatus == "free"`, `subscriptionStartedAt == null`, and `subscriptionExpiresAt == null`. Users may never upgrade their own `subscriptionPlan` or `role`.
2. **Server-Time Integrity**: All `createdAt`, `updatedAt`, `reviewedAt`, and `approvedAt` audit fields must equal `request.time`.
3. **Price & Status Integrity on Payment Request Creation**: A newly created `payment_requests/{requestId}` document must have `status == "pending"`, `reviewedBy == ""`, `reviewedAt == null`, and `amount` matching `/payment_settings/public_pricing`.
4. **Terminal State Locking**: Once a payment request becomes `"approved"` or `"rejected"`, it can never transition back to `"pending"` or be approved a second time.
5. **Reference Uniqueness**: Approval of a payment request requires atomic creation of `/used_references/{referenceKey}` where `!exists(...)` beforehand, guaranteeing a transaction reference cannot be approved twice.
6. **Admin Isolation**: Only verified admins (`mohamedmaqled66@gmail.com` with `email_verified == true`, or listed in `/admins/{uid}`) may read all users/requests, write `/payment_settings/*`, approve/reject payments, or append `/payment_audit_logs/*`.
7. **Expired Monthly Downgrade**: A user may update their own profile from `pro_monthly` to `free` / `expired` only when `request.time > existing().subscriptionExpiresAt`. `pro_lifetime` has `subscriptionExpiresAt == null` and cannot expire.

## Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. Regular user creates `/users/{uid}` with `subscriptionPlan: "pro_lifetime"` -> DENIED.
2. Regular user updates `/users/{uid}` setting `role: "admin"` -> DENIED.
3. Regular user updates `/users/{uid}` setting `subscriptionPlan: "pro_monthly"` or extending `subscriptionExpiresAt` -> DENIED.
4. Regular user creates `/payment_requests/{id}` with `status: "approved"` -> DENIED.
5. Regular user creates `/payment_requests/{id}` with tampered `amount: 1` when `public_pricing.monthlyPrice` is higher -> DENIED.
6. Regular user creates `/payment_requests/{id}` spoofing another `userId` -> DENIED.
7. Regular user updates `/payment_requests/{id}` to `status: "approved"` -> DENIED.
8. Regular user reads `/payment_requests/{otherId}` or runs unrestricted `list` across all requests -> DENIED.
9. Regular user writes `/payment_settings/public_pricing` or `/payment_settings/instapay` -> DENIED.
10. Admin attempts to approve an already `"approved"` or `"rejected"` request -> DENIED.
11. Admin attempts to approve a request whose `referenceKey` already exists in `/used_references/{referenceKey}` -> DENIED.
12. Unverified-email user attempting admin access or regular user writing `/payment_audit_logs/{logId}` -> DENIED.
