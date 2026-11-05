"""
TrustVault Core Configuration
Handles environment settings, JWT parameters, storage configurations, and database credentials.
"""
import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustVault"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "trustvault-production-secret-key-change-in-prod-sha256")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for demo convenience
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trustvault.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "*"
    ]
    
    # File Storage
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # 'local' or 's3'
    LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", "./vault_storage")
    
    # S3 / Cloudflare R2
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_ACCESS_KEY_ID: str = os.getenv("S3_ACCESS_KEY_ID", "")
    S3_SECRET_ACCESS_KEY: str = os.getenv("S3_SECRET_ACCESS_KEY", "")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "trustvault-private-documents")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
