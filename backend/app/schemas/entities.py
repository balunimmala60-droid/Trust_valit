"""
TrustVault Pydantic Schemas for Request/Response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "VIEWER"

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    account_status: str
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "General"
    tags: Optional[str] = ""

class DocumentResponse(DocumentBase):
    id: str
    owner_id: str
    original_filename: str
    size_bytes: int
    file_extension: str
    integrity_hash: str
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionGrantRequest(BaseModel):
    user_email: EmailStr
    permission_level: str = "READ"  # READ, EDIT
    expires_in_hours: Optional[int] = None

class PermissionRevokeRequest(BaseModel):
    permission_id: str

class PermissionResponse(BaseModel):
    id: str
    document_id: str
    user_id: str
    granted_by_id: str
    permission_level: str
    status: str
    expires_at: Optional[datetime] = None
    granted_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuditEventResponse(BaseModel):
    event_id: str
    actor_id: str
    action: str
    document_id: Optional[str] = None
    timestamp: str
    requested_permission: str
    decision: str
    reason: Optional[str] = None
    metadata: Dict[str, Any]
    previous_hash: str
    current_hash: str

class AuditIntegrityResponse(BaseModel):
    valid: bool
    total_events: int
    latest_hash: Optional[str] = None
    reason: Optional[str] = None
    message: str

class AttackSimulationRequest(BaseModel):
    threat_id: str
    simulation_type: str

class AttackSimulationResponse(BaseModel):
    threat_id: str
    name: str
    attack_vector: str
    expected_result: str
    actual_result: str
    decision: str
    status: str  # 'DEFENDED' or 'VULNERABLE'
    audit_event_id: str
    reason: str
