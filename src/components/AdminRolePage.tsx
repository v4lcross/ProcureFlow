import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { RoleDefinition, RoleId, UserRoleAssignment } from '../types/pr';

interface AdminRolePageProps {
  assignments: UserRoleAssignment[];
  rolesMap: Record<RoleId, RoleDefinition>;
  currentUserEmail: string;
  currentUserName: string;
  onSaveAssignment: (email: string, displayName: string, roleId: RoleId) => void;
  onRemoveAssignment: (id: string) => void;
  onBackToDashboard: () => void;
}

const ROLE_META: Record<
  RoleId,
  {
    code: RoleId;
    title: string;
    subtitle: string;
    badgeBg: string;
    badgeText: string;
    borderCol: string;
  }
> = {
  L0: {
    code: 'L0',
    title: 'Level 0: Buyer (Owner / Dispatcher)',
    subtitle: 'Key in PRs, inspect Fresh Level 0 queue, submit to L1, and send reminders.',
    badgeBg: 'bg-amber-50 border-amber-300',
    badgeText: 'text-amber-800',
    borderCol: 'border-amber-200',
  },
  L1: {
    code: 'L1',
    title: 'Level 1: Initial Reviewer / Doc Checker',
    subtitle: 'Verify vendor quotation validity & Coda logs, then Approve to L2 or Return.',
    badgeBg: 'bg-blue-50 border-blue-300',
    badgeText: 'text-blue-800',
    borderCol: 'border-blue-200',
  },
  L2: {
    code: 'L2',
    title: 'Level 2: Head Unit Reviewer',
    subtitle: 'Validate department budget & business justification, then Approve to L3.',
    badgeBg: 'bg-indigo-50 border-indigo-300',
    badgeText: 'text-indigo-800',
    borderCol: 'border-indigo-200',
  },
  L3: {
    code: 'L3',
    title: 'Level 3: GGM, GCAS (Final Signoff)',
    subtitle: 'Execute final executive signoff to mark requisitions Fully Approved.',
    badgeBg: 'bg-emerald-50 border-emerald-300',
    badgeText: 'text-emerald-800',
    borderCol: 'border-emerald-200',
  },
};

export const AdminRolePage: React.FC<AdminRolePageProps> = ({
  assignments,
  rolesMap,
  currentUserEmail,
  currentUserName,
  onSaveAssignment,
  onRemoveAssignment,
  onBackToDashboard,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleId>('L1');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('Please enter a valid user email address (e.g., user@gmail.com).');
      return;
    }
    const derivedName =
      nameInput.trim() || trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
    onSaveAssignment(trimmedEmail, derivedName, selectedRole);
    setEmailInput('');
    setNameInput('');
    setFormError('');
  };

  const handleFillCurrentUser = (targetRole: RoleId) => {
    setEmailInput(currentUserEmail);
    setNameInput(currentUserName);
    setSelectedRole(targetRole);
    setFormError('');
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[#0B1120] text-white rounded-2xl p-6 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Governance & Access Control</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            User Role & Approval Level Assignment
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Assign user Google/Gmail addresses to{' '}
            <span className="text-white font-semibold">Level 1 (Doc Checker)</span>,{' '}
            <span className="text-white font-semibold">Level 2 (Head Unit)</span>,{' '}
            <span className="text-white font-semibold">Level 3 (GGM, GCAS)</span>, or{' '}
            <span className="text-white font-semibold">Level 0 (Buyer)</span>. When an assigned user
            signs in via Google, their name and level automatically populate in{' '}
            <span className="text-blue-300 font-semibold">Active Perspective</span> and the approval
            pipeline.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PR Dashboard</span>
        </button>
      </div>

      {/* 4 Live Hierarchy Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['L0', 'L1', 'L2', 'L3'] as RoleId[]).map((lvl) => {
          const meta = ROLE_META[lvl];
          const roleDef = rolesMap[lvl];
          const levelAssignments = assignments.filter((a) => a.roleId === lvl);

          return (
            <div
              key={lvl}
              className={`bg-white rounded-xl border p-4 flex flex-col justify-between space-y-3 shadow-2xs ${meta.borderCol}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${meta.badgeBg} ${meta.badgeText}`}
                  >
                    {lvl}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {levelAssignments.length} Assigned
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2">{meta.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{meta.subtitle}</p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Perspective Label
                </div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                  {roleDef.actorName ? (
                    <span className="text-emerald-700">{roleDef.actorName}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned (Blank)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Left Form + Right Assigned Users Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assign User Email Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Assign User Email to Level</h2>
                <p className="text-[11px] text-slate-500">
                  Map a Gmail / Google Workspace address to an approval tier
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                User Email (Google / Gmail) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. approver@mediaprima.com.my"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Display Name / Approver Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. En. Kamal (Leave blank to use email username)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Approval Level <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as RoleId)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="L1">Level 1: Initial Reviewer / Doc Checker</option>
                <option value="L2">Level 2: Head Unit Reviewer</option>
                <option value="L3">Level 3: GGM, GCAS (Final Signoff)</option>
                <option value="L0">Level 0: Buyer (Owner / Dispatcher)</option>
              </select>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Assign Role Level</span>
            </button>
          </form>

          {/* Quick Self-Assign Helper for Current Logged-In User */}
          {currentUserEmail && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick-Fill Your Logged-In Email ({currentUserEmail}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['L1', 'L2', 'L3', 'L0'] as RoleId[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleFillCurrentUser(lvl)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-[11px] font-semibold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Set Me as {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Assigned User Directory Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Assigned User Emails ({assignments.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Users listed below automatically adopt their assigned level upon Google login
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">USER EMAIL & DISPLAY NAME</th>
                  <th className="py-3 px-4">ASSIGNED LEVEL</th>
                  <th className="py-3 px-4">UPDATED (MYT)</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-slate-400">
                      No user emails have been assigned to Level 1, Level 2, or Level 3 yet. Use the
                      form on the left to assign user emails.
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => {
                    const isMe =
                      currentUserEmail &&
                      item.email.toLowerCase() === currentUserEmail.toLowerCase();
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.displayName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            {item.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={item.roleId}
                            onChange={(e) =>
                              onSaveAssignment(
                                item.email,
                                item.displayName,
                                e.target.value as RoleId
                              )
                            }
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="L0">Level 0: Buyer</option>
                            <option value="L1">Level 1: Doc Checker</option>
                            <option value="L2">Level 2: Head Unit</option>
                            <option value="L3">Level 3: GGM, GCAS</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {item.updatedAtMYT}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onRemoveAssignment(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                            title="Remove role assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
