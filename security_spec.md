# Security Specification — ProcureFlow PR Approval Router v2.0

## 1. Data Invariants

1. **Authentication & Email Verification Invariant:** Every read and write operation requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Ownership Invariant (`Requisition`):** A `/requisitions/{prId}` document can only be created, read, or updated if `ownerId == request.auth.uid`. `ownerId`, `id`, and `createdAt` are strictly immutable after creation.
3. **Master Gate Relational Sync (`AuditLog`):** A subcollection document at `/requisitions/{prId}/auditLogs/{logId}` cannot be created or read unless the parent `/requisitions/{prId}` document exists (`exists(...)`) and its `data.ownerId == request.auth.uid`. AuditLog documents are strictly append-only (`allow update, delete: if false`).
4. **Terminal State Locking:** Once a `Requisition` reaches `status == 'FULLY_APPROVED'` or `status == 'REJECTED'`, no further updates are permitted (`existing().status != 'FULLY_APPROVED' && existing().status != 'REJECTED'`).
5. **Temporal Integrity:** `createdAt` on creation must equal `request.time`, and `updatedAt` on creation/update must equal `request.time`.
6. **Path Variable Hardening & Volumetric Bounds:** Every ID path variable (`{prId}`, `{logId}`) must match `^[a-zA-Z0-9_\-]+$` with length `1..128`, and every string field enforces explicit `.size()` boundaries matching `firebase-blueprint.json`.

---

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity & State)

1. **Payload 1 (Identity Spoofing on Create):** Creating `/requisitions/PR-2026-099` with `ownerId: "victim-uid-999"` while authenticated as `"attacker-uid-111"`.
2. **Payload 2 (Unverified Email Spoofing):** Creating a requisition with `request.auth.token.email_verified == false`.
3. **Payload 3 (Shadow Field Injection on Create):** Creating a requisition with an undeclared field `"isAdminOverride": true`.
4. **Payload 4 (Path Variable Poisoning):** Creating `/requisitions/INVALID$PATH!@#` containing illegal characters.
5. **Payload 5 (Volumetric String Overflow):** Creating a requisition with `businessJustification` exceeding 2,000 characters.
6. **Payload 6 (Client Timestamp Forgery):** Creating a requisition with a forged past timestamp `createdAt` != `request.time`.
7. **Payload 7 (Terminal State Mutation):** Attempting to update a requisition whose existing `status` is already `'FULLY_APPROVED'` or `'REJECTED'`.
8. **Payload 8 (Immortal Field Mutation on Update):** Attempting to mutate `ownerId` or `createdAt` during an `update` on `/requisitions/{prId}`.
9. **Payload 9 (Shadow Key Update Gap):** Updating `/requisitions/{prId}` with an unauthorized key not in the action's `affectedKeys().hasOnly(...)` allowlist.
10. **Payload 10 (Orphaned Subcollection Write):** Creating `/requisitions/NON-EXISTENT-PR/auditLogs/log-1` when the parent requisition does not exist.
11. **Payload 11 (Audit Trail Tampering):** Attempting to `update` or `delete` an existing `/requisitions/{prId}/auditLogs/{logId}` entry.
12. **Payload 12 (Cross-Tenant Query Scraping):** Attempting a blanket `list` query on `/requisitions` without filtering `resource.data.ownerId == request.auth.uid`.
