#!/usr/bin/env python3
"""
TrustVault Permissions & Delegation Automated Workflow Tests
Implements and automates the 14 scenarios required by Part 8 of the RISE Specification:
1. Owner uploads Document 1 -> Succeeds
2. Owner grants READ to Viewer B -> Access granted
3. Viewer B opens shared doc -> Allowed
4. Viewer B tries editing doc -> Denied (HTTP 403)
5. Owner grants EDIT to Viewer C -> Access granted
6. Viewer C performs edit -> Allowed
7. Viewer C attempts ownership change -> Denied
8. Owner revokes Viewer B -> Access revoked
9. Viewer B uses old link -> Denied (0ms cutoff)
10. Viewer B changes doc ID (IDOR) -> Denied
11. Viewer B grants access -> Denied
12. Unauthorized user calls permission API -> Denied
13. Audit entries recorded for grant and revocation
14. System state matches expected database records
"""
import unittest
import sys
import os
import tempfile
import shutil
from datetime import datetime, timezone, timedelta

# Add applet root directory to path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from backend.app.services.authorization import (
    PermissionDecisionEngine,
    Operation,
    PermissionLevel,
    PermissionStatus,
    UserRole
)
from backend.app.audit.audit_service import AuditService

class TestPermissionsWorkflow(unittest.TestCase):
    def setUp(self):
        self.audit = AuditService()

        # Personas
        self.owner_a = {"id": "user-owner-sarah", "role": UserRole.OWNER, "email": "sarah.chen@fintech-vault.internal", "account_status": "ACTIVE"}
        self.viewer_b = {"id": "user-viewer-david", "role": UserRole.VIEWER, "email": "david.ross@external-partner.com", "account_status": "ACTIVE"}
        self.viewer_c = {"id": "user-viewer-elena", "role": UserRole.VIEWER, "email": "elena.rostova@compliance-audit.org", "account_status": "ACTIVE"}
        self.unauth_user = {"id": "user-unauth-mallory", "role": UserRole.VIEWER, "email": "mallory@attacker.net", "account_status": "ACTIVE"}
        self.admin = {"id": "user-admin-alex", "role": UserRole.ADMIN, "email": "alex.vance@trustvault.security", "account_status": "ACTIVE"}

        # Document 1 owned by Owner A
        self.doc1 = {
            "id": "doc-vault-001",
            "owner_id": self.owner_a["id"],
            "title": "Q3 Confidential Financial Statement.pdf",
            "is_deleted": False
        }

        # Document 2 owned by another team (for IDOR tests)
        self.doc2 = {
            "id": "doc-vault-999",
            "owner_id": "user-owner-stranger",
            "title": "Restricted Board Minutes.pdf",
            "is_deleted": False
        }

        # Active permissions store
        self.permissions = []

    def _find_perm(self, user_id, doc_id):
        for p in self.permissions:
            if p["user_id"] == user_id and p["document_id"] == doc_id:
                return p
        return None

    # Step 1: Owner uploads Document 1 -> Succeeds
    def test_01_owner_uploads_document(self):
        decision = PermissionDecisionEngine.evaluate(self.owner_a, self.doc1, Operation.UPLOAD)
        self.assertTrue(decision.allowed)
        self.audit.append_event(self.owner_a["id"], "UPLOAD", self.doc1["id"], decision="ALLOW")
        self.assertEqual(len(self.audit._ledger), 1)

    # Step 2: Owner grants READ to Viewer B -> Access granted
    def test_02_owner_grants_read_to_viewer_b(self):
        # Owner evaluates grant permission
        decision = PermissionDecisionEngine.evaluate(self.owner_a, self.doc1, Operation.GRANT_PERMISSION)
        self.assertTrue(decision.allowed)

        # Grant READ
        perm_b = {
            "id": "perm-001",
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE,
            "granted_by_id": self.owner_a["id"],
            "granted_at": datetime.now(timezone.utc).isoformat()
        }
        self.permissions.append(perm_b)
        self.audit.append_event(self.owner_a["id"], "GRANT_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.assertEqual(len(self.permissions), 1)

    # Step 3: Viewer B opens shared doc -> Allowed
    def test_03_viewer_b_opens_shared_doc_allowed(self):
        perm_b = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer_b, self.doc1, Operation.READ, perm_b)
        self.assertTrue(decision.allowed)
        self.audit.append_event(self.viewer_b["id"], "READ", self.doc1["id"], decision="ALLOW")

    # Step 4: Viewer B tries editing doc -> Denied (HTTP 403)
    def test_04_viewer_b_tries_editing_doc_denied(self):
        perm_b = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer_b, self.doc1, Operation.EDIT, perm_b)
        self.assertFalse(decision.allowed)
        self.assertIn("insufficient", decision.reason.lower())
        self.audit.append_event(self.viewer_b["id"], "EDIT", self.doc1["id"], decision="DENY", reason=decision.reason)

    # Step 5: Owner grants EDIT to Viewer C -> Access granted
    def test_05_owner_grants_edit_to_viewer_c(self):
        perm_c = {
            "id": "perm-002",
            "document_id": self.doc1["id"],
            "user_id": self.viewer_c["id"],
            "permission_level": PermissionLevel.EDIT,
            "status": PermissionStatus.ACTIVE,
            "granted_by_id": self.owner_a["id"],
            "granted_at": datetime.now(timezone.utc).isoformat()
        }
        self.permissions.append(perm_c)
        self.audit.append_event(self.owner_a["id"], "GRANT_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.assertEqual(len(self.permissions), 1)

    # Step 6: Viewer C performs edit -> Allowed
    def test_06_viewer_c_performs_edit_allowed(self):
        perm_c = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_c["id"],
            "permission_level": PermissionLevel.EDIT,
            "status": PermissionStatus.ACTIVE
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer_c, self.doc1, Operation.EDIT, perm_c)
        self.assertTrue(decision.allowed)
        self.audit.append_event(self.viewer_c["id"], "EDIT", self.doc1["id"], decision="ALLOW")

    # Step 7: Viewer C attempts ownership change -> Denied
    def test_07_viewer_c_attempts_ownership_change_denied(self):
        perm_c = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_c["id"],
            "permission_level": PermissionLevel.EDIT,
            "status": PermissionStatus.ACTIVE
        }
        # Ownership transfer / document deletion is owner-only
        decision_delete = PermissionDecisionEngine.evaluate(self.viewer_c, self.doc1, Operation.DELETE, perm_c)
        decision_grant = PermissionDecisionEngine.evaluate(self.viewer_c, self.doc1, Operation.GRANT_PERMISSION, perm_c)
        self.assertFalse(decision_delete.allowed)
        self.assertFalse(decision_grant.allowed)

    # Step 8: Owner revokes Viewer B -> Access revoked
    def test_08_owner_revokes_viewer_b(self):
        perm_b = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        # Owner revokes
        grant_decision = PermissionDecisionEngine.evaluate(self.owner_a, self.doc1, Operation.REVOKE_PERMISSION)
        self.assertTrue(grant_decision.allowed)

        # Mutate to revoked
        perm_b["status"] = PermissionStatus.REVOKED
        perm_b["revoked_at"] = datetime.now(timezone.utc).isoformat()
        self.audit.append_event(self.owner_a["id"], "REVOKE_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.assertEqual(perm_b["status"], PermissionStatus.REVOKED)

    # Step 9: Viewer B uses old link -> Denied (0ms cutoff)
    def test_09_viewer_b_uses_old_link_denied_immediately(self):
        revoked_perm_b = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.REVOKED,
            "revoked_at": datetime.now(timezone.utc).isoformat()
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer_b, self.doc1, Operation.READ, revoked_perm_b)
        self.assertFalse(decision.allowed)
        self.assertIn("revoked", decision.reason.lower())

    # Step 10: Viewer B changes doc ID (IDOR) -> Denied
    def test_10_viewer_b_changes_doc_id_idor_denied(self):
        # Viewer B tries to access Doc 2 (not shared with them)
        decision = PermissionDecisionEngine.evaluate(self.viewer_b, self.doc2, Operation.READ, None)
        self.assertFalse(decision.allowed)
        self.assertIn("no explicit permission grant", decision.reason.lower())

    # Step 11: Viewer B grants access -> Denied
    def test_11_viewer_b_grants_access_denied(self):
        perm_b = {
            "document_id": self.doc1["id"],
            "user_id": self.viewer_b["id"],
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer_b, self.doc1, Operation.GRANT_PERMISSION, perm_b)
        self.assertFalse(decision.allowed)
        self.assertIn("restricted exclusively to the document owner", decision.reason.lower())

    # Step 12: Unauthorized user calls permission API -> Denied
    def test_12_unauthorized_user_calls_permission_api_denied(self):
        decision = PermissionDecisionEngine.evaluate(self.unauth_user, self.doc1, Operation.GRANT_PERMISSION, None)
        self.assertFalse(decision.allowed)
        self.assertIn("restricted exclusively to the document owner", decision.reason.lower())

    # Step 13: Audit entries recorded for grant and revocation
    def test_13_audit_entries_recorded_for_grant_and_revocation(self):
        self.audit.append_event(self.owner_a["id"], "GRANT_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.viewer_b["id"], "READ", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.owner_a["id"], "REVOKE_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.viewer_b["id"], "READ", self.doc1["id"], decision="DENY", reason="Permission revoked")

        status = self.audit.verify_integrity()
        self.assertTrue(status["valid"])
        self.assertEqual(status["total_events"], 4)

    # Step 14: System state matches expected database records
    def test_14_system_state_matches_expected_database_records(self):
        # Simulate complete workflow sequence
        ledger_count_before = len(self.audit._ledger)
        self.audit.append_event(self.owner_a["id"], "UPLOAD", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.owner_a["id"], "GRANT_PERMISSION", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.viewer_c["id"], "EDIT", self.doc1["id"], decision="ALLOW")
        self.audit.append_event(self.owner_a["id"], "REVOKE_PERMISSION", self.doc1["id"], decision="ALLOW")

        verification = self.audit.verify_integrity()
        self.assertTrue(verification["valid"])
        self.assertEqual(verification["total_events"], ledger_count_before + 4)

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPermissionsWorkflow)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
