# Jebdekho — Deployment Architecture

## 1. Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| **local** | Developer machines | Docker Compose |
| **staging** | QA + demo | Single VPS |
| **production** | Live users | VPS + Cloudflare |

---

## 2. Docker Compose (Development)

Services defined in root `docker-compose.yml`:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:16-alpine | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache, pub/sub, rate limits |
| `minio` | minio/minio | 9000, 9001 | S3-compatible storage (dev) |
| `mailhog` | mailhog/mailhog | 1025, 8025 | Email testing (optional) |

API and Next.js apps run **natively** on host during dev (hot reload). Only infrastructure in Docker.

---

## 3. Production Topology (Single VPS MVP)

```
Internet
    │
Cloudflare (DNS, SSL, CDN, WAF, DDoS)
    │
VPS (Ubuntu 22.04+)
    │
Nginx (:443)
    ├── buyer.jebdekho.com      → buyer-web:3000
    ├── merchant.jebdekho.com   → merchant-web:3002
    ├── rider.jebdekho.com      → rider-web:3003
    ├── admin.jebdekho.com      → admin-web:3004
    └── api.jebdekho.com        → api:3001 (+ /ws upgrade)
    │
Docker Compose (production)
    ├── api (2 replicas via compose scale)
    ├── buyer-web
    ├── merchant-web
    ├── rider-web
    ├── admin-web
    ├── postgres
    ├── redis
    └── (MinIO or external R2)
```

---

## 4. Nginx Configuration Highlights

- TLS termination at Cloudflare (Full Strict) or Nginx with Let's Encrypt
- `proxy_pass` to each Next.js app and API
- WebSocket upgrade headers for `/ws`
- Rate limiting at Nginx layer (supplement to app-level)
- Gzip/brotli for static assets
- Client max body size: 10MB (uploads go direct to R2 via presigned URLs)

---

## 5. Container Build Strategy

### API Dockerfile (multi-stage)

```
Stage 1: deps     → pnpm install
Stage 2: build    → nest build + prisma generate
Stage 3: production → node dist/main.js (non-root user)
```

### Next.js Dockerfile

```
Stage 1: build with standalone output
Stage 2: minimal node alpine + standalone server.js
```

---

## 6. Database Operations

| Operation | Schedule | Tool |
|-----------|----------|------|
| Full backup | Daily 2 AM | `pg_dump` → R2 |
| WAL archiving | Continuous (prod) | pgBackRest (Phase 8) |
| Migrations | On deploy | `prisma migrate deploy` |
| Connection pooling | Always | PgBouncer (optional at scale) |

---

## 7. Cloudflare Configuration

| Feature | Setting |
|---------|---------|
| SSL | Full (Strict) |
| Caching | Static assets only; API bypass cache |
| WAF | Managed rules enabled |
| Rate limiting | Auth endpoints |
| R2 | Production object storage (replace MinIO) |

---

## 8. CI/CD Pipeline

```
PR opened
  → lint (ESLint)
  → typecheck (tsc)
  → unit tests (Jest)
  → build all apps

Merge to main
  → build Docker images
  → push to registry (GHCR)
  → SSH deploy to VPS (or watchtower pull)
  → prisma migrate deploy
  → health check /api/v1/health/ready
  → rollback on failure
```

---

## 9. Secrets Management

- **Never** commit `.env`
- Production secrets in VPS env file or Docker secrets (chmod 600)
- Rotate JWT secrets quarterly
- Razorpay keys in env only; webhook secret separate

---

## 10. Monitoring Checklist

- [ ] Uptime monitor on `/api/v1/health`
- [ ] Disk space alerts (Postgres volume)
- [ ] Redis memory alerts
- [ ] Error rate threshold (Sentry)
- [ ] SSL expiry monitoring

---

## 11. Scaling Triggers

| Metric | Action |
|--------|--------|
| API CPU > 70% sustained | Scale API replicas |
| Postgres connections > 80% | Add PgBouncer |
| Redis memory > 75% | Increase instance or eviction policy |
| Single VPS maxed | Split DB to managed Postgres (RDS/Supabase) |

---

## 12. Files in Repo

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev infrastructure |
| `docker-compose.prod.yml` | Production stack template |
| `docker/nginx/nginx.conf` | Reverse proxy |
| `docker/postgres/init.sql` | DB extensions |
| `docker/api/Dockerfile` | API production image |
| `.env.example` | Documented env vars |
