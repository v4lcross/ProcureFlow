import { PurchaseRequisition, RoleDefinition, RoleId, WorkflowConfig } from '../types/pr';

export const ROLES: Record<RoleId, RoleDefinition> = {
  L0: {
    id: 'L0',
    shortTag: 'BUYER',
    dropdownLabel: 'Buyer: (Level 0 - Owner)',
    actorName: '',
    backupActorName: 'Hafizah (Backup Buyer)',
    roleTitle: 'Buyer (Level 0 - Owner)',
    levelNumber: 0,
    bannerTitle: 'Buyer (Level 0 - Owner)',
    bannerDescription:
      'Buyer perspective: Fresh Coda PRs start at Level 0 in your queue. Inspect via Side Viewing, submit to Level 1, and send targeted reminders to active approvers.',
  },
  L1: {
    id: 'L1',
    shortTag: 'LEVEL 1',
    dropdownLabel: 'Level 1: Doc Checker',
    actorName: '',
    backupActorName: 'Deputy Doc Checker (Level 1)',
    roleTitle: 'Initial Reviewer / Doc Checker (Level 1)',
    levelNumber: 1,
    bannerTitle: 'Initial Reviewer / Doc Checker (Level 1)',
    bannerDescription:
      'Level 1 perspective: Inspect submitted PRs in Side Viewing, verify vendor quotation & Coda signoff logs, then Approve to Level 2, Return to Buyer (with mandatory remarks), or Reject.',
  },
  L2: {
    id: 'L2',
    shortTag: 'LEVEL 2',
    dropdownLabel: 'Level 2: Head Unit',
    actorName: '',
    backupActorName: 'Deputy Head Unit (Level 2)',
    roleTitle: 'Head Unit Reviewer (Level 2)',
    levelNumber: 2,
    bannerTitle: 'Head Unit Reviewer (Level 2)',
    bannerDescription:
      'Level 2 perspective: Review Level 1-verified requisitions, validate cost center budget & justification, then Approve to Level 3 (GGM, GCAS), Return to Buyer, or Reject.',
  },
  L3: {
    id: 'L3',
    shortTag: 'LEVEL 3',
    dropdownLabel: 'Level 3: GGM, GCAS',
    actorName: '',
    backupActorName: 'Acting GGM, GCAS (Level 3)',
    roleTitle: 'GGM, GCAS (Level 3 - Final Signoff)',
    levelNumber: 3,
    bannerTitle: 'GGM, GCAS (Level 3 - Final Signoff)',
    bannerDescription:
      'Level 3 perspective: Perform final executive signoff on Head Unit-approved requisitions to mark them Fully Approved, or Return to Buyer / Reject with mandatory remarks.',
  },
};

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enableThresholdFastTrack: false,
  fastTrackThresholdMYR: 25000,
  delegationActive: {
    L1: false,
    L2: false,
    L3: false,
  },
};

export function getEffectiveApproverName(
  roleId: RoleId,
  config: WorkflowConfig,
  customRoles?: Record<RoleId, RoleDefinition>
): { name: string; isDelegated: boolean; fullLabel: string } {
  const role = customRoles ? customRoles[roleId] : ROLES[roleId];
  const fallbackLabel =
    roleId === 'L1'
      ? 'Level 1 (Doc Checker)'
      : roleId === 'L2'
      ? 'Level 2 (Head Unit)'
      : roleId === 'L3'
      ? 'Level 3 (GGM, GCAS)'
      : 'Buyer (Level 0)';
  const primaryName = role.actorName || fallbackLabel;

  if (roleId !== 'L0' && config.delegationActive[roleId]) {
    return {
      name: role.backupActorName,
      isDelegated: true,
      fullLabel: `${role.backupActorName} [Delegated for ${primaryName}]`,
    };
  }
  return {
    name: primaryName,
    isDelegated: false,
    fullLabel: role.actorName ? `${role.actorName} (${role.roleTitle})` : role.roleTitle,
  };
}

export function formatMYTTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return `${day}/${month}/${year}, ${hour}:${minute}:${second} MYT`;
}

export function formatMYTClock(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

export function formatCurrencyMYR(amount: number, prefix: 'RM' | 'MYR' = 'RM'): string {
  return `${prefix} ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const INITIAL_PRS: PurchaseRequisition[] = [
  {
    id: 'PR-2026-089',
    title: 'Server Rack Upgrade Phase 2',
    vendorName: 'Informatix Tech Sdn Bhd',
    department: 'Enterprise Infrastructure (IT Infra)',
    departmentUnitHeader: 'Enterprise Infrastructure Unit',
    requestor: 'Farid (IT Infra)',
    costMYR: 45200.0,
    status: 'LEVEL_0_FRESH',
    lastUpdatedMYT: '29/09/2026, 08:30:15 MYT',
    slaHoursElapsed: 4.3,
    glAccountCode: '600-4210-ITCAPEX',
    costCenter: 'CC-MY-KUL-042 (Infra)',
    codaRef: 'CODA-REQ-88419',
    businessJustification:
      'Expansion of primary data centre switch stack to accommodate Phase 2 server migration.',
    attachments: [
      {
        id: 'att-089-1',
        type: 'PDF',
        fileName: 'Approved_Quotation_VendorA.pdf',
        fileSize: '1.8 MB',
        badgeText: 'Signed & Stamped',
        validityDate: '31/10/2026',
        quotationRef: 'QT-INF-2026-0912',
        lineItems: [
          {
            description: '42U Enterprise Server Rack Cabinet w/ Dual PDU & Cable Management',
            qty: 4,
            unitPrice: 7800,
            total: 31200,
          },
          {
            description: 'High-Density Top-of-Rack Patch Panel & Fiber Tray Kit',
            qty: 4,
            unitPrice: 2250,
            total: 9000,
          },
          {
            description: 'On-Site Data Centre Installation, Grounding & Testing (Kuala Lumpur)',
            qty: 1,
            unitPrice: 5000,
            total: 5000,
          },
        ],
      },
      {
        id: 'att-089-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '340 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'Technical Spec Verification',
            actor: 'Farid (Lead Infra Engineer)',
            timestamp: '28/09/2026, 14:12:04 MYT',
            status: 'Verified in Coda',
          },
          {
            step: 'IT Capex Budget Reservation',
            actor: 'Siti Aminah (IT Finance Controller)',
            timestamp: '28/09/2026, 17:40:22 MYT',
            status: 'Pre-Approved',
          },
          {
            step: 'Exported to PR Approval Router (Level 0 Queue)',
            actor: 'Coda Sync Webhook',
            timestamp: '29/09/2026, 08:30:15 MYT',
            status: 'Dispatched to Buyer',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-089-1',
        timestamp: '28/09/2026, 17:40:22 MYT',
        actorName: 'Siti Aminah',
        actorRole: 'Coda Pre-Approval System',
        actionTitle: 'Coda Pre-Approval Completed',
        remarks:
          'Pre-approved Coda PR CODA-REQ-88419 with verified vendor quotation QT-INF-2026-0912.',
        eventType: 'IMPORT',
      },
      {
        id: 'aud-089-2',
        timestamp: '29/09/2026, 08:30:15 MYT',
        actorName: 'Coda Integration Bridge',
        actorRole: 'System (Automated)',
        actionTitle: 'Assigned to Level 0 Fresh PR Queue',
        remarks:
          'Initialized at Level 0: Fresh PR under Buyer (Owner / Dispatcher) for inspection and routing submission.',
        eventType: 'IMPORT',
      },
    ],
  },
  {
    id: 'PR-2026-088',
    title: 'Cisco Core Switch Replacement',
    vendorName: 'Netlink Systems Malaysia',
    department: 'Network Operations',
    departmentUnitHeader: 'Network Operations Unit',
    requestor: 'Hafiz (NetOps)',
    costMYR: 18500.0,
    status: 'LEVEL_0_FRESH',
    lastUpdatedMYT: '29/09/2026, 08:45:00 MYT',
    slaHoursElapsed: 4.1,
    glAccountCode: '600-4215-NETHW',
    costCenter: 'CC-MY-KUL-019 (NetOps)',
    codaRef: 'CODA-REQ-88412',
    businessJustification:
      'Replacement of end-of-support core distribution switch at Bangsar South POP to guarantee 99.99% uptime SLA.',
    attachments: [
      {
        id: 'att-088-1',
        type: 'PDF',
        fileName: 'Approved_Quotation_NetlinkMY.pdf',
        fileSize: '1.4 MB',
        badgeText: 'Signed & Stamped',
        validityDate: '15/11/2026',
        quotationRef: 'NL-MY-2026-4410',
        lineItems: [
          {
            description: 'Cisco Catalyst 9300 24-Port Managed Layer 3 Core Switch',
            qty: 1,
            unitPrice: 14800,
            total: 14800,
          },
          {
            description: 'SmartNet Total Care 3-Year 24x7x4 Hardware Support',
            qty: 1,
            unitPrice: 3700,
            total: 3700,
          },
        ],
      },
      {
        id: 'att-088-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '295 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'Network Architecture Signoff',
            actor: 'Hafiz (Senior Network Engineer)',
            timestamp: '28/09/2026, 16:05:10 MYT',
            status: 'Verified in Coda',
          },
          {
            step: 'Exported to PR Approval Router (Level 0 Queue)',
            actor: 'Coda Sync Webhook',
            timestamp: '29/09/2026, 08:45:00 MYT',
            status: 'Dispatched to Buyer',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-088-1',
        timestamp: '29/09/2026, 08:45:00 MYT',
        actorName: 'Coda Integration Bridge',
        actorRole: 'System (Automated)',
        actionTitle: 'Imported Coda Requisition to Level 0 Queue',
        remarks:
          'Coda Ref CODA-REQ-88412 queued as Level 0: Fresh PR in Buyer queue. Ready for Side Viewing inspection.',
        eventType: 'IMPORT',
      },
    ],
  },
  {
    id: 'PR-2026-082',
    title: 'Annual Cloud Infrastructure License',
    vendorName: 'Amazon Web Services Malaysia Sdn Bhd',
    department: 'Digital Platforms Unit',
    departmentUnitHeader: 'Digital Platforms Unit',
    requestor: 'Nadia (Cloud Ops)',
    costMYR: 124000.0,
    status: 'PENDING_L2',
    lastUpdatedMYT: '29/09/2026, 10:45:10 MYT',
    slaHoursElapsed: 19.5,
    glAccountCode: '500-3100-CLOUDSV',
    costCenter: 'CC-MY-KUL-108 (Digital)',
    codaRef: 'CODA-REQ-88390',
    businessJustification:
      'Annual reserved instance commitment for production Kubernetes clusters and managed RDS databases in ap-southeast-1 & Malaysia Local Zone.',
    attachments: [
      {
        id: 'att-082-1',
        type: 'PDF',
        fileName: 'AWS_Enterprise_Renewal_Quote_2026.pdf',
        fileSize: '2.1 MB',
        badgeText: 'Signed & Stamped',
        validityDate: '30/10/2026',
        quotationRef: 'AWS-MY-ENT-88390',
        lineItems: [
          {
            description: 'Production EKS Compute Savings Plan (12-Month All Upfront)',
            qty: 1,
            unitPrice: 82000,
            total: 82000,
          },
          {
            description: 'Multi-AZ Relational Database Reserved Nodes & Snapshot Storage',
            qty: 1,
            unitPrice: 42000,
            total: 42000,
          },
        ],
      },
      {
        id: 'att-082-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '410 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'FinOps Reserved Capacity Audit',
            actor: 'Nadia (Cloud Platform Lead)',
            timestamp: '28/09/2026, 11:20:00 MYT',
            status: 'Verified in Coda',
          },
          {
            step: 'Exported to PR Approval Router (Level 0 Queue)',
            actor: 'Coda Sync Webhook',
            timestamp: '29/09/2026, 08:10:00 MYT',
            status: 'Dispatched to Buyer',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-082-1',
        timestamp: '29/09/2026, 09:15:22 MYT',
        actorName: 'Buyer',
        actorRole: 'Buyer (Level 0)',
        actionTitle: 'Submitted Pre-Approved PR for Routing',
        remarks: 'Moved status from Level 0 Fresh PR to Pending Level 1 Review.',
        eventType: 'SUBMIT_L1',
      },
      {
        id: 'aud-082-2',
        timestamp: '29/09/2026, 10:45:10 MYT',
        actorName: 'Doc Checker (Level 1)',
        actorRole: 'Doc Checker - Level 1',
        actionTitle: 'Approved at Level 1',
        remarks:
          'Verified quotation validity and Coda workflow signoff. Advanced to Level 2 (Head Unit Reviewer).',
        eventType: 'APPROVE_L1',
      },
    ],
  },
  {
    id: 'PR-2026-079',
    title: 'Developer Laptops (Batch 4 - 20 Units)',
    vendorName: 'Dell Global Business Center Sdn Bhd',
    department: 'Engineering & Technology',
    departmentUnitHeader: 'Engineering & Technology Unit',
    requestor: 'Chong (Eng Lead)',
    costMYR: 86000.0,
    status: 'PENDING_L3',
    lastUpdatedMYT: '29/09/2026, 09:10:00 MYT',
    slaHoursElapsed: 22.8,
    glAccountCode: '600-4100-ENDUSER',
    costCenter: 'CC-MY-KUL-077 (Eng)',
    codaRef: 'CODA-REQ-88354',
    businessJustification:
      'Hardware refresh for 20 senior software engineers joining Q4 platform modernization squad (32GB RAM, ProSupport Plus).',
    attachments: [
      {
        id: 'att-079-1',
        type: 'PDF',
        fileName: 'Approved_Quotation_DellMY_Batch4.pdf',
        fileSize: '1.6 MB',
        badgeText: 'Signed & Stamped',
        validityDate: '25/10/2026',
        quotationRef: 'DELL-MY-Q4-7721',
        lineItems: [
          {
            description: 'Dell Latitude 7450 Ultralight (Core Ultra 7, 32GB RAM, 1TB NVMe)',
            qty: 20,
            unitPrice: 4100,
            total: 82000,
          },
          {
            description: 'Dell Thunderbolt 4 Dock WD22TB4 Corporate Bundle',
            qty: 20,
            unitPrice: 200,
            total: 4000,
          },
        ],
      },
      {
        id: 'att-079-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '380 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'IT Asset Inventory Allocation Check',
            actor: 'Chong (Engineering Lead)',
            timestamp: '27/09/2026, 15:00:00 MYT',
            status: 'Verified in Coda',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-079-1',
        timestamp: '28/09/2026, 11:05:14 MYT',
        actorName: 'Buyer',
        actorRole: 'Buyer (Level 0)',
        actionTitle: 'Submitted Pre-Approved PR for Routing',
        remarks: 'Moved status from Level 0 Fresh PR to Pending Level 1 Review.',
        eventType: 'SUBMIT_L1',
      },
      {
        id: 'aud-079-2',
        timestamp: '28/09/2026, 14:30:40 MYT',
        actorName: 'Doc Checker (Level 1)',
        actorRole: 'Doc Checker - Level 1',
        actionTitle: 'Approved at Level 1',
        remarks: 'Dell corporate quotation & Coda asset forms verified. Advanced to Level 2.',
        eventType: 'APPROVE_L1',
      },
      {
        id: 'aud-079-3',
        timestamp: '29/09/2026, 09:10:00 MYT',
        actorName: 'Head Unit (Level 2)',
        actorRole: 'Head Unit Reviewer - Level 2',
        actionTitle: 'Approved at Level 2',
        remarks:
          'Headcount and Q4 engineering CAPEX budget confirmed. Advanced to Level 3 (GGM, GCAS Final Signoff).',
        eventType: 'APPROVE_L2',
      },
    ],
  },
  {
    id: 'PR-2026-075',
    title: 'Data Center HVAC Preventative Maintenance',
    vendorName: 'CoolTech Air Conditioning Services',
    department: 'Facilities & Real Estate',
    departmentUnitHeader: 'Facilities & Real Estate Unit',
    requestor: 'Zulkifli (Facilities)',
    costMYR: 12300.0,
    status: 'RETURNED_TO_BUYER',
    lastUpdatedMYT: '28/09/2026, 16:22:45 MYT',
    slaHoursElapsed: 26.5,
    glAccountCode: '500-2290-FACMAINT',
    costCenter: 'CC-MY-KUL-005 (Facilities)',
    codaRef: 'CODA-REQ-88310',
    businessJustification:
      'Quarterly CRAC precision cooling chemical servicing, compressor pressure calibration, and chilled water valve inspection.',
    returnRemarks:
      'Vendor quotation validity date expired yesterday. Please obtain an updated quotation letter before re-routing to Head Unit.',
    returnedBy: 'Doc Checker - Level 1',
    attachments: [
      {
        id: 'att-075-1',
        type: 'PDF',
        fileName: 'Approved_Quotation_CoolTech_HVAC.pdf',
        fileSize: '1.1 MB',
        badgeText: 'Requires Renewal',
        validityDate: '27/09/2026 (Expired)',
        quotationRef: 'CT-HVAC-2026-118',
        lineItems: [
          {
            description: 'CRAC Precision Cooling Unit Comprehensive Servicing (6 Units)',
            qty: 6,
            unitPrice: 1800,
            total: 10800,
          },
          {
            description: '24/7 Emergency Callout Retainer & Refrigerant Top-Up',
            qty: 1,
            unitPrice: 1500,
            total: 1500,
          },
        ],
      },
      {
        id: 'att-075-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '310 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'Facilities Maintenance Schedule Signoff',
            actor: 'Zulkifli (Facilities Manager)',
            timestamp: '27/09/2026, 10:15:00 MYT',
            status: 'Verified in Coda',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-075-1',
        timestamp: '28/09/2026, 10:12:00 MYT',
        actorName: 'Buyer',
        actorRole: 'Buyer (Level 0)',
        actionTitle: 'Submitted Pre-Approved PR for Routing',
        remarks: 'Moved status from Level 0 Fresh PR to Pending Level 1 Review.',
        eventType: 'SUBMIT_L1',
      },
      {
        id: 'aud-075-2',
        timestamp: '28/09/2026, 16:22:45 MYT',
        actorName: 'Doc Checker (Level 1)',
        actorRole: 'Doc Checker - Level 1',
        actionTitle: 'Returned to Buyer (Level 0)',
        remarks:
          'Vendor quotation validity date expired yesterday. Please obtain an updated quotation letter before re-routing to Head Unit.',
        eventType: 'RETURN_TO_BUYER',
      },
    ],
  },
  {
    id: 'PR-2026-068',
    title: 'ERP Accounting Integration Module',
    vendorName: 'Enterprise Solutions Tech MY',
    department: 'Finance & Accounts',
    departmentUnitHeader: 'Finance & Accounts Unit',
    requestor: 'Mei Ling (Finance)',
    costMYR: 64500.0,
    status: 'FULLY_APPROVED',
    lastUpdatedMYT: '26/09/2026, 15:40:12 MYT',
    slaHoursElapsed: 18.6,
    glAccountCode: '600-4500-FINERP',
    costCenter: 'CC-MY-KUL-002 (Finance)',
    codaRef: 'CODA-REQ-88240',
    businessJustification:
      'Automated e-Invoicing LHDN MyInvois API connector and automated Coda-to-SAP general ledger reconciliation module.',
    attachments: [
      {
        id: 'att-068-1',
        type: 'PDF',
        fileName: 'Approved_Quotation_EnterpriseSolutions.pdf',
        fileSize: '2.4 MB',
        badgeText: 'Signed & Stamped',
        validityDate: '31/12/2026',
        quotationRef: 'EST-MY-2026-068',
        lineItems: [
          {
            description: 'LHDN MyInvois Middleware Connector & Real-Time Validation Engine',
            qty: 1,
            unitPrice: 44500,
            total: 44500,
          },
          {
            description: 'SAP GL Integration, UAT Sandboxing & User Training',
            qty: 1,
            unitPrice: 20000,
            total: 20000,
          },
        ],
      },
      {
        id: 'att-068-2',
        type: 'LOG',
        fileName: 'Coda_Workflow_Approval_Log.pdf',
        fileSize: '450 KB',
        badgeText: 'Automated Coda Export',
        codaSteps: [
          {
            step: 'Finance Compliance & Tax Audit',
            actor: 'Mei Ling (Head of Tax & ERP)',
            timestamp: '24/09/2026, 09:30:00 MYT',
            status: 'Verified in Coda',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-068-1',
        timestamp: '25/09/2026, 09:00:18 MYT',
        actorName: 'Buyer',
        actorRole: 'Buyer (Level 0)',
        actionTitle: 'Submitted Pre-Approved PR for Routing',
        remarks: 'Moved status from Level 0 Fresh PR to Pending Level 1 Review.',
        eventType: 'SUBMIT_L1',
      },
      {
        id: 'aud-068-2',
        timestamp: '25/09/2026, 11:45:02 MYT',
        actorName: 'Doc Checker (Level 1)',
        actorRole: 'Doc Checker - Level 1',
        actionTitle: 'Approved at Level 1',
        remarks: 'Quotation, SST registration, and Coda signoff verified. Advanced to Level 2.',
        eventType: 'APPROVE_L1',
      },
      {
        id: 'aud-068-3',
        timestamp: '26/09/2026, 10:18:55 MYT',
        actorName: 'Head Unit (Level 2)',
        actorRole: 'Head Unit Reviewer - Level 2',
        actionTitle: 'Approved at Level 2',
        remarks: 'Mandatory LHDN e-Invoice compliance project approved. Advanced to Level 3 (GGM).',
        eventType: 'APPROVE_L2',
      },
      {
        id: 'aud-068-4',
        timestamp: '26/09/2026, 15:40:12 MYT',
        actorName: 'GGM, GCAS (Level 3)',
        actorRole: 'GGM, GCAS - Level 3',
        actionTitle: 'Final Signoff — Fully Approved',
        remarks:
          'Executive signoff granted at Level 3. Requisition is Fully Approved for PO issuance.',
        eventType: 'APPROVE_L3',
      },
    ],
  },
];

export const SAMPLE_NEW_CODA_PRS: Omit<
  PurchaseRequisition,
  'id' | 'status' | 'lastUpdatedMYT' | 'auditTrail' | 'attachments'
>[] = [
  {
    title: 'SOC 24/7 Threat Detection SIEM Upgrade',
    vendorName: 'CyberShield Security Sdn Bhd',
    department: 'Cybersecurity & Risk',
    departmentUnitHeader: 'Cybersecurity & Risk Unit',
    requestor: 'Azlan (SecOps)',
    costMYR: 58400.0,
    slaHoursElapsed: 0.5,
    glAccountCode: '600-4310-CYBERSEC',
    costCenter: 'CC-MY-KUL-088 (SecOps)',
    codaRef: 'CODA-REQ-88455',
    businessJustification:
      'Expansion of log ingestion license and automated SOAR playbook module for Media Prima cloud properties.',
  },
  {
    title: 'Broadcast Studio LED Lighting Grid Retrofit',
    vendorName: 'Lumina Broadcast Engineering MY',
    department: 'Broadcast Production Ops',
    departmentUnitHeader: 'Broadcast Production Unit',
    requestor: 'Rizal (Studio Eng)',
    costMYR: 72900.0,
    slaHoursElapsed: 1.2,
    glAccountCode: '600-4800-STUDIOHW',
    costCenter: 'CC-MY-KUL-031 (Broadcast)',
    codaRef: 'CODA-REQ-88462',
    businessJustification:
      'Energy-efficient DMX LED Fresnel array for Studio B newsroom to reduce studio HVAC thermal load by 35%.',
  },
  {
    title: 'High-Speed NVMe Media Shared Storage Array',
    vendorName: 'Vanguard Media Systems Sdn Bhd',
    department: 'Post-Production & Archives',
    departmentUnitHeader: 'Post-Production Unit',
    requestor: 'Kavitha (Post-Prod)',
    costMYR: 94000.0,
    slaHoursElapsed: 0.8,
    glAccountCode: '600-4290-STORAGE',
    costCenter: 'CC-MY-KUL-054 (PostProd)',
    codaRef: 'CODA-REQ-88479',
    businessJustification:
      '4K multi-stream collaborative editing storage pool for upcoming Q4 broadcast programming.',
  },
];
