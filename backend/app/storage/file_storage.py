"""
TrustVault File Storage & Strict Signature Validation
Inspects magic bytes, computes SHA-256 integrity hash, and writes to private storage.
"""
import os
import re
import uuid
import hashlib
from typing import Tuple, Dict, Any

ALLOWED_EXTENSIONS = {"pdf", "docx", "jpg", "jpeg", "png"}
MAX_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

# Magic byte signatures
MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "docx": [b"PK\x03\x04"],  # ZIP container for Office Open XML
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xFF\xD8\xFF"],
    "jpeg": [b"\xFF\xD8\xFF"]
}

class FileValidationError(Exception):
    pass

def sanitize_filename(filename: str) -> str:
    """Strips path traversal elements and hazardous characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean)
    return clean or "unnamed_document"

def validate_file_bytes(file_bytes: bytes, filename: str) -> Tuple[str, str, str]:
    """
    Validates file size, extension, and verifies magic bytes signature.
    Returns: (sanitized_name, extension, sha256_hash)
    """
    if len(file_bytes) == 0:
        raise FileValidationError("File is empty (0 bytes).")
        
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise FileValidationError(f"File size exceeds 15MB limit ({len(file_bytes)} bytes).")

    sanitized = sanitize_filename(filename)
    parts = sanitized.rsplit('.', 1)
    if len(parts) < 2:
        raise FileValidationError("File has no extension.")
    
    ext = parts[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(f"Extension '.{ext}' is not permitted. Allowed: {', '.join(ALLOWED_EXTENSIONS)}.")

    # Magic byte verification
    expected_signatures = MAGIC_SIGNATURES.get(ext, [])
    has_valid_sig = False
    for sig in expected_signatures:
        if file_bytes.startswith(sig):
            has_valid_sig = True
            break

    if not has_valid_sig:
        raise FileValidationError(
            f"File signature mismatch: File header does not match magic bytes for extension '{ext}'."
        )

    # Compute SHA-256 integrity checksum
    integrity_hash = hashlib.sha256(file_bytes).hexdigest()
    return sanitized, ext, integrity_hash

class PrivateStorage:
    def __init__(self, base_dir: str = "./vault_storage"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, file_bytes: bytes, original_filename: str) -> Dict[str, Any]:
        sanitized_name, ext, integrity_hash = validate_file_bytes(file_bytes, original_filename)
        storage_id = f"{uuid.uuid4().hex}.{ext}"
        storage_path = os.path.join(self.base_dir, storage_id)

        # Write to private storage
        with open(storage_path, "wb") as f:
            f.write(file_bytes)

        return {
            "storage_id": storage_id,
            "original_filename": sanitized_name,
            "extension": ext,
            "size_bytes": len(file_bytes),
            "integrity_hash": integrity_hash
        }

    def read_file(self, storage_id: str) -> bytes:
        safe_id = os.path.basename(storage_id)
        path = os.path.join(self.base_dir, safe_id)
        if not os.path.exists(path):
            raise FileNotFoundError("Storage file not found.")
        with open(path, "rb") as f:
            return f.read()
