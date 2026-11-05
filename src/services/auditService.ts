import { AuditRecord, AuditVerificationResult, UserRole, AuditAction } from '../types';
import { sha256, GENESIS_HASH } from './crypto';

const AUDIT_STORAGE_KEY = 'trustvault_audit_records_v1';

export async function computeAuditHash(
  previousHash: string,
  timestamp: string,
  actorId: string,
  action: string,
  documentId: string | undefined,
  decision: string,
  metadata: Record<string, any>
): Promise<string> {
  const metaStr = JSON.stringify(metadata || {});
  const raw = `${previousHash}|${timestamp}|${actorId}|${action}|${documentId || 'NONE'}|${decision}|${metaStr}`;
  return sha256(raw);
}

export class AuditService {
  /**
   * Appends an audit event to the cryptographically linked ledger
   */
  static async recordEvent(
    actor: { id: string; email: string; role: UserRole },
    action: AuditAction,
    options: {
      documentId?: string;
      documentTitle?: string;
      requestedPermission?: string;
      decision: 'ALLOW' | 'DENY';
      reason: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AuditRecord> {
    const existing = this.getAllEvents();
    const lastHash = existing.length > 0 ? existing[existing.length - 1].currentHash : GENESIS_HASH;
    const timestamp = new Date().toISOString();
    const eventId = 'evt_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

    const currentHash = await computeAuditHash(
      lastHash,
      timestamp,
      actor.id,
      action,
      options.documentId,
      options.decision,
      options.metadata || {}
    );

    const record: AuditRecord = {
      eventId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      documentId: options.documentId,
      documentTitle: options.documentTitle,
      timestamp,
      requestedPermission: options.requestedPermission || 'NONE',
      decision: options.decision,
      reason: options.reason,
      metadata: options.metadata || {},
      previousHash: lastHash,
      currentHash
    };

    existing.push(record);
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }

    return record;
  }

  static getAllEvents(): AuditRecord[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse audit logs from storage:', e);
    }
    return [];
  }

  /**
   * Cryptographically verifies the entire audit hash chain
   */
  static async verifyChainIntegrity(): Promise<AuditVerificationResult> {
    const events = this.getAllEvents();
    const verifiedAt = new Date().toISOString();

    if (events.length === 0) {
      return {
        valid: true,
        totalEvents: 0,
        message: 'Audit ledger is currently empty. Genesis state is valid.',
        verifiedAt
      };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];

      // Check 1: Chain Link Verification
      if (evt.previousHash !== expectedPrevHash) {
        return {
          valid: false,
          totalEvents: events.length,
          errorAtIndex: i,
          tamperedEventId: evt.eventId,
          reason: `Broken chain link at Event #${i + 1} (${evt.eventId}): expected previous hash '${expectedPrevHash.substring(0, 16)}...', but found '${evt.previousHash.substring(0, 16)}...'. Chain sequence has been severed!`,
          message: 'AUDIT INTEGRITY VIOLATION DETECTED',
          verifiedAt
        };
      }

      // Check 2: Payload Hash Recomputation
      const recomputed = await computeAuditHash(
        evt.previousHash,
        evt.timestamp,
        evt.actorId,
        evt.action,
        evt.documentId,
        evt.decision,
        evt.metadata
      );

      if (recomputed !== evt.currentHash) {
        return {
          valid: false,
          totalEvents: events.length,
          errorAtIndex: i,
          tamperedEventId: evt.eventId,
          reason: `Payload modification detected at Event #${i + 1} (${evt.eventId}): Recalculated hash does not match currentHash! Event payload was secretly altered.`,
          message: 'AUDIT INTEGRITY VIOLATION DETECTED',
          verifiedAt
        };
      }

      expectedPrevHash = evt.currentHash;
    }

    return {
      valid: true,
      totalEvents: events.length,
      latestHash: expectedPrevHash,
      message: `Audit trail verified: All ${events.length} cryptographic SHA-256 hash blocks are intact and untampered.`,
      verifiedAt
    };
  }

  /**
   * Injects a synthetic modification into an audit record to demonstrate tamper detection to judges
   */
  static injectTamperingForDemo(): { success: boolean; eventId?: string } {
    const events = this.getAllEvents();
    if (events.length < 2) return { success: false };

    // Tamper with the decision of the middle event
    const targetIdx = Math.floor(events.length / 2);
    events[targetIdx].decision = events[targetIdx].decision === 'ALLOW' ? 'DENY' : 'ALLOW';
    events[targetIdx].reason = 'ATTACKER_ALTERED_PAYLOAD_MANUALLY';

    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(events));
    return { success: true, eventId: events[targetIdx].eventId };
  }

  static resetToPreseeded(initialEvents: AuditRecord[]) {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialEvents));
  }
}
