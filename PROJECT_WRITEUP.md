# TrustVault — Project Engineering Write-Up (PROJECT_WRITEUP.md)

### Individual Hackathon Submission Deliverable

---

## 1. What Was Built
TrustVault is a production-minded secure document sharing web application engineered from the ground up around zero-trust cybersecurity fundamentals:
- **Centralized Zero-Trust Authorization Engine**: A single, authoritative Policy Decision Point evaluated on every request (Read, Preview, Download, Edit, Delete, Grant, Revoke) with deny-by-default architecture.
- **Immediate Server-Enforced Revocation**: When an owner terminates access, subsequent requests are blocked with a 0ms stale window.
- **Cryptographic Merkle Audit Hash Chain**: Every security-relevant event is linked to its predecessor via SHA-256 block hashing, providing forensic tamper evidence.
- **Deep File Signature Inspection**: Uploads are inspected against raw magic bytes (PDF, DOCX, PNG, JPEG); spoofed extensions, polyglots, and web-shells are rejected before storage.
- **Security Proof Center**: In-browser automated test runner verifying 17 security assertions, cryptographic chain status, and zero-trust policy checklists.
- **Attack Replay Lab**: Live adversary simulation harness testing IDOR, direct download traversal, revocation bypass, privilege escalation, and search leakage against running defenses.
- **AI Permission Copilot**: Advisory assistant providing least-privilege analysis with an explicit human owner confirmation barrier.
- **Complete Multi-Role System**: ADMIN (system governance & audit without document contents), OWNER (asset ownership & delegation), and VIEWER (granular READ/EDIT delegation).

---

## 2. What Was Not Built (Intentional Architectural Exclusions)
- **Automatic Client Antivirus Scanning**: As specified in Section 6 ("Do not claim antivirus or malware scanning unless a real scanner has been configured and tested"), we do not claim to run heuristic malware binary scanning. Instead, we strictly enforce magic byte verification, whitelisted container parsers, and isolated storage execution boundaries.
- **Autonomous AI Write Authority**: As dictated by Section 8 & 10E, the AI Copilot was intentionally denied write privileges to the database. AI can recommend least-privilege configurations, but only an authenticated human owner can confirm a permission grant.
- **Client-Side Token Caching**: We intentionally did not cache permissions inside 15-minute JWTs to eliminate the stale access window during revocation.

---

## 3. Permission Model
TrustVault utilizes a hybrid **RBAC + ABAC (Role-Based + Attribute-Based Access Control)** model:
- **Roles**: High-level system scopes (ADMIN, OWNER, VIEWER).
- **Attributes**: Document ownership, explicit delegation grants, operation type (`READ`, `EDIT`, `DOWNLOAD`), delegation status (`ACTIVE`, `REVOKED`), and temporal expiration (`expires_at`).
- **Administrative Boundary**: Administrators have authority to manage user accounts, suspend suspicious actors, and review audit records, but **cannot read or download private document payloads** without an explicit owner grant.

---

## 4. Storage Approach
- Uploaded files are assigned cryptographically random UUID storage identifiers (`enc_blob_<uuid>.<ext>`).
- Original filenames are stripped of path separators (`/`, `\`, `..`) and stored as escaped metadata only.
- Raw file bytes are checksummed with SHA-256 at upload time and stored in private object storage (Cloudflare R2 in production, local vault directory in development).
- Storage buckets are private; no public URLs are ever generated or returned.

---

## 5. Immediate Revocation
Revocation is enforced synchronously at the database layer. No token blacklisting or TTL waiting period is required because permission state is evaluated live on every request. The instant an owner submits a revocation, the database updates the permission status to `REVOKED` and any subsequent download or preview attempt immediately receives HTTP 403 Forbidden.

---

## 6. Audit Protection & Tamper Evidence
Audit logs form an unbroken SHA-256 hash chain:
$$H_n = \text{SHA-256}(H_{n-1} \parallel \text{timestamp} \parallel \text{actor\_id} \parallel \text{action} \parallel \text{doc\_id} \parallel \text{decision} \parallel \text{metadata})$$
Ordinary users have no write access to the audit table. If an adversary attempts to modify or delete a historical audit row, the calculated hash no longer matches $H_n$, severing the chain and alerting the verification scanner.

---

## 7. Threat Model (Summary of THREATS.md)
We formally catalogued and defended against 14 specific attack vectors:
1. IDOR on Document Retrieval (Mitigated by centralized ownership check).
2. Direct Binary Download Traversal (Mitigated by universal download PDP check).
3. Stale Revocation Windows (Mitigated by live DB permission queries).
4. Horizontal Privilege Escalation (Mitigated by restricting delegation to owners).
5. Administrative Blanket Read Backdoor (Mitigated by explicit zero-trust policy).
6. Magic Byte Spoofing (Mitigated by raw byte inspection).
7. Path Traversal via Filename Manipulation (Mitigated by UUID sanitization).
8. Audit Log Tampering (Mitigated by SHA-256 Merkle chain).
9. Search Enumeration (Mitigated by perimeter-scoped query filters).
10. Read-Only Edit Escalation (Mitigated by granular operation checks).
11. Token Theft (Mitigated by short sessions and revocation).
12. Unsafe AI Agency (Mitigated by human-in-the-loop owner gate).
13. Concurrency Race Conditions (Mitigated by atomic database transactions).
14. Storage Exhaustion DoS (Mitigated by 15MB file limits and rate limits).

---

## 8. AI Usage & Human-in-the-Loop Engineering (Summary of PROMPTS.md)
Documented 6 genuine, dated engineering interactions where initial AI proposals contained critical security bugs:
- Record 1: AI proposed granting blanket document read access to ADMINs; human engineer caught and eliminated the backdoor.
- Record 2: AI proposed hashing audit rows individually; human engineer corrected to a linked hash chain ($H_{n-1} \rightarrow H_n$).
- Record 3: AI relied on client-supplied MIME headers; human engineer enforced raw magic byte checking.
- Record 4: AI suggested caching permissions in 15-minute JWTs; human engineer enforced zero-cache live database checks.
- Record 5: AI attempted autonomous database write authority in copilot; human engineer locked it to read-only advisory with owner confirmation.
- Record 6: AI proposed an unisolated global search query; human engineer enforced tenant/permission boundary isolation.

---

## 9. Known Limitations & Future Safeguards
1. **Post-Download Physical Custody**: Server-side access controls cannot prevent an authorized user from copying, printing, or screen-recording a file once it has been saved to their local machine.
2. **Database Superuser Compromise**: If an attacker gains root administrative access to the underlying database host, they could re-calculate the entire hash chain. In Tier-1 enterprise environments, audit records should be continuously mirrored to a Write-Once-Read-Many (WORM) storage bucket or anchored to a public cryptographic ledger.
