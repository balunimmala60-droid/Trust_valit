# TrustVault — Production Deployment Guide (DEPLOYMENT.md)

*Target Production Infrastructure: Vercel (Frontend) + Render (FastAPI Backend) + Neon (PostgreSQL) + Cloudflare R2 (Private Object Store)*

---

## 1. Architecture Map

```
  [User Browser]
       │
       ▼ (HTTPS TLS 1.3)
  [Vercel Frontend: React 19 SPA]
       │
       ▼ (REST / JSON / Streaming)
  [Render Web Service: FastAPI Backend]
       ├── (SQLAlchemy Pool) ────────→ [Neon PostgreSQL 16]
       │
       └── (S3 Adapter / Boto3) ────→ [Cloudflare R2 Bucket (Private)]
```

---

## 2. Neon PostgreSQL Database Provisioning
1. Sign up at [neon.tech](https://neon.tech) and create a project named `trustvault-prod`.
2. Copy the pooled connection string:
   `DATABASE_URL=postgresql://trustvault_user:secret@ep-cool-db-1234.neon.tech/trustvault?sslmode=require`
3. Execute the initial migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## 3. Cloudflare R2 Object Storage Configuration
1. Log in to Cloudflare Dashboard -> R2 Object Storage.
2. Create a private bucket: `trustvault-private-documents`.
3. Generate R2 API Tokens with `Object Read & Write` permissions.
4. Export credentials:
   - `S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID=<access_key>`
   - `S3_SECRET_ACCESS_KEY=<secret_key>`
   - `S3_BUCKET_NAME=trustvault-private-documents`
5. Ensure public bucket access is **DISABLED**. All reads and writes must pass through the authorized backend proxy.

---

## 4. Render Backend Deployment (FastAPI)
1. In Render Dashboard, click **New Web Service**.
2. Connect your repository, select root or `backend` folder.
3. Configure settings:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `SECRET_KEY`: Cryptographically random 64-character hex string.
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `BACKEND_CORS_ORIGINS`: `["https://trustvault.vercel.app"]`
   - Storage credentials from Cloudflare R2.
5. Health Check path: `/api/health`.

---

## 5. Vercel Frontend Deployment (React)
1. In Vercel Dashboard, import the Git repository.
2. Select Framework: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_API_BASE_URL`: `https://trustvault-backend.onrender.com`
6. Deploy and test using an Incognito window to confirm clean session behavior.

---

## 6. Pre-Flight Security Checklist
- [x] HTTPS enforced with HSTS (`Strict-Transport-Security: max-age=31536000`).
- [x] CORS restricted to verified frontend origin (no wildcards in production).
- [x] Object storage bucket is private with zero public URLs.
- [x] Passwords hashed with PBKDF2 (100k rounds) / Argon2.
- [x] Zero plain credentials committed to source control.
