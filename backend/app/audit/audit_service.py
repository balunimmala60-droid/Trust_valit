"""
TrustVault Verifiable Audit Service
Implements a tamper-evident cryptographic SHA-256 hash chain for all security-relevant events.
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditRecord:
    def __init__(
        self,
        event_id: str,
        actor_id: str,
        action: str,
        document_id: Optional[str],
        timestamp: str,
        requested_permission: str,
        decision: str,  # 'ALLOW' or 'DENY'
        reason: str,
        metadata: Dict[str, Any],
        previous_hash: str,
        current_hash: str
    ):
        self.event_id = event_id
        self.actor_id = actor_id
        self.action = action
        self.document_id = document_id
        self.timestamp = timestamp
        self.requested_permission = requested_permission
        self.decision = decision
        self.reason = reason
        self.metadata = metadata
        self.previous_hash = previous_hash
        self.current_hash = current_hash

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "actor_id": self.actor_id,
            "action": self.action,
            "document_id": self.document_id,
            "timestamp": self.timestamp,
            "requested_permission": self.requested_permission,
            "decision": self.decision,
            "reason": self.reason,
            "metadata": self.metadata,
            "previous_hash": self.previous_hash,
            "current_hash": self.current_hash
        }

class AuditService:
    def __init__(self):
        self._ledger: List[AuditRecord] = []

    @staticmethod
    def calculate_event_hash(
        previous_hash: str,
        timestamp: str,
        actor_id: str,
        action: str,
        document_id: Optional[str],
        decision: str,
        metadata: Dict[str, Any]
    ) -> str:
        serialized_metadata = json.dumps(metadata, sort_keys=True)
        raw_payload = (
            f"{previous_hash}|{timestamp}|{actor_id}|{action}|"
            f"{document_id or 'NONE'}|{decision}|{serialized_metadata}"
        )
        return hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()

    def append_event(
        self,
        actor_id: str,
        action: str,
        document_id: Optional[str] = None,
        requested_permission: str = "NONE",
        decision: str = "ALLOW",
        reason: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditRecord:
        meta = metadata or {}
        timestamp = datetime.now(timezone.utc).isoformat()
        event_id = str(uuid.uuid4())
        
        last_hash = self._ledger[-1].current_hash if self._ledger else GENESIS_HASH
        current_hash = self.calculate_event_hash(
            previous_hash=last_hash,
            timestamp=timestamp,
            actor_id=actor_id,
            action=action,
            document_id=document_id,
            decision=decision,
            metadata=meta
        )

        record = AuditRecord(
            event_id=event_id,
            actor_id=actor_id,
            action=action,
            document_id=document_id,
            timestamp=timestamp,
            requested_permission=requested_permission,
            decision=decision,
            reason=reason,
            metadata=meta,
            previous_hash=last_hash,
            current_hash=current_hash
        )
        self._ledger.append(record)
        return record

    def verify_integrity(self) -> Dict[str, Any]:
        """
        Scans entire ledger to verify that each block links to the preceding block's hash
        and that each hash accurately recalculates from its payload.
        """
        if not self._ledger:
            return {"valid": True, "total_events": 0, "message": "Ledger is empty (valid genesis)."}

        expected_prev_hash = GENESIS_HASH
        for idx, event in enumerate(self._ledger):
            # Check link to previous
            if event.previous_hash != expected_prev_hash:
                return {
                    "valid": False,
                    "error_at_index": idx,
                    "event_id": event.event_id,
                    "reason": f"Chain link broken at event #{idx}: expected prev_hash '{expected_prev_hash[:12]}...', found '{event.previous_hash[:12]}...'"
                }
            
            # Recalculate hash
            recomputed = self.calculate_event_hash(
                previous_hash=event.previous_hash,
                timestamp=event.timestamp,
                actor_id=event.actor_id,
                action=event.action,
                document_id=event.document_id,
                decision=event.decision,
                metadata=event.metadata
            )
            if recomputed != event.current_hash:
                return {
                    "valid": False,
                    "error_at_index": idx,
                    "event_id": event.event_id,
                    "reason": f"Payload tamper detected at event #{idx}: recalculation mismatch."
                }
            
            expected_prev_hash = event.current_hash

        return {
            "valid": True,
            "total_events": len(self._ledger),
            "latest_hash": expected_prev_hash,
            "message": "Audit trail is 100% verified and cryptographically sound."
        }

    def get_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in reversed(self._ledger[-limit:])]
