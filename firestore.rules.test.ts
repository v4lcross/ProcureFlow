/**
 * Hardened Security Rules Test Suite — ProcureFlow PR Approval Router v2.0
 * Verifies that all 12 "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  path: string;
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create (ownerId mismatch)',
    operation: 'create',
    path: '/requisitions/PR-2026-099',
    authUid: 'attacker-uid-111',
    emailVerified: true,
    payload: { id: 'PR-2026-099', ownerId: 'victim-uid-999', status: 'LEVEL_0_FRESH' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoofing',
    operation: 'create',
    path: '/requisitions/PR-2026-099',
    authUid: 'user-1',
    emailVerified: false,
    payload: { id: 'PR-2026-099', ownerId: 'user-1', status: 'LEVEL_0_FRESH' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create',
    operation: 'create',
    path: '/requisitions/PR-2026-099',
    authUid: 'user-1',
    emailVerified: true,
    payload: { id: 'PR-2026-099', ownerId: 'user-1', isAdminOverride: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Path Variable Poisoning',
    operation: 'create',
    path: '/requisitions/INVALID$PATH!@#',
    authUid: 'user-1',
    emailVerified: true,
    payload: { id: 'INVALID$PATH!@#', ownerId: 'user-1' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Volumetric String Overflow (>2000 chars)',
    operation: 'create',
    path: '/requisitions/PR-2026-099',
    authUid: 'user-1',
    emailVerified: true,
    payload: {
      id: 'PR-2026-099',
      ownerId: 'user-1',
      businessJustification: 'X'.repeat(2500),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Client Timestamp Forgery (createdAt != request.time)',
    operation: 'create',
    path: '/requisitions/PR-2026-099',
    authUid: 'user-1',
    emailVerified: true,
    payload: {
      id: 'PR-2026-099',
      ownerId: 'user-1',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Terminal State Mutation (updating FULLY_APPROVED PR)',
    operation: 'update',
    path: '/requisitions/PR-2026-068',
    authUid: 'user-1',
    emailVerified: true,
    payload: { status: 'LEVEL_0_FRESH' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immortal Field Mutation on Update (mutating ownerId)',
    operation: 'update',
    path: '/requisitions/PR-2026-089',
    authUid: 'user-1',
    emailVerified: true,
    payload: { ownerId: 'user-2' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Shadow Key Update Gap',
    operation: 'update',
    path: '/requisitions/PR-2026-089',
    authUid: 'user-1',
    emailVerified: true,
    payload: { unauthorizedKey: 'injected' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned Subcollection Write (missing parent PR)',
    operation: 'create',
    path: '/requisitions/NON-EXISTENT-PR/auditLogs/aud-1',
    authUid: 'user-1',
    emailVerified: true,
    payload: { id: 'aud-1', prId: 'NON-EXISTENT-PR', ownerId: 'user-1' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Immutable Audit Trail Tampering (deleting audit log)',
    operation: 'delete',
    path: '/requisitions/PR-2026-089/auditLogs/aud-089-1',
    authUid: 'user-1',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-Tenant Query Scraping (reading another user PR)',
    operation: 'get',
    path: '/requisitions/PR-OTHER-USER',
    authUid: 'attacker-uid-111',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
