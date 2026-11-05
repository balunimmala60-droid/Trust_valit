# TrustVault — REST API Specification & Endpoint Policies

*FastAPI OpenAPI 3.1 Compliant Documentation*

---

## 1. Authentication & Identity Endpoints

### `POST /api/v1/auth/register`
- **Description**: Registers a new user identity. Password is salted and hashed using PBKDF2-HMAC-SHA256 (100k rounds) / Argon2. Plaintext passwords are never persisted.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "full_name": "Alice Smith",
    "role": "OWNER"
  }
  ```
- **Responses**:
  - `201 Created`: User profile created.
  - `400 Bad Request`: Email already registered or password fails complexity.

### `POST /api/v1/auth/login`
- **Description**: Authenticates credentials, creates a session token, and records `LOGIN` in the SHA-256 audit ledger.
- **Request Body**:
  ```json
  {
    "email": "sarah.owner@acmecorp.com",
    "password": "CorrectPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT bearer access token (`{"access_token": "...", "token_type": "bearer"}`).
  - `401 Unauthorized`: Invalid credentials (logged as `FAILED_LOGIN` in audit chain).

---

## 2. Document Management Endpoints

### `POST /api/v1/documents/upload`
- **Authorization**: Authenticated user with role `OWNER` or `ADMIN`.
- **Content-Type**: `multipart/form-data`
- **Security Validation**:
  - Magic byte inspection of file header (PDF: `%PDF-`, DOCX: `PK\x03\x04`, PNG: `\x89PNG`, JPEG: `\xFF\xD8\xFF`).
  - Filename sanitization into safe UUID keys (`enc_blob_<uuid>.<ext>`).
  - Max size: 15MB.
  - Real-time SHA-256 integrity hash calculation.
- **Responses**:
  - `201 Created`: Returns Document metadata and integrity hash.
  - `400 Bad Request`: File signature mismatch or disallowed extension.

### `GET /api/v1/documents/{doc_id}`
- **Authorization Policy**: Centralized Zero-Trust Engine (`PermissionDecisionEngine.evaluate()`).
- **Policy Check**: Must be document owner OR possess an active, unexpired `DocumentPermission` record.
- **Responses**:
  - `200 OK`: Returns Document Security Passport metadata.
  - `403 Forbidden`: Unshared user or revoked access.
  - `404 Not Found`: Document does not exist.

### `GET /api/v1/documents/{doc_id}/download`
- **Authorization Policy**: Operation `DOWNLOAD`.
- **Policy Check**: Evaluates user identity, active permission status, and expiration. Admins cannot download without explicit owner grant.
- **Responses**:
  - `200 OK`: Streams binary octet-stream with `Content-Disposition` and `X-Document-Integrity` headers.
  - `403 Forbidden`: Access denied or permission revoked.

### `GET /api/v1/documents/{doc_id}/preview`
- **Authorization Policy**: Operation `PREVIEW`.
- **Policy Check**: Requires active `READ` or `EDIT` delegation.
- **Responses**:
  - `200 OK`: Returns preview stream with watermarking metadata.
  - `403 Forbidden`: Access denied.

### `PUT /api/v1/documents/{doc_id}`
- **Authorization Policy**: Operation `EDIT`.
- **Policy Check**: Requester must be OWNER or hold explicit `EDIT` permission. Users with `READ` permission are rejected.
- **Responses**:
  - `200 OK`: Document updated and version incremented.
  - `403 Forbidden`: Read-only permission insufficient for editing.

### `DELETE /api/v1/documents/{doc_id}`
- **Authorization Policy**: Operation `DELETE`.
- **Policy Check**: Restricted exclusively to document OWNER.
- **Responses**:
  - `204 No Content`: Document purged.
  - `403 Forbidden`: Non-owner rejected.

---

## 3. Permission & Delegation Endpoints

### `POST /api/v1/documents/{doc_id}/permissions`
- **Authorization Policy**: Operation `GRANT_PERMISSION`.
- **Policy Check**: Caller must be confirmed document OWNER.
- **Request Body**:
  ```json
  {
    "user_email": "david.viewer@external-partner.com",
    "permission_level": "READ",
    "expires_in_hours": 24
  }
  ```
- **Responses**:
  - `201 Created`: Permission created and logged in audit chain.
  - `403 Forbidden`: Non-owner attempted delegation (Privilege Escalation blocked).

### `POST /api/v1/documents/{doc_id}/permissions/{perm_id}/revoke`
- **Authorization Policy**: Operation `REVOKE_PERMISSION`.
- **Policy Check**: Caller must be document OWNER.
- **Immediate Effect**: Database record updated to `status: 'REVOKED'`. All future read/download requests fail immediately (0ms grace period).
- **Responses**:
  - `200 OK`: Permission marked REVOKED.
  - `403 Forbidden`: Caller not authorized to revoke.

---

## 4. Verifiable Audit Trail Endpoints

### `GET /api/v1/audit/events`
- **Authorization**: Admin or Document Owner (filtered to owned assets).
- **Responses**:
  - `200 OK`: Returns list of audit event blocks including `previous_hash` and `current_hash`.

### `GET /api/v1/audit/verify`
- **Description**: Cryptographically verifies the entire SHA-256 hash chain from genesis block to current tip.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "valid": true,
      "total_events": 42,
      "latest_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "message": "Audit trail is 100% verified and cryptographically sound."
    }
    ```
