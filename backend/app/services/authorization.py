"""
TrustVault Centralized Zero-Trust Authorization Decision Engine
Strict deny-by-default permission decision service evaluated for every resource access attempt.
"""
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime, timezone

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    VIEWER = "VIEWER"

class Operation(str, Enum):
    UPLOAD = "UPLOAD"
    READ = "READ"
    PREVIEW = "PREVIEW"
    DOWNLOAD = "DOWNLOAD"
    EDIT = "EDIT"
    DELETE = "DELETE"
    GRANT_PERMISSION = "GRANT_PERMISSION"
    REVOKE_PERMISSION = "REVOKE_PERMISSION"
    VIEW_HISTORY = "VIEW_HISTORY"
    VIEW_AUDIT = "VIEW_AUDIT"
    MANAGE_USERS = "MANAGE_USERS"

class PermissionLevel(str, Enum):
    READ = "READ"
    EDIT = "EDIT"

class PermissionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

class AuthorizationDecision:
    def __init__(self, allowed: bool, reason: str, audit_metadata: Optional[Dict[str, Any]] = None):
        self.allowed = allowed
        self.reason = reason
        self.audit_metadata = audit_metadata or {}

    def to_dict(self):
        return {
            "allowed": self.allowed,
            "reason": self.reason,
            "metadata": self.audit_metadata
        }

class PermissionDecisionEngine:
    """
    Centralized Zero-Trust Permission Decision Engine.
    Enforces deny-by-default, immediate revocation, expiration, and strict role separation.
    """
    @staticmethod
    def evaluate(
        user: Dict[str, Any],
        document: Optional[Dict[str, Any]],
        operation: Operation,
        permission_record: Optional[Dict[str, Any]] = None
    ) -> AuthorizationDecision:
        # Rule 1: Authenticated user must exist and be active
        if not user:
            return AuthorizationDecision(False, "Unauthenticated request.")
            
        if user.get("account_status", "ACTIVE") != "ACTIVE":
            return AuthorizationDecision(False, f"Account status '{user.get('account_status')}' is inactive/suspended.")

        # Rule 2: Administrative System Operations
        if operation in [Operation.MANAGE_USERS, Operation.VIEW_AUDIT]:
            if user.get("role") == UserRole.ADMIN:
                return AuthorizationDecision(True, "Admin role granted for system management.")
            # Non-admins cannot access system-wide audit or user management
            return AuthorizationDecision(False, "Requires administrative privileges.")

        # If operation targets a document, document must exist
        if not document:
            return AuthorizationDecision(False, "Resource not found.")

        user_id = str(user.get("id"))
        doc_owner_id = str(document.get("owner_id"))

        # Rule 3: Document Owner Access
        if user_id == doc_owner_id:
            # Owner has full rights to their own document
            return AuthorizationDecision(True, "Document owner authorized.")

        # Rule 4: Administrative Boundary on Document Contents
        # Admins do NOT automatically get access to private documents
        if user.get("role") == UserRole.ADMIN and not permission_record:
            return AuthorizationDecision(
                False,
                "Administrative privilege limitation: Admins do not possess blanket access to user documents without explicit grant."
            )

        # Rule 5: Delegation Operations (Granting / Revoking / Deletion)
        if operation in [Operation.GRANT_PERMISSION, Operation.REVOKE_PERMISSION, Operation.DELETE]:
            # Only the actual owner can grant, revoke, or delete
            return AuthorizationDecision(
                False,
                f"Operation '{operation}' is restricted exclusively to the document owner."
            )

        # Rule 6: Explicit Document Permission Check
        if not permission_record:
            return AuthorizationDecision(
                False,
                "Access denied: No explicit permission grant exists for this document and user."
            )

        # Rule 7: Immediate Revocation Enforcement
        if permission_record.get("status") == PermissionStatus.REVOKED:
            return AuthorizationDecision(
                False,
                f"Access revoked: Permission was revoked on {permission_record.get('revoked_at', 'previously')}."
            )

        # Rule 8: Expiration Enforcement
        expires_at = permission_record.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                except Exception:
                    exp_dt = None
            else:
                exp_dt = expires_at
                
            if exp_dt and datetime.now(timezone.utc) > exp_dt:
                return AuthorizationDecision(
                    False,
                    f"Permission expired on {expires_at}."
                )

        perm_level = permission_record.get("permission_level", PermissionLevel.READ)

        # Rule 9: EDIT Operation Check
        if operation == Operation.EDIT:
            if perm_level == PermissionLevel.EDIT:
                return AuthorizationDecision(True, "Explicit EDIT permission granted.")
            return AuthorizationDecision(
                False,
                "Read-only permission insufficient for edit operation."
            )

        # Rule 10: READ, PREVIEW, DOWNLOAD, VIEW_HISTORY
        if operation in [Operation.READ, Operation.PREVIEW, Operation.DOWNLOAD, Operation.VIEW_HISTORY]:
            if perm_level in [PermissionLevel.READ, PermissionLevel.EDIT]:
                return AuthorizationDecision(True, f"Explicit {perm_level} permission authorized for {operation}.")

        # Default Deny Catch-all
        return AuthorizationDecision(False, f"Deny by default for operation '{operation}'.")
