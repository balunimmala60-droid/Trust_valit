# TrustVault — Formal Test Case Specifications (TEST_CASES.md)

*Benchmark: RISE 2026 Evaluation*

---

## 1. Authentication & Session Test Cases

| Case ID | Description | Pre-conditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|:---:|
| **TC-AUTH-01** | Valid User Authentication | User registered | Submit valid email and password | 200 OK, returns JWT token, logs `LOGIN` in audit chain | P0 |
| **TC-AUTH-02** | Invalid Password Rejection | User registered | Submit incorrect password | 401 Unauthorized, returns generic error, logs `FAILED_LOGIN` | P0 |
| **TC-AUTH-03** | Suspended Account Denial | Account status = `SUSPENDED` | Submit valid credentials for suspended user | 403 Forbidden, all API requests rejected | P0 |
| **TC-AUTH-04** | Tampered Token Signature | Active session | Alter JWT signature bytes | 401 Unauthorized, token rejected | P0 |

---

## 2. Zero-Trust Authorization & IDOR Test Cases

| Case ID | Description | Pre-conditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|:---:|
| **TC-AUTHZ-01** | Owner Full Resource Access | Document exists | Owner requests READ, DOWNLOAD, EDIT, DELETE | Allowed for all operations | P0 |
| **TC-AUTHZ-02** | Unshared User IDOR Defense | Document owned by User A | User B queries `GET /documents/{id}` | 403 Forbidden, 0 bytes returned, logged in audit chain | P0 |
| **TC-AUTHZ-03** | Admin Privilege Boundary | Document owned by User A | Admin queries unshared document content | 403 Forbidden (Admin cannot read private user docs) | P0 |
| **TC-AUTHZ-04** | Read-Only Edit Restriction | User holds `READ` grant | User sends `PUT /documents/{id}` | 403 Forbidden (Insufficient privilege) | P0 |
| **TC-AUTHZ-05** | Viewer Delegation Block | User has role `VIEWER` | User sends `POST /documents/{id}/permissions` | 403 Forbidden (Only owners can delegate) | P0 |
| **TC-AUTHZ-06** | Immediate Revocation Cutoff | User has active `READ` | Owner revokes; User immediately requests download | 403 Forbidden on the very next request (0ms window) | P0 |

---

## 3. File Inspection & Upload Security Test Cases

| Case ID | Description | Pre-conditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|:---:|
| **TC-FILE-01** | Genuine PDF Upload | Valid PDF file | Upload file with `%PDF-` header | 201 Created, SHA-256 computed, saved with UUID | P1 |
| **TC-FILE-02** | Magic Byte Spoofing | Executable renamed to `.pdf` | Upload file with `MZ` header as `.pdf` | 400 Bad Request, signature mismatch rejected | P0 |
| **TC-FILE-03** | Path Traversal Sanitization | Filename `../../etc/passwd` | Upload with path characters | Filename stripped to safe alphanumeric identifier | P0 |
| **TC-FILE-04** | Oversized File Limit | File > 15MB | Upload 16MB file | 400 Bad Request / 413 Payload Too Large | P1 |

---

## 4. Cryptographic Audit Trail Test Cases

| Case ID | Description | Pre-conditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|:---:|
| **TC-AUDIT-01** | Genesis Block & Chaining | Fresh audit ledger | Log 3 sequential events | Each block contains previous hash; chain tip valid | P0 |
| **TC-AUDIT-02** | Tamper Detection Proof | Active audit ledger | Mutate decision payload of block #2 | Chain verification scanner detects broken link & fails | P0 |
