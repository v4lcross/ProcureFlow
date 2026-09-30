import React, { useState, useEffect } from 'react';
import {
  X,
  CornerUpLeft,
  Bell,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Hash,
  Printer,
  Download,
  Sliders,
  UserCheck,
  Zap,
  Award,
  Plus,
  Upload,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  DocumentAttachment,
  PurchaseRequisition,
  RoleDefinition,
  WorkflowConfig,
} from '../types/pr';
import {
  formatCurrencyMYR,
  getEffectiveApproverName,
  ROLES,
} from '../data/initialPRs';

interface ReturnModalProps {
  pr: PurchaseRequisition | null;
  isOpen: boolean;
  activeRole: RoleDefinition;
  onClose: () => void;
  onConfirmReturn: (remarks: string) => void;
}

export const ReturnToBuyerModal: React.FC<ReturnModalProps> = ({
  pr,
  isOpen,
  activeRole,
  onClose,
  onConfirmReturn,
}) => {
  const [remarks, setRemarks] = useState(
    'Vendor quotation validity date expired yesterday. Please obtain an updated quotation letter before re-routing to Head Unit.'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen, pr]);

  if (!isOpen || !pr) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Mandatory remarks are required before returning a PR to Buyer (Level 0).');
      return;
    }
    onConfirmReturn(remarks.trim());
  };

  const quickPresets = [
    'Vendor quotation validity date expired yesterday. Please obtain an updated quotation letter before re-routing to Head Unit.',
    'Cost center code mismatch against Coda pre-approval sheet. Please rectify GL Account & Cost Center.',
    'Missing vendor company stamp and authorized signatory on attached PDF quotation.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border-2 border-amber-500/80 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/40">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <CornerUpLeft className="w-4 h-4 text-amber-600" />
            <span>Return PR to Buyer (Level 0)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You are returning{' '}
            <span className="font-mono font-semibold text-slate-900">{pr.id}</span> (
            <span className="font-medium text-slate-800">{pr.title}</span>) to{' '}
            <span className="font-semibold text-slate-900">Buyer Ahmad</span> for rectification as{' '}
            <span className="font-semibold text-amber-700">{activeRole.dropdownLabel}</span>. Please
            specify the exact missing or incorrect details:
          </p>

          <div>
            <label className="block text-xs font-semibold text-amber-800 mb-1.5">
              Return Remarks / Required Amendments <span className="text-red-600">* (Mandatory)</span>
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter detailed rectification instructions for the Buyer..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 leading-relaxed"
            />
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400">
              Quick Remark Templates (Click to fill):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRemarks(preset);
                    setError('');
                  }}
                  className="text-left text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition-colors truncate max-w-full"
                >
                  Template {idx + 1}: {preset.slice(0, 58)}...
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#EA8032] hover:bg-[#D96B1E] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Confirm Return to Buyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RejectModalProps {
  pr: PurchaseRequisition | null;
  isOpen: boolean;
  activeRole: RoleDefinition;
  onClose: () => void;
  onConfirmReject: (remarks: string) => void;
}

export const RejectRequisitionModal: React.FC<RejectModalProps> = ({
  pr,
  isOpen,
  activeRole,
  onClose,
  onConfirmReject,
}) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRemarks('Unbudgeted expenditure for current fiscal quarter. Requisition terminated.');
      setError('');
    }
  }, [isOpen, pr]);

  if (!isOpen || !pr) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Mandatory rejection reason is required to terminate routing.');
      return;
    }
    onConfirmReject(remarks.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border-2 border-red-500/80 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Reject Purchase Requisition</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You are permanently rejecting{' '}
            <span className="font-mono font-semibold text-slate-900">{pr.id}</span> (
            {formatCurrencyMYR(pr.costMYR)}) as{' '}
            <span className="font-semibold text-red-700">{activeRole.dropdownLabel}</span>. This will
            terminate routing and record an immutable Malaysian-timestamped audit log.
          </p>

          <div>
            <label className="block text-xs font-semibold text-red-800 mb-1.5">
              Rejection Remarks / Justification <span className="text-red-600">* (Mandatory)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError('');
              }}
              placeholder="Specify reason for rejecting this requisition..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Confirm Reject Requisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReminderModalProps {
  pr: PurchaseRequisition | null;
  isOpen: boolean;
  workflowConfig: WorkflowConfig;
  onClose: () => void;
  onConfirmRemind: (customMessage: string) => void;
}

export const SendReminderModal: React.FC<ReminderModalProps> = ({
  pr,
  isOpen,
  workflowConfig,
  onClose,
  onConfirmRemind,
}) => {
  const [message, setMessage] = useState('');

  const getStageTarget = (status: PurchaseRequisition['status']) => {
    if (status === 'PENDING_L1') {
      const eff = getEffectiveApproverName('L1', workflowConfig);
      return {
        level: 1,
        roleTitle: 'Initial Reviewer / Document Checker (Level 1)',
        personName: eff.name,
        isDelegated: eff.isDelegated,
      };
    }
    if (status === 'PENDING_L2') {
      const eff = getEffectiveApproverName('L2', workflowConfig);
      return {
        level: 2,
        roleTitle: 'Head Unit Reviewer (Level 2)',
        personName: eff.name,
        isDelegated: eff.isDelegated,
      };
    }
    const eff = getEffectiveApproverName('L3', workflowConfig);
    return {
      level: 3,
      roleTitle: 'GGM, GCAS (Level 3)',
      personName: eff.name,
      isDelegated: eff.isDelegated,
    };
  };

  useEffect(() => {
    if (pr && isOpen) {
      const target = getStageTarget(pr.status);
      setMessage(
        `Gentle reminder: Purchase Requisition ${pr.id} (${formatCurrencyMYR(
          pr.costMYR
        )}) is pending your Level ${target.level} approval (${target.personName}).`
      );
    }
  }, [pr, isOpen, workflowConfig]);

  if (!isOpen || !pr) return null;

  const target = getStageTarget(pr.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Bell className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Send Approver Reminder</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-600">
            This PR is currently with{' '}
            <span className="font-bold text-slate-900">{target.roleTitle}</span> —{' '}
            <span className="font-semibold text-blue-700">{target.personName}</span>
            {target.isDelegated && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                Delegated Backup Active
              </span>
            )}
            .
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Simulated Notification Payload (MYT UTC+8)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white rounded-md border border-slate-200 p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Dispatches instant alert & records an immutable Malaysian-timestamped entry in the
              audit trail.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmRemind(message)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Send Reminder to Level {target.level} Approver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentViewerModalProps {
  pr: PurchaseRequisition | null;
  attachment: DocumentAttachment | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  pr,
  attachment,
  onClose,
}) => {
  if (!pr || !attachment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                attachment.type === 'PDF'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
              }`}
            >
              {attachment.type}
            </span>
            <div>
              <h3 className="text-sm font-bold">{attachment.fileName}</h3>
              <p className="text-[11px] text-slate-400">
                {pr.id} • {attachment.fileSize} • {attachment.badgeText}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 bg-slate-50/50">
          {attachment.type === 'PDF' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Official Vendor Commercial Quotation</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{pr.vendorName}</h4>
                  <p className="text-xs text-slate-500">
                    Customer: {pr.department} • Attention: {pr.requestor}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{attachment.badgeText}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Quote Ref: {attachment.quotationRef || 'QT-MY-2026-001'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Valid Until: {attachment.validityDate || '31/12/2026'}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-2 pr-3">Item Description</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price (MYR)</th>
                      <th className="py-2 pl-3 text-right">Total (MYR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(attachment.lineItems || []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-3 font-medium text-slate-800">{item.description}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{item.qty}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrencyMYR(item.unitPrice)}
                        </td>
                        <td className="py-3 pl-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrencyMYR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={3} className="pt-3 text-right text-xs font-bold text-slate-600">
                        Total Pre-Approved Amount (Inclusive of SST):
                      </td>
                      <td className="pt-3 pl-3 text-right font-mono text-sm font-bold text-blue-600">
                        {formatCurrencyMYR(pr.costMYR, 'MYR')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">GL Account:</span>{' '}
                  <span className="font-mono">{pr.glAccountCode}</span> •{' '}
                  <span className="font-semibold text-slate-800">Cost Center:</span>{' '}
                  <span className="font-mono">{pr.costCenter}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                  Coda Ref: {pr.codaRef} ✓
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Automated Coda Pre-Approval Workflow Log
                  </h4>
                  <p className="text-xs text-slate-500">
                    Coda Reference: <span className="font-mono font-semibold">{pr.codaRef}</span> •
                    Synced to PR Approval Router Level 0
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  Coda Synced ✓
                </span>
              </div>

              <div className="space-y-3">
                {(attachment.codaSteps || []).map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">{step.step}</div>
                      <div className="text-slate-500">Signed off by: {step.actor}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                        {step.status}
                      </span>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {step.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> {pr.codaRef}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Timezone: Asia/Kuala_Lumpur (MYT UTC+8)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close Document Preview
          </button>
        </div>
      </div>
    </div>
  );
};

interface ApprovalCertificateModalProps {
  pr: PurchaseRequisition | null;
  onClose: () => void;
}

export const ApprovalCertificateModal: React.FC<ApprovalCertificateModalProps> = ({
  pr,
  onClose,
}) => {
  if (!pr) return null;

  const handleDownloadCertificateTxt = () => {
    const lines = [
      '====================================================================',
      '        PROCUREFLOW - OFFICIAL PR APPROVAL ROUTING CERTIFICATE      ',
      '                  Timezone: Asia/Kuala_Lumpur (MYT UTC+8)           ',
      '====================================================================',
      `PR Number       : ${pr.id}`,
      `Title           : ${pr.title}`,
      `Vendor          : ${pr.vendorName}`,
      `Department      : ${pr.department} (${pr.requestor})`,
      `Total Cost      : ${formatCurrencyMYR(pr.costMYR, 'MYR')}`,
      `GL Account Code : ${pr.glAccountCode}`,
      `Cost Center     : ${pr.costCenter}`,
      `Coda Reference  : ${pr.codaRef}`,
      `Current Status  : ${pr.status}`,
      `Last Updated    : ${pr.lastUpdatedMYT}`,
      '--------------------------------------------------------------------',
      'CHRONOLOGICAL MALAYSIAN AUDIT TRAIL (UTC+8):',
      ...pr.auditTrail.map(
        (a, i) =>
          `${i + 1}. [${a.timestamp}] ${a.actorName} (${a.actorRole})\n   Action: ${
            a.actionTitle
          }\n   Remarks: ${a.remarks}`
      ),
      '====================================================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pr.id}_Approval_Certificate_MYT.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1120] text-white">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">
                Official Purchase Requisition Routing & Signoff Certificate
              </h3>
              <p className="text-[11px] text-slate-400">
                Malaysian Timestamped Verification Sheet • {pr.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 bg-white">
          <div className="border-2 border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  PROCUREFLOW ENTERPRISE GOVERNANCE • MYT (UTC+8)
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {pr.id}: {pr.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Vendor: <span className="font-semibold text-slate-800">{pr.vendorName}</span> •
                  Coda Ref: <span className="font-mono font-semibold">{pr.codaRef}</span>
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${
                    pr.status === 'FULLY_APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {pr.status === 'FULLY_APPROVED'
                      ? 'FINAL SIGNOFF COMPLETE'
                      : `STAGE: ${pr.status}`}
                  </span>
                </div>
                <div className="text-base font-mono font-bold text-slate-900 mt-1.5">
                  {formatCurrencyMYR(pr.costMYR, 'MYR')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Department / Requestor
                </span>
                <span className="font-semibold text-slate-800">
                  {pr.department} ({pr.requestor})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  GL Account & Cost Center
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {pr.glAccountCode} / {pr.costCenter}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Turnaround SLA Elapsed
                </span>
                <span className="font-mono font-semibold text-emerald-700">
                  {pr.slaHoursElapsed.toFixed(1)} Hours (Target &lt;24h)
                </span>
              </div>
            </div>

            {/* Digital Signoff Stamp Boxes */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                DIGITAL TIER SIGNOFF VERIFICATION (MYT UTC+8)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['L0', 'L1', 'L2', 'L3'] as const).map((lvl) => {
                  const role = ROLES[lvl];
                  const matchingLog = [...pr.auditTrail]
                    .reverse()
                    .find((a) =>
                      lvl === 'L0'
                        ? a.eventType === 'SUBMIT_L1'
                        : lvl === 'L1'
                        ? a.eventType === 'APPROVE_L1'
                        : lvl === 'L2'
                        ? a.eventType === 'APPROVE_L2'
                        : a.eventType === 'APPROVE_L3'
                    );

                  return (
                    <div
                      key={lvl}
                      className={`p-3 rounded-lg border text-xs ${
                        matchingLog
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[10px] text-slate-500">
                          {lvl}
                        </span>
                        {matchingLog && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Signed ✓
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 mt-1 truncate">
                        {matchingLog ? matchingLog.actorName : role.actorName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{role.roleTitle}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1.5">
                        {matchingLog ? matchingLog.timestamp : 'Pending Signoff'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCertificateTxt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Certificate (.TXT)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WorkflowRulesModalProps {
  isOpen: boolean;
  config: WorkflowConfig;
  onUpdateConfig: (newConfig: WorkflowConfig) => void;
  onClose: () => void;
}

export const WorkflowRulesModal: React.FC<WorkflowRulesModalProps> = ({
  isOpen,
  config,
  onUpdateConfig,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleDelegation = (lvl: 'L1' | 'L2' | 'L3') => {
    onUpdateConfig({
      ...config,
      delegationActive: {
        ...config.delegationActive,
        [lvl]: !config.delegationActive[lvl],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1120] text-white">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold">
                Workflow Rules: Delegation & Cost Threshold Routing
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure Out-of-Office Backup Approvers & Fast-Track Thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Section 1: Out-of-Office Backup Approver Delegation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>1. Out-of-Office / Backup Approver Delegation</span>
            </div>
            <p className="text-xs text-slate-500">
              When an approver is on leave, enable delegation so reminders and signoffs route
              automatically to their designated deputy and log in the MYT audit trail.
            </p>

            <div className="space-y-2">
              {(['L1', 'L2', 'L3'] as const).map((lvl) => {
                const role = ROLES[lvl];
                const isActive = config.delegationActive[lvl];
                return (
                  <div
                    key={lvl}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">
                        {role.shortTag}: {role.actorName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Backup Deputy:{' '}
                        <span className="font-semibold text-slate-800">
                          {role.backupActorName}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDelegation(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isActive ? 'Delegated to Deputy ✓' : 'Activate Backup'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Auto-Routing Cost Threshold */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>2. Cost Threshold Fast-Track Routing</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    enableThresholdFastTrack: !config.enableThresholdFastTrack,
                  })
                }
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  config.enableThresholdFastTrack
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {config.enableThresholdFastTrack ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When enabled, requisitions strictly below{' '}
              <span className="font-mono font-bold text-slate-800">
                {formatCurrencyMYR(config.fastTrackThresholdMYR)}
              </span>{' '}
              (such as <span className="font-mono">PR-2026-088</span> and{' '}
              <span className="font-mono">PR-2026-075</span>) achieve{' '}
              <span className="font-semibold text-emerald-700">Fully Approved</span> status directly
              upon Level 2 (Head Unit) approval without requiring Level 3 GGM signoff.
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            Save & Close Rules
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ManualPRFormInput {
  prNo: string;
  title: string;
  department: string;
  requestor: string;
  vendorName: string;
  budgetRefNo: string;
  glAccountCode: string;
  codaRef: string;
  costMYR: number;
  quotationRef: string;
  validityDate: string;
  quotationFileName: string;
  quotationFileSize: string;
  businessJustification: string;
  submitDirectlyToL1: boolean;
}

interface CreateManualPRModalProps {
  isOpen: boolean;
  suggestedPrNo: string;
  existingIds: string[];
  onClose: () => void;
  onCreatePR: (data: ManualPRFormInput) => void;
}

const DEPARTMENT_PRESETS = [
  {
    dept: 'Enterprise Infrastructure (IT Infra)',
    budgetRef: 'BG-2026-IT-042 (Infra)',
    glCode: '600-4210-ITCAPEX',
    requestor: 'Farid (IT Infra)',
  },
  {
    dept: 'Network Operations',
    budgetRef: 'BG-2026-NET-019 (NetOps)',
    glCode: '600-4215-NETHW',
    requestor: 'Hafiz (NetOps)',
  },
  {
    dept: 'Digital Platforms Unit',
    budgetRef: 'BG-2026-DIG-108 (Digital)',
    glCode: '500-3100-CLOUDSV',
    requestor: 'Nadia (Cloud Ops)',
  },
  {
    dept: 'Engineering & Technology',
    budgetRef: 'BG-2026-ENG-077 (Eng)',
    glCode: '600-4100-ENDUSER',
    requestor: 'Chong (Eng Lead)',
  },
  {
    dept: 'Facilities & Real Estate',
    budgetRef: 'BG-2026-FAC-005 (Facilities)',
    glCode: '500-2290-FACMAINT',
    requestor: 'Zulkifli (Facilities)',
  },
  {
    dept: 'Finance & Accounts',
    budgetRef: 'BG-2026-FIN-002 (Finance)',
    glCode: '600-4500-FINERP',
    requestor: 'Mei Ling (Finance)',
  },
  {
    dept: 'Broadcast Production Ops',
    budgetRef: 'BG-2026-BRD-031 (Broadcast)',
    glCode: '600-4800-STUDIOHW',
    requestor: 'Rizal (Studio Eng)',
  },
  {
    dept: 'Cybersecurity & Risk',
    budgetRef: 'BG-2026-SEC-088 (SecOps)',
    glCode: '600-4310-CYBERSEC',
    requestor: 'Azlan (SecOps)',
  },
];

export const CreateManualPRModal: React.FC<CreateManualPRModalProps> = ({
  isOpen,
  suggestedPrNo,
  existingIds,
  onClose,
  onCreatePR,
}) => {
  const [prNo, setPrNo] = useState(suggestedPrNo);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(DEPARTMENT_PRESETS[0].dept);
  const [requestor, setRequestor] = useState(DEPARTMENT_PRESETS[0].requestor);
  const [vendorName, setVendorName] = useState('');
  const [budgetRefNo, setBudgetRefNo] = useState(DEPARTMENT_PRESETS[0].budgetRef);
  const [glAccountCode, setGlAccountCode] = useState(DEPARTMENT_PRESETS[0].glCode);
  const [codaRef, setCodaRef] = useState('CODA-REQ-88495');
  const [costMYR, setCostMYR] = useState('');
  const [quotationRef, setQuotationRef] = useState('QT-MY-2026-104');
  const [validityDate, setValidityDate] = useState('31/12/2026');
  const [quotationFileName, setQuotationFileName] = useState('');
  const [quotationFileSize, setQuotationFileSize] = useState('1.6 MB');
  const [businessJustification, setBusinessJustification] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrNo(suggestedPrNo);
      setTitle('');
      setDepartment(DEPARTMENT_PRESETS[0].dept);
      setRequestor(DEPARTMENT_PRESETS[0].requestor);
      setVendorName('');
      setBudgetRefNo(DEPARTMENT_PRESETS[0].budgetRef);
      setGlAccountCode(DEPARTMENT_PRESETS[0].glCode);
      setCodaRef(`CODA-REQ-${Math.floor(88450 + Math.random() * 500)}`);
      setCostMYR('');
      setQuotationRef(`QT-MY-2026-${Math.floor(100 + Math.random() * 899)}`);
      setValidityDate('31/12/2026');
      setQuotationFileName('');
      setQuotationFileSize('1.6 MB');
      setBusinessJustification('');
      setError('');
    }
  }, [isOpen, suggestedPrNo]);

  if (!isOpen) return null;

  const handleDepartmentChange = (selectedDept: string) => {
    setDepartment(selectedDept);
    const preset = DEPARTMENT_PRESETS.find((p) => p.dept === selectedDept);
    if (preset) {
      setBudgetRefNo(preset.budgetRef);
      setGlAccountCode(preset.glCode);
      setRequestor(preset.requestor);
    }
  };

  const handleQuickFillSample = () => {
    setTitle('Data Center UPS Battery Bank Replacement');
    setDepartment('Enterprise Infrastructure (IT Infra)');
    setRequestor('Farid (IT Infra)');
    setVendorName('PowerGrid Engineering Malaysia Sdn Bhd');
    setBudgetRefNo('BG-2026-IT-042 (Infra)');
    setGlAccountCode('600-4210-ITCAPEX');
    setCostMYR('38500.00');
    setQuotationFileName('Approved_Quotation_PowerGrid_UPS.pdf');
    setBusinessJustification(
      'Replacement of redundant 40kVA modular UPS battery strings in Main Server Room to maintain 4-hour emergency power backup.'
    );
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuotationFileName(file.name);
    setQuotationFileSize(`${Math.max(0.2, file.size / (1024 * 1024)).toFixed(1)} MB`);
  };

  const validateAndSubmit = (submitDirectlyToL1: boolean) => {
    const cleanPrNo = prNo.trim().toUpperCase();
    if (!cleanPrNo) {
      setError('PR No. is required.');
      return;
    }
    if (existingIds.includes(cleanPrNo)) {
      setError(`PR No. "${cleanPrNo}" already exists. Please enter a unique PR No.`);
      return;
    }
    if (!title.trim()) {
      setError('Requisition Title is required.');
      return;
    }
    if (!department.trim()) {
      setError('Department / Unit is required.');
      return;
    }
    if (!budgetRefNo.trim()) {
      setError('Budget Ref. No. is required.');
      return;
    }
    if (!vendorName.trim()) {
      setError('Vendor Name is required.');
      return;
    }
    const parsedCost = parseFloat(costMYR.replace(/,/g, ''));
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setError('Please enter a valid Total Cost (MYR) greater than 0.');
      return;
    }
    if (!businessJustification.trim()) {
      setError('Business Justification is required.');
      return;
    }

    const finalFileName =
      quotationFileName.trim() ||
      `Approved_Quotation_${vendorName
        .trim()
        .split(' ')[0]
        .replace(/[^a-zA-Z0-9]/g, '')}.pdf`;

    onCreatePR({
      prNo: cleanPrNo,
      title: title.trim(),
      department: department.trim(),
      requestor: requestor.trim() || 'Ahmad (Buyer)',
      vendorName: vendorName.trim(),
      budgetRefNo: budgetRefNo.trim(),
      glAccountCode: glAccountCode.trim() || '600-4210-ITCAPEX',
      codaRef: codaRef.trim() || 'CODA-REQ-88500',
      costMYR: parsedCost,
      quotationRef: quotationRef.trim() || 'QT-MY-2026-100',
      validityDate: validityDate.trim() || '31/12/2026',
      quotationFileName: finalFileName,
      quotationFileSize,
      businessJustification: businessJustification.trim(),
      submitDirectlyToL1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1120] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Key In New Purchase Requisition (Buyer Level 0)
              </h3>
              <p className="text-[11px] text-slate-400">
                Manual PR Entry • Initializes with Malaysian Timestamp (MYT UTC+8)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickFillSample}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Auto-fill realistic sample PR data for quick testing"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fill Sample</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: PR No., Total Cost (MYR), Budget Ref. No. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                PR No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={prNo}
                onChange={(e) => {
                  setPrNo(e.target.value);
                  if (error) setError('');
                }}
                placeholder="PR-2026-090"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Total Cost (MYR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  RM
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costMYR}
                  onChange={(e) => {
                    setCostMYR(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="45200.00"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Budget Ref. No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={budgetRefNo}
                onChange={(e) => {
                  setBudgetRefNo(e.target.value);
                  if (error) setError('');
                }}
                placeholder="BG-2026-IT-042"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Requisition Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Requisition Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Server Rack Upgrade Phase 2 / Network Firewall Renewal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 3: Department & Requestor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department / Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEPARTMENT_PRESETS.map((d) => (
                  <option key={d.dept} value={d.dept}>
                    {d.dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Requestor Name / Unit
              </label>
              <input
                type="text"
                value={requestor}
                onChange={(e) => setRequestor(e.target.value)}
                placeholder="e.g., Farid (IT Infra)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Vendor Name, GL Account Code, Coda PR Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => {
                  setVendorName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g., Informatix Tech Sdn Bhd"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                GL Account Code
              </label>
              <input
                type="text"
                value={glAccountCode}
                onChange={(e) => setGlAccountCode(e.target.value)}
                placeholder="600-4210-ITCAPEX"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Coda PR Ref.
              </label>
              <input
                type="text"
                value={codaRef}
                onChange={(e) => setCodaRef(e.target.value)}
                placeholder="CODA-REQ-88495"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 5: Quotation Reference, Validity Date & PDF Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Quotation Ref. No.
              </label>
              <input
                type="text"
                value={quotationRef}
                onChange={(e) => setQuotationRef(e.target.value)}
                placeholder="QT-MY-2026-104"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Quotation Validity Date
              </label>
              <input
                type="text"
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
                placeholder="31/12/2026"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Vendor Quotation PDF
              </label>
              <label className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-blue-300 bg-white hover:bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-600 cursor-pointer transition-colors truncate">
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {quotationFileName ? quotationFileName : 'Attach PDF Quote'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Row 6: Business Justification */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Business Justification / Scope of Work <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={businessJustification}
              onChange={(e) => {
                setBusinessJustification(e.target.value);
                if (error) setError('');
              }}
              placeholder="Explain why this requisition is needed, project milestone, or operational impact..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => validateAndSubmit(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to Level 0 Queue (Fresh PR)</span>
            </button>

            <button
              type="button"
              onClick={() => validateAndSubmit(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save & Submit to Level 1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

