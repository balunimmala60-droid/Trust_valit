# TrustVault — Priority Roadmap & Agile Sprints (PRIORITY_ROADMAP.md)

*Evaluation Priority Order:*
1. P0 — SECURITY: 35 MARKS
2. P0 — THREAT THINKING: 15 MARKS
3. P1 — FUNCTIONALITY: 15 MARKS
4. P1 — AI USAGE: 15 MARKS
5. P2 — ENGINEERING QUALITY: 10 MARKS
6. P2 — DOCUMENTATION, DEPLOYMENT AND DEMO: 10 MARKS

---

## Sprint 0: Architecture, Environment & Baseline
- [x] Inspect container environment, verify Node.js + Python runtimes.
- [x] Establish directory structure (`/backend` and `/src`).
- [x] Author baseline `THREATS.md` with 14 threats.
- [x] Author baseline `MARKS_TRACKER.md` tracking all 100 marks.
- **Exit Gate**: Environment confirmed; threat model and architecture baseline locked. [PASSED]

---

## Sprint 1: P0 Security Foundation (35 Marks)
- [x] Implement PBKDF2/Argon2 password hashing & verification.
- [x] Implement Centralized Zero-Trust Authorization Engine (`PermissionDecisionEngine`).
- [x] Enforce deny-by-default on all resource operations.
- [x] Restrict administrative role to governance (no blanket document read).
- [x] Enforce immediate revocation (0ms window).
- [x] Implement raw file magic bytes signature validator (PDF, DOCX, PNG, JPEG).
- [x] Build automated Python regression suite (`backend/run_tests.py`) and verify 17 tests pass.
- **Exit Gate**: All critical authorization & security tests pass. [PASSED]

---

## Sprint 2: Core Document Workflow & Functionality (15 Marks)
- [x] Build multi-persona authentication (Admin, Owner, Viewer) with 1-click switcher.
- [x] Implement document upload with live SHA-256 integrity hash calculation.
- [x] Implement Document Security Passport with metadata and isolated storage UUID.
- [x] Implement secure watermarked document preview.
- [x] Implement authorized binary download.
- [x] Implement granular READ vs EDIT delegation workflow.
- [x] Implement formal Access Request approval/rejection pipeline.
- **Exit Gate**: All 10 mandatory document workflows verified end-to-end. [PASSED]

---

## Sprint 3: Audit Trail & Advanced Security Features (30 Marks)
- [x] Implement cryptographic SHA-256 Merkle audit hash chain.
- [x] Build live chain verification engine and tamper simulation tool.
- [x] Build Attack Replay Lab simulating IDOR, privilege escalation, and magic byte attacks.
- [x] Build Security Proof Center with in-browser automated test runner.
- [x] Build AI Permission Copilot with least-privilege analysis and owner confirmation gate.
- [x] Document 6 authentic AI usage records in `PROMPTS.md`.
- **Exit Gate**: Audit integrity verification, attack lab, and AI copilot verified. [PASSED]

---

## Sprint 4: Polish, Engineering Quality & Documentation (20 Marks)
- [x] Deep navy & electric blue cyber visual design.
- [x] Complete REST API documentation (`API_DOCUMENTATION.md`).
- [x] Complete Relational Database Schema (`DATABASE_SCHEMA.md`).
- [x] Complete Production Deployment Guide (`DEPLOYMENT.md`).
- [x] Complete Project Write-up (`PROJECT_WRITEUP.md`).
- [x] Complete 5-Minute Judge Demo Guide modal.
- [x] Final `compile_applet` and `lint_applet` clean verification.
- **Exit Gate**: 100% build pass, zero lint errors, all quality gates verified. [PASSED]
