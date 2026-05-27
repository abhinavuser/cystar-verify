# CyStar Verify — Selective Disclosure Credential Module

A production-grade credential sharing system that lets holders selectively reveal specific fields from their digital credentials while maintaining full cryptographic verifiability. Built for the CyStar IITM Summer Internship assessment (Problem Statement 1).

## Demo

- **Live App**: [deployed-url-here]
- **Demo Video**: [video-link-here]

## Why This Problem Statement?

CyStar works in digital identity and credential verification — selective disclosure is at the core of modern verifiable credential standards (W3C VC, mDL, etc.). I chose this because the crypto is interesting and the use case directly maps to what CyStar does. A hospital shouldn't need to see your CGPA to verify your degree, and an employer shouldn't see your marks to confirm your graduation year. This module makes that possible.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Next.js App    │────▶│  Express API      │────▶│  MongoDB     │
│   (Holder UI +   │     │  (Auth, Crypto,   │     │  Atlas       │
│    Verifier UI)  │◀────│   Verification)   │◀────│              │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

### Selective Disclosure Flow

This is **not** simple JSON filtering. Here's how the crypto actually works:

**Issuance:**
1. Each credential field gets a unique random salt (16 bytes)
2. Per-field commitment: `H_i = HMAC-SHA256(salt_i, fieldName_i : fieldValue_i)`
3. Root hash: `R = SHA256(sort(H_1 || H_2 || ... || H_n))` — deterministic ordering by field name
4. Signature: `σ = Ed25519.sign(privateKey, R)`
5. Stored: `{ fields, salts, fieldHashes, rootHash, signature }`

**Selective Sharing:**
1. Holder picks fields to disclose
2. For disclosed fields: include `{ value, salt }` (so verifier can recompute `H_i`)
3. For hidden fields: include only `H_i` (hash commitment, not the value)
4. Include `rootHash`, `signature`, and issuer's public key
5. Generate share token + QR code, set expiry

**Verification:**
1. Verifier recomputes `H_i` for each disclosed field using provided salt
2. Merges recomputed hashes with provided hashes of hidden fields
3. Recomputes root hash from all field hashes
4. Checks `computedRoot === providedRoot` (integrity)
5. Verifies `Ed25519.verify(publicKey, rootHash, signature)` (authenticity)
6. If both pass → credential is genuine and untampered

This ensures a verifier can confirm the authenticity of disclosed fields without seeing hidden data, and any tampering breaks the hash chain.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS v4 |
| Backend | Express.js + TypeScript |
| Database | MongoDB Atlas |
| Auth | JWT (7-day expiry) |
| Crypto | Node.js `crypto` — Ed25519 signing, HMAC-SHA256 field hashing |
| QR Codes | `qrcode` library |
| Validation | Zod schemas |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
.
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.ts        # App entry, middleware stack
│   │   ├── config/
│   │   │   └── env.ts      # Env loading + validation
│   │   ├── middleware/
│   │   │   ├── auth.ts     # JWT verification
│   │   │   ├── rateLimiter.ts
│   │   │   └── validate.ts # Zod request validation
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Credential.ts
│   │   │   └── Share.ts    # TTL-indexed for auto-expiry
│   │   ├── routes/
│   │   │   ├── auth.ts     # /api/auth/register, /api/auth/login
│   │   │   ├── credentials.ts  # /api/credentials/issue, GET /api/credentials
│   │   │   └── share.ts    # /api/share/share, /api/share/verify, /api/share/public/:token
│   │   ├── services/
│   │   │   └── crypto.ts   # Core: issueCredential, buildPresentation, verifyPresentation
│   │   └── utils/
│   │       └── errors.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx    # Credential list
│   │   │   ├── dashboard/issue/page.tsx    # Issue form
│   │   │   ├── dashboard/share/[id]/page.tsx   # Selective disclosure UI
│   │   │   └── verify/[token]/page.tsx   # Public verification (no login)
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       └── api.ts      # Fetch wrapper + auth helpers
│   ├── .env.example
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

## API Documentation

### Authentication

```
POST /api/auth/register
Body: { "email": "user@test.com", "password": "secret123", "name": "Test User" }
Response: { "token": "jwt...", "user": { "id", "name", "email" } }

POST /api/auth/login
Body: { "email": "user@test.com", "password": "secret123" }
Response: { "token": "jwt...", "user": { "id", "name", "email" } }
```

### Credential Management (requires `Authorization: Bearer <token>`)

```
POST /api/credentials/issue
Body: {
  "fields": { "holderName": "Rahul", "degree": "B.Tech CS", "cgpa": "8.5", ... },
  "issuerName": "IIT Madras",
  "issueDate": "2025-06-15",
  "credentialType": "academic"
}
Response: { "id", "fields", "issuerName", "issueDate", "rootHash", "createdAt" }

GET /api/credentials
Response: [{ "id", "fields", "issuerName", ... }]  (salts/hashes excluded)

GET /api/credentials/:id
Response: { "id", "fields", "issuerName", ... }
```

### Selective Disclosure & Sharing (requires auth)

```
POST /api/share/share
Body: {
  "credentialId": "mongo-id",
  "disclosedFields": ["holderName", "degree", "graduationYear"],
  "expiresInHours": 24
}
Response: { "token", "shareUrl", "qrCode" (base64 data URL), "expiresAt", "disclosedFields" }
```

### Public Verification (no auth, rate-limited)

```
GET /api/share/public/:token
Response: { "disclosed": { ... }, "issuerName", "issueDate", "totalFields", "disclosedCount" }

POST /api/share/verify
Body: { "token": "uuid" }
Response: {
  "valid": true,
  "reason": "Cryptographic verification passed",
  "disclosedFields": ["holderName", "degree"],
  "totalFields": 6,
  "issuerName": "IIT Madras",
  "verifiedAt": "2025-05-30T..."
}
```

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### Backend

```bash
cd server
cp .env.example .env
# edit .env — add your MONGO_URI and set a JWT_SECRET
npm install
npm run dev
# first run will generate Ed25519 keys — copy them to .env
```

### Frontend

```bash
cd client
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:5000 (or your deployed backend)
npm install
npm run dev
```

App runs at `http://localhost:3000`, API at `http://localhost:5000`.

### Environment Variables

**Server (.env):**
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLIENT_URL` | Frontend URL for CORS |
| `SIGNING_KEY_PRIVATE` | Ed25519 private key (base64 PEM) |
| `SIGNING_KEY_PUBLIC` | Ed25519 public key (base64 PEM) |

**Client (.env.local):**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Security Measures

- **Password hashing**: bcrypt with 12 rounds
- **JWT auth**: 7-day expiry, required on all credential routes
- **Rate limiting**: 30 req/15min on verification (prevents brute-force), 20 on auth, 100 general
- **Input validation**: Zod schemas on all endpoints
- **Credential protection**: Salts and field hashes are never returned in list/get responses
- **CORS**: Configured to only allow the frontend origin
- **Helmet**: HTTP security headers
- **TTL indexes**: Share links auto-delete from DB after expiry

## What I'd Improve Given More Time

- **BBS+ signatures**: Replace HMAC-based scheme with BBS+ for proper zero-knowledge selective disclosure (holder can prove possession without revealing any linkable info to the verifier)
- **DID integration**: Issuer DIDs instead of just a name string, with did:web or did:key resolution
- **Revocation**: Add credential revocation lists so issuers can invalidate credentials
- **Batch verification**: Verify multiple presentations in one API call
- **WebSocket progress**: Real-time verification status for complex credential chains
- **Mobile app**: React Native wrapper with biometric auth for the holder interface
- **Audit log**: Track who verified what, when (with consent)
- **Offline verification**: Bundle the public key + presentation into the QR code so verification can happen without calling the API

## Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Point to `/server` directory
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all env variables

### Frontend (Vercel)
1. Import repo on Vercel
2. Set root directory to `client`
3. Add `NEXT_PUBLIC_API_URL` env var pointing to Render backend
4. Deploy
