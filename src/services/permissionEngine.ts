import { User, VaultDocument, DocumentPermission, UserRole, PermissionLevel } from '../types';

export type SecureOperation =
  | 'READ'
  | 'PREVIEW'
  | 'DOWNLOAD'
  | 'EDIT'
  | 'DELETE'
  | 'GRANT_PERMISSION'
  | 'REVOKE_PERMISSION'
  | 'VIEW_HISTORY'
  | 'VIEW_AUDIT'
  | 'MANAGE_USERS';

export interface PermissionEvaluationResult {
  allowed: boolean;
  reason: string;
  ruleTriggered: string;
}

export class PermissionDecisionEngine {
  /**
   * Centralized Zero-Trust Permission Decision Engine.
   * Evaluated on EVERY action. Deny-by-default architecture.
   */
  static evaluate(
    user: User | null,
    document: VaultDocument | null,
    operation: SecureOperation,
    permissionRecord?: DocumentPermission | null
  ): PermissionEvaluationResult {
    // Rule 1: Authenticated User Validation
    if (!user) {
      return {
        allowed: false,
        reason: 'Unauthenticated session: No valid user identity provided.',
        ruleTriggered: 'RULE_1_AUTH_REQUIRED'
      };
    }

    if (user.accountStatus !== 'ACTIVE') {
      return {
        allowed: false,
        reason: `Account '${user.email}' is currently ${user.accountStatus}. All operations blocked.`,
        ruleTriggered: 'RULE_1_ACCOUNT_STATUS'
      };
    }

    // Rule 2: Administrative System Scopes
    if (operation === 'MANAGE_USERS' || operation === 'VIEW_AUDIT') {
      if (user.role === 'ADMIN') {
        return {
          allowed: true,
          reason: 'Authorized: User holds ADMIN role with system audit authority.',
          ruleTriggered: 'RULE_2_ADMIN_SYSTEM_PRIVILEGE'
        };
      }
      return {
        allowed: false,
        reason: 'Forbidden: Operation requires administrative privileges.',
        ruleTriggered: 'RULE_2_NON_ADMIN_SYSTEM_DENIED'
      };
    }

    // If targeting a document, document must exist and not be permanently deleted
    if (!document) {
      return {
        allowed: false,
        reason: 'Resource not found: Target document does not exist.',
        ruleTriggered: 'RULE_TARGET_MISSING'
      };
    }

    if (document.isDeleted && operation !== 'VIEW_HISTORY') {
      return {
        allowed: false,
        reason: 'Resource is marked deleted.',
        ruleTriggered: 'RULE_TARGET_DELETED'
      };
    }

    // Rule 3: Document Owner Access
    if (user.id === document.ownerId) {
      return {
        allowed: true,
        reason: `Authorized: User '${user.fullName}' is the verified document owner.`,
        ruleTriggered: 'RULE_3_DOCUMENT_OWNER'
      };
    }

    // Rule 4: Zero-Trust Administrative Boundary
    // Crucial: System Administrators CANNOT read or download private document content without an explicit grant!
    if (user.role === 'ADMIN' && !permissionRecord) {
      return {
        allowed: false,
        reason: 'Administrative Privilege Limitation: Administrators do NOT possess blanket read access to tenant documents without explicit owner delegation.',
        ruleTriggered: 'RULE_4_ADMIN_ZERO_TRUST_BOUNDARY'
      };
    }

    // Rule 5: Delegation & Modification Privileges
    // Only the document owner can grant, revoke, or delete
    if (operation === 'GRANT_PERMISSION' || operation === 'REVOKE_PERMISSION' || operation === 'DELETE') {
      return {
        allowed: false,
        reason: `Forbidden: Only the document owner can execute '${operation}'.`,
        ruleTriggered: 'RULE_5_OWNER_DELEGATION_RESTRICTION'
      };
    }

    // Rule 6: Explicit Permission Grant Verification
    if (!permissionRecord) {
      return {
        allowed: false,
        reason: 'Access Denied: No explicit permission grant exists for this document and identity.',
        ruleTriggered: 'RULE_6_NO_EXPLICIT_GRANT'
      };
    }

    // Rule 7: Immediate Revocation Enforcement
    if (permissionRecord.status === 'REVOKED') {
      return {
        allowed: false,
        reason: `Access Revoked: Permission was revoked on ${permissionRecord.revokedAt || 'previously'}. Access terminated.`,
        ruleTriggered: 'RULE_7_IMMEDIATE_REVOCATION'
      };
    }

    // Rule 8: Expiration Check
    if (permissionRecord.expiresAt) {
      const expDate = new Date(permissionRecord.expiresAt);
      if (new Date() > expDate) {
        return {
          allowed: false,
          reason: `Access Expired: Time-limited permission grant expired at ${permissionRecord.expiresAt}.`,
          ruleTriggered: 'RULE_8_PERMISSION_EXPIRED'
        };
      }
    }

    // Rule 9: EDIT Operation Check
    if (operation === 'EDIT') {
      if (permissionRecord.permissionLevel === 'EDIT') {
        return {
          allowed: true,
          reason: 'Authorized: User holds explicit EDIT delegation from owner.',
          ruleTriggered: 'RULE_9_EDIT_AUTHORIZED'
        };
      }
      return {
        allowed: false,
        reason: 'Forbidden: User possesses READ-only delegation. Document editing rejected.',
        ruleTriggered: 'RULE_9_READONLY_INSUFFICIENT_FOR_EDIT'
      };
    }

    // Rule 10: READ / PREVIEW / DOWNLOAD
    if (operation === 'READ' || operation === 'PREVIEW' || operation === 'DOWNLOAD' || operation === 'VIEW_HISTORY') {
      if (permissionRecord.permissionLevel === 'READ' || permissionRecord.permissionLevel === 'EDIT') {
        return {
          allowed: true,
          reason: `Authorized: User holds active ${permissionRecord.permissionLevel} delegation.`,
          ruleTriggered: 'RULE_10_READ_AUTHORIZED'
        };
      }
    }

    // Catch-all Default Deny
    return {
      allowed: false,
      reason: `Default Deny: Operation '${operation}' is not explicitly permitted under current policy.`,
      ruleTriggered: 'RULE_DEFAULT_DENY'
    };
  }
}
