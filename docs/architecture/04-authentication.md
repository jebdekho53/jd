# Jebdekho — Authentication System Design

## 1. Overview

Authentication is **centralized** in the NestJS API. All four client apps use the same auth endpoints with role-specific registration flows. Sessions are **stateless JWT access tokens** plus **server-side refresh token rotation** stored in PostgreSQL (hashed) with Redis cache for revocation checks.

---

## 2. Token Strategy (RS256)

**Algorithm: RS256 only** — asymmetric signing from Day 1 for microservice compatibility and safe key rotation.

| Token | Lifetime | Storage (Client) | Storage (Server) |
|-------|----------|------------------|------------------|
| **Access Token** (JWT) | 15 minutes | Memory / secure storage | Not stored |
| **Refresh Token** | 30 days | httpOnly secure cookie or Keychain (RN) | `refresh_tokens` (SHA-256 hash) |

### Key Management

```
JWT_PRIVATE_KEY  → PEM RSA private key (sign access + refresh claims)
JWT_PUBLIC_KEY   → PEM RSA public key (verify in API + future services)
```

**Rotation:** Deploy new key pair as `JWT_PRIVATE_KEY_NEXT`; accept tokens signed by current or previous public key during overlap window; then retire old private key.

### JWT Header

```json
{ "alg": "RS256", "typ": "JWT", "kid": "2026-06" }
```

### JWT Payload

```json
{
  "sub": "user_cuid",
  "email": "user@example.com",
  "phone": "+919876543210",
  "roles": ["BUYER"],
  "permissions": ["orders:read", "cart:write"],
  "iat": 1710000000,
  "exp": 1710000900,
  "iss": "jebdekho-api",
  "aud": "jebdekho-clients"
}
```

**Design choice:** Permissions embedded in JWT for fast authorization. On permission change, force refresh or maintain short access TTL.

---

## 3. Registration Flows

### 3.1 Buyer Registration

```
POST /api/v1/auth/register/buyer
  { phone, name, email?, password? }

→ Create User (phone unverified)
→ Send OTP via **MSG91**
→ Return { message, otpSent: true }  (no tokens until verified)

POST /api/v1/auth/verify-otp
  { phone, code, purpose: "REGISTRATION" }

→ Mark phone verified
→ Create BuyerProfile
→ Assign BUYER role
→ Issue access + refresh tokens
```

### 3.2 Merchant Registration

```
POST /api/v1/auth/register/merchant
  { phone, email, password, businessName }

→ OTP verification required
→ Create MerchantProfile (KYC: PENDING)
→ Assign MERCHANT role
→ Redirect to store onboarding (no store until created)
```

### 3.3 Rider Registration

```
POST /api/v1/auth/register/rider
  { phone, name, vehicleType, documents[] }

→ Admin approval required before RIDER role activated
→ Status: PENDING_APPROVAL → APPROVED (admin action)
```

### 3.4 Admin

Admins are **invite-only**. No public registration endpoint.

```
POST /api/v1/admin/users/invite  (super-admin only)
```

---

## 4. Login Flows

### 4.1 Password Login

```
POST /api/v1/auth/login
  { phone | email, password, deviceId?, deviceName? }

→ Validate credentials
→ Check account status (ACTIVE, SUSPENDED, DELETED)
→ Issue tokens
→ Store refresh token hash + device metadata
```

### 4.2 OTP Login (Passwordless)

```
POST /api/v1/auth/otp/request
  { phone, purpose: "LOGIN" }

POST /api/v1/auth/otp/verify
  { phone, code, purpose: "LOGIN" }

→ Issue tokens (same as password login)
```

---

## 5. Refresh Token Rotation

```
POST /api/v1/auth/refresh
  Cookie: refresh_token=... OR Body: { refreshToken }

1. Hash incoming token, lookup in DB
2. If not found or revoked → 401, invalidate all user sessions (reuse detection)
3. Revoke old refresh token
4. Issue new access + refresh pair
5. Store new refresh hash
```

**Reuse detection:** If a revoked refresh token is presented, revoke **all** refresh tokens for that user (possible token theft).

---

## 6. Password Reset

```
POST /api/v1/auth/password/forgot
  { phone | email }

→ Send OTP or magic link (email)

POST /api/v1/auth/password/reset
  { phone | email, code, newPassword }

→ Validate OTP
→ bcrypt hash new password (cost 12)
→ Revoke all refresh tokens
```

---

## 7. OTP System

| Field | Value |
|-------|-------|
| Code length | 6 digits |
| Expiry | 5 minutes |
| Max attempts | 5 per code |
| Rate limit | 3 requests / phone / 10 min |
| Storage | `otp_verifications` + Redis counter |

OTP codes stored as **bcrypt hash**, never plaintext.

---

## 8. Password Hashing

- Algorithm: **bcrypt** (cost factor 12)
- Future migration path: argon2id

---

## 9. Account States

| Status | Behavior |
|--------|----------|
| `PENDING_VERIFICATION` | Can only verify OTP |
| `ACTIVE` | Full access per role |
| `SUSPENDED` | Login blocked |
| `PENDING_APPROVAL` | Rider awaiting admin |
| `DELETED` | Soft delete; login blocked |

---

## 10. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register/buyer` | Public | Buyer signup |
| POST | `/api/v1/auth/register/merchant` | Public | Merchant signup |
| POST | `/api/v1/auth/register/rider` | Public | Rider signup (pending approval) |
| POST | `/api/v1/auth/verify-otp` | Public | Verify phone OTP |
| POST | `/api/v1/auth/login` | Public | Password login |
| POST | `/api/v1/auth/otp/request` | Public | Request OTP |
| POST | `/api/v1/auth/otp/verify` | Public | OTP login |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate tokens |
| POST | `/api/v1/auth/logout` | JWT | Revoke current refresh token |
| POST | `/api/v1/auth/logout-all` | JWT | Revoke all sessions |
| POST | `/api/v1/auth/password/forgot` | Public | Initiate reset |
| POST | `/api/v1/auth/password/reset` | Public | Complete reset |
| GET | `/api/v1/auth/me` | JWT | Current user + profiles |

---

## 11. Client Integration

### Buyer / Merchant / Admin (Next.js) + Rider (React Native)

1. Store access token in memory (Zustand / SecureStore on RN).
2. HTTP interceptor: on 401 → call `/refresh` → retry.
3. On refresh failure → redirect to login.

### WebSocket Auth

```
Connection handshake:
  Authorization: Bearer <access_token>

Server validates JWT, joins role-specific rooms.
```

---

## 12. Security Controls

| Control | Implementation |
|---------|----------------|
| Brute force | Rate limit login (Redis): 10/min per IP, 5/min per phone |
| CORS | Allowlist per app origin |
| CSRF | SameSite=Strict cookies if cookie-based refresh |
| JWT alg | **RS256** (mandatory — dev and prod) |
| Key rotation | `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY`; optional `_PREVIOUS` pair for zero-downtime |
| Device tracking | Optional `deviceId` on refresh tokens for session management UI |

---

## 13. NestJS Implementation Plan (Phase 1)

```
auth.module.ts
├── PassportModule + JwtModule
├── AuthController
├── AuthService
│   ├── registerBuyer/Merchant/Rider
│   ├── login, verifyOtp, refresh, logout
│   └── forgotPassword, resetPassword
├── JwtStrategy (passport-jwt)
├── OtpService (MSG91 integration)
├── TokenService (generate, hash, rotate)
└── Guards exported to other modules
```

Dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`.

---

## 14. Environment Variables

See `.env.example` — `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `MSG91_*`.
