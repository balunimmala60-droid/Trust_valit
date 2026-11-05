# TrustVault — Automated Test Results (TEST_RESULTS.md)

**Execution Timestamp:** 2026-11-05T08:14:09Z  
**Total Tests Executed:** 17  
**Passed:** 17  
**Failed:** 0  
**Status:** ALL TESTS PASSING (100% Green)

---

## Security & Authorization Test Matrix

| # | Test Name | Target Domain | Expected Behavior | Actual Result |
|---|---|---|---|:---:|
| 1 | `test_password_hashing_and_verification` | Auth / Crypto | PBKDF2 with 100k rounds; verify hash mismatch on wrong pw | **PASS** |
| 2 | `test_jwt_token_creation_and_validation` | Session Security | Cryptographic HS256 signature verification; reject tampered tokens | **PASS** |
| 3 | `test_owner_access_full_privileges` | Authorization | Document owner allowed READ, DOWNLOAD, EDIT, DELETE, GRANT | **PASS** |
| 4 | `test_viewer_access_explicitly_shared` | Authorization | Viewer with READ allowed READ/DOWNLOAD, denied EDIT (403) | **PASS** |
| 5 | `test_viewer_with_explicit_edit_permission`| Authorization | Viewer with explicit EDIT allowed document modification | **PASS** |
| 6 | `test_unshared_user_denied_by_default` | Zero-Trust | Deny-by-default when no grant exists | **PASS** |
| 7 | `test_admin_cannot_access_unshared_document_content` | Least-Privilege | Admin role cannot read/download private documents | **PASS** |
| 8 | `test_viewer_cannot_grant_or_revoke_permissions` | Privilege Escalation | Viewers blocked from granting or delegating permissions | **PASS** |
| 9 | `test_immediate_revocation_blocks_subsequent_access` | Revocation | Immediately reject read/download upon revocation (0ms window) | **PASS** |
| 10 | `test_expired_permission_denied` | Temporal Access | Permission past expiration timestamp rejected automatically | **PASS** |
| 11 | `test_valid_pdf_magic_bytes_accepted` | File Inspection | Genuine `%PDF-` file header accepted and SHA-256 hashed | **PASS** |
| 12 | `test_spoofed_file_signature_rejected` | Upload Security | File with `.pdf` extension but binary executable header rejected | **PASS** |
| 13 | `test_path_traversal_filename_sanitization` | Storage Security | Path separators (`../../etc/passwd`) stripped to safe identifier | **PASS** |
| 14 | `test_oversized_file_rejected` | DoS Prevention | Files exceeding 15MB rejected before buffering | **PASS** |
| 15 | `test_audit_hash_chain_validity` | Audit Integrity | Sequential event hashing produces unbroken SHA-256 chain | **PASS** |
| 16 | `test_audit_hash_chain_detects_tampering` | Forensic Proof | Modifying single event payload triggers integrity failure alert | **PASS** |
| 17 | `test_negative_assertion_fails_if_authorization_is_bypassed` | Regression Gate | Test fails if unauthorized user is mistakenly allowed | **PASS** |

---

## How to Re-Run Tests
```bash
python3 backend/run_tests.py
```
Or via the in-app **Security Proof Center** and **Attack Replay Lab** in the TrustVault Web UI.
