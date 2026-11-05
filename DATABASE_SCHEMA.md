# TrustVault — Relational Database Architecture (DATABASE_SCHEMA.md)

*Target RDBMS: PostgreSQL 16 (Neon Cloud) / SQLite 3 for isolated testing*

---

## 1. Entity-Relationship Overview

```
 [users] 1 ────< [documents] 1 ────< [document_permissions]
    │                │                          │
    │                ├────< [document_versions] │
    │                │                          │
    ├────────────────┴────< [audit_logs] >──────┘
    │
    ├────< [access_requests]
    │
    └────< [notifications]
```

---

## 2. Table Specifications & Indexes

### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | UUID v4 user identifier |
| `full_name` | `VARCHAR(120)` | NOT NULL | User's full identity name |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | Unique login and audit identity |
| `password_hash` | `VARCHAR(255)` | NOT NULL | PBKDF2-HMAC-SHA256 (100k rounds) / Argon2 |
| `role` | `VARCHAR(20)` | NOT NULL, DEFAULT 'VIEWER' | `ADMIN`, `OWNER`, `VIEWER` |
| `account_status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'ACTIVE' | `ACTIVE`, `SUSPENDED`, `PENDING` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP | Account registration timestamp |
| `last_login_at` | `TIMESTAMP WITH TIME ZONE` | NULLABLE | Most recent successful authentication |

### Table: `documents`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | UUID v4 document key |
| `owner_id` | `VARCHAR(36)` | FK -> `users(id)`, INDEX | Verified owner reference |
| `title` | `VARCHAR(255)` | NOT NULL, INDEX | Human-readable document title |
| `description` | `TEXT` | NULLABLE | Classification notes |
| `category` | `VARCHAR(64)` | NOT NULL, INDEX | `Financial`, `Legal`, `Technical`, `Security`, `General` |
| `tags` | `VARCHAR(255)` | DEFAULT '' | Comma-delimited tags |
| `original_filename`| `VARCHAR(255)` | NOT NULL | Sanitized display filename |
| `storage_identifier`| `VARCHAR(255)` | UNIQUE, NOT NULL | Isolated object store UUID path (`enc_blob_*.pdf`) |
| `mime_type` | `VARCHAR(100)` | NOT NULL | Verified MIME type from magic bytes |
| `size_bytes` | `INTEGER` | NOT NULL | Byte length (max 15MB) |
| `file_extension` | `VARCHAR(10)` | NOT NULL | Whitelisted extension (`pdf`, `docx`, `png`, `jpg`) |
| `integrity_hash` | `VARCHAR(64)` | NOT NULL | SHA-256 raw content checksum |
| `current_version`| `INTEGER` | DEFAULT 1 | Version counter |
| `is_deleted` | `BOOLEAN` | DEFAULT FALSE | Soft-delete retention flag |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP | Metadata modification timestamp |

### Table: `document_permissions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | UUID v4 permission record key |
| `document_id` | `VARCHAR(36)` | FK -> `documents(id)`, INDEX | Target document |
| `user_id` | `VARCHAR(36)` | FK -> `users(id)`, INDEX | Grantee recipient identity |
| `granted_by_id` | `VARCHAR(36)` | FK -> `users(id)` | Must match document owner |
| `permission_level`| `VARCHAR(20)` | NOT NULL | `READ`, `EDIT` |
| `status` | `VARCHAR(20)` | NOT NULL, INDEX | `ACTIVE`, `REVOKED`, `EXPIRED` |
| `expires_at` | `TIMESTAMP WITH TIME ZONE` | NULLABLE | Automatic time-based expiration |
| `granted_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP | Grant issuance timestamp |
| `revoked_at` | `TIMESTAMP WITH TIME ZONE` | NULLABLE | Exact revocation timestamp |
| `revoked_by_id` | `VARCHAR(36)` | FK -> `users(id)`, NULLABLE | Owner identity that executed revocation |

**Composite Indexes**:
- `CREATE INDEX idx_doc_user_perm ON document_permissions (document_id, user_id, status);`

### Table: `audit_logs` (Cryptographic Hash Chain)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | Internal row key |
| `event_id` | `VARCHAR(36)` | UNIQUE, NOT NULL | Unique audit event token |
| `actor_id` | `VARCHAR(36)` | FK -> `users(id)`, INDEX | Identity performing action |
| `action` | `VARCHAR(64)` | NOT NULL, INDEX | `LOGIN`, `UPLOAD`, `DOWNLOAD`, `REVOKE`, etc. |
| `document_id` | `VARCHAR(36)` | FK -> `documents(id)`, NULLABLE | Target resource (if applicable) |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, INDEX | UTC timestamp |
| `requested_permission`| `VARCHAR(32)` | DEFAULT 'NONE' | Privilege evaluated |
| `decision` | `VARCHAR(16)` | NOT NULL | `ALLOW`, `DENY` |
| `reason` | `TEXT` | NULLABLE | Zero-trust engine explanation |
| `metadata_json` | `TEXT` | DEFAULT '{}' | Canonical JSON serialized metadata |
| `previous_hash` | `VARCHAR(64)` | NOT NULL | Predecessor block hash ($H_{n-1}$) |
| `current_hash` | `VARCHAR(64)` | UNIQUE, NOT NULL, INDEX | Block SHA-256 hash ($H_n$) |
