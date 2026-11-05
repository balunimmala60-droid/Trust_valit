"""
TrustVault Database Models (SQLAlchemy 2.x)
PostgreSQL / SQLite compatible relational models with constraints, indexes, and relationships.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime, ForeignKey, Index, Enum as SQLEnum
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="VIEWER")  # ADMIN, OWNER, VIEWER
    account_status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, SUSPENDED, PENDING
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owned_documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    granted_permissions = relationship("DocumentPermission", foreign_keys="DocumentPermission.granted_by_id")
    received_permissions = relationship("DocumentPermission", foreign_keys="DocumentPermission.user_id")
    access_requests = relationship("AccessRequest", back_populates="requester")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(64), default="General", index=True)
    tags = Column(String(255), default="")  # Comma separated
    original_filename = Column(String(255), nullable=False)
    storage_identifier = Column(String(255), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    file_extension = Column(String(10), nullable=False)
    integrity_hash = Column(String(64), nullable=False)  # SHA-256
    current_version = Column(Integer, default=1)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="owned_documents")
    permissions = relationship("DocumentPermission", back_populates="document", cascade="all, delete-orphan")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    requests = relationship("AccessRequest", back_populates="document", cascade="all, delete-orphan")


class DocumentPermission(Base):
    __tablename__ = "document_permissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    granted_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    permission_level = Column(String(20), nullable=False)  # READ, EDIT
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, REVOKED, EXPIRED
    expires_at = Column(DateTime(timezone=True), nullable=True)
    granted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Relationships
    document = relationship("Document", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id])
    granted_by = relationship("User", foreign_keys=[granted_by_id])

    __table_args__ = (
        Index("idx_doc_user_perm", "document_id", "user_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), unique=True, nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    requested_permission = Column(String(32), default="NONE")
    decision = Column(String(16), nullable=False)  # ALLOW, DENY
    reason = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True, index=True)


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    storage_identifier = Column(String(255), nullable=False)
    integrity_hash = Column(String(64), nullable=False)
    change_summary = Column(String(255), nullable=True)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="versions")


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_level = Column(String(20), default="READ")  # READ, EDIT
    justification = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED
    reviewed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("Document", back_populates="requests")
    requester = relationship("User", back_populates="access_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(32), default="SECURITY_ALERT")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    actor_id = Column(String(36), nullable=True)
    target_resource = Column(String(128), nullable=True)
    details = Column(Text, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
