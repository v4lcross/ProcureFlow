import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { PRStatus, PurchaseRequisition, WorkflowConfig } from '../types/pr';

interface StatusBadgeProps {
  status: PRStatus;
  variant?: 'table' | 'drawer';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'table' }) => {
  const config: Record<
    PRStatus,
    { label: string; drawerLabel: string; bg: string; dot: string }
  > = {
    LEVEL_0_FRESH: {
      label: 'Level 0: Fresh PR',
      drawerLabel: 'Level 0: Fresh PR',
      bg: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
      dot: 'bg-[#D97706]',
    },
    PENDING_L1: {
      label: 'Pending L1 (Doc Checker)',
      drawerLabel: 'Pending Level 1 Review',
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      dot: 'bg-indigo-600',
    },
    PENDING_L2: {
      label: 'Pending L2 (Head Unit)',
      drawerLabel: 'Pending Level 2 Review',
      bg: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
      dot: 'bg-[#9333EA]',
    },
    PENDING_L3: {
      label: 'Pending L3 (GGM Signoff)',
      drawerLabel: 'Pending Level 3 Review',
      bg: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
      dot: 'bg-[#2563EB]',
    },
    RETURNED_TO_BUYER: {
      label: 'Returned to Buyer',
      drawerLabel: 'Returned to Buyer (Level 0)',
      bg: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
    },
    FULLY_APPROVED: {
      label: 'Fully Approved',
      drawerLabel: 'Fully Approved',
      bg: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
      dot: 'bg-[#059669]',
    },
    REJECTED: {
      label: 'Rejected',
      drawerLabel: 'Rejected',
      bg: 'bg-rose-100 text-rose-900 border-rose-300',
      dot: 'bg-rose-700',
    },
  };

  const current = config[status];

  if (variant === 'drawer') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap ${current.bg}`}
      >
        {current.drawerLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      {current.label}
    </span>
  );
};

interface MiniPipelineProps {
  pr: PurchaseRequisition;
  workflowConfig: WorkflowConfig;
}

export const MiniPipelineProgress: React.FC<MiniPipelineProps> = ({ pr, workflowConfig }) => {
  const isFastTracked =
    workflowConfig.enableThresholdFastTrack &&
    pr.costMYR < workflowConfig.fastTrackThresholdMYR;

  const getStageState = (stage: 'L0' | 'L1' | 'L2' | 'L3') => {
    if (pr.status === 'REJECTED') return 'rejected';
    if (pr.status === 'FULLY_APPROVED') {
      if (stage === 'L3' && isFastTracked) return 'skipped';
      return 'done';
    }
    if (pr.status === 'RETURNED_TO_BUYER') {
      return stage === 'L0' ? 'returned' : 'pending';
    }
    if (pr.status === 'LEVEL_0_FRESH') {
      return stage === 'L0' ? 'active' : stage === 'L3' && isFastTracked ? 'skipped' : 'pending';
    }
    if (pr.status === 'PENDING_L1') {
      if (stage === 'L0') return 'done';
      if (stage === 'L1') return 'active';
      if (stage === 'L3' && isFastTracked) return 'skipped';
      return 'pending';
    }
    if (pr.status === 'PENDING_L2') {
      if (stage === 'L0' || stage === 'L1') return 'done';
      if (stage === 'L2') return 'active';
      if (stage === 'L3' && isFastTracked) return 'skipped';
      return 'pending';
    }
    if (pr.status === 'PENDING_L3') {
      if (stage === 'L0' || stage === 'L1' || stage === 'L2') return 'done';
      return 'active';
    }
    return 'pending';
  };

  const stages: ('L0' | 'L1' | 'L2' | 'L3')[] = ['L0', 'L1', 'L2', 'L3'];

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="inline-flex items-center gap-1">
        {stages.map((stg, idx) => {
          const state = getStageState(stg);
          let pillStyle = 'bg-slate-100 text-slate-400 border-slate-200';
          if (state === 'done') {
            pillStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
          } else if (state === 'active') {
            pillStyle = 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs';
          } else if (state === 'returned' || state === 'rejected') {
            pillStyle = 'bg-red-100 text-red-700 border-red-300 font-bold';
          } else if (state === 'skipped') {
            pillStyle = 'bg-slate-50 text-slate-300 border-dashed border-slate-200 line-through';
          }

          return (
            <React.Fragment key={stg}>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${pillStyle}`}
                title={
                  state === 'skipped'
                    ? `Auto-skipped (< RM ${workflowConfig.fastTrackThresholdMYR.toLocaleString()} threshold)`
                    : `${stg}: ${state}`
                }
              >
                {stg}
              </span>
              {idx < stages.length - 1 && (
                <span
                  className={`w-2 h-0.5 ${
                    state === 'done' ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {pr.amendmentDiff && pr.status !== 'RETURNED_TO_BUYER' && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-semibold">
          <Sparkles className="w-2.5 h-2.5" />
          Amended
        </span>
      )}
    </div>
  );
};

interface SlaBadgeProps {
  pr: PurchaseRequisition;
}

export const SlaTrackerBadge: React.FC<SlaBadgeProps> = ({ pr }) => {
  const hours = pr.slaHoursElapsed;
  const isCompleted = pr.status === 'FULLY_APPROVED' || pr.status === 'REJECTED';

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50/80 border border-emerald-200/70 px-2 py-0.5 rounded-md">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Closed in {hours.toFixed(1)}h (≤24h SLA)</span>
      </span>
    );
  }

  if (hours > 24) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        <span>{hours.toFixed(1)}h / 24h • SLA Overdue</span>
      </span>
    );
  }

  if (hours >= 18) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>{hours.toFixed(1)}h / 24h • SLA At Risk</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-100/80 border border-slate-200/80 px-2 py-0.5 rounded-md">
      <Clock className="w-3 h-3 text-slate-400" />
      <span>{hours.toFixed(1)}h / 24h SLA</span>
    </span>
  );
};
