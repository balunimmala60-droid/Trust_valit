# TrustVault — Security Architecture Specification (SECURITY_ARCHITECTURE.md)

---

## 1. Zero-Trust Centralized Policy Decision Point (PDP)

TrustVault replaces distributed endpoint checks with a single, authoritative **Policy Decision Point (PDP)**:
`PermissionDecisionEngine.evaluate(user, document, operation, permissionRecord)`

### Decision Algorithm & Rule Sequence
```
1. Authenticated User Check:
   IF user is NULL -> REJECT (401 Unauthorized)
   IF user.account_status != 'ACTIVE' -> REJECT (403 Forbidden - Account Suspended)

2. System Administrative Operations:
   IF operation IN ['MANAGE_USERS', 'VIEW_AUDIT']:
       IF user.role == 'ADMIN' -> ALLOW
       ELSE -> REJECT (403 Forbidden - Requires Admin Role)

3. Resource Target Verification:
   IF document is NULL -> REJECT (404 Not Found)
   IF document.is_deleted AND operation != 'VIEW_HISTORY' -> REJECT (410 Gone)

4. Document Ownership:
   IF user.id == document.owner_id -> ALLOW (Full Owner Rights)

5. Administrative Boundary on Document Contents:
   IF user.role == 'ADMIN' AND permissionRecord is NULL:
       REJECT (403 Forbidden - Admin Zero-Trust Limitation)

6. Delegation Authority:
   IF operation IN ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'DELETE']:
       REJECT (403 Forbidden - Exclusive to Document Owner)

7. Explicit Permission Record:
   IF permissionRecord is NULL -> REJECT (403 Forbidden - Deny by Default)

8. Immediate Revocation Check:
   IF permissionRecord.status == 'REVOKED' -> REJECT (403 Forbidden - Access Revoked)

9. Expiration Validation:
   IF permissionRecord.expires_at < current_timestamp -> REJECT (403 Forbidden - Access Expired)

10. Operation Specific Delegation:
    IF operation == 'EDIT':
        IF permissionRecord.level == 'EDIT' -> ALLOW
        ELSE -> REJECT (403 Forbidden - Insufficient Read-Only Grant)

    IF operation IN ['READ', 'PREVIEW', 'DOWNLOAD', 'VIEW_HISTORY']:
        IF permissionRecord.level IN ['READ', 'EDIT'] -> ALLOW

11. Catch-all:
    REJECT (403 Forbidden - Default Deny)
```

---

## 2. Immediate Revocation Guarantees

In traditional architectures, permissions are frequently embedded inside 15-minute or 1-hour JWT tokens. An owner revoking access at $t=0$ leaves an attacker free to access data until $t=15m$.

**TrustVault Zero-Window Revocation**:
1. No permission grants are stored inside JWT tokens. JWTs contain only identity (`sub`, `email`, `role`).
2. Every read, preview, download, and edit queries the live database transactionally.
3. The instant an owner clicks "Revoke", the status changes to `REVOKED` in PostgreSQL.
4. The next HTTP packet arriving 1 millisecond later is denied.

---

## 3. Tamper-Evident SHA-256 Audit Chain

```
[Genesis: 0000000000000000...] 
              ↓
  [Event #1: LOGIN] ──────────→ H_1 = SHA-256(Genesis || Payload_1)
              ↓
  [Event #2: UPLOAD] ─────────→ H_2 = SHA-256(H_1 || Payload_2)
              ↓
  [Event #3: GRANT_PERM] ────→ H_3 = SHA-256(H_2 || Payload_3)
              ↓
  [Event #4: REVOKE_PERM] ───→ H_4 = SHA-256(H_3 || Payload_4)
```

### Tamper Detection Proof
If an insider modifies any byte in `Event #2` (e.g. changing `decision: 'DENY'` to `'ALLOW'`), $H_2$ recalculation fails, and $H_3$'s recorded `previous_hash` no longer matches $H_2$. The verification scanner alerts immediately.
