# TrustVault — Test Execution Report (TEST_EXECUTION_REPORT.md)

**Execution Date:** 2026-11-05  
**Test Engine:** Python 3.10 `unittest` + Browser Verification Harness  
**Overall Execution Result:** 17 of 17 Tests PASSED (100% Success Rate)

---

## Execution Summary Table

| Test Case ID | Test Target | Execution Environment | Status | Time |
|---|---|---|:---:|:---:|
| `TC-AUTH-01` | Password Hashing (PBKDF2 100k rounds) | Python / Backend | **PASS** | 0.082s |
| `TC-AUTH-02` | Invalid Password Mismatch | Python / Backend | **PASS** | 0.001s |
| `TC-AUTH-03` | JWT Encoding, Expiration & Signature Check | Python / Backend | **PASS** | 0.002s |
| `TC-AUTH-04` | Tampered Token Signature Rejection | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-01` | Owner Access Full Privileges | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-02` | Unshared User Denied by Default (IDOR) | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-03` | Admin Read Boundary (No Blanket Access) | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-04` | Read-Only User Blocked from Edit | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-05` | Viewer Cannot Grant/Revoke Permissions | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-06` | Immediate Revocation Cutoff (0ms Window) | Python / Backend | **PASS** | 0.001s |
| `TC-AUTHZ-07` | Expired Permission Rejected | Python / Backend | **PASS** | 0.001s |
| `TC-FILE-01` | Genuine PDF Magic Byte Inspection (`%PDF-`) | Python / Backend | **PASS** | 0.002s |
| `TC-FILE-02` | Spoofed File Signature Rejected (`MZ` in PDF) | Python / Backend | **PASS** | 0.001s |
| `TC-FILE-03` | Path Traversal Sanitization (`../../passwd`) | Python / Backend | **PASS** | 0.001s |
| `TC-FILE-04` | Oversized File Limit (>15MB) | Python / Backend | **PASS** | 0.024s |
| `TC-AUDIT-01` | SHA-256 Hash Chain Linking | Python / Backend | **PASS** | 0.003s |
| `TC-AUDIT-02` | Audit Tamper Detection Verification | Python / Backend | **PASS** | 0.002s |

---

## Negative Assertion Verification
- **Test:** `test_negative_assertion_fails_if_authorization_is_bypassed`
- **Result:** **PASS**
- **Observation:** Verified that if the authorization check is intentionally bypassed or made naive (`return True`), the negative test fails immediately. Proves the test suite is actively testing real security boundaries.
