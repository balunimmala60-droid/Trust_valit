# TrustVault — Task Board

## P0 — Security (35 Marks)
- [x] **TASK-SEC-01**: Centralized Authorization Engine (`PermissionDecisionEngine`) with deny-by-default logic. [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-02**: Password hashing & verification with PBKDF2/Argon2 and JWT session tokens. [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-03**: Role-Based Access Control (ADMIN, OWNER, VIEWER) with no admin auto-read backdoor. [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-04**: Immediate server-enforced permission revocation (READ and EDIT). [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-05**: Strict file upload inspection: magic bytes (PDF, DOCX, JPEG, PNG), extension blacklist/whitelist, size limits. [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-06**: Tamper-evident SHA-256 audit hash chain with link verification engine. [COMPLETED AND VERIFIED]
- [x] **TASK-SEC-07**: Prevention of IDOR, horizontal privilege escalation, and direct URL traversal. [COMPLETED AND VERIFIED]

## P0 — Threat Thinking (15 Marks)
- [x] **TASK-THR-01**: Formulate formal `THREATS.md` with 14 detailed threat scenarios, attack vectors, mitigations, and residual risks. [COMPLETED AND VERIFIED]
- [x] **TASK-THR-02**: Implement Attack Replay Lab with safe live simulations against test accounts and real backend validation. [COMPLETED AND VERIFIED]
- [x] **TASK-THR-03**: Document honest security limitations (e.g., client-side cache after download, privileged host attacks). [COMPLETED AND VERIFIED]

## P1 — Functionality (15 Marks)
- [x] **TASK-FUN-01**: Multi-role Authentication (Register, Login, Session Management, Demo Quick-Switch). [COMPLETED AND VERIFIED]
- [x] **TASK-FUN-02**: Document Management (Upload, Listing, Categorization, Tagging, Integrity Hash, Secure Download). [COMPLETED AND VERIFIED]
- [x] **TASK-FUN-03**: Secure In-App Document Preview (PDF, DOCX, Images) with watermark and security banner. [COMPLETED AND VERIFIED]
- [x] **TASK-FUN-04**: Sharing & Delegation Workflow (Grant READ/EDIT, Set Expiry, Access Requests, Revocation). [COMPLETED AND VERIFIED]
- [x] **TASK-FUN-05**: Verifiable Audit Trail Viewer with real-time log stream, filtering, and hash-chain audit verifier. [COMPLETED AND VERIFIED]
- [x] **TASK-FUN-06**: Search & Filter with strict access-boundary isolation (no enumeration of unshared files). [COMPLETED AND VERIFIED]

## P1 — AI Usage (15 Marks)
- [x] **TASK-AI-01**: Author comprehensive `PROMPTS.md` containing 6 genuine dated records with identified flaws, human review, corrective commits, and test outputs. [COMPLETED AND VERIFIED]
- [x] **TASK-AI-02**: Build interactive AI Permission Copilot: least-privilege analysis, risk advisory, owner confirmation gate. [COMPLETED AND VERIFIED]

## P2 — Engineering Quality (10 Marks)
- [x] **TASK-ENG-01**: Clean modular architecture in TypeScript + Python FastAPI backend. [COMPLETED AND VERIFIED]
- [x] **TASK-ENG-02**: Automated test suite with Pytest & browser-executable automated test runner. [COMPLETED AND VERIFIED]
- [x] **TASK-ENG-03**: Responsive design with Tailwind CSS, Lucide icons, and Recharts. [COMPLETED AND VERIFIED]

## P2 — Documentation, Deployment and Demo (10 Marks)
- [x] **TASK-DOC-01**: Comprehensive README, API docs, Database Schema, and Deployment guide. [COMPLETED AND VERIFIED]
- [x] **TASK-DOC-02**: 5-Minute Judge Demo script with step-by-step walkthrough. [COMPLETED AND VERIFIED]
- [x] **TASK-DOC-03**: Demo persona switcher for rapid hackathon evaluation. [COMPLETED AND VERIFIED]
