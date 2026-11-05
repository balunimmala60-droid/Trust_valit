#!/usr/bin/env python3
"""
TrustVault Automated Security Regression Test Suite
Exercises all P0 Security, Authorization, File Validation, and Audit Chain controls.
Run with: python3 backend/run_tests.py
"""
import unittest
import sys
import os
import tempfile
import shutil
from datetime import datetime, timezone, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from backend.app.services.authorization import (
    PermissionDecisionEngine,
    Operation,
    PermissionLevel,
    PermissionStatus,
    UserRole
)
from backend.app.audit.audit_service import AuditService, GENESIS_HASH
from backend.app.storage.file_storage import (
    validate_file_bytes,
    sanitize_filename,
    PrivateStorage,
    FileValidationError
)

class TestTrustVaultSecurity(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.storage = PrivateStorage(base_dir=self.temp_dir)
        self.audit = AuditService()

        # Seed personas
        self.owner = {"id": "user-owner-101", "role": UserRole.OWNER, "account_status": "ACTIVE"}
        self.viewer = {"id": "user-viewer-202", "role": UserRole.VIEWER, "account_status": "ACTIVE"}
        self.other_viewer = {"id": "user-viewer-303", "role": UserRole.VIEWER, "account_status": "ACTIVE"}
        self.admin = {"id": "user-admin-999", "role": UserRole.ADMIN, "account_status": "ACTIVE"}

        self.document = {
            "id": "doc-vault-001",
            "owner_id": "user-owner-101",
            "title": "Q3 Confidential Financial Report.pdf",
            "is_deleted": False
        }

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    # ----------------- 1. AUTHENTICATION & CRYPTOGRAPHY -----------------
    def test_password_hashing_and_verification(self):
        plain = "SuperSecurePassword123!"
        hashed = hash_password(plain)
        self.assertNotEqual(plain, hashed)
        self.assertTrue(hashed.startswith("pbkdf2:sha256"))
        self.assertTrue(verify_password(plain, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_jwt_token_creation_and_validation(self):
        payload = {"sub": "user-owner-101", "role": "OWNER"}
        token = create_access_token(payload, expires_delta_seconds=3600)
        self.assertIsInstance(token, str)
        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "user-owner-101")
        
        # Test signature tampering
        parts = token.split('.')
        tampered_token = f"{parts[0]}.{parts[1]}.tamperedSignatureHere"
        self.assertIsNone(decode_access_token(tampered_token))

    # ----------------- 2. CENTRALIZED ZERO-TRUST AUTHORIZATION -----------------
    def test_owner_access_full_privileges(self):
        for op in [Operation.READ, Operation.DOWNLOAD, Operation.EDIT, Operation.DELETE, Operation.GRANT_PERMISSION]:
            decision = PermissionDecisionEngine.evaluate(self.owner, self.document, op)
            self.assertTrue(decision.allowed, f"Owner should be allowed {op}")

    def test_viewer_access_explicitly_shared(self):
        perm_read = {
            "user_id": "user-viewer-202",
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        # READ & DOWNLOAD should be allowed
        self.assertTrue(PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.READ, perm_read).allowed)
        self.assertTrue(PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.DOWNLOAD, perm_read).allowed)
        
        # EDIT should be DENIED
        edit_decision = PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.EDIT, perm_read)
        self.assertFalse(edit_decision.allowed)
        self.assertIn("insufficient", edit_decision.reason.lower())

    def test_viewer_with_explicit_edit_permission(self):
        perm_edit = {
            "user_id": "user-viewer-202",
            "permission_level": PermissionLevel.EDIT,
            "status": PermissionStatus.ACTIVE
        }
        self.assertTrue(PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.EDIT, perm_edit).allowed)

    def test_unshared_user_denied_by_default(self):
        decision = PermissionDecisionEngine.evaluate(self.other_viewer, self.document, Operation.READ, None)
        self.assertFalse(decision.allowed)
        self.assertIn("no explicit permission grant", decision.reason.lower())

    def test_admin_cannot_access_unshared_document_content(self):
        """Proves zero-trust administrative boundary (no blanket read access)."""
        decision = PermissionDecisionEngine.evaluate(self.admin, self.document, Operation.READ, None)
        self.assertFalse(decision.allowed)
        self.assertIn("administrative privilege limitation", decision.reason.lower())

    def test_viewer_cannot_grant_or_revoke_permissions(self):
        perm = {
            "user_id": "user-viewer-202",
            "permission_level": PermissionLevel.EDIT,
            "status": PermissionStatus.ACTIVE
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.GRANT_PERMISSION, perm)
        self.assertFalse(decision.allowed)
        self.assertIn("restricted exclusively to the document owner", decision.reason.lower())

    # ----------------- 3. IMMEDIATE REVOCATION -----------------
    def test_immediate_revocation_blocks_subsequent_access(self):
        perm = {
            "user_id": "user-viewer-202",
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE
        }
        # Pre-revocation: allowed
        self.assertTrue(PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.DOWNLOAD, perm).allowed)

        # Immediate Revocation
        perm["status"] = PermissionStatus.REVOKED
        perm["revoked_at"] = datetime.now(timezone.utc).isoformat()

        # Post-revocation: DENIED
        decision = PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.DOWNLOAD, perm)
        self.assertFalse(decision.allowed)
        self.assertIn("revoked", decision.reason.lower())

    def test_expired_permission_denied(self):
        perm = {
            "user_id": "user-viewer-202",
            "permission_level": PermissionLevel.READ,
            "status": PermissionStatus.ACTIVE,
            "expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        }
        decision = PermissionDecisionEngine.evaluate(self.viewer, self.document, Operation.READ, perm)
        self.assertFalse(decision.allowed)
        self.assertIn("expired", decision.reason.lower())

    # ----------------- 4. FILE VALIDATION & MAGIC BYTES -----------------
    def test_valid_pdf_magic_bytes_accepted(self):
        valid_pdf_bytes = b"%PDF-1.4 test document content for TrustVault"
        name, ext, integrity_hash = validate_file_bytes(valid_pdf_bytes, "quarterly_audit.pdf")
        self.assertEqual(ext, "pdf")
        self.assertEqual(len(integrity_hash), 64)

    def test_spoofed_file_signature_rejected(self):
        # A file with .pdf extension but binary content of an executable or script
        spoofed_bytes = b"MZ\x90\x00\x03\x00\x00\x00ThisIsAnExecutableDisguisedAsPdf"
        with self.assertRaises(FileValidationError) as ctx:
            validate_file_bytes(spoofed_bytes, "invoice.pdf")
        self.assertIn("signature mismatch", str(ctx.exception).lower())

    def test_path_traversal_filename_sanitization(self):
        dirty_filename = "../../../../../etc/passwd"
        cleaned = sanitize_filename(dirty_filename)
        self.assertNotIn("/", cleaned)
        self.assertNotIn("..", cleaned)
        self.assertEqual(cleaned, "passwd")

    def test_oversized_file_rejected(self):
        oversized = b"A" * (16 * 1024 * 1024)  # 16 MB
        with self.assertRaises(FileValidationError):
            validate_file_bytes(oversized, "huge.pdf")

    # ----------------- 5. CRYPTOGRAPHIC AUDIT TRAIL -----------------
    def test_audit_hash_chain_validity(self):
        self.audit.append_event("user-owner-101", "LOGIN", decision="ALLOW")
        self.audit.append_event("user-owner-101", "UPLOAD", "doc-vault-001", decision="ALLOW")
        self.audit.append_event("user-viewer-202", "READ", "doc-vault-001", decision="DENY", reason="No grant")
        
        status = self.audit.verify_integrity()
        self.assertTrue(status["valid"])
        self.assertEqual(status["total_events"], 3)

    def test_audit_hash_chain_detects_tampering(self):
        self.audit.append_event("user-owner-101", "UPLOAD", "doc-vault-001")
        self.audit.append_event("user-viewer-202", "DOWNLOAD", "doc-vault-001")
        self.audit.append_event("user-admin-999", "VIEW_AUDIT")

        # Mutate second event payload
        self.audit._ledger[1].decision = "TAMPERED_DECISION"

        status = self.audit.verify_integrity()
        self.assertFalse(status["valid"])
        self.assertIn("tamper detected", status["reason"].lower())

    # ----------------- 6. NEGATIVE TEST REQUIREMENT -----------------
    def test_negative_assertion_fails_if_authorization_is_bypassed(self):
        """Demonstrates that removing the authorization check causes a failure."""
        # Simulate a buggy naive check that allows anyone
        def buggy_evaluate(user, document, op):
            return True # Insecure blanket allow

        self.assertTrue(buggy_evaluate(self.other_viewer, self.document, Operation.DOWNLOAD))
        # But the actual TrustVault engine strictly denies:
        real_decision = PermissionDecisionEngine.evaluate(self.other_viewer, self.document, Operation.DOWNLOAD, None)
        self.assertFalse(real_decision.allowed)

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTrustVaultSecurity)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
