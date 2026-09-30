export type RoleId = 'L0' | 'L1' | 'L2' | 'L3';

export type PRStatus =
  | 'LEVEL_0_FRESH'
  | 'PENDING_L1'
  | 'PENDING_L2'
  | 'PENDING_L3'
  | 'RETURNED_TO_BUYER'
  | 'FULLY_APPROVED'
  | 'REJECTED';

export type FilterTab =
  | 'ALL'
  | 'FRESH_L0'
  | 'IN_ROUTING'
  | 'RETURNED'
  | 'COMPLETED';

export type SortField = 'id' | 'costMYR' | 'lastUpdatedMYT' | 'slaHoursElapsed';
export type SortDirection = 'asc' | 'desc';

export type AuditEventType =
  | 'IMPORT'
  | 'SUBMIT_L1'
  | 'APPROVE_L1'
  | 'APPROVE_L2'
  | 'APPROVE_L3'
  | 'RETURN_TO_BUYER'
  | 'REJECT'
  | 'REMINDER'
  | 'DOC_UPLOAD';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // DD/MM/YYYY, HH:mm:ss MYT
  actorName: string;
  actorRole: string;
  actionTitle: string;
  remarks: string;
  targetRecipient?: string;
  eventType: AuditEventType;
}

export interface QuotationLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface CodaStepItem {
  step: string;
  actor: string;
  timestamp: string;
  status: string;
}

export interface DocumentAttachment {
  id: string;
  type: 'PDF' | 'LOG';
  fileName: string;
  fileSize: string;
  badgeText: string;
  validityDate?: string;
  quotationRef?: string;
  isRevised?: boolean;
  lineItems?: QuotationLineItem[];
  codaSteps?: CodaStepItem[];
}

export interface AmendmentDiff {
  previousReturnRemarks: string;
  returnedBy: string;
  buyerAmendmentNote: string;
  resubmittedAtMYT: string;
  updatedFileName?: string;
}

export interface PurchaseRequisition {
  id: string;
  title: string;
  vendorName: string;
  department: string;
  departmentUnitHeader: string;
  requestor: string;
  costMYR: number;
  status: PRStatus;
  lastUpdatedMYT: string;
  slaHoursElapsed: number; // Out of 24h target SLA
  glAccountCode: string;
  costCenter: string;
  codaRef: string;
  businessJustification: string;
  returnRemarks?: string;
  returnedBy?: string;
  rejectionRemarks?: string;
  rejectedBy?: string;
  amendmentDiff?: AmendmentDiff;
  attachments: DocumentAttachment[];
  auditTrail: AuditLogEntry[];
}

export interface RoleDefinition {
  id: RoleId;
  shortTag: string;
  dropdownLabel: string;
  actorName: string;
  backupActorName: string;
  roleTitle: string;
  levelNumber: number;
  bannerTitle: string;
  bannerDescription: string;
}

export interface WorkflowConfig {
  enableThresholdFastTrack: boolean; // If true, PRs < thresholdMYR complete at Level 2
  fastTrackThresholdMYR: number; // Default RM 25,000
  delegationActive: {
    L1: boolean;
    L2: boolean;
    L3: boolean;
  };
}

export interface UserRoleAssignment {
  id: string;
  email: string;
  displayName: string;
  roleId: RoleId; // 'L0' | 'L1' | 'L2' | 'L3'
  updatedAtMYT: string;
  updatedBy: string;
}
