/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck2,
  RefreshCw,
  ArrowRight,
  CornerUpLeft,
  Check,
  Search,
  Bell,
  ChevronRight,
  Plus,
  X,
  Download,
  Sliders,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckSquare,
  Send,
  Award,
} from 'lucide-react';
import {
  AuditLogEntry,
  DocumentAttachment,
  FilterTab,
  PurchaseRequisition,
  RoleId,
  SortDirection,
  SortField,
  WorkflowConfig,
} from './types/pr';
import {
  DEFAULT_WORKFLOW_CONFIG,
  INITIAL_PRS,
  ROLES,
  SAMPLE_NEW_CODA_PRS,
  formatCurrencyMYR,
  formatMYTClock,
  formatMYTTimestamp,
  getEffectiveApproverName,
} from './data/initialPRs';
import {
  MiniPipelineProgress,
  SlaTrackerBadge,
  StatusBadge,
} from './components/StatusBadge';
import { SideViewingDrawer } from './components/SideViewingDrawer';
import {
  ApprovalCertificateModal,
  CreateManualPRModal,
  DocumentViewerModal,
  ManualPRFormInput,
  RejectRequisitionModal,
  ReturnToBuyerModal,
  SendReminderModal,
  WorkflowRulesModal,
} from './components/Modals';

const STORAGE_KEY = 'procureflow_pr_router_v2_data';
const ROLE_STORAGE_KEY = 'procureflow_pr_router_v2_role';
const CONFIG_STORAGE_KEY = 'procureflow_pr_router_v2_config';

interface ToastNotification {
  id: string;
  title: string;
  subtitle: string;
}

export default function App() {
  // 1. State initialization with LocalStorage persistence (F06)
  const [prs, setPrs] = useState<PurchaseRequisition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: PurchaseRequisition) => ({
            ...p,
            slaHoursElapsed: typeof p.slaHoursElapsed === 'number' ? p.slaHoursElapsed : 6.5,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to read PRs from LocalStorage:', e);
    }
    return INITIAL_PRS;
  });

  const [activeRoleId, setActiveRoleId] = useState<RoleId>(() => {
    try {
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as RoleId;
      if (savedRole && ROLES[savedRole]) {
        return savedRole;
      }
    } catch (e) {
      console.error(e);
    }
    return 'L0';
  });

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>(() => {
    try {
      const savedCfg = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedCfg) {
        return JSON.parse(savedCfg);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WORKFLOW_CONFIG;
  });

  // Default selected PR is PR-2026-089 so Side Viewing Panel is open on initial load matching Image 1.png
  const [selectedPrId, setSelectedPrId] = useState<string | null>('PR-2026-089');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [needsMyActionOnly, setNeedsMyActionOnly] = useState(false);
  const [slaAtRiskOnly, setSlaAtRiskOnly] = useState(false);

  // Sorting state (UI/UX #5)
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Batch Selection state (Feature #2)
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Live Malaysian Clock (UTC+8)
  const [mytClock, setMytClock] = useState<string>(() => formatMYTClock(new Date()));

  // Toast Notification Banner
  const [toast, setToast] = useState<ToastNotification | null>({
    id: 'init-toast',
    title: 'Perspective Switched',
    subtitle: 'Now operating as Buyer (Level 0 - Owner)',
  });

  // Modals state
  const [returnModalPr, setReturnModalPr] = useState<PurchaseRequisition | null>(null);
  const [rejectModalPr, setRejectModalPr] = useState<PurchaseRequisition | null>(null);
  const [remindModalPr, setRemindModalPr] = useState<PurchaseRequisition | null>(null);
  const [certificatePr, setCertificatePr] = useState<PurchaseRequisition | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isNewPRModalOpen, setIsNewPRModalOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<{
    pr: PurchaseRequisition;
    attachment: DocumentAttachment;
  } | null>(null);

  // Sync PRs to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prs));
    } catch (e) {
      console.error('Failed to save PRs to LocalStorage:', e);
    }
  }, [prs]);

  // Sync Role to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, activeRoleId);
    } catch (e) {
      console.error(e);
    }
  }, [activeRoleId]);

  // Sync Workflow Config to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(workflowConfig));
    } catch (e) {
      console.error(e);
    }
  }, [workflowConfig]);

  // Live MYT Clock ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMytClock(formatMYTClock(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = useCallback((title: string, subtitle: string) => {
    const id = String(Date.now());
    setToast({ id, title, subtitle });
  }, []);

  const activeRole = ROLES[activeRoleId];

  const handleRoleSwitch = useCallback(
    (newRoleId: RoleId) => {
      setActiveRoleId(newRoleId);
      const roleObj = ROLES[newRoleId];
      triggerToast('Perspective Switched', `Now operating as ${roleObj.bannerTitle}`);
    },
    [triggerToast]
  );

  // Helper to check if a PR needs action from the given role
  const isActionableByRole = useCallback((pr: PurchaseRequisition, roleId: RoleId): boolean => {
    if (roleId === 'L0') {
      return pr.status === 'LEVEL_0_FRESH' || pr.status === 'RETURNED_TO_BUYER';
    }
    if (roleId === 'L1') {
      return pr.status === 'PENDING_L1';
    }
    if (roleId === 'L2') {
      return pr.status === 'PENDING_L2';
    }
    if (roleId === 'L3') {
      return pr.status === 'PENDING_L3';
    }
    return false;
  }, []);

  // Live Role Inbox Counts (UI/UX Enhancement #3)
  const roleInboxCounts = useMemo(() => {
    return {
      L0: prs.filter((p) => isActionableByRole(p, 'L0')).length,
      L1: prs.filter((p) => isActionableByRole(p, 'L1')).length,
      L2: prs.filter((p) => isActionableByRole(p, 'L2')).length,
      L3: prs.filter((p) => isActionableByRole(p, 'L3')).length,
    };
  }, [prs, isActionableByRole]);

  // KPI Counts
  const counts = useMemo(() => {
    const freshL0 = prs.filter((p) => p.status === 'LEVEL_0_FRESH').length;
    const inRouting = prs.filter(
      (p) =>
        p.status === 'PENDING_L1' || p.status === 'PENDING_L2' || p.status === 'PENDING_L3'
    ).length;
    const returned = prs.filter((p) => p.status === 'RETURNED_TO_BUYER').length;
    const fullyApproved = prs.filter((p) => p.status === 'FULLY_APPROVED').length;
    const completed = prs.filter(
      (p) => p.status === 'FULLY_APPROVED' || p.status === 'REJECTED'
    ).length;
    const slaAtRisk = prs.filter(
      (p) => p.status !== 'FULLY_APPROVED' && p.status !== 'REJECTED' && p.slaHoursElapsed >= 18
    ).length;

    return {
      all: prs.length,
      freshL0,
      inRouting,
      returned,
      fullyApproved,
      completed,
      slaAtRisk,
    };
  }, [prs]);

  // Filtered & Sorted PR list
  const filteredPrs = useMemo(() => {
    const list = prs.filter((pr) => {
      if (filterTab === 'FRESH_L0' && pr.status !== 'LEVEL_0_FRESH') return false;
      if (
        filterTab === 'IN_ROUTING' &&
        pr.status !== 'PENDING_L1' &&
        pr.status !== 'PENDING_L2' &&
        pr.status !== 'PENDING_L3'
      )
        return false;
      if (filterTab === 'RETURNED' && pr.status !== 'RETURNED_TO_BUYER') return false;
      if (
        filterTab === 'COMPLETED' &&
        pr.status !== 'FULLY_APPROVED' &&
        pr.status !== 'REJECTED'
      )
        return false;

      if (needsMyActionOnly && !isActionableByRole(pr, activeRoleId)) {
        return false;
      }

      if (slaAtRiskOnly) {
        const isClosed = pr.status === 'FULLY_APPROVED' || pr.status === 'REJECTED';
        if (isClosed || pr.slaHoursElapsed < 18) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = pr.id.toLowerCase().includes(q);
        const matchTitle = pr.title.toLowerCase().includes(q);
        const matchVendor = pr.vendorName.toLowerCase().includes(q);
        const matchDept = pr.department.toLowerCase().includes(q);
        const matchCost =
          String(pr.costMYR).includes(q) ||
          formatCurrencyMYR(pr.costMYR).toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchVendor && !matchDept && !matchCost) {
          return false;
        }
      }

      return true;
    });

    if (!sortField) return list;

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id);
      } else if (sortField === 'costMYR') {
        cmp = a.costMYR - b.costMYR;
      } else if (sortField === 'slaHoursElapsed') {
        cmp = a.slaHoursElapsed - b.slaHoursElapsed;
      } else if (sortField === 'lastUpdatedMYT') {
        cmp = a.lastUpdatedMYT.localeCompare(b.lastUpdatedMYT);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [
    prs,
    filterTab,
    needsMyActionOnly,
    slaAtRiskOnly,
    activeRoleId,
    searchQuery,
    sortField,
    sortDirection,
    isActionableByRole,
  ]);

  const selectedPr = useMemo(
    () => prs.find((p) => p.id === selectedPrId) || null,
    [prs, selectedPrId]
  );

  // Toggle Column Sort (UI/UX #5)
  const handleSortColumn = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Action 1: Buyer submits Level 0 (or Returned) PR to Level 1
  const handleSubmitToL1 = useCallback(
    (prId: string, buyerNote?: string) => {
      const nowMYT = formatMYTTimestamp(new Date());
      setPrs((prev) =>
        prev.map((pr) => {
          if (pr.id !== prId) return pr;
          const isResubmit = pr.status === 'RETURNED_TO_BUYER';
          const revisedAttachment = pr.attachments.find((a) => a.isRevised);

          const newAudit: AuditLogEntry = {
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: nowMYT,
            actorName: ROLES.L0.actorName,
            actorRole: 'Buyer (Level 0)',
            actionTitle: isResubmit
              ? 'Rectified & Resubmitted PR to Level 1'
              : 'Submitted Pre-Approved PR for Routing',
            remarks:
              buyerNote ||
              'Moved status from Level 0 Fresh PR to Pending Level 1 Review (Initial Reviewer / Doc Checker).',
            eventType: 'SUBMIT_L1',
          };

          return {
            ...pr,
            status: 'PENDING_L1',
            lastUpdatedMYT: nowMYT,
            slaHoursElapsed: isResubmit ? 1.0 : pr.slaHoursElapsed,
            amendmentDiff:
              isResubmit && pr.returnRemarks
                ? {
                    previousReturnRemarks: pr.returnRemarks,
                    returnedBy: pr.returnedBy || 'Level 1 Approver',
                    buyerAmendmentNote:
                      buyerNote || 'Rectified vendor quotation and Coda details.',
                    resubmittedAtMYT: nowMYT,
                    updatedFileName: revisedAttachment?.fileName,
                  }
                : pr.amendmentDiff,
            returnRemarks: undefined,
            returnedBy: undefined,
            auditTrail: [...pr.auditTrail, newAudit],
          };
        })
      );

      triggerToast(
        `Submitted ${prId} to Level 1`,
        'Assigned to Initial Reviewer / Doc Checker with MYT audit log.'
      );
    },
    [triggerToast]
  );

  // Action 2: Approver (L1, L2, L3) clicks Approve (supports Delegation & Cost Threshold Fast-Track)
  const handleApprovePR = useCallback(
    (prId: string) => {
      const nowMYT = formatMYTTimestamp(new Date());
      setPrs((prev) =>
        prev.map((pr) => {
          if (pr.id !== prId) return pr;

          const isFastTracked =
            workflowConfig.enableThresholdFastTrack &&
            pr.costMYR < workflowConfig.fastTrackThresholdMYR;

          if (pr.status === 'PENDING_L1') {
            const effL1 = getEffectiveApproverName('L1', workflowConfig);
            const newAudit: AuditLogEntry = {
              id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowMYT,
              actorName: effL1.name,
              actorRole: effL1.isDelegated
                ? 'Backup Doc Checker - Level 1 (Delegated)'
                : 'Doc Checker - Level 1',
              actionTitle: 'Approved at Level 1',
              remarks:
                'Verified quotation validity and Coda workflow signoff. Advanced to Level 2 (Head Unit Reviewer).',
              eventType: 'APPROVE_L1',
            };
            triggerToast(
              `${pr.id} Approved at Level 1`,
              `Verified by ${effL1.name}. Advanced to Pending Level 2 Review.`
            );
            return {
              ...pr,
              status: 'PENDING_L2',
              lastUpdatedMYT: nowMYT,
              auditTrail: [...pr.auditTrail, newAudit],
            };
          }

          if (pr.status === 'PENDING_L2') {
            const effL2 = getEffectiveApproverName('L2', workflowConfig);
            if (isFastTracked) {
              const newAudit: AuditLogEntry = {
                id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                timestamp: nowMYT,
                actorName: effL2.name,
                actorRole: effL2.isDelegated
                  ? 'Backup Head Unit - Level 2 (Delegated)'
                  : 'Head Unit Reviewer - Level 2',
                actionTitle: 'Approved at Level 2 (Fast-Track Final Signoff)',
                remarks: `Approved under Fast-Track Cost Threshold (< RM ${workflowConfig.fastTrackThresholdMYR.toLocaleString()}). Marked Fully Approved.`,
                eventType: 'APPROVE_L2',
              };
              triggerToast(
                `${pr.id} Fully Approved (Fast-Track)!`,
                `Below RM ${workflowConfig.fastTrackThresholdMYR.toLocaleString()} threshold — finalized at Level 2.`
              );
              return {
                ...pr,
                status: 'FULLY_APPROVED',
                lastUpdatedMYT: nowMYT,
                auditTrail: [...pr.auditTrail, newAudit],
              };
            }

            const newAudit: AuditLogEntry = {
              id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowMYT,
              actorName: effL2.name,
              actorRole: effL2.isDelegated
                ? 'Backup Head Unit - Level 2 (Delegated)'
                : 'Head Unit Reviewer - Level 2',
              actionTitle: 'Approved at Level 2',
              remarks:
                'Department budget and business justification verified. Advanced to Level 3 (GGM, GCAS Final Signoff).',
              eventType: 'APPROVE_L2',
            };
            triggerToast(
              `${pr.id} Approved at Level 2`,
              `Verified by ${effL2.name}. Advanced to Pending Level 3 Review (GGM, GCAS).`
            );
            return {
              ...pr,
              status: 'PENDING_L3',
              lastUpdatedMYT: nowMYT,
              auditTrail: [...pr.auditTrail, newAudit],
            };
          }

          if (pr.status === 'PENDING_L3') {
            const effL3 = getEffectiveApproverName('L3', workflowConfig);
            const newAudit: AuditLogEntry = {
              id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowMYT,
              actorName: effL3.name,
              actorRole: effL3.isDelegated
                ? 'Acting GGM, GCAS - Level 3 (Delegated)'
                : 'GGM, GCAS - Level 3',
              actionTitle: 'Final Signoff — Fully Approved',
              remarks:
                'Final executive signoff completed by GGM, GCAS. Requisition is Fully Approved.',
              eventType: 'APPROVE_L3',
            };
            triggerToast(
              `${pr.id} Fully Approved!`,
              `Level 3 Final Signoff by ${effL3.name}. Permanent Malaysian timestamp recorded.`
            );
            return {
              ...pr,
              status: 'FULLY_APPROVED',
              lastUpdatedMYT: nowMYT,
              auditTrail: [...pr.auditTrail, newAudit],
            };
          }

          return pr;
        })
      );
    },
    [workflowConfig, triggerToast]
  );

  // Action 3: Approver returns PR to Buyer (Level 0) with mandatory remarks
  const handleConfirmReturn = (remarks: string) => {
    if (!returnModalPr) return;
    const nowMYT = formatMYTTimestamp(new Date());
    const prId = returnModalPr.id;
    const eff = getEffectiveApproverName(activeRole.id, workflowConfig);

    setPrs((prev) =>
      prev.map((pr) => {
        if (pr.id !== prId) return pr;
        const newAudit: AuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestamp: nowMYT,
          actorName: eff.name,
          actorRole: activeRole.roleTitle,
          actionTitle: 'Returned to Buyer (Level 0)',
          remarks: `Mandatory Return Remarks: "${remarks}"`,
          eventType: 'RETURN_TO_BUYER',
        };
        return {
          ...pr,
          status: 'RETURNED_TO_BUYER',
          lastUpdatedMYT: nowMYT,
          returnRemarks: remarks,
          returnedBy: `${eff.name} (${activeRole.shortTag})`,
          auditTrail: [...pr.auditTrail, newAudit],
        };
      })
    );

    setReturnModalPr(null);
    triggerToast(
      `${prId} Returned to Buyer (Level 0)`,
      `Returned by ${eff.name} with mandatory rectification remarks.`
    );
  };

  // Action 4: Approver rejects PR with mandatory remarks
  const handleConfirmReject = (remarks: string) => {
    if (!rejectModalPr) return;
    const nowMYT = formatMYTTimestamp(new Date());
    const prId = rejectModalPr.id;
    const eff = getEffectiveApproverName(activeRole.id, workflowConfig);

    setPrs((prev) =>
      prev.map((pr) => {
        if (pr.id !== prId) return pr;
        const newAudit: AuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestamp: nowMYT,
          actorName: eff.name,
          actorRole: activeRole.roleTitle,
          actionTitle: 'Rejected Requisition',
          remarks: `Rejection Reason: "${remarks}"`,
          eventType: 'REJECT',
        };
        return {
          ...pr,
          status: 'REJECTED',
          lastUpdatedMYT: nowMYT,
          rejectionRemarks: remarks,
          rejectedBy: `${eff.name} (${activeRole.shortTag})`,
          auditTrail: [...pr.auditTrail, newAudit],
        };
      })
    );

    setRejectModalPr(null);
    triggerToast(`${prId} Rejected`, `Routing terminated by ${eff.name}.`);
  };

  // Action 5: Stage-Aware Reminder Dispatch (F04 + Delegation support)
  const dispatchStageAwareReminder = useCallback(
    (pr: PurchaseRequisition, customNote?: string) => {
      const nowMYT = formatMYTTimestamp(new Date());
      let levelNum = 1;
      let approverTitle = 'Initial Reviewer / Document Checker';
      let approverName = getEffectiveApproverName('L1', workflowConfig).name;

      if (pr.status === 'PENDING_L1') {
        levelNum = 1;
        approverTitle = 'Initial Reviewer / Document Checker';
        approverName = getEffectiveApproverName('L1', workflowConfig).name;
      } else if (pr.status === 'PENDING_L2') {
        levelNum = 2;
        approverTitle = 'Head Unit Reviewer';
        approverName = getEffectiveApproverName('L2', workflowConfig).name;
      } else if (pr.status === 'PENDING_L3') {
        levelNum = 3;
        approverTitle = 'GGM, GCAS';
        approverName = getEffectiveApproverName('L3', workflowConfig).name;
      }

      const newAudit: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowMYT,
        actorName: ROLES.L0.actorName,
        actorRole: 'Buyer (Level 0)',
        actionTitle: `Triggered Reminder to Level ${levelNum} Approver`,
        targetRecipient: `${approverTitle} (${approverName})`,
        remarks:
          customNote ||
          `Target Recipient: ${approverTitle} (${approverName}). Notification sent.`,
        eventType: 'REMINDER',
      };

      setPrs((prev) =>
        prev.map((item) => {
          if (item.id !== pr.id) return item;
          return {
            ...item,
            lastUpdatedMYT: nowMYT,
            auditTrail: [...item.auditTrail, newAudit],
          };
        })
      );

      triggerToast(
        `Reminder sent to ${approverTitle} at Level ${levelNum}`,
        `Recipient: ${approverName} • Logged to ${pr.id} audit trail (${nowMYT})`
      );
    },
    [workflowConfig, triggerToast]
  );

  // Feature #3: Upload / Replace Revised Quotation PDF during Rectification
  const handleUploadRevisedQuotation = (prId: string, fileName: string, fileSize: string) => {
    const nowMYT = formatMYTTimestamp(new Date());
    setPrs((prev) =>
      prev.map((pr) => {
        if (pr.id !== prId) return pr;

        const updatedAttachments = pr.attachments.map((att) => {
          if (att.type === 'PDF') {
            return {
              ...att,
              fileName,
              fileSize,
              badgeText: 'Signed & Stamped (Renewed)',
              validityDate: '31/12/2026 (Renewed)',
              isRevised: true,
            };
          }
          return att;
        });

        const newAudit: AuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestamp: nowMYT,
          actorName: ROLES.L0.actorName,
          actorRole: 'Buyer (Level 0)',
          actionTitle: 'Uploaded Revised Vendor Quotation PDF',
          remarks: `Replaced quotation with "${fileName}" (${fileSize}, Valid until 31/12/2026). Ready for re-submission to Level 1.`,
          eventType: 'DOC_UPLOAD',
        };

        return {
          ...pr,
          lastUpdatedMYT: nowMYT,
          attachments: updatedAttachments,
          auditTrail: [...pr.auditTrail, newAudit],
        };
      })
    );

    triggerToast(
      `Revised Quotation Uploaded (${prId})`,
      `${fileName} attached and logged in MYT audit trail.`
    );
  };

  // Feature #2: Batch Operations Execution
  const handleBatchSubmitToL1 = () => {
    const targetPrs = prs.filter(
      (p) =>
        selectedBatchIds.includes(p.id) &&
        (p.status === 'LEVEL_0_FRESH' || p.status === 'RETURNED_TO_BUYER')
    );
    if (targetPrs.length === 0) return;
    targetPrs.forEach((p) => handleSubmitToL1(p.id, 'Batch submitted by Buyer to Level 1.'));
    setSelectedBatchIds([]);
    triggerToast(
      `Batch Submitted ${targetPrs.length} PR(s) to Level 1`,
      `Moved ${targetPrs.map((p) => p.id).join(', ')} to Pending Level 1 Review.`
    );
  };

  const handleBatchRemindApprovers = () => {
    const targetPrs = prs.filter(
      (p) =>
        selectedBatchIds.includes(p.id) &&
        (p.status === 'PENDING_L1' || p.status === 'PENDING_L2' || p.status === 'PENDING_L3')
    );
    if (targetPrs.length === 0) return;
    targetPrs.forEach((p) => dispatchStageAwareReminder(p));
    setSelectedBatchIds([]);
    triggerToast(
      `Batch Dispatched ${targetPrs.length} Reminder(s)`,
      `Sent stage-aware reminders for ${targetPrs.map((p) => p.id).join(', ')}.`
    );
  };

  const handleBatchApprove = () => {
    const targetPrs = prs.filter(
      (p) => selectedBatchIds.includes(p.id) && isActionableByRole(p, activeRoleId)
    );
    if (targetPrs.length === 0) return;
    targetPrs.forEach((p) => handleApprovePR(p.id));
    setSelectedBatchIds([]);
  };

  // Feature #4: Export Full PR & Audit Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'PR Number',
      'Requisition Title',
      'Vendor Name',
      'Department',
      'Requestor',
      'Cost (MYR)',
      'Status',
      'SLA Elapsed (Hours)',
      'GL Account',
      'Cost Center',
      'Coda Ref',
      'Last Updated (MYT)',
      'Audit Log Count',
    ];
    const rows = prs.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.vendorName.replace(/"/g, '""')}"`,
      `"${p.department.replace(/"/g, '""')}"`,
      `"${p.requestor.replace(/"/g, '""')}"`,
      p.costMYR.toFixed(2),
      p.status,
      p.slaHoursElapsed.toFixed(1),
      p.glAccountCode,
      `"${p.costCenter}"`,
      p.codaRef,
      `"${p.lastUpdatedMYT}"`,
      p.auditTrail.length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProcureFlow_PR_Audit_Report_MYT.csv`;
    a.click();
    URL.revokeObjectURL(url);

    triggerToast(
      'Exported CSV Audit Report',
      `Downloaded ${prs.length} PR records with Malaysian timestamps.`
    );
  };

  // Action 6: Import / Simulate a Fresh Level 0 Coda PR (F01 verification)
  const handleImportFreshCodaPR = () => {
    const nowMYT = formatMYTTimestamp(new Date());
    const nextNum = 89 + prs.length - 5;
    const prNumber = `PR-2026-0${nextNum}`;
    const template = SAMPLE_NEW_CODA_PRS[prs.length % SAMPLE_NEW_CODA_PRS.length];

    const newPr: PurchaseRequisition = {
      id: prNumber,
      ...template,
      status: 'LEVEL_0_FRESH',
      lastUpdatedMYT: nowMYT,
      attachments: [
        {
          id: `att-${Date.now()}-1`,
          type: 'PDF',
          fileName: `Approved_Quotation_${prNumber}.pdf`,
          fileSize: '1.5 MB',
          badgeText: 'Signed & Stamped',
          validityDate: '30/11/2026',
          quotationRef: `QT-${prNumber}`,
          lineItems: [
            {
              description: `${template.title} — Primary Enterprise Package`,
              qty: 1,
              unitPrice: template.costMYR,
              total: template.costMYR,
            },
          ],
        },
        {
          id: `att-${Date.now()}-2`,
          type: 'LOG',
          fileName: 'Coda_Workflow_Approval_Log.pdf',
          fileSize: '320 KB',
          badgeText: 'Automated Coda Export',
          codaSteps: [
            {
              step: 'Department Technical Pre-Approval',
              actor: template.requestor,
              timestamp: nowMYT,
              status: 'Verified in Coda',
            },
          ],
        },
      ],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: nowMYT,
          actorName: 'Coda Sync Webhook',
          actorRole: 'System (Automated)',
          actionTitle: 'Imported Coda Requisition to Level 0 Queue',
          remarks: `Initialized as Level 0: Fresh PR under Buyer Ahmad (${template.codaRef}).`,
          eventType: 'IMPORT',
        },
      ],
    };

    setPrs((prev) => [newPr, ...prev]);
    setSelectedPrId(newPr.id);
    setFilterTab('ALL');
    triggerToast(
      `Imported ${newPr.id} at Level 0: Fresh PR`,
      'Added to Buyer Queue and opened in Side Viewing Drawer.'
    );
  };

  // Action 7: Buyer Manually Keys In a New PR (+ New PR Modal)
  const handleCreateManualPR = (data: ManualPRFormInput) => {
    const nowMYT = formatMYTTimestamp(new Date());
    const initialAudit: AuditLogEntry[] = [
      {
        id: `aud-${Date.now()}-1`,
        timestamp: nowMYT,
        actorName: ROLES.L0.actorName,
        actorRole: 'Buyer (Level 0 - Owner)',
        actionTitle: 'Keyed In New Purchase Requisition (Level 0)',
        remarks: `Created manual PR ${data.prNo} for ${data.department} (Budget Ref: ${data.budgetRefNo}, Cost: ${formatCurrencyMYR(
          data.costMYR
        )}).`,
        eventType: 'IMPORT',
      },
    ];

    if (data.submitDirectlyToL1) {
      initialAudit.push({
        id: `aud-${Date.now()}-2`,
        timestamp: nowMYT,
        actorName: ROLES.L0.actorName,
        actorRole: 'Buyer (Level 0 - Owner)',
        actionTitle: 'Submitted Pre-Approved PR for Routing',
        remarks:
          'Submitted directly upon creation from Level 0 to Pending Level 1 Review (Initial Reviewer / Doc Checker).',
        eventType: 'SUBMIT_L1',
      });
    }

    const newPr: PurchaseRequisition = {
      id: data.prNo,
      title: data.title,
      vendorName: data.vendorName,
      department: data.department,
      departmentUnitHeader: data.department.split('(')[0].trim(),
      requestor: data.requestor,
      costMYR: data.costMYR,
      status: data.submitDirectlyToL1 ? 'PENDING_L1' : 'LEVEL_0_FRESH',
      lastUpdatedMYT: nowMYT,
      slaHoursElapsed: 0.1,
      glAccountCode: data.glAccountCode,
      costCenter: data.budgetRefNo,
      codaRef: data.codaRef,
      businessJustification: data.businessJustification,
      attachments: [
        {
          id: `att-${Date.now()}-1`,
          type: 'PDF',
          fileName: data.quotationFileName,
          fileSize: data.quotationFileSize,
          badgeText: 'Signed & Stamped',
          validityDate: data.validityDate,
          quotationRef: data.quotationRef,
          lineItems: [
            {
              description: `${data.title} — Commercial Package`,
              qty: 1,
              unitPrice: data.costMYR,
              total: data.costMYR,
            },
          ],
        },
        {
          id: `att-${Date.now()}-2`,
          type: 'LOG',
          fileName: 'Coda_Workflow_Approval_Log.pdf',
          fileSize: '310 KB',
          badgeText: 'Automated Coda Export',
          codaSteps: [
            {
              step: `Budget Verification (${data.budgetRefNo})`,
              actor: data.requestor,
              timestamp: nowMYT,
              status: 'Verified in Coda',
            },
          ],
        },
      ],
      auditTrail: initialAudit,
    };

    setPrs((prev) => [newPr, ...prev]);
    setSelectedPrId(newPr.id);
    setFilterTab('ALL');
    setIsNewPRModalOpen(false);
    triggerToast(
      data.submitDirectlyToL1
        ? `Created & Submitted ${newPr.id} to Level 1`
        : `Created ${newPr.id} in Level 0 Queue`,
      `${newPr.title} (${formatCurrencyMYR(newPr.costMYR)}) saved with MYT timestamp.`
    );
  };

  // Reset Demo Data
  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    setPrs(INITIAL_PRS);
    setWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
    setSelectedPrId('PR-2026-089');
    setActiveRoleId('L0');
    setFilterTab('ALL');
    setSearchQuery('');
    setNeedsMyActionOnly(false);
    setSlaAtRiskOnly(false);
    setSelectedBatchIds([]);
    triggerToast(
      'Prototype State Reset',
      'Restored default 6 sample PRs across all workflow stages.'
    );
  };

  // UI/UX #2: Global Keyboard Shortcuts (`↑`, `↓`, `S`, `A`, `R`, `M`, `Esc`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (returnModalPr) setReturnModalPr(null);
        else if (rejectModalPr) setRejectModalPr(null);
        else if (remindModalPr) setRemindModalPr(null);
        else if (certificatePr) setCertificatePr(null);
        else if (viewingAttachment) setViewingAttachment(null);
        else if (isRulesModalOpen) setIsRulesModalOpen(false);
        else if (isNewPRModalOpen) setIsNewPRModalOpen(false);
        else setSelectedPrId(null);
        return;
      }

      if (filteredPrs.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const idx = filteredPrs.findIndex((p) => p.id === selectedPrId);
        const nextIdx = idx < filteredPrs.length - 1 ? idx + 1 : 0;
        setSelectedPrId(filteredPrs[nextIdx].id);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const idx = filteredPrs.findIndex((p) => p.id === selectedPrId);
        const prevIdx = idx > 0 ? idx - 1 : filteredPrs.length - 1;
        setSelectedPrId(filteredPrs[prevIdx].id);
      } else if ((e.key === 's' || e.key === 'S') && selectedPr) {
        if (
          activeRoleId === 'L0' &&
          (selectedPr.status === 'LEVEL_0_FRESH' || selectedPr.status === 'RETURNED_TO_BUYER')
        ) {
          e.preventDefault();
          handleSubmitToL1(selectedPr.id);
        }
      } else if ((e.key === 'a' || e.key === 'A') && selectedPr) {
        if (
          (activeRoleId === 'L1' && selectedPr.status === 'PENDING_L1') ||
          (activeRoleId === 'L2' && selectedPr.status === 'PENDING_L2') ||
          (activeRoleId === 'L3' && selectedPr.status === 'PENDING_L3')
        ) {
          e.preventDefault();
          handleApprovePR(selectedPr.id);
        }
      } else if ((e.key === 'r' || e.key === 'R') && selectedPr) {
        if (
          (activeRoleId === 'L1' && selectedPr.status === 'PENDING_L1') ||
          (activeRoleId === 'L2' && selectedPr.status === 'PENDING_L2') ||
          (activeRoleId === 'L3' && selectedPr.status === 'PENDING_L3')
        ) {
          e.preventDefault();
          setReturnModalPr(selectedPr);
        }
      } else if ((e.key === 'm' || e.key === 'M') && selectedPr) {
        if (
          selectedPr.status === 'PENDING_L1' ||
          selectedPr.status === 'PENDING_L2' ||
          selectedPr.status === 'PENDING_L3'
        ) {
          e.preventDefault();
          dispatchStageAwareReminder(selectedPr);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredPrs,
    selectedPrId,
    selectedPr,
    activeRoleId,
    returnModalPr,
    rejectModalPr,
    remindModalPr,
    certificatePr,
    viewingAttachment,
    isRulesModalOpen,
    handleSubmitToL1,
    handleApprovePR,
    dispatchStageAwareReminder,
  ]);

  const allVisibleSelected =
    filteredPrs.length > 0 && filteredPrs.every((p) => selectedBatchIds.includes(p.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(filteredPrs.map((p) => p.id));
    }
  };

  const toggleRowSelection = (prId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId]
    );
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600" />
    );
  };

  const anyDelegationActive =
    workflowConfig.delegationActive.L1 ||
    workflowConfig.delegationActive.L2 ||
    workflowConfig.delegationActive.L3 ||
    workflowConfig.enableThresholdFastTrack;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* 1. TOP DARK HEADER BAR */}
      <header className="bg-[#0B1120] text-white border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight text-white">ProcureFlow</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/90 text-blue-400 border border-slate-700">
                PR Approval Router v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Malaysian Workflow • MYT (UTC+8)</p>
          </div>
        </div>

        {/* Right Controls: Live MYT Clock + Role Switcher + Rules + Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live MYT Clock */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-100">{mytClock} MYT</span>
            <span className="text-slate-400 text-[11px]">(UTC+8)</span>
          </div>

          {/* Active Perspective Selector with Inbox Counts (F06 + UI/UX #3) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1 flex items-center gap-2">
            <label
              htmlFor="role-switcher"
              className="text-xs text-slate-400 whitespace-nowrap"
            >
              Active Perspective:
            </label>
            <select
              id="role-switcher"
              value={activeRoleId}
              onChange={(e) => handleRoleSwitch(e.target.value as RoleId)}
              className="bg-[#0F172A] text-white font-semibold text-xs rounded-md px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="L0">
                Buyer: Ahmad (Level 0 - Owner) [{roleInboxCounts.L0} Actionable]
              </option>
              <option value="L1">
                Level 1: Doc Checker (Sarah) [{roleInboxCounts.L1} Pending]
              </option>
              <option value="L2">
                Level 2: Head Unit (En. Razak) [{roleInboxCounts.L2} Pending]
              </option>
              <option value="L3">
                Level 3: GGM, GCAS (Datuk Farid) [{roleInboxCounts.L3} Pending]
              </option>
            </select>
          </div>

          {/* Feature #5: Workflow Rules & Delegation Button */}
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              anyDelegationActive
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Configure Out-of-Office Delegation & Fast-Track Thresholds"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules & Delegation</span>
            {anyDelegationActive && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={handleResetDemo}
            title="Reset Prototype to Initial 6 PRs"
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. CONTEXTUAL ROLE BANNER BAR + 1-CLICK ROLE INBOX PILLS (UI/UX #3) */}
      <div className="bg-[#EFF6FF] border-b border-blue-200/70 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2.5 text-xs text-blue-900 max-w-3xl">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
            {activeRole.shortTag}
          </span>
          <span className="font-medium leading-snug">{activeRole.bannerDescription}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Role Switcher Pills with Live Inbox Counts */}
          <div className="hidden xl:flex items-center gap-1 bg-blue-100/70 p-1 rounded-lg border border-blue-200/70">
            {(['L0', 'L1', 'L2', 'L3'] as RoleId[]).map((rid) => {
              const r = ROLES[rid];
              const count = roleInboxCounts[rid];
              const isCurrent = activeRoleId === rid;
              return (
                <button
                  key={rid}
                  type="button"
                  onClick={() => handleRoleSwitch(rid)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-blue-900 hover:bg-white/70'
                  }`}
                >
                  <span>{r.shortTag}</span>
                  <span
                    className={`px-1.5 py-0.1 rounded-full font-mono text-[10px] ${
                      isCurrent
                        ? 'bg-white text-blue-700 font-bold'
                        : count > 0
                        ? 'bg-amber-200 text-amber-900 font-bold'
                        : 'bg-blue-200/60 text-blue-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsNewPRModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New PR</span>
          </button>

          <button
            type="button"
            onClick={handleImportFreshCodaPR}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Coda Sync (L0)</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE SPLIT VIEW (Dashboard Left + Side Viewing Drawer Right) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Left Main Dashboard Area */}
        <main className="flex-1 min-w-0 p-6 space-y-5 relative overflow-x-hidden">
          {/* Floating Dark Toast Notification */}
          {toast && (
            <div className="fixed lg:absolute top-2 right-6 z-40 max-w-sm bg-[#0F172A] text-white rounded-xl shadow-xl border border-slate-800 px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <Bell className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-bold text-white leading-tight">{toast.title}</div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  {toast.subtitle}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Fresh PRs (L0) */}
            <button
              type="button"
              onClick={() => setFilterTab('FRESH_L0')}
              className={`text-left bg-white rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer ${
                filterTab === 'FRESH_L0'
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  FRESH PRS (L0)
                </div>
                <div className="text-2xl font-bold font-mono text-[#D97706] mt-1">
                  {counts.freshL0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Owned by Buyer</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-amber-200/70 text-[#B45309] font-bold text-xs flex items-center justify-center shrink-0">
                L0
              </div>
            </button>

            {/* Card 2: In Routing */}
            <button
              type="button"
              onClick={() => setFilterTab('IN_ROUTING')}
              className={`text-left bg-white rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer ${
                filterTab === 'IN_ROUTING'
                  ? 'border-blue-400 ring-2 ring-blue-100'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  IN ROUTING
                </div>
                <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
                  {counts.inRouting}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">L1, L2, L3 Review</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Card 3: Returned to Buyer */}
            <button
              type="button"
              onClick={() => setFilterTab('RETURNED')}
              className={`text-left bg-white rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer ${
                filterTab === 'RETURNED'
                  ? 'border-red-400 ring-2 ring-red-100'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  RETURNED TO BUYER
                </div>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">
                  {counts.returned}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Requires rectification</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200/60 text-red-600 flex items-center justify-center shrink-0">
                <CornerUpLeft className="w-4 h-4" />
              </div>
            </button>

            {/* Card 4: Fully Approved */}
            <button
              type="button"
              onClick={() => setFilterTab('COMPLETED')}
              className={`text-left bg-white rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer ${
                filterTab === 'COMPLETED'
                  ? 'border-emerald-400 ring-2 ring-emerald-100'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  FULLY APPROVED
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                  {counts.fullyApproved}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Signoff complete</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Feature #2: Batch Action Bar when 1+ rows are checked */}
          {selectedBatchIds.length > 0 && (
            <div className="bg-[#0F172A] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-xs">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <span className="font-bold">
                  {selectedBatchIds.length} PR(s) Selected for Batch Action
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({selectedBatchIds.join(', ')})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeRoleId === 'L0' && (
                  <>
                    <button
                      type="button"
                      onClick={handleBatchSubmitToL1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Batch Submit to L1</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchRemindApprovers}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Batch Remind Approvers</span>
                    </button>
                  </>
                )}

                {activeRoleId !== 'L0' && (
                  <button
                    type="button"
                    onClick={handleBatchApprove}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Batch Approve Selected ({activeRole.shortTag})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBatchIds([])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Main PR Table Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Filter Tabs & Search Header */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Quick Filter Tabs (F01) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL' as FilterTab, label: `All PRs (${counts.all})` },
                  {
                    id: 'FRESH_L0' as FilterTab,
                    label: `Fresh PRs (Level 0) (${counts.freshL0})`,
                  },
                  { id: 'IN_ROUTING' as FilterTab, label: `In Routing (${counts.inRouting})` },
                  {
                    id: 'RETURNED' as FilterTab,
                    label: `Returned to Buyer (${counts.returned})`,
                  },
                  { id: 'COMPLETED' as FilterTab, label: `Completed (${counts.completed})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filterTab === tab.id
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search, SLA Filter, Needs My Action & CSV Export */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search PR No., Title, Cost..."
                    className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Feature #1: SLA At Risk / Overdue Filter */}
                <button
                  type="button"
                  onClick={() => setSlaAtRiskOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    slaAtRiskOnly
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Filter PRs approaching or exceeding 24-Hour SLA"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>SLA At Risk ({counts.slaAtRisk})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNeedsMyActionOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    needsMyActionOnly
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      needsMyActionOnly ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                  />
                  <span>Needs My Action ({roleInboxCounts[activeRoleId]})</span>
                </button>

                {/* Feature #4: Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  title="Export PR Table & Audit Trail Report to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewPRModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New PR</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Select all visible PRs for batch operations"
                      />
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortColumn('id')}
                        className="inline-flex items-center gap-1 group cursor-pointer uppercase font-bold"
                      >
                        <span>PR NUMBER</span>
                        {renderSortIcon('id')}
                      </button>
                    </th>
                    <th className="py-3 px-3">REQUISITION TITLE</th>
                    <th className="py-3 px-3">DEPARTMENT / UNIT</th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortColumn('costMYR')}
                        className="inline-flex items-center gap-1 group cursor-pointer uppercase font-bold"
                      >
                        <span>COST (MYR)</span>
                        {renderSortIcon('costMYR')}
                      </button>
                    </th>
                    <th className="py-3 px-3">STATUS / ACTIVE STAGE</th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSortColumn('slaHoursElapsed')}
                        className="inline-flex items-center gap-1 group cursor-pointer uppercase font-bold"
                      >
                        <span>LAST UPDATED / 24H SLA</span>
                        {renderSortIcon('slaHoursElapsed')}
                      </button>
                    </th>
                    <th className="py-3 pl-3 pr-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPrs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No purchase requisitions match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPrs.map((pr) => {
                      const isSelected = pr.id === selectedPrId;
                      const isChecked = selectedBatchIds.includes(pr.id);
                      const actionable = isActionableByRole(pr, activeRoleId);

                      const getPendingShortLevel = () => {
                        if (pr.status === 'PENDING_L1') return 'L1';
                        if (pr.status === 'PENDING_L2') return 'L2';
                        if (pr.status === 'PENDING_L3') return 'L3';
                        return null;
                      };
                      const pendingShort = getPendingShortLevel();

                      return (
                        <tr
                          key={pr.id}
                          onClick={() => setSelectedPrId(pr.id)}
                          className={`group transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/40 border-l-4 border-l-blue-600'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Batch Select Checkbox */}
                          <td
                            className="py-3.5 pl-4 pr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRowSelection(pr.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* PR Number with Actionable Blue Dot */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {actionable && (
                                <span
                                  className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                                  title="Needs your action in current perspective"
                                />
                              )}
                              <span>{pr.id}</span>
                            </div>
                          </td>

                          {/* Requisition Title + Vendor Name */}
                          <td className="py-3.5 px-3 max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate">
                              {pr.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {pr.vendorName}
                            </div>
                          </td>

                          {/* Department / Unit */}
                          <td className="py-3.5 px-3 text-slate-600 max-w-[150px]">
                            <span className="line-clamp-2 leading-snug">{pr.department}</span>
                          </td>

                          {/* Cost (MYR) */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrencyMYR(pr.costMYR)}
                          </td>

                          {/* Status Badge + 4-Dot Mini Pipeline Progress (UI/UX #5) */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <StatusBadge status={pr.status} />
                            <MiniPipelineProgress pr={pr} workflowConfig={workflowConfig} />
                          </td>

                          {/* Last Updated (MYT) + 24h SLA Tracker (Feature #1) */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-mono text-[11px] text-slate-500">
                              {pr.lastUpdatedMYT}
                            </div>
                            <div className="mt-1">
                              <SlaTrackerBadge pr={pr} />
                            </div>
                          </td>

                          {/* Contextual Action Button */}
                          <td
                            className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center justify-end gap-2">
                              {/* Level 0 Fresh PR */}
                              {pr.status === 'LEVEL_0_FRESH' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPrId(pr.id)}
                                  className="px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Ready to Submit
                                </button>
                              )}

                              {/* In Routing: Remind Button for Buyer OR Review Button for Active Approver */}
                              {pendingShort && (
                                <>
                                  {activeRoleId === 'L0' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPrId(pr.id);
                                        dispatchStageAwareReminder(pr);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                      title={`Send targeted reminder to ${pendingShort} approver`}
                                    >
                                      <Bell className="w-3 h-3 text-amber-500 fill-amber-400" />
                                      <span>Remind {pendingShort}</span>
                                    </button>
                                  ) : actionable ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPrId(pr.id)}
                                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                    >
                                      Review & Decide
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPrId(pr.id);
                                        dispatchStageAwareReminder(pr);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
                                    >
                                      <Bell className="w-3 h-3 text-amber-500" />
                                      <span>Remind {pendingShort}</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Returned to Buyer */}
                              {pr.status === 'RETURNED_TO_BUYER' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPrId(pr.id)}
                                  className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Rectify & Resubmit
                                </button>
                              )}

                              {/* Completed / Fully Approved Certificate Action */}
                              {pr.status === 'FULLY_APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => setCertificatePr(pr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Download / Print Official Signoff Certificate"
                                >
                                  <Award className="w-3 h-3 text-emerald-600" />
                                  <span>Certificate</span>
                                </button>
                              )}

                              {pr.status === 'REJECTED' && (
                                <span className="text-slate-300 px-2">—</span>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedPrId(pr.id)}
                                className="text-slate-400 group-hover:text-slate-700 p-1 rounded transition-colors"
                                aria-label="Inspect in Side Viewing Drawer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Dark Prototype Status Banner */}
          <div className="bg-[#0B1120] text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>PR Approval Router Stage 1 + Enhanced Suite Ready</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operational with 24h SLA Tracking, Batch Operations, Revised Quotation Upload (v2),
                Inline Split Document Preview, Official Approval Certificates, Out-of-Office
                Delegation & Fast-Track Cost Thresholds, Column Sorting, and Keyboard Navigation.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono shrink-0">
              <span className="text-slate-400">Storage: </span>
              <span className="text-emerald-400 font-semibold">Saved ({prs.length} PRs)</span>
            </div>
          </div>
        </main>

        {/* Right Side Viewing Drawer */}
        {selectedPr && (
          <SideViewingDrawer
            pr={selectedPr}
            activeRole={activeRole}
            workflowConfig={workflowConfig}
            onClose={() => setSelectedPrId(null)}
            onSubmitToL1={handleSubmitToL1}
            onApprovePR={handleApprovePR}
            onOpenReturnModal={(pr) => setReturnModalPr(pr)}
            onOpenRejectModal={(pr) => setRejectModalPr(pr)}
            onOpenRemindModal={(pr) => setRemindModalPr(pr)}
            onQuickRemindDirect={(pr) => dispatchStageAwareReminder(pr)}
            onViewAttachment={(attachment) =>
              setViewingAttachment({ pr: selectedPr, attachment })
            }
            onUploadRevisedQuotation={handleUploadRevisedQuotation}
            onOpenCertificate={(pr) => setCertificatePr(pr)}
            onSwitchRole={handleRoleSwitch}
          />
        )}
      </div>

      {/* Modals & Dialogs */}
      <ReturnToBuyerModal
        pr={returnModalPr}
        isOpen={Boolean(returnModalPr)}
        activeRole={activeRole}
        onClose={() => setReturnModalPr(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      <RejectRequisitionModal
        pr={rejectModalPr}
        isOpen={Boolean(rejectModalPr)}
        activeRole={activeRole}
        onClose={() => setRejectModalPr(null)}
        onConfirmReject={handleConfirmReject}
      />

      <SendReminderModal
        pr={remindModalPr}
        isOpen={Boolean(remindModalPr)}
        workflowConfig={workflowConfig}
        onClose={() => setRemindModalPr(null)}
        onConfirmRemind={(customMsg) => {
          if (remindModalPr) {
            dispatchStageAwareReminder(remindModalPr, customMsg);
          }
          setRemindModalPr(null);
        }}
      />

      <DocumentViewerModal
        pr={viewingAttachment?.pr || null}
        attachment={viewingAttachment?.attachment || null}
        onClose={() => setViewingAttachment(null)}
      />

      <ApprovalCertificateModal
        pr={certificatePr}
        onClose={() => setCertificatePr(null)}
      />

      <WorkflowRulesModal
        isOpen={isRulesModalOpen}
        config={workflowConfig}
        onUpdateConfig={(newCfg) => {
          setWorkflowConfig(newCfg);
          triggerToast(
            'Workflow Rules Updated',
            'Delegation & Fast-Track Cost Threshold settings applied.'
          );
        }}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <CreateManualPRModal
        isOpen={isNewPRModalOpen}
        suggestedPrNo={`PR-2026-0${89 + prs.length - 5}`}
        existingIds={prs.map((p) => p.id)}
        onClose={() => setIsNewPRModalOpen(false)}
        onCreatePR={handleCreateManualPR}
      />
    </div>
  );
}
