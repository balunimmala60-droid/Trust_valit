# TrustVault — Bug & Vulnerability Remediation Report (BUG_REPORT.md)

---

## Remediated Bugs & Vulnerabilities

### BUG-01: Admin Blanket Document Read Privilege Escalation
- **Severity**: Critical (CVSS 9.1)
- **Description**: Initial authorization draft allowed `role == 'ADMIN'` accounts to read and download any document in the system without owner consent.
- **Root Cause**: Early return condition in authorization logic.
- **Remediation**: Replaced with explicit Policy Decision Point checking document ownership and explicit grants. Admins are restricted to system health, user lifecycle, and audit logs.
- **Verification**: Verified via `test_admin_cannot_access_unshared_document_content`. Status: **RESOLVED**.

---

### BUG-02: Stale Access Window After Revocation
- **Severity**: High (CVSS 8.2)
- **Description**: Initial design considered caching permissions inside 15-minute JWT tokens, creating a 15-minute vulnerability window after revocation.
- **Root Cause**: Reliance on token claims for resource authorization.
- **Remediation**: Implemented zero token caching. Every request performs a transactional database query for current permission status.
- **Verification**: Verified via `test_immediate_revocation_blocks_subsequent_access`. Status: **RESOLVED**.

---

### BUG-03: MIME Header / File Extension Spoofing
- **Severity**: High (CVSS 8.4)
- **Description**: Upload validator checked only file extension and `Content-Type` HTTP header, permitting renamed executables.
- **Root Cause**: Incomplete file validation relying on client-supplied metadata.
- **Remediation**: Added binary magic byte verification (`%PDF-`, `PK\x03\x04`, `\x89PNG`, `\xFF\xD8\xFF`) and UUID filename isolation.
- **Verification**: Verified via `test_spoofed_file_signature_rejected`. Status: **RESOLVED**.

---

### BUG-04: Standalone Audit Log Tamper Blind Spot
- **Severity**: High (CVSS 7.8)
- **Description**: Audit entries were hashed individually, allowing an insider with database access to delete rows without breaking validity.
- **Root Cause**: Absence of Merkle chaining between adjacent events.
- **Remediation**: Linked every block to the predecessor block's SHA-256 hash ($H_n = \text{SHA-256}(H_{n-1} \parallel \text{payload})$).
- **Verification**: Verified via `test_audit_hash_chain_detects_tampering`. Status: **RESOLVED**.

---

### BUG-05: Metadata Search Enumeration
- **Severity**: Medium (CVSS 5.3)
- **Description**: Global search query scanned all documents in the database, allowing unauthorized users to infer existence of confidential unshared titles.
- **Root Cause**: Unscoped SQL query filter.
- **Remediation**: Restricted search scope strictly to owned documents and active, unexpired granted documents.
- **Verification**: Verified via `test_search_enumeration_cross_user_isolation`. Status: **RESOLVED**.
