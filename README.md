# ProcureFlow — Purchase Requisition (PR) Approval Router v2.0

A Malaysian-workflow Purchase Requisition (PR) Approval Router designed to eliminate delays in manual signing of pre-approved Coda PR forms. **ProcureFlow** routes fresh requisitions starting from **Level 0 (Buyer Queue)** through a sequential **3-tier approval pipeline**, featuring an interactive **Side Viewing Drawer**, stage-aware **Remind Approver** notifications, **24-hour SLA tracking**, an unalterable **Malaysian-timestamped Audit Trail (`MYT UTC+8`)**, and **Firebase Cloud Sync (Google Auth + Cloud Firestore)** alongside local browser persistence.

---

## 🎯 Product Goals & Targets

1. **< 24-Hour Turnaround Cycle:** Cut internal PR routing approval duration from several days to under 24 hours with real-time SLA tracking (`SLA At Risk` & `SLA Overdue` alerts).
2. **100% Visibility & Control (Level 0 Queue):** Every fresh Coda PR or manually keyed-in PR starts at `Level 0: Fresh PR` in the Buyer's queue, immediately inspectable and submittable via the slide-in **Side Viewing Drawer**.
3. **Targeted Accountability:** Buyers can dispatch stage-aware reminders directly to the exact approver currently holding the PR (`Level 1`, `Level 2`, or `Level 3`).
4. **Immutable Malaysian Audit Trail (`UTC+8`):** Every import, manual creation, submission, approval, return, rejection, document upload, and reminder is recorded chronologically in Malaysian Time (`DD/MM/YYYY, HH:mm:ss MYT`).
5. **Hybrid Cloud & Local Persistence:** Works out-of-the-box with `localStorage` and upgrades seamlessly to real-time **Firebase Cloud Firestore** persistence when signed in with Google (`Cloud Sync (Google)`).

---

## 🏛️ Hierarchy & Sequential Workflow Definition

| Level | Role Title | Default Persona | Backup / Deputy | Allowed Key Actions | Status Tag Generated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 0** | **Buyer (Owner / Dispatcher)** | Ahmad | Hafizah | Key in `+ New PR`, Quick Coda Sync, Inspect via Side Viewing, Upload Revised Quotation (`v2`), Submit to L1, Remind L1/L2/L3 | `Level 0: Fresh PR` / `Returned to Buyer` |
| **Level 1** | **Initial Reviewer / Doc Checker** | Sarah | Amirul | Verify Quotation & Coda Log, Approve (advance to L2), Return to Buyer (mandatory remarks), Reject | `Pending L1 (Doc Checker)` |
| **Level 2** | **Head Unit Reviewer** | En. Razak | Pn. Farah | Validate Budget & Justification, Approve (advance to L3 or Fast-Track Signoff), Return to Buyer, Reject | `Pending L2 (Head Unit)` |
| **Level 3** | **GGM, GCAS (Final Signoff)** | Datuk Farid | Dato' Azman | Final Executive Signoff, Return to Buyer (mandatory remarks), Reject | `Fully Approved` / `Rejected` |

---

## ✨ Core & Enhanced Features

### 1. Level 0 Fresh PR Queue & Manual Entry (`+ New PR`)
* **Manual PR Entry Modal (`+ New PR`):** Buyers can key in new Purchase Requisitions manually with full procurement metadata (`PR No.`, `Total Cost (MYR)`, `Budget Ref. No.`, `Requisition Title`, `Department / Unit`, `Requestor`, `Vendor Name`, `GL Account Code`, `Coda PR Ref.`, `Quotation Ref. & Validity Date`, `PDF Attachment`, and `Business Justification`).
* **Dual Save Mode:** Save to the `Level 0: Fresh PR` queue for later review or **Save & Submit Directly to Level 1**.
* **Quick Coda Sync (`L0`):** One-click simulation of incoming pre-approved Coda requisitions.

### 2. Interactive Side Viewing Drawer & Inline Split-View
* Clicking any PR row opens the right-hand **Side Viewing Panel** without leaving the main dashboard.
* **Inline Split-View Comparison:** Expand vendor quotation line items or Coda pre-approval steps directly inside the drawer to cross-check `GL Account Code`, `Budget Ref. No.`, `Validity Date`, and `Total Cost (MYR)` side by side.
* **Visual Diff (`Resubmitted • Amended`):** When a returned PR is rectified and resubmitted by the Buyer, approvers see a side-by-side comparison of the *Previous Return Reason* vs. *Buyer Rectification & Renewed Quotation File*.

### 3. 3-Tier Sequential Approvals & Mandatory Return Remarks
* Enforces strict sequential progression (`L0 → L1 → L2 → L3 → Fully Approved`).
* Selecting **Return to Buyer** or **Reject** enforces mandatory remarks with validation alerts and quick-fill templates.
* Buyers can upload or simulate a **Revised Vendor Quotation PDF (`v2 Renewed`)** before resubmitting a returned PR.

### 4. Stage-Aware "Remind Approver" & Batch Operations
* **Targeted Reminders:** Automatically detects who currently holds an in-flight PR (`L1`, `L2`, or `L3`), dispatches an on-screen notification, and records the reminder in the permanent audit trail.
* **Batch Action Bar:** Select multiple PR rows to perform **Batch Submit to L1**, **Batch Remind Approvers**, or **Batch Approve Selected**.

### 5. Workflow Rules: Out-of-Office Delegation & Fast-Track Thresholds
* **Out-of-Office / Backup Approver Delegation:** Toggle deputy approvers for Level 1, Level 2, or Level 3 so routing never stalls when primary approvers are on leave.
* **Cost Threshold Fast-Track (`< RM 25,000`):** Optional governance rule allowing requisitions below RM 25,000 to achieve `Fully Approved` status directly upon Level 2 (Head Unit) approval.

### 6. Official Approval Certificate & CSV Audit Export
* **Printable / Downloadable Certificate:** Generate an official PR Routing & Signoff Certificate showing digital verification stamps (`L0`, `L1`, `L2`, `L3`) and Malaysian timestamps.
* **CSV Export:** Download the full PR table and audit trail metrics as a `.csv` report.

### 7. Firebase Authentication & Real-Time Cloud Firestore Sync
* **Google Sign-In (`Cloud Sync (Google)`):** Authenticate via Google popup in the top navigation bar.
* **Automatic Cloud Seeding & Real-Time Listeners:** When a user signs in for the first time, initial sample PRs and their audit trails are automatically seeded to Cloud Firestore (`asia-southeast1`). Real-time `onSnapshot` listeners keep `/requisitions/{prId}` and `/requisitions/{prId}/auditLogs/{logId}` synchronized across sessions.
* **Hardened Zero-Trust Security Rules (`firestore.rules`):**
  * Enforces verified Google accounts (`request.auth.token.email_verified == true`) and strict per-user `ownerId` isolation.
  * Validates every field against strict key allowlists (`hasAll` / `hasOnly`), string length bounds, regex ID guards, and server timestamps (`request.time`).
  * Locks terminal states (`FULLY_APPROVED` and `REJECTED`) against unauthorized post-completion edits and makes audit log entries append-only (`allow update: if false`).

---

## 🗄️ Firestore Data Model (`firebase-blueprint.json`)

| Collection Path | Entity Schema | Description |
| :--- | :--- | :--- |
| `/requisitions/{prId}` | `Requisition` | Stores Purchase Requisition metadata, status (`LEVEL_0_FRESH` to `FULLY_APPROVED`), `costCenter` (Budget Ref. No.), quotation metadata, return/rejection remarks, and amendment diffs. |
| `/requisitions/{prId}/auditLogs/{logId}` | `AuditLog` | Subcollection storing chronological, immutable Malaysian-timestamped (`MYT UTC+8`) audit trail events (`IMPORT`, `SUBMIT_L1`, `APPROVE_L1`, `APPROVE_L2`, `APPROVE_L3`, `RETURN_TO_BUYER`, `REJECT`, `REMINDER`, `DOC_UPLOAD`). |

---

## ⌨️ Keyboard Shortcuts

When inspecting requisitions on the dashboard (outside text inputs):

| Key | Action |
| :--- | :--- |
| `↑` / `↓` (or `K` / `J`) | Navigate up/down through PR table rows & update Side Viewing Drawer |
| `S` | **Submit for Approval (Level 1)** *(when Buyer is viewing Level 0 / Returned PR)* |
| `A` | **Approve & Route to Next Level** *(when Approver is viewing active PR)* |
| `R` | Open **Return to Buyer (Level 0)** modal *(when Approver is viewing active PR)* |
| `M` | Trigger **Stage-Aware Reminder** *(on active in-routing PRs)* |
| `Esc` | Close active modal or Side Viewing Drawer |

---

## 🛠️ Tech Stack & Project Structure

* **Frontend Framework:** React 19 + TypeScript + Vite
* **Backend / Cloud Database:** Firebase Authentication (Google Sign-In) + Cloud Firestore (`asia-southeast1`)
* **Styling:** Tailwind CSS v4 (`Plus Jakarta Sans` & `JetBrains Mono` tabular numerals)
* **Icons:** Lucide React
* **Security & Linting:** `@firebase/eslint-plugin-security-rules` + TypeScript type checking

```text
├── index.html
├── metadata.json
├── package.json
├── README.md
├── firebase-applet-config.json         # Firebase project & Firestore database configuration
├── firebase-blueprint.json             # Strict entity & collection schema blueprint
├── firestore.rules                     # Hardened Zero-Trust Firestore security rules
├── firestore.rules.test.ts             # "Dirty Dozen" adversarial security test scenarios
├── security_spec.md                    # Security invariants & Red Team audit specification
├── eslint.config.mjs                   # ESLint configuration for Firestore security rules
└── src/
    ├── main.tsx
    ├── index.css
    ├── firebase.ts                     # Firebase Auth, Firestore SDK helpers & error handler
    ├── App.tsx                         # Main dashboard, Cloud Sync listeners, batch bar & state
    ├── types/
    │   └── pr.ts                       # TypeScript interfaces for PRs, Audit Logs, Roles & Rules
    ├── data/
    │   └── initialPRs.ts               # Pre-populated sample PRs, role definitions & MYT formatters
    └── components/
        ├── StatusBadge.tsx             # Status badges, 4-stage mini pipeline & 24h SLA badges
        ├── SideViewingDrawer.tsx       # Slide-in inspection panel, inline split-view & audit timeline
        └── Modals.tsx                  # New PR, Return, Reject, Reminder, Certificate & Rules modals
```

---

## 🚀 Getting Started Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server (runs on port 3000):**
   ```bash
   npm run dev
   ```

3. **Lint Firestore Security Rules & TypeScript:**
   ```bash
   npx eslint firestore.rules
   npm run lint
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
