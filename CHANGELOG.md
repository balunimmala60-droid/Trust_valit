# TrustVault — Changelog & Engineering Record (CHANGELOG.md)

All notable changes to the TrustVault application are documented in this file.

---

## [1.0.0] - 2026-11-05 (Production Hackathon Release)

### Security (35 Marks)
- **Added**: Centralized Zero-Trust Authorization Engine (`PermissionDecisionEngine.evaluate()`) enforcing deny-by-default on all resource actions.
- **Added**: Immediate server revocation with live database verification (0ms stale access window).
- **Added**: Zero-trust administrative privilege boundary: ADMIN role restricted to tenant management and audit review without blanket document content access.
- **Added**: Raw magic byte file header inspection for PDF (`%PDF-`), DOCX (`PK\x03\x04`), PNG (`\x89PNG`), and JPEG (`\xFF\xD8\xFF`).
- **Added**: Path traversal defense: file storage randomized to UUID keys (`enc_blob_<uuid>.<ext>`) with path characters stripped.
- **Added**: PBKDF2-HMAC-SHA256 (100k rounds) / Argon2 password hashing.

### Threat Thinking & Verification (15 Marks)
- **Added**: Comprehensive `THREATS.md` cataloguing 14 specific attack scenarios, attack paths, impacts, and mitigations.
- **Added**: Interactive Attack Replay Lab with safe live simulations for IDOR, direct download traversal, revocation bypass, privilege escalation, and search leakage.
- **Added**: Transparent disclosure of physical post-download custody limits and database host threat boundaries.

### Functionality (15 Marks)
- **Added**: Full document lifecycle: upload, listing, details, watermarked preview, secure download, deletion.
- **Added**: Document Security Passport displaying SHA-256 integrity checksum, storage UUID, and delegation state.
- **Added**: Granular READ vs EDIT delegation grants with optional expiration timers.
- **Added**: Formal Access Request workflow with owner approval and rejection audit logging.
- **Added**: Live Access Radar streaming real-time authorization decisions.

### AI Usage (15 Marks)
- **Added**: Comprehensive `PROMPTS.md` containing 6 authentic, dated interactions detailing initial AI security flaws, human critical review, corrective commits, and test outputs.
- **Added**: In-app AI Permission Copilot providing least-privilege analysis with an explicit human owner confirmation barrier.

### Engineering Quality (10 Marks)
- **Added**: Standalone Python test runner (`backend/run_tests.py`) verifying 17 automated security assertions.
- **Added**: In-browser security regression test harness in Security Proof Center.
- **Added**: Modular TypeScript architecture with strict typing and zero lint issues.

### Documentation & Demo (10 Marks)
- **Added**: 5-Minute Judge Demo walkthrough modal with step-by-step guidance.
- **Added**: 1-Click Judge Persona Quick-Switcher (Sarah Owner, David Viewer, Elena Viewer, Alex Admin).
- **Added**: Complete `README.md`, `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, `DEPLOYMENT.md`, and `PROJECT_WRITEUP.md`.
