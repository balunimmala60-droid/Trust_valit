export type UserRole = 'ADMIN' | 'OWNER' | 'VIEWER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type AppTheme = 'blue' | 'bw' | 'original';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export type PermissionLevel = 'READ' | 'EDIT';
export type PermissionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  grantedById: string;
  permissionLevel: PermissionLevel;
  status: PermissionStatus;
  expiresAt?: string;
  grantedAt: string;
  revokedAt?: string;
  revokedById?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageIdentifier: string;
  integrityHash: string;
  sizeBytes: number;
  changeSummary: string;
  createdAt: string;
  createdById: string;
}

export interface VaultDocument {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  description: string;
  category: 'Financial' | 'Legal' | 'Technical' | 'Security' | 'General';
  tags: string[];
  originalFilename: string;
  storageIdentifier: string;
  mimeType: string;
  sizeBytes: number;
  fileExtension: string;
  integrityHash: string;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  contentPreview?: string; // Encrypted or simulated payload for preview
}

export type AuditAction =
  | 'LOGIN'
  | 'FAILED_LOGIN'
  | 'UPLOAD'
  | 'VIEW'
  | 'READ'
  | 'PREVIEW'
  | 'DOWNLOAD'
  | 'EDIT'
  | 'DELETE'
  | 'GRANT_PERMISSION'
  | 'UPDATE_PERMISSION'
  | 'REVOKE_PERMISSION'
  | 'REQUEST_ACCESS'
  | 'APPROVE_ACCESS'
  | 'REJECT_ACCESS'
  | 'ADMIN_ACTION'
  | 'SUSPICIOUS_ATTEMPT'
  | 'ATTACK_SIMULATION';

export interface AuditRecord {
  eventId: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditAction;
  documentId?: string;
  documentTitle?: string;
  timestamp: string;
  requestedPermission: string;
  decision: 'ALLOW' | 'DENY';
  reason: string;
  metadata: Record<string, any>;
  previousHash: string;
  currentHash: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalEvents: number;
  latestHash?: string;
  errorAtIndex?: number;
  tamperedEventId?: string;
  reason?: string;
  message: string;
  verifiedAt: string;
}

export interface AccessRequest {
  id: string;
  documentId: string;
  documentTitle: string;
  ownerId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requestedLevel: PermissionLevel;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SECURITY_ALERT' | 'PERMISSION_GRANTED' | 'ACCESS_REVOKED' | 'REQUEST_RECEIVED';
  isRead: boolean;
  createdAt: string;
}

export interface AttackSimulation {
  threatId: string;
  name: string;
  category: 'IDOR' | 'Revocation' | 'Privilege Escalation' | 'File Inspection' | 'Admin Bypass' | 'Search Leak';
  description: string;
  attackVector: string;
  simulatedPayload: string;
  expectedResult: 'DENIED (403)' | 'REJECTED (400)' | 'ISOLATED (0 RESULTS)';
  actualResult?: string;
  decision?: 'DEFENDED' | 'VULNERABLE';
  details?: string;
  auditEventId?: string;
  executedAt?: string;
}
