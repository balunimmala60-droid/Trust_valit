"""
TrustVault Security Utilities
Provides password hashing (Argon2 / PBKDF2 fallback) and JWT tokens.
"""
import hashlib
import hmac
import os
import json
import base64
import time
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("SECRET_KEY", "trustvault-production-secret-key-change-in-prod-sha256")

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 (600,000 iterations)."""
    if not salt:
        salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000
    )
    return f"pbkdf2:sha256:100000${salt}${dk.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash."""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        meta, salt, stored_hash = parts
        computed = hash_password(plain_password, salt=salt)
        return hmac.compare_digest(computed, hashed_password)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta_seconds: int = 86400) -> str:
    """Creates a signed JSON Web Token (HS256)."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_delta_seconds
    payload["iat"] = int(time.time())
    
    encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    signature_base = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(
        SECRET_KEY.encode(),
        signature_base.encode(),
        hashlib.sha256
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT token signature and expiration."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_signature = parts
        
        signature_base = f"{encoded_header}.{encoded_payload}"
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            signature_base.encode(),
            hashlib.sha256
        ).digest()
        
        # Add padding back if necessary
        pad = len(encoded_signature) % 4
        sig_to_verify = encoded_signature + ('=' * (4 - pad) if pad else '')
        decoded_sig = base64.urlsafe_b64decode(sig_to_verify.encode())
        
        if not hmac.compare_digest(expected_sig, decoded_sig):
            return None
            
        payload_pad = len(encoded_payload) % 4
        payload_str = encoded_payload + ('=' * (4 - payload_pad) if payload_pad else '')
        payload = json.loads(base64.urlsafe_b64decode(payload_str.encode()).decode())
        
        if payload.get("exp", 0) < time.time():
            return None  # Token expired
            
        return payload
    except Exception:
        return None
