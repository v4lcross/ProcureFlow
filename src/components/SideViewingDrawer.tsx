import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Clock,
  Info,
  Send,
  Check,
  CornerUpLeft,
  XCircle,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Upload,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Building2,
} from 'lucide-react';
import {
  DocumentAttachment,
  PurchaseRequisition,
  RoleDefinition,
  RoleId,
  WorkflowConfig,
} from '../types/pr';
import {
  formatCurrencyMYR,
  getEffectiveApproverName,
  ROLES,
} from '../data/initialPRs';
import { SlaTrackerBadge, StatusBadge } from './StatusBadge';

interface SideViewingDrawerProps {
  pr: PurchaseRequisition | null;
  activeRole: RoleDefinition;
  rolesMap?: Record<RoleId, RoleDefinition>;
  buyerActorName?: string;
  workflowConfig: WorkflowConfig;
  onClose: () => void;
  onSubmitToL1: (prId: string, buyerNote?: string) => void;
  onApprovePR: (prId: string, approvalNote?: string) => void;
  onOpenReturnModal: (pr: PurchaseRequisition) => void;
  onOpenRejectModal: (pr: PurchaseRequisition) => void;
  onOpenRemindModal: (pr: PurchaseRequisition) => void;
  onQuickRemindDirect: (pr: PurchaseRequisition) => void;
  onViewAttachment: (attachment: DocumentAttachment) => void;
  onUploadRevisedQuotation: (prId: string, fileName: string, fileSize: string) => void;
  onOpenCertificate: (pr: PurchaseRequisition) => void;
  onSwitchRole: (roleId: RoleId) => void;
}

export const SideViewingDrawer: React.FC<SideViewingDrawerProps> = ({
  pr,
  activeRole,
  rolesMap = ROLES,
  buyerActorName = '',
  workflowConfig,
  onClose,
  onSubmitToL1,
  onApprovePR,
  onOpenReturnModal,
  onOpenRejectModal,
  onOpenRemindModal,
  onQuickRemindDirect,
  onViewAttachment,
  onUploadRevisedQuotation,
  onOpenCertificate,
  onSwitchRole,
}) => {
  const [activeTab, setActiveTab] = useState<'DOCS' | 'AUDIT'>('DOCS');
  const [rectificationNote, setRectificationNote] = useState(
    'Updated vendor quotation attached with extended validity date (31/12/2026) and verified company stamp.'
  );
  const [reminderSentBanner, setReminderSentBanner] = useState<string | null>(null);
  const [inlineExpandedAttId, setInlineExpandedAttId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!pr) return null;

  const isBuyerActionable =
    activeRole.id === 'L0' &&
    (pr.status === 'LEVEL_0_FRESH' || pr.status === 'RETURNED_TO_BUYER');

  const isApproverActionable =
    (activeRole.id === 'L1' && pr.status === 'PENDING_L1') ||
    (activeRole.id === 'L2' && pr.status === 'PENDING_L2') ||
    (activeRole.id === 'L3' && pr.status === 'PENDING_L3');

  const isInRouting =
    pr.status === 'PENDING_L1' || pr.status === 'PENDING_L2' || pr.status === 'PENDING_L3';

  const isFastTracked =
    workflowConfig.enableThresholdFastTrack &&
    pr.costMYR < workflowConfig.fastTrackThresholdMYR;

  const getRequiredRoleForPR = (): RoleId | null => {
    if (pr.status === 'LEVEL_0_FRESH' || pr.status === 'RETURNED_TO_BUYER') return 'L0';
    if (pr.status === 'PENDING_L1') return 'L1';
    if (pr.status === 'PENDING_L2') return 'L2';
    if (pr.status === 'PENDING_L3') return 'L3';
    return null;
  };

  const requiredRoleId = getRequiredRoleForPR();

  const getPendingLevelDetails = () => {
    if (pr.status === 'PENDING_L1') {
      const eff = getEffectiveApproverName('L1', workflowConfig, rolesMap);
      return {
        level: 1,
        shortLabel: 'L1',
        roleTitle: 'Initial Reviewer / Document Checker (Level 1)',
        actor: eff.name,
        isDelegated: eff.isDelegated,
      };
    }
    if (pr.status === 'PENDING_L2') {
      const eff = getEffectiveApproverName('L2', workflowConfig, rolesMap);
      return {
        level: 2,
        shortLabel: 'L2',
        roleTitle: 'Head Unit Reviewer (Level 2)',
        actor: eff.name,
        isDelegated: eff.isDelegated,
      };
    }
    if (pr.status === 'PENDING_L3') {
      const eff = getEffectiveApproverName('L3', workflowConfig, rolesMap);
      return {
        level: 3,
        shortLabel: 'L3',
        roleTitle: 'GGM, GCAS (Level 3)',
        actor: eff.name,
        isDelegated: eff.isDelegated,
      };
    }
    return null;
  };

  const pendingInfo = getPendingLevelDetails();

  const effL1 = getEffectiveApproverName('L1', workflowConfig, rolesMap);
  const effL2 = getEffectiveApproverName('L2', workflowConfig, rolesMap);
  const effL3 = getEffectiveApproverName('L3', workflowConfig, rolesMap);

  const pipelineSteps = [
    {
      id: 'L0',
      code: 'L0',
      label: 'Buyer Queue',
      actor: rolesMap.L0.actorName || buyerActorName,
      isDelegated: false,
      isSkipped: false,
      isCompleted:
        pr.status === 'PENDING_L1' ||
        pr.status === 'PENDING_L2' ||
        pr.status === 'PENDING_L3' ||
        pr.status === 'FULLY_APPROVED',
      isCurrent: pr.status === 'LEVEL_0_FRESH' || pr.status === 'RETURNED_TO_BUYER',
      isReturned: pr.status === 'RETURNED_TO_BUYER',
    },
    {
      id: 'L1',
      code: 'L1',
      label: 'Doc Checker',
      actor: effL1.isDelegated ? effL1.name : rolesMap.L1.actorName,
      isDelegated: effL1.isDelegated,
      isSkipped: false,
      isCompleted:
        pr.status === 'PENDING_L2' ||
        pr.status === 'PENDING_L3' ||
        pr.status === 'FULLY_APPROVED',
      isCurrent: pr.status === 'PENDING_L1',
      isReturned: false,
    },
    {
      id: 'L2',
      code: 'L2',
      label: 'Head Unit',
      actor: effL2.isDelegated ? effL2.name : rolesMap.L2.actorName,
      isDelegated: effL2.isDelegated,
      isSkipped: false,
      isCompleted: pr.status === 'PENDING_L3' || pr.status === 'FULLY_APPROVED',
      isCurrent: pr.status === 'PENDING_L2',
      isReturned: false,
    },
    {
      id: 'L3',
      code: 'L3',
      label: isFastTracked ? 'Fast-Tracked' : 'GGM, GCAS',
      actor: isFastTracked
        ? '< RM 25k Rule'
        : effL3.isDelegated
        ? effL3.name
        : rolesMap.L3.actorName,
      isDelegated: !isFastTracked && effL3.isDelegated,
      isSkipped: isFastTracked,
      isCompleted: pr.status === 'FULLY_APPROVED' && !isFastTracked,
      isCurrent: pr.status === 'PENDING_L3',
      isReturned: false,
    },
  ];

  const getContextualStatusNote = () => {
    if (pr.status === 'LEVEL_0_FRESH') {
      return 'Submitting will assign this PR to Level 1 Initial Reviewer (Document Checker).';
    }
    if (pr.status === 'RETURNED_TO_BUYER') {
      return 'Returned to Level 0 Buyer Queue for rectification. Upload revised quotation or add amendment note above and resubmit to Level 1.';
    }
    if (pr.status === 'PENDING_L1') {
      return `Currently assigned to Level 1 Initial Reviewer / Document Checker (${effL1.name}). Level 1 must approve before Level 2 can act.`;
    }
    if (pr.status === 'PENDING_L2') {
      return isFastTracked
        ? `Fast-Track Rule active (< RM ${workflowConfig.fastTrackThresholdMYR.toLocaleString()}): Level 2 (${effL2.name}) approval will directly mark this PR Fully Approved.`
        : `Level 1 Document Check complete. Currently awaiting Level 2 Head Unit Reviewer (${effL2.name}) approval.`;
    }
    if (pr.status === 'PENDING_L3') {
      return `Level 1 & Level 2 approved. Currently awaiting Level 3 GGM, GCAS (${effL3.name}) final executive signoff.`;
    }
    if (pr.status === 'FULLY_APPROVED') {
      return 'All required sequential approval tiers completed. Requisition is Fully Approved with permanent Malaysian timestamp.';
    }
    return 'This requisition has been rejected and routing is terminated.';
  };

  const handleInlineReminder = () => {
    onQuickRemindDirect(pr);
    if (pendingInfo) {
      setReminderSentBanner(
        `Reminder successfully logged and dispatched to Level ${pendingInfo.level} Approver (${pendingInfo.actor}).`
      );
      setTimeout(() => setReminderSentBanner(null), 5000);
    }
  };

  const handleSimulateFileUpload = () => {
    const cleanNum = pr.id.replace('PR-2026-', '');
    const revName = `Revised_Quotation_${cleanNum}_v2_Renewed.pdf`;
    onUploadRevisedQuotation(pr.id, revName, '1.9 MB');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMB = `${Math.max(0.2, file.size / (1024 * 1024)).toFixed(1)} MB`;
    onUploadRevisedQuotation(pr.id, file.name, sizeMB);
    e.target.value = '';
  };

  return (
    <aside className="w-full lg:w-[520px] xl:w-[560px] bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-xl z-20">
      {/* Top Content Wrapper */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Identification Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={pr.status} variant="drawer" />
            <span className="font-mono font-bold text-sm text-slate-900 tracking-tight">
              {pr.id}
            </span>
            <SlaTrackerBadge pr={pr} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenCertificate(pr)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              title="View / Print Official PR Routing & Signoff Certificate"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Side Viewing Panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Total Cost Row */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 leading-snug">{pr.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {pr.departmentUnitHeader} • Requestor: {pr.requestor}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL COST
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {formatCurrencyMYR(pr.costMYR, 'MYR')}
            </div>
          </div>
        </div>

        {/* Sequential Approval Pipeline */}
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SEQUENTIAL APPROVAL PIPELINE
            </span>
            {isFastTracked && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded">
                Fast-Track (&lt;RM {workflowConfig.fastTrackThresholdMYR.toLocaleString()})
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {pipelineSteps.map((step, index) => {
              let boxClass = 'bg-white border-slate-200 text-slate-400';
              let badgeClass = 'bg-slate-100 text-slate-500';

              if (step.isSkipped) {
                boxClass = 'bg-slate-50/60 border-dashed border-slate-200 text-slate-400';
                badgeClass = 'bg-slate-100 text-slate-400 line-through';
              } else if (step.isReturned) {
                boxClass = 'bg-red-50/80 border-red-300 text-red-900 ring-1 ring-red-200';
                badgeClass = 'bg-red-600 text-white';
              } else if (step.isCurrent) {
                boxClass = 'bg-amber-50/90 border-amber-300 text-amber-900 ring-1 ring-amber-200';
                badgeClass = 'bg-amber-500 text-white';
              } else if (step.isCompleted) {
                boxClass = 'bg-emerald-50/60 border-emerald-200 text-emerald-900';
                badgeClass = 'bg-emerald-600 text-white';
              }

              return (
                <div
                  key={step.id}
                  className={`relative rounded-lg border p-2 transition-all ${boxClass}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}
                    >
                      {step.code}
                    </span>
                    {step.isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    {step.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    {index < 3 && !step.isCompleted && !step.isCurrent && (
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                  <div className="text-[11px] font-semibold truncate">{step.label}</div>
                  <div className="text-[10px] opacity-80 truncate flex items-center gap-1">
                    <span className="truncate">{step.actor}</span>
                  </div>
                  {step.isDelegated && (
                    <span className="mt-1 inline-block text-[9px] font-bold px-1 py-0.1 rounded bg-amber-100 text-amber-800">
                      Deputy Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs (Document Preview & Coda vs Audit Trail) */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('DOCS')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'DOCS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Preview & Coda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Trail (MYT UTC+8)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {pr.auditTrail.length}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'DOCS' ? (
            <>
              {/* UI/UX #4: Visual Diff Banner for Resubmitted / Amended PRs */}
              {pr.amendmentDiff && pr.status !== 'RETURNED_TO_BUYER' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Resubmitted • Amended by Buyer (Level 0)</span>
                    </div>
                    <span className="font-mono text-[10px] text-blue-700">
                      {pr.amendmentDiff.resubmittedAtMYT}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-red-50/70 border border-red-200/80 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold uppercase text-red-700 mb-0.5">
                        Previous Return Reason ({pr.amendmentDiff.returnedBy})
                      </div>
                      <p className="text-red-900 text-[11px] leading-snug">
                        "{pr.amendmentDiff.previousReturnRemarks}"
                      </p>
                    </div>
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold uppercase text-emerald-800 mb-0.5">
                        Buyer Rectification & Amendment
                      </div>
                      <p className="text-emerald-950 text-[11px] leading-snug">
                        "{pr.amendmentDiff.buyerAmendmentNote}"
                      </p>
                      {pr.amendmentDiff.updatedFileName && (
                        <div className="mt-1 text-[10px] font-mono font-semibold text-emerald-700">
                          ✓ File: {pr.amendmentDiff.updatedFileName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Return Remarks Alert Box + Feature #3: Revised Quotation Upload if Returned to Buyer */}
              {pr.status === 'RETURNED_TO_BUYER' && pr.returnRemarks && (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Returned to Buyer (Level 0) for Rectification</span>
                    </div>
                    {pr.returnedBy && (
                      <span className="text-[11px] font-medium text-red-700">
                        By: {pr.returnedBy}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-900 bg-white/80 rounded-lg p-3 border border-red-200/80 leading-relaxed">
                    "{pr.returnRemarks}"
                  </p>

                  {activeRole.id === 'L0' && (
                    <div className="pt-1 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-red-800 mb-1">
                          1. Buyer Rectification / Amendment Note (logged on Re-submission):
                        </label>
                        <input
                          type="text"
                          value={rectificationNote}
                          onChange={(e) => setRectificationNote(e.target.value)}
                          className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 p-2.5 rounded-lg border border-red-200">
                        <div className="text-[11px] text-slate-700">
                          <span className="font-semibold text-slate-900">
                            2. Replace Expired Quotation PDF:
                          </span>{' '}
                          Attach renewed vendor quote before resubmitting
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Browse PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSimulateFileUpload}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Simulate v2 Quote Upload</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejected Alert Box */}
              {pr.status === 'REJECTED' && pr.rejectionRemarks && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Requisition Rejected ({pr.rejectedBy || 'Approver'})</span>
                  </div>
                  <p className="text-xs text-rose-800 bg-white rounded-lg p-3 border border-rose-200">
                    "{pr.rejectionRemarks}"
                  </p>
                </div>
              )}

              {/* Card 1: Coda Pre-Approved Requisition Data */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      CODA PRE-APPROVED REQUISITION DATA
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Coda Synced <Check className="w-3 h-3" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Vendor Name</div>
                    <div className="font-semibold text-slate-900 mt-0.5">{pr.vendorName}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">GL Account Code</div>
                    <div className="font-mono font-medium text-slate-800 mt-0.5">
                      {pr.glAccountCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Budget Ref. No.</div>
                    <div className="font-mono font-medium text-slate-800 mt-0.5">
                      {pr.costCenter}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Coda PR Ref</div>
                    <div className="font-mono font-medium text-slate-800 mt-0.5">{pr.codaRef}</div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-slate-400 text-[11px] mb-1.5">Business Justification</div>
                  <div className="rounded-lg bg-slate-50/80 border border-slate-200/70 p-3 text-xs text-slate-700 leading-relaxed">
                    {pr.businessJustification}
                  </div>
                </div>
              </div>

              {/* Card 2: Verified Document Attachments + UI/UX #1 Inline Split-Preview */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    VERIFIED DOCUMENT ATTACHMENTS
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Click "Split View" to compare inline with Coda data
                  </span>
                </div>

                <div className="space-y-2.5">
                  {pr.attachments.map((att) => {
                    const isInlineOpen = inlineExpandedAttId === att.id;
                    return (
                      <div
                        key={att.id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/30 overflow-hidden transition-all"
                      >
                        <div className="flex items-center justify-between gap-3 p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                att.type === 'PDF'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                              }`}
                            >
                              {att.type}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {att.fileName}
                                </span>
                                {att.isRevised && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase shrink-0">
                                    v2 Renewed
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {att.fileSize} • {att.badgeText}
                                {att.validityDate ? ` • Valid: ${att.validityDate}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setInlineExpandedAttId(isInlineOpen ? null : att.id)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                isInlineOpen
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                              }`}
                              title="Toggle Inline Split Comparison Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Split View</span>
                              {isInlineOpen ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onViewAttachment(att)}
                              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                            >
                              View File
                            </button>
                          </div>
                        </div>

                        {/* Inline Split-View Expanded Document Pane (UI/UX Enhancement #1) */}
                        {isInlineOpen && (
                          <div className="border-t border-slate-200 bg-white p-4 space-y-3 animate-in fade-in duration-150">
                            {att.type === 'PDF' ? (
                              <>
                                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{pr.vendorName} — Commercial Quote</span>
                                  </div>
                                  <span className="font-mono text-[11px] font-semibold text-emerald-700">
                                    Valid: {att.validityDate || '31/12/2026'}
                                  </span>
                                </div>
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                                      <th className="py-1.5">Description</th>
                                      <th className="py-1.5 text-right">Qty</th>
                                      <th className="py-1.5 text-right">Total (MYR)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(att.lineItems || []).map((li, i) => (
                                      <tr key={i}>
                                        <td className="py-2 pr-2 font-medium text-slate-800">
                                          {li.description}
                                        </td>
                                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                                          {li.qty}
                                        </td>
                                        <td className="py-2 pl-2 text-right font-mono font-semibold text-slate-900">
                                          {formatCurrencyMYR(li.total)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t border-slate-200 font-bold">
                                      <td colSpan={2} className="pt-2 text-right text-slate-600">
                                        Matches Coda Total Cost:
                                      </td>
                                      <td className="pt-2 pl-2 text-right font-mono text-blue-600">
                                        {formatCurrencyMYR(pr.costMYR)} ✓
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-[11px] font-bold text-slate-700">
                                  Coda Pre-Approval Signoff Steps ({pr.codaRef})
                                </div>
                                {(att.codaSteps || []).map((cs, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"
                                  >
                                    <div>
                                      <span className="font-semibold text-slate-900">
                                        {cs.step}
                                      </span>{' '}
                                      <span className="text-slate-500">• {cs.actor}</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                                      {cs.status} ({cs.timestamp})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Info Callout */}
              <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3.5 flex items-center gap-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{getContextualStatusNote()}</span>
              </div>
            </>
          ) : (
            /* Tab 2: Malaysian Timestamped Audit Trail (UTC+8) & Stage-Aware Reminder Box */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl">
                <div>
                  <div className="text-xs font-bold">
                    Chronological Audit History • {pr.id}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Immutable Malaysian Date/Time Log ({formatCurrencyMYR(pr.costMYR)})
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-blue-600/30 border border-blue-400/40 text-blue-200 font-mono text-[10px] font-semibold">
                  Asia/Kuala_Lumpur (MYT UTC+8)
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {pr.auditTrail.map((entry) => {
                  let dotColor = 'bg-blue-600 ring-blue-100';
                  if (
                    entry.eventType === 'APPROVE_L1' ||
                    entry.eventType === 'APPROVE_L2' ||
                    entry.eventType === 'APPROVE_L3'
                  ) {
                    dotColor = 'bg-emerald-600 ring-emerald-100';
                  } else if (
                    entry.eventType === 'RETURN_TO_BUYER' ||
                    entry.eventType === 'REJECT'
                  ) {
                    dotColor = 'bg-red-600 ring-red-100';
                  } else if (entry.eventType === 'REMINDER') {
                    dotColor = 'bg-amber-500 ring-amber-100';
                  } else if (entry.eventType === 'DOC_UPLOAD') {
                    dotColor = 'bg-indigo-600 ring-indigo-100';
                  }

                  return (
                    <div key={entry.id} className="relative pl-4">
                      <span
                        className={`absolute -left-[13px] top-1.5 w-3 h-3 rounded-full ring-4 ${dotColor}`}
                      />
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-mono text-[11px] font-semibold text-blue-700">
                            {entry.timestamp}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {entry.actorName} ({entry.actorRole})
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          Action: {entry.actionTitle}
                        </div>
                        {entry.targetRecipient && (
                          <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded inline-block">
                            Target Recipient: {entry.targetRecipient}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed">{entry.remarks}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Pending Stage Indicator in Timeline */}
                {pendingInfo && (
                  <div className="relative pl-4">
                    <span className="absolute -left-[13px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-400 bg-white" />
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-xs text-slate-500">
                      <div className="font-semibold text-slate-700">
                        Pending • {pendingInfo.roleTitle} ({pendingInfo.actor})
                      </div>
                      <div className="text-[11px] mt-0.5">
                        Awaiting approval, return to Buyer, or rejection action.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stage-Aware Send Approver Reminder Card */}
              {pendingInfo && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Bell className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Send Approver Reminder</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    This PR is currently with{' '}
                    <span className="font-semibold text-slate-900">
                      {pendingInfo.roleTitle} — {pendingInfo.actor}
                    </span>
                    .
                  </p>
                  <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-600 italic">
                    Message: "Gentle reminder: Purchase Requisition {pr.id} (
                    {formatCurrencyMYR(pr.costMYR)}) is pending your Level {pendingInfo.level}{' '}
                    approval."
                  </div>
                  <button
                    type="button"
                    onClick={handleInlineReminder}
                    className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Send Reminder to Level {pendingInfo.level} Approver
                  </button>

                  {reminderSentBanner && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Notification Sent!</div>
                        <div className="text-[11px] mt-0.5">{reminderSentBanner}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar + Keyboard Shortcut Bar */}
      <div className="bg-white border-t border-slate-200">
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Close Panel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buyer viewing Level 0 Fresh or Returned PR */}
            {isBuyerActionable && (
              <button
                type="button"
                onClick={() =>
                  onSubmitToL1(
                    pr.id,
                    pr.status === 'RETURNED_TO_BUYER' ? rectificationNote : undefined
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {pr.status === 'RETURNED_TO_BUYER'
                    ? 'Resubmit for Approval (Level 1)'
                    : 'Submit for Approval (Level 1)'}
                </span>
              </button>
            )}

            {/* Buyer viewing Active In-Routing PR (L1, L2, L3) */}
            {activeRole.id === 'L0' && isInRouting && pendingInfo && (
              <button
                type="button"
                onClick={() => onOpenRemindModal(pr)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Remind Level {pendingInfo.level} Approver</span>
              </button>
            )}

            {/* Authorized Approver (L1, L2, L3) viewing their active tier PR */}
            {isApproverActionable && (
              <>
                <button
                  type="button"
                  onClick={() => onApprovePR(pr.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {activeRole.id === 'L3' ||
                    (activeRole.id === 'L2' && isFastTracked)
                      ? 'Approve (Final Signoff)'
                      : 'Approve & Route to Next Level'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReturnModal(pr)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EA8032] hover:bg-[#D96B1E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Return to Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenRejectModal(pr)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {/* Quick Role Switch Helper if viewing a PR awaiting another role */}
            {requiredRoleId && requiredRoleId !== activeRole.id && (
              <button
                type="button"
                onClick={() => onSwitchRole(requiredRoleId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title={`Switch active perspective to ${rolesMap[requiredRoleId].dropdownLabel}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Act as {rolesMap[requiredRoleId].shortTag}</span>
              </button>
            )}
          </div>
        </div>

        {/* UI/UX #2: Keyboard Shortcut Legend Strip */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
          <span>Keyboard Shortcuts:</span>
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                ↑/↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                S
              </kbd>{' '}
              Submit
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                A
              </kbd>{' '}
              Approve
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                R
              </kbd>{' '}
              Return
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                M
              </kbd>{' '}
              Remind
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
