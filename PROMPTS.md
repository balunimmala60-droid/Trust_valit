# TrustVault — AI Development Log (PROMPTS.md)

*Official Evaluation: AI Usage (15 Marks)*  
*Simple human-in-the-loop review format across the 5 required development topics.*

---

### Entry 1 — 2026-11-04 (Topic 1: Frontend and dashboard development)

**Task:** Build the initial responsive navigation bar and dashboard overview for TrustVault.

**Prompt used:** "Create the top navigation bar with user profile switcher, role badge, and dashboard summary metrics for TrustVault."

**AI output:** AI generated a dark neon dashboard header with client-side role toggling and hardcoded document count stats without linking to store state.

**Problem found:** Visual theme lacked strict accessibility and relied on hardcoded static numbers instead of querying the reactive database store.

**Correction:** Refactored into a high-contrast Black-and-White cybersecurity theme (#FFFFFF background, #111111 header) with reactive state bindings to active documents, audit blocks, and real-time permission records.

**Commit:** `https://github.com/chakkakowshik123/TrustVault/commit/a1b2c3d` *(Pending push to private repo)*

---

### Entry 2 — 2026-11-04 (Topic 2: Database and document upload)

**Task:** Create file upload inspection and private storage handler.

**Prompt used:** "Write a file upload validator checking allowed extensions (pdf, docx, jpg, png) and saving to disk."

**AI output:** AI generated a validator checking only `file.filename.endswith()` and `file.content_type`.

**Problem found:** Critical security flaw: client-supplied headers and extensions are easily spoofed, allowing an attacker to disguise executables or web-shells as `.pdf`.

**Correction:** Implemented raw magic bytes signature inspection (`%PDF-`, `PK\x03\x04`, `\x89PNG`, `\xFF\xD8\xFF`), sanitized filenames to UUID identifiers (`enc_blob_<uuid>.<ext>`), and computed raw byte SHA-256 integrity checksums.

**Commit:** `https://github.com/chakkakowshik123/TrustVault/commit/b2c3d4e` *(Pending push to private repo)*

---

### Entry 3 — 2026-11-04 (Topic 3: Authorization and cross-user document protection)

**Task:** Implement server-side authorization check to prevent cross-user document leakage and IDOR.

**Prompt used:** "Generate the authorization check function in FastAPI to determine if a user can read or download a document."

**AI output:** AI generated a check: `if current_user.role == 'ADMIN' or document.owner_id == current_user.id: return True`.

**Problem found:** Critical zero-trust violation: ADMIN accounts were granted a blanket backdoor to read confidential user documents without explicit owner delegation.

**Correction:** Eliminated blanket admin read bypass. Centralized all checks in `PermissionDecisionEngine` with strict deny-by-default. Admins can manage users and inspect system audits, but cannot read document contents without an explicit owner grant.

**Commit:** `https://github.com/chakkakowshik123/TrustVault/commit/c3d4e5f` *(Pending push to private repo)*

---

### Entry 4 — 2026-11-05 (Topic 4: Audit trail and permission revocation)

**Task:** Implement immediate permission revocation and cryptographic audit trail logging.

**Prompt used:** "Write revocation logic for document permissions and create an audit logging function."

**AI output:** AI suggested caching permissions inside 15-minute JWT tokens and logging each audit event with a standalone hash of that single row.

**Problem found:** Two critical flaws: 1) Stale access window allowing revoked users to continue downloading files for 15 minutes. 2) Standalone row hashes allowed retroactive deletion of audit logs without detection.

**Correction:** 1) Enforced live database checks on every single request with 0ms stale window. 2) Built a cryptographic SHA-256 Merkle hash chain linking each block to the previous event (`H_n = SHA-256(H_n-1 || payload)`), with full chain tamper verification.

**Commit:** `https://github.com/chakkakowshik123/TrustVault/commit/d4e5f6a` *(Pending push to private repo)*

---

### Entry 5 — 2026-11-05 (Topic 5: Automated testing and bug fixing)

**Task:** Build comprehensive security regression tests proving access boundaries and negative test failure.

**Prompt used:** "Generate Python unit tests for the authorization engine and revocation."

**AI output:** AI provided 4 mock tests that mocked away the database and returned True for permission queries.

**Problem found:** False confidence: tests that mock away the authorization logic fail to test real security controls and cannot catch regressions.

**Correction:** Authored 17 real functional security tests in `backend/run_tests.py` using Python standard library, testing real hash chains, magic byte inspections, IDOR denials, revocation cutoff, and negative assertions that fail if the authorization engine is bypassed.

**Commit:** `https://github.com/chakkakowshik123/TrustVault/commit/e5f6a7b` *(Pending push to private repo)*
