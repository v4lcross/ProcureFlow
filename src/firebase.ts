import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AuditLogEntry, PurchaseRequisition, UserRoleAssignment } from './types/pr';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Helper to sanitize strings to blueprint bounds
function clampStr(val: string | undefined, maxLen: number, fallback = 'N/A'): string {
  const clean = (val || '').trim();
  if (!clean) return fallback;
  return clean.slice(0, maxLen);
}

// Convert PurchaseRequisition to Firestore document payload adhering strictly to firebase-blueprint.json
export function buildFirestoreRequisitionPayload(
  pr: PurchaseRequisition,
  ownerId: string,
  isCreate: boolean
): Record<string, unknown> {
  const pdfAtt = pr.attachments.find((a) => a.type === 'PDF') || pr.attachments[0];

  const payload: Record<string, unknown> = {
    id: clampStr(pr.id, 64, 'PR-2026-000'),
    ownerId: clampStr(ownerId, 128),
    title: clampStr(pr.title, 300),
    vendorName: clampStr(pr.vendorName, 300),
    department: clampStr(pr.department, 200),
    departmentUnitHeader: clampStr(pr.departmentUnitHeader || pr.department, 200),
    requestor: clampStr(pr.requestor, 200),
    costMYR: Math.max(0, Number(pr.costMYR) || 0),
    status: pr.status,
    lastUpdatedMYT: clampStr(pr.lastUpdatedMYT, 64),
    slaHoursElapsed: Math.max(0, Number(pr.slaHoursElapsed) || 0),
    glAccountCode: clampStr(pr.glAccountCode, 100),
    costCenter: clampStr(pr.costCenter, 100),
    codaRef: clampStr(pr.codaRef, 100),
    businessJustification: clampStr(pr.businessJustification, 2000),
    quotationFileName: clampStr(pdfAtt?.fileName, 300, 'Approved_Quotation.pdf'),
    quotationFileSize: clampStr(pdfAtt?.fileSize, 64, '1.5 MB'),
    quotationBadgeText: clampStr(pdfAtt?.badgeText, 100, 'Signed & Stamped'),
    quotationValidityDate: clampStr(pdfAtt?.validityDate, 100, '31/12/2026'),
    quotationRef: clampStr(pdfAtt?.quotationRef, 100, 'QT-2026-001'),
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }

  if (pr.returnRemarks && pr.returnRemarks.trim().length > 0) {
    payload.returnRemarks = clampStr(pr.returnRemarks, 1000);
  }
  if (pr.returnedBy && pr.returnedBy.trim().length > 0) {
    payload.returnedBy = clampStr(pr.returnedBy, 200);
  }
  if (pr.rejectionRemarks && pr.rejectionRemarks.trim().length > 0) {
    payload.rejectionRemarks = clampStr(pr.rejectionRemarks, 1000);
  }
  if (pr.rejectedBy && pr.rejectedBy.trim().length > 0) {
    payload.rejectedBy = clampStr(pr.rejectedBy, 200);
  }
  if (typeof pdfAtt?.isRevised === 'boolean') {
    payload.quotationIsRevised = pdfAtt.isRevised;
  }
  if (pr.amendmentDiff) {
    payload.amendmentPrevRemarks = clampStr(pr.amendmentDiff.previousReturnRemarks, 1000);
    payload.amendmentReturnedBy = clampStr(pr.amendmentDiff.returnedBy, 200);
    payload.amendmentBuyerNote = clampStr(pr.amendmentDiff.buyerAmendmentNote, 1000);
    payload.amendmentResubmittedAt = clampStr(pr.amendmentDiff.resubmittedAtMYT, 64);
    if (pr.amendmentDiff.updatedFileName) {
      payload.amendmentUpdatedFile = clampStr(pr.amendmentDiff.updatedFileName, 300);
    }
  }

  return payload;
}

export function buildFirestoreAuditLogPayload(
  entry: AuditLogEntry,
  prId: string,
  ownerId: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: clampStr(entry.id.replace(/[^a-zA-Z0-9_-]/g, '-'), 128, `aud-${Date.now()}`),
    prId: clampStr(prId, 64),
    ownerId: clampStr(ownerId, 128),
    timestamp: clampStr(entry.timestamp, 64),
    actorName: clampStr(entry.actorName, 200),
    actorRole: clampStr(entry.actorRole, 200),
    actionTitle: clampStr(entry.actionTitle, 300),
    remarks: clampStr(entry.remarks, 2000),
    eventType: entry.eventType,
    createdAt: serverTimestamp(),
  };

  if (entry.targetRecipient && entry.targetRecipient.trim().length > 0) {
    payload.targetRecipient = clampStr(entry.targetRecipient, 300);
  }

  return payload;
}

// Create a brand new PR + its initial audit logs in Firestore
export async function saveNewPRToFirestore(pr: PurchaseRequisition, user: User) {
  const prPath = `requisitions/${pr.id}`;
  try {
    const reqPayload = buildFirestoreRequisitionPayload(pr, user.uid, true);
    await setDoc(doc(db, 'requisitions', pr.id), reqPayload);

    for (const log of pr.auditTrail) {
      const logId = log.id.replace(/[^a-zA-Z0-9_-]/g, '-');
      const logPayload = buildFirestoreAuditLogPayload({ ...log, id: logId }, pr.id, user.uid);
      await setDoc(doc(db, 'requisitions', pr.id, 'auditLogs', logId), logPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, prPath);
  }
}

// Update workflow status on an existing PR and append new audit log entry in Firestore
export async function updatePRWorkflowInFirestore(
  pr: PurchaseRequisition,
  newLog: AuditLogEntry,
  user: User
) {
  const prPath = `requisitions/${pr.id}`;
  try {
    const updatePayload: Record<string, unknown> = {
      status: pr.status,
      lastUpdatedMYT: clampStr(pr.lastUpdatedMYT, 64),
      slaHoursElapsed: Math.max(0, Number(pr.slaHoursElapsed) || 0),
      updatedAt: serverTimestamp(),
    };

    if (pr.returnRemarks && pr.returnRemarks.trim().length > 0) {
      updatePayload.returnRemarks = clampStr(pr.returnRemarks, 1000);
    }
    if (pr.returnedBy && pr.returnedBy.trim().length > 0) {
      updatePayload.returnedBy = clampStr(pr.returnedBy, 200);
    }
    if (pr.rejectionRemarks && pr.rejectionRemarks.trim().length > 0) {
      updatePayload.rejectionRemarks = clampStr(pr.rejectionRemarks, 1000);
    }
    if (pr.rejectedBy && pr.rejectedBy.trim().length > 0) {
      updatePayload.rejectedBy = clampStr(pr.rejectedBy, 200);
    }
    if (pr.amendmentDiff) {
      updatePayload.amendmentPrevRemarks = clampStr(pr.amendmentDiff.previousReturnRemarks, 1000);
      updatePayload.amendmentReturnedBy = clampStr(pr.amendmentDiff.returnedBy, 200);
      updatePayload.amendmentBuyerNote = clampStr(pr.amendmentDiff.buyerAmendmentNote, 1000);
      updatePayload.amendmentResubmittedAt = clampStr(pr.amendmentDiff.resubmittedAtMYT, 64);
      if (pr.amendmentDiff.updatedFileName) {
        updatePayload.amendmentUpdatedFile = clampStr(pr.amendmentDiff.updatedFileName, 300);
      }
    }

    await updateDoc(doc(db, 'requisitions', pr.id), updatePayload);

    const logId = newLog.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const logPayload = buildFirestoreAuditLogPayload({ ...newLog, id: logId }, pr.id, user.uid);
    await setDoc(doc(db, 'requisitions', pr.id, 'auditLogs', logId), logPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, prPath);
  }
}

// Update revised quotation fields on an existing PR and append audit log entry in Firestore
export async function updatePRQuotationInFirestore(
  pr: PurchaseRequisition,
  newLog: AuditLogEntry,
  user: User
) {
  const prPath = `requisitions/${pr.id}`;
  try {
    const pdfAtt = pr.attachments.find((a) => a.type === 'PDF') || pr.attachments[0];
    const updatePayload: Record<string, unknown> = {
      lastUpdatedMYT: clampStr(pr.lastUpdatedMYT, 64),
      quotationFileName: clampStr(pdfAtt?.fileName, 300, 'Revised_Quotation.pdf'),
      quotationFileSize: clampStr(pdfAtt?.fileSize, 64, '1.8 MB'),
      quotationBadgeText: clampStr(pdfAtt?.badgeText, 100, 'Signed & Stamped (Renewed)'),
      quotationValidityDate: clampStr(pdfAtt?.validityDate, 100, '31/12/2026 (Renewed)'),
      quotationIsRevised: true,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'requisitions', pr.id), updatePayload);

    const logId = newLog.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const logPayload = buildFirestoreAuditLogPayload({ ...newLog, id: logId }, pr.id, user.uid);
    await setDoc(doc(db, 'requisitions', pr.id, 'auditLogs', logId), logPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, prPath);
  }
}

export function mapFirestoreDocToPR(
  data: Record<string, any>,
  auditLogs: AuditLogEntry[],
  fallbackPR?: PurchaseRequisition
): PurchaseRequisition {
  const quotationRef = String(data.quotationRef || 'QT-2026-001');
  const quotationFileName = String(data.quotationFileName || 'Approved_Quotation.pdf');
  const quotationFileSize = String(data.quotationFileSize || '1.5 MB');
  const quotationBadgeText = String(data.quotationBadgeText || 'Signed & Stamped');
  const quotationValidityDate = String(data.quotationValidityDate || '31/12/2026');
  const quotationIsRevised = Boolean(data.quotationIsRevised);
  const codaRef = String(data.codaRef || 'CODA-PR-88201');
  const costMYR = Number(data.costMYR) || 0;

  const attachments = fallbackPR?.attachments
    ? fallbackPR.attachments.map((att) =>
        att.type === 'PDF'
          ? {
              ...att,
              fileName: quotationFileName,
              fileSize: quotationFileSize,
              badgeText: quotationBadgeText,
              validityDate: quotationValidityDate,
              quotationRef,
              isRevised: quotationIsRevised,
            }
          : att
      )
    : [
        {
          id: `att-${data.id}-1`,
          fileName: quotationFileName,
          fileSize: quotationFileSize,
          type: 'PDF' as const,
          badgeText: quotationBadgeText,
          badgeTone: quotationBadgeText.toLowerCase().includes('warning')
            ? ('warning' as const)
            : ('verified' as const),
          validityDate: quotationValidityDate,
          quotationRef,
          isRevised: quotationIsRevised,
          lineItems: [
            {
              description: `${data.title} — Approved Scope (${data.vendorName})`,
              qty: 1,
              unitPriceMYR: costMYR,
              totalMYR: costMYR,
            },
          ],
        },
        {
          id: `att-${data.id}-2`,
          fileName: `Coda_Approval_Summary_${data.id}.json`,
          fileSize: '14 KB',
          type: 'JSON' as const,
          badgeText: 'System Log',
          badgeTone: 'system' as const,
          jsonPayload: JSON.stringify(
            {
              codaPreApprovalId: codaRef,
              prNumber: data.id,
              department: data.department,
              budgetRefNo: data.costCenter,
              glAccount: data.glAccountCode,
              totalApprovedMYR: costMYR,
            },
            null,
            2
          ),
        },
      ];

  const amendmentDiff =
    data.amendmentPrevRemarks && data.amendmentReturnedBy && data.amendmentBuyerNote
      ? {
          previousReturnRemarks: String(data.amendmentPrevRemarks),
          returnedBy: String(data.amendmentReturnedBy),
          buyerAmendmentNote: String(data.amendmentBuyerNote),
          resubmittedAtMYT: String(data.amendmentResubmittedAt || data.lastUpdatedMYT),
          updatedFileName: data.amendmentUpdatedFile ? String(data.amendmentUpdatedFile) : undefined,
        }
      : fallbackPR?.amendmentDiff;

  return {
    id: String(data.id),
    title: String(data.title),
    vendorName: String(data.vendorName),
    department: String(data.department),
    departmentUnitHeader: String(data.departmentUnitHeader || data.department),
    requestor: String(data.requestor),
    costMYR,
    status: data.status,
    lastUpdatedMYT: String(data.lastUpdatedMYT),
    slaHoursElapsed: Number(data.slaHoursElapsed) || 0,
    glAccountCode: String(data.glAccountCode),
    costCenter: String(data.costCenter),
    codaRef,
    businessJustification: String(data.businessJustification),
    returnRemarks: data.returnRemarks ? String(data.returnRemarks) : undefined,
    returnedBy: data.returnedBy ? String(data.returnedBy) : undefined,
    rejectionRemarks: data.rejectionRemarks ? String(data.rejectionRemarks) : undefined,
    rejectedBy: data.rejectedBy ? String(data.rejectedBy) : undefined,
    amendmentDiff,
    attachments,
    auditTrail: auditLogs.length > 0 ? auditLogs : fallbackPR?.auditTrail || [],
  };
}

export async function seedInitialPRsToFirestore(prs: PurchaseRequisition[], user: User) {
  for (const pr of prs) {
    await saveNewPRToFirestore(pr, user);
  }
}

export async function deleteAllUserPRsInFirestore(user: User) {
  const path = 'requisitions';
  try {
    const q = query(collection(db, 'requisitions'), where('ownerId', '==', user.uid));
    const snap = await getDocs(q);
    for (const prDoc of snap.docs) {
      const prId = prDoc.id;
      const logsQ = query(
        collection(db, 'requisitions', prId, 'auditLogs'),
        where('ownerId', '==', user.uid)
      );
      const logsSnap = await getDocs(logsQ);
      for (const logDoc of logsSnap.docs) {
        await deleteDoc(doc(db, 'requisitions', prId, 'auditLogs', logDoc.id));
      }
      await deleteDoc(doc(db, 'requisitions', prId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRoleAssignmentToFirestore(
  assignment: UserRoleAssignment,
  user: User,
  isUpdate: boolean
) {
  const safeId = clampStr(assignment.id.replace(/[^a-zA-Z0-9_-]/g, '-'), 128, `role-${Date.now()}`);
  const path = `roleAssignments/${safeId}`;
  try {
    if (isUpdate) {
      await updateDoc(doc(db, 'roleAssignments', safeId), {
        email: clampStr(assignment.email.toLowerCase(), 200),
        displayName: clampStr(assignment.displayName, 200),
        roleId: assignment.roleId,
        updatedAtMYT: clampStr(assignment.updatedAtMYT, 64),
        updatedBy: clampStr(assignment.updatedBy, 200),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'roleAssignments', safeId), {
        id: safeId,
        ownerId: clampStr(user.uid, 128),
        email: clampStr(assignment.email.toLowerCase(), 200),
        displayName: clampStr(assignment.displayName, 200),
        roleId: assignment.roleId,
        updatedAtMYT: clampStr(assignment.updatedAtMYT, 64),
        updatedBy: clampStr(assignment.updatedBy, 200),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteRoleAssignmentFromFirestore(assignmentId: string) {
  const safeId = clampStr(assignmentId.replace(/[^a-zA-Z0-9_-]/g, '-'), 128);
  const path = `roleAssignments/${safeId}`;
  try {
    await deleteDoc(doc(db, 'roleAssignments', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
};
export type { User };
