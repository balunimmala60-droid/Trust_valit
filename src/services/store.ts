import { User, VaultDocument, DocumentPermission, AccessRequest, NotificationItem, AuditRecord } from '../types';
import { AuditService } from './auditService';
import { GENESIS_HASH } from './crypto';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_01',
    fullName: 'Alex Vance (Chief InfoSec Officer)',
    email: 'admin@trustvault.sec',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    createdAt: '2026-10-15T08:00:00Z',
    lastLoginAt: '2026-11-05T07:30:00Z'
  },
  {
    id: 'user_owner_01',
    fullName: 'Sarah Chen (VP of Engineering)',
    email: 'sarah.owner@acmecorp.com',
    role: 'OWNER',
    accountStatus: 'ACTIVE',
    createdAt: '2026-10-18T10:00:00Z',
    lastLoginAt: '2026-11-05T08:00:00Z'
  },
  {
    id: 'user_viewer_01',
    fullName: 'David Ross (External Audit Partner)',
    email: 'david.viewer@external-partner.com',
    role: 'VIEWER',
    accountStatus: 'ACTIVE',
    createdAt: '2026-10-25T14:30:00Z',
    lastLoginAt: '2026-11-05T07:45:00Z'
  },
  {
    id: 'user_viewer_02',
    fullName: 'Elena Rostova (SecOps Contractor)',
    email: 'elena.viewer@contractor.io',
    role: 'VIEWER',
    accountStatus: 'ACTIVE',
    createdAt: '2026-10-28T09:15:00Z',
    lastLoginAt: '2026-11-04T18:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc_vault_001',
    ownerId: 'user_owner_01',
    ownerName: 'Sarah Chen (VP of Engineering)',
    ownerEmail: 'sarah.owner@acmecorp.com',
    title: 'Series B Financial Cap Table & Term Sheet',
    description: 'Highly confidential investor term sheet, cap table scenario model, and valuation covenants.',
    category: 'Financial',
    tags: ['SeriesB', 'CapTable', 'Valuation', 'StrictlyConfidential'],
    originalFilename: 'Series_B_Term_Sheet_v4.pdf',
    storageIdentifier: 'enc_blob_98f4a10c-39b0-466d-922f-d897e682aa01.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2485900,
    fileExtension: 'pdf',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    currentVersion: 4,
    isDeleted: false,
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-11-04T16:20:00Z',
    contentPreview: 'TRUSTVAULT SECURE PREVIEW: Series B Term Sheet. Lead Investor: Horizon Cyber Ventures. Pre-money valuation: $65,000,000. Participating preferred stock with 1.0x non-participating liquidation preference. Board representation: 1 Observer seat. Standard anti-dilution provisions apply. Authorized access only.'
  },
  {
    id: 'doc_vault_002',
    ownerId: 'user_owner_01',
    ownerName: 'Sarah Chen (VP of Engineering)',
    ownerEmail: 'sarah.owner@acmecorp.com',
    title: 'Zero-Trust Infrastructure Architecture v3',
    description: 'Technical specification for mutual TLS, enclave computing, and centralized authorization policies.',
    category: 'Technical',
    tags: ['Architecture', 'ZeroTrust', 'mTLS', 'Enclave'],
    originalFilename: 'Zero_Trust_Infra_Spec_v3.docx',
    storageIdentifier: 'enc_blob_77e112bc-12aa-4ff3-b311-c91823abf102.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 1420500,
    fileExtension: 'docx',
    integrityHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    currentVersion: 3,
    isDeleted: false,
    createdAt: '2026-10-22T09:30:00Z',
    updatedAt: '2026-11-03T14:10:00Z',
    contentPreview: 'TRUSTVAULT TECHNICAL BLUEPRINT: All ingress traffic must terminate at Envoy proxy with strict SPIFFE/SPIRE x509 identity validation. Every microservice call checks the Centralized Policy Decision Point with 0ms local cache tolerance.'
  },
  {
    id: 'doc_vault_003',
    ownerId: 'user_owner_01',
    ownerName: 'Sarah Chen (VP of Engineering)',
    ownerEmail: 'sarah.owner@acmecorp.com',
    title: 'API Penetration Test & Audit Executive Summary',
    description: 'Red team assessment report detailing vulnerability findings, privilege boundary verifications, and remediation timelines.',
    category: 'Security',
    tags: ['PenTest', 'Audit', 'Vulnerabilities', 'RedTeam'],
    originalFilename: 'Pentest_Exec_Summary_Q4.pdf',
    storageIdentifier: 'enc_blob_44a9910d-58ce-412f-87ae-1002938a1923.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 3812000,
    fileExtension: 'pdf',
    integrityHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    currentVersion: 2,
    isDeleted: false,
    createdAt: '2026-10-28T15:00:00Z',
    updatedAt: '2026-11-04T12:00:00Z',
    contentPreview: 'TRUSTVAULT RED TEAM EXECUTIVE SUMMARY: External assessment verified zero IDOR flaws across resource controllers. Revocation tests confirmed 100% immediate cutoff across API endpoints.'
  }
];

export const INITIAL_PERMISSIONS: DocumentPermission[] = [
  {
    id: 'perm_001',
    documentId: 'doc_vault_001',
    userId: 'user_viewer_01',
    userEmail: 'david.viewer@external-partner.com',
    userName: 'David Ross (External Audit Partner)',
    grantedById: 'user_owner_01',
    permissionLevel: 'READ',
    status: 'ACTIVE',
    grantedAt: '2026-10-26T10:00:00Z'
  },
  {
    id: 'perm_002',
    documentId: 'doc_vault_003',
    userId: 'user_viewer_02',
    userEmail: 'elena.viewer@contractor.io',
    userName: 'Elena Rostova (SecOps Contractor)',
    grantedById: 'user_owner_01',
    permissionLevel: 'READ',
    status: 'REVOKED', // Pre-revoked for immediate revocation demonstration!
    grantedAt: '2026-10-29T11:00:00Z',
    revokedAt: '2026-11-04T17:30:00Z',
    revokedById: 'user_owner_01'
  }
];

export const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'req_001',
    documentId: 'doc_vault_001',
    documentTitle: 'Series B Financial Cap Table & Term Sheet',
    ownerId: 'user_owner_01',
    requesterId: 'user_viewer_01',
    requesterName: 'David Ross (External Audit Partner)',
    requesterEmail: 'david.viewer@external-partner.com',
    requestedLevel: 'EDIT',
    justification: 'Need EDIT permissions to annotate covenant clauses directly for the upcoming board meeting.',
    status: 'PENDING',
    createdAt: '2026-11-05T06:30:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_001',
    userId: 'user_owner_01',
    title: 'New Access Request',
    message: 'David Ross requested EDIT permission on "Series B Financial Cap Table & Term Sheet".',
    type: 'REQUEST_RECEIVED',
    isRead: false,
    createdAt: '2026-11-05T06:30:00Z'
  },
  {
    id: 'notif_002',
    userId: 'user_viewer_02',
    title: 'Permission Revoked',
    message: 'Sarah Chen revoked your READ access to "API Penetration Test & Audit Executive Summary".',
    type: 'ACCESS_REVOKED',
    isRead: true,
    createdAt: '2026-11-04T17:30:00Z'
  }
];

/**
 * Initializes store and seeds cryptographically linked audit events
 */
export async function initializeDatabaseStore() {
  if (!localStorage.getItem('trustvault_users')) {
    localStorage.setItem('trustvault_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('trustvault_documents')) {
    localStorage.setItem('trustvault_documents', JSON.stringify(INITIAL_DOCUMENTS));
  }
  if (!localStorage.getItem('trustvault_permissions')) {
    localStorage.setItem('trustvault_permissions', JSON.stringify(INITIAL_PERMISSIONS));
  }
  if (!localStorage.getItem('trustvault_access_requests')) {
    localStorage.setItem('trustvault_access_requests', JSON.stringify(INITIAL_ACCESS_REQUESTS));
  }
  if (!localStorage.getItem('trustvault_notifications')) {
    localStorage.setItem('trustvault_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
  }

  // Check audit ledger; if not present, seed a valid initial hash chain
  const existingAudit = AuditService.getAllEvents();
  if (existingAudit.length === 0) {
    const seedActor = { id: 'user_admin_01', email: 'admin@trustvault.sec', role: 'ADMIN' as const };
    const ownerActor = { id: 'user_owner_01', email: 'sarah.owner@acmecorp.com', role: 'OWNER' as const };

    await AuditService.recordEvent(seedActor, 'LOGIN', {
      decision: 'ALLOW',
      reason: 'Administrator authenticated via WebAuthn/MFA.'
    });

    await AuditService.recordEvent(ownerActor, 'UPLOAD', {
      documentId: 'doc_vault_001',
      documentTitle: 'Series B Financial Cap Table & Term Sheet',
      decision: 'ALLOW',
      reason: 'Document encrypted, signed, and saved to private storage.',
      metadata: { integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', sizeBytes: 2485900 }
    });

    await AuditService.recordEvent(ownerActor, 'GRANT_PERMISSION', {
      documentId: 'doc_vault_001',
      documentTitle: 'Series B Financial Cap Table & Term Sheet',
      requestedPermission: 'READ',
      decision: 'ALLOW',
      reason: 'Owner granted READ permission to david.viewer@external-partner.com.',
      metadata: { targetUser: 'david.viewer@external-partner.com', level: 'READ' }
    });

    await AuditService.recordEvent(ownerActor, 'REVOKE_PERMISSION', {
      documentId: 'doc_vault_003',
      documentTitle: 'API Penetration Test & Audit Executive Summary',
      requestedPermission: 'READ',
      decision: 'ALLOW',
      reason: 'Owner revoked access for elena.viewer@contractor.io. Immediate cutoff applied.',
      metadata: { targetUser: 'elena.viewer@contractor.io', revokedAt: '2026-11-04T17:30:00Z' }
    });
  }
}
