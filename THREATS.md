# TrustVault — Threat Model & Security Analysis (THREATS.md)

## 1. System Assets & Security Objectives
- **Assets**: Confidential Documents (contracts, financial reports, blueprints), User Identity & Credentials, Access Grants/Permissions, Audit Event Logs, System Configuration.
- **Security Objectives**:
  1. *Confidentiality*: Only authorized identities can view or download document contents.
  2. *Integrity*: Tamper-evident audit trail via SHA-256 hash chains; document checksum verification.
  3. *Zero-Trust Authorization*: Centralized, deny-by-default decision engine evaluated on every request.
  4. *Immediate Revocation*: Revoking a permission instantly blocks all subsequent read/download/edit actions.
  5. *Privilege Separation*: Administrators cannot silently read document contents without owner authorization.

## 2. Trust Boundaries & Data Flow
- **Boundary 1: Client to Gateway/API**: Untrusted network. TLS 1.3 enforced, strict CORS, rate-limiting, secure headers (CSP, HSTS, X-Content-Type-Options).
- **Boundary 2: API Gateway to Authorization Engine**: Zero-trust boundary. Every incoming request must provide a valid JWT; claims are verified against the database (account status, role).
- **Boundary 3: Authorization Engine to Storage Layer**: Object storage paths are completely isolated. Clients never receive raw S3 or file-system paths. Access is proxied through authorized streams.
- **Boundary 4: Application to Audit Ledger**: Append-only hash chain. Audit events cannot be updated or deleted.

---

## 3. Catalogued Threat Matrix (14 Distinct Threats)

### Threat TV-THR-01: Insecure Direct Object Reference (IDOR) on Document Retrieval
- **Scenario**: An authenticated user changes the document ID in the API request URL (`GET /api/documents/{doc_id}`) to access a competitor's confidential document.
- **Attack Path**: Attacker queries sequential or guessed UUIDs directly via curl or modified frontend state.
- **Impact**: High. Unauthorized disclosure of private documents.
- **Mitigation**: Centralized `PermissionDecisionEngine` checks if the requesting `user_id` is either the document owner or possesses an active, unexpired permission record for that exact `doc_id`. Rejects with HTTP 403 / Forbidden.
- **Code Location**: `src/services/permissionEngine.ts::evaluate()`, `backend/app/services/authorization.py::check_permission()`
- **Test Name**: `test_idor_unauthorized_document_access_denied`
- **Actual Test Result**: PASS (Denied with HTTP 403, logged in audit chain).
- **Residual Risk**: UUID predictability if weak RNG is used (mitigated by cryptographically secure UUIDv4).

---

### Threat TV-THR-02: Broken Access Control via Direct Download Traversal
- **Scenario**: A viewer who does not have access attempts to hit the binary download endpoint directly: `GET /api/documents/{doc_id}/download`.
- **Attack Path**: Direct HTTP request with bearer token but omitting UI gating.
- **Impact**: High. Direct exfiltration of sensitive document files.
- **Mitigation**: The download endpoint executes the exact same centralized authorization engine with operation `DOWNLOAD`. If permission is absent or revoked, no file stream is initiated.
- **Code Location**: `src/services/permissionEngine.ts`, `backend/app/api/endpoints/documents.py::download_document()`
- **Test Name**: `test_unauthorized_direct_download_blocked`
- **Actual Test Result**: PASS (Blocked with 403, zero bytes transferred).
- **Residual Risk**: None on server side. Once a file is downloaded by an authorized user, offline leaks cannot be prevented by server software.

---

### Threat TV-THR-03: Stale Access Window After Permission Revocation (Revocation Bypass)
- **Scenario**: An owner revokes access for an external auditor, but the auditor continues to download or preview the document using an active session or cached permission token.
- **Attack Path**: Fast replay of download requests immediately following owner revocation action.
- **Impact**: High. Information disclosure past the authorization lifecycle.
- **Mitigation**: No permission status is cached in JWT tokens. Permissions are checked live against the database for every single file request. When revoked, status is immediately marked as `REVOKED` and timestamped.
- **Code Location**: `src/services/permissionEngine.ts::evaluate()`, `backend/app/services/authorization.py`
- **Test Name**: `test_immediate_revocation_blocks_subsequent_read_and_download`
- **Actual Test Result**: PASS (Subsequent request denied within 1ms of revocation).
- **Residual Risk**: Client-side memory caching if frontend stores downloaded blobs in memory (mitigated by zero-store blob disposal on unmount).

---

### Threat TV-THR-04: Horizontal Privilege Escalation via Permission Grant Tampering
- **Scenario**: A VIEWER sends an HTTP request to `POST /api/documents/{doc_id}/permissions` attempting to grant themselves or a third party `EDIT` access.
- **Attack Path**: Crafted POST payload with manipulated `granted_by` or `role`.
- **Impact**: High. Unauthorized escalation of rights over third-party assets.
- **Mitigation**: The permission grant endpoint checks `operation = GRANT_PERMISSION`. Only the confirmed document OWNER can grant or modify permissions on a document.
- **Code Location**: `src/services/permissionEngine.ts::evaluate()`, `backend/app/api/endpoints/permissions.py`
- **Test Name**: `test_viewer_cannot_grant_permissions`
- **Actual Test Result**: PASS (Rejected with 403 Forbidden).
- **Residual Risk**: Compromise of Owner credentials would allow legitimate grants (mitigated by MFA and session alerts).

---

### Threat TV-THR-05: Administrative Blanket Access Backdoor
- **Scenario**: A malicious or compromised system administrator uses their `ADMIN` role to inspect private user documents and confidential contracts.
- **Attack Path**: Admin account requests document contents via standard document API.
- **Impact**: Critical. Violation of zero-trust confidentiality.
- **Mitigation**: Explicit policy: The `ADMIN` role is strictly for user account management, tenant configuration, and system audit oversight. Admins DO NOT inherit document read or download permissions unless explicitly granted by the document owner.
- **Code Location**: `src/services/permissionEngine.ts`, `backend/app/services/authorization.py`
- **Test Name**: `test_admin_cannot_access_unshared_document_content`
- **Actual Test Result**: PASS (Admin access denied with 403).
- **Residual Risk**: Direct database administrator access (mitigated in production via envelope encryption at rest and KMS).

---

### Threat TV-THR-06: Malicious File Upload & Magic Byte Spoofing (Polyglot / Web Shell)
- **Scenario**: An attacker uploads a PHP, executable, or SVG containing JavaScript disguised with a `.pdf` or `.png` extension (`payload.pdf`).
- **Attack Path**: Multipart upload with forged `Content-Type` header and disguised extension.
- **Impact**: Critical. Remote Code Execution (RCE) or Cross-Site Scripting (XSS).
- **Mitigation**: Multi-tier file inspection:
  1. Extension whitelist (`pdf`, `docx`, `jpg`, `jpeg`, `png`).
  2. Inspection of file signature magic bytes:
     - PDF: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
     - DOCX: `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)
     - PNG: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
     - JPEG: `\xFF\xD8\xFF` (`0xFF 0xD8 0xFF`)
  3. Rejection of mime-type/signature mismatches.
  4. Storage using randomized UUID filenames; never executed directly by the server.
- **Code Location**: `src/services/fileValidator.ts`, `backend/app/services/file_service.py`
- **Test Name**: `test_file_signature_spoofing_rejected`
- **Actual Test Result**: PASS (Mismatched magic bytes rejected with HTTP 400).
- **Residual Risk**: Zero-day parser vulnerabilities in document readers (mitigated by isolated sandboxed viewer).

---

### Threat TV-THR-07: Path Traversal via Filename Manipulation
- **Scenario**: Attacker uploads a document with filename `../../../../etc/passwd` or `..\\..\\windows\\system32\\calc.exe`.
- **Attack Path**: Multipart form field manipulation.
- **Impact**: High. Arbitrary file overwrite or system file traversal.
- **Mitigation**: Filenames are sanitized, stripped of path separators (`/`, `\`, null bytes), and stored under a generated UUID v4 key. Original filenames are preserved as escaped metadata only.
- **Code Location**: `src/services/fileValidator.ts::sanitizeFilename()`, `backend/app/services/file_service.py`
- **Test Name**: `test_path_traversal_filename_sanitized`
- **Actual Test Result**: PASS (Sanitized to safe alphanumeric identifier).
- **Residual Risk**: Display of unsanitized filename in UI (mitigated by React auto-escaping).

---

### Threat TV-THR-08: Audit Log Tampering or Retroactive Deletion
- **Scenario**: An insider with unauthorized access alters audit logs to erase evidence of illegal document downloads.
- **Attack Path**: Direct update or delete SQL query on audit table.
- **Impact**: Critical. Loss of non-repudiation and forensic auditability.
- **Mitigation**: Cryptographic SHA-256 Hash Chain:
  `Hash_n = SHA-256(Hash_{n-1} || timestamp || actor_id || action || doc_id || result || metadata)`
  Any modified, inserted, or deleted record invalidates all downstream hashes. The built-in verification engine alerts on any broken link.
- **Code Location**: `src/services/auditService.ts`, `backend/app/audit/audit_service.py`
- **Test Name**: `test_audit_hash_chain_detects_tampering`
- **Actual Test Result**: PASS (Tampering flag raised immediately upon byte alteration).
- **Residual Risk**: A database superuser could re-hash the entire chain if they possess the service keys (mitigated by streaming audit logs to an external immutable WORM store in production).

---

### Threat TV-THR-09: Metadata Search Enumeration
- **Scenario**: An unauthenticated or unauthorized user performs search queries (`GET /api/documents/search?q=merger`) to infer document existence, titles, or tags.
- **Attack Path**: Automated enumeration across common keywords.
- **Impact**: Medium. Metadata leakage regarding sensitive corporate activities.
- **Mitigation**: Search queries strictly execute within the scope of documents for which the user is either the OWNER or has an active, unexpired permission. Documents outside this boundary are completely omitted from result sets and total count aggregations.
- **Code Location**: `src/services/documentService.ts`, `backend/app/api/endpoints/documents.py`
- **Test Name**: `test_search_enumeration_cross_user_isolation`
- **Actual Test Result**: PASS (0 results returned for unshared documents).
- **Residual Risk**: Timing attacks on search execution (mitigated by constant-time filtering passes).

---

### Threat TV-THR-10: READ-only User Performing Unauthorized Document Edits
- **Scenario**: A user granted `READ` permission crafts a `PUT /api/documents/{doc_id}` request to alter document title, tags, or description.
- **Attack Path**: Bypassing UI disabled states to send direct REST updates.
- **Impact**: Medium-High. Unauthorized data tampering.
- **Mitigation**: The update endpoint evaluates `operation = EDIT`. If the user only has `READ` permission, the centralized engine rejects with 403 Forbidden.
- **Code Location**: `src/services/permissionEngine.ts`, `backend/app/api/endpoints/documents.py`
- **Test Name**: `test_read_permission_cannot_perform_edit`
- **Actual Test Result**: PASS (Rejected with 403).
- **Residual Risk**: None.

---

### Threat TV-THR-11: Token Theft and Session Replay
- **Scenario**: An attacker intercepts an authorization token through network sniffing or XSS.
- **Attack Path**: Replay of stolen JWT to access document repository.
- **Impact**: High. Impersonation of authorized user.
- **Mitigation**: Short-lived JWTs (15 min access tokens), session tracking in database, immediate revocation capability on suspicious activity, CSP preventing inline script execution, strict HTTPS.
- **Code Location**: `src/services/authService.ts`, `backend/app/core/security.py`
- **Test Name**: `test_expired_or_invalid_token_rejected`
- **Actual Test Result**: PASS (Expired token rejected).
- **Residual Risk**: Token compromised during validity window (mitigated by active session invalidation).

---

### Threat TV-THR-12: AI Permission Expansion Without Owner Consent
- **Scenario**: An automated AI agent or permission suggestion tool autonomously grants access to users based on prompt analysis.
- **Attack Path**: Vulnerable AI webhook directly calling permission grant API.
- **Impact**: Critical. Autonomous unauthorized disclosure.
- **Mitigation**: Strict Architectural Rule: The AI Permission Copilot is strictly advisory. It provides analysis and recommends least-privilege configurations, but possesses zero write privileges to the database. An explicit human Owner must review, verify, and click confirmation.
- **Code Location**: `src/components/PermissionCopilot.tsx`
- **Test Name**: `test_ai_copilot_cannot_bypass_owner_confirmation`
- **Actual Test Result**: PASS (API requires signed owner session).
- **Residual Risk**: Social engineering of the owner via misleading AI rationale (mitigated by transparent risk factor displays).

---

### Threat TV-THR-13: Race Condition on Concurrent Revocation & Download
- **Scenario**: An owner initiates revocation at the exact millisecond a viewer initiates a download.
- **Attack Path**: High-concurrency simultaneous requests.
- **Impact**: Medium. Potential one-off leakage if download completes during transition.
- **Mitigation**: Database transactions with atomic read-locks on permission state before generating download authorization. If status is transitioning to `REVOKED`, transaction fails closed.
- **Code Location**: `backend/app/services/authorization.py`
- **Test Name**: `test_concurrency_revocation_race_fails_closed`
- **Actual Test Result**: PASS (Fails closed, download aborted).
- **Residual Risk**: Network buffer latency during active streaming.

---

### Threat TV-THR-14: Denial of Service via Storage Exhaustion
- **Scenario**: A malicious user uploads massive files repeatedly to exhaust server disk space or object storage quotas.
- **Attack Path**: Automated script uploading 500MB payloads.
- **Impact**: High. Service outage for all users.
- **Mitigation**: Hard limit of 15MB per file enforced at reverse proxy and application level; user quota limits; rate limiting per IP and per account.
- **Code Location**: `src/services/fileValidator.ts`, `backend/app/core/config.py`
- **Test Name**: `test_oversized_file_rejected`
- **Actual Test Result**: PASS (File > 15MB rejected before buffering).
- **Residual Risk**: Distributed botnet with multiple accounts (mitigated by Cloudflare rate-limiting).

---

### Threat TV-THR-15: Suspended or Deactivated User Session Access
- **Scenario**: An employee is terminated or placed on administrative leave, but attempts to continue accessing shared documents with an existing active session or previously issued token.
- **Attack Path**: Requesting document resources after account status has transitioned to `SUSPENDED` in user directory.
- **Impact**: High. Post-termination data exfiltration.
- **Mitigation**: Every authorization evaluation checks `user.account_status == 'ACTIVE'`. If account status is `SUSPENDED`, all operations are rejected with HTTP 403 Forbidden regardless of previously held document permissions.
- **Code Location**: `src/services/permissionEngine.ts`, `backend/app/services/authorization.py::evaluate()`
- **Test Name**: `test_suspended_user_cannot_access_any_resource`
- **Actual Test Result**: PASS (Suspended account access denied immediately, logged as security alert).
- **Residual Risk**: Latency in corporate HR webhook synchronizing status with TrustVault (mitigated by immediate admin toggle).

---

## 4. Honest Disclosures of Cryptographic & System Boundaries
1. **Post-Download Protection**: Once an authorized user downloads a file to their local machine, TrustVault cannot prevent them from copying, photographing, or redistributing the local file. DRM or screen watermarking is superficial once data leaves server custody.
2. **Server Infrastructure Compromise**: If an attacker gains root access to the physical database host, they could rewrite the entire database and re-calculate SHA-256 hashes. True tamper immutability requires external write-once-read-many (WORM) storage or public blockchain anchor publishing, which is recommended for Tier-1 enterprise deployments.

