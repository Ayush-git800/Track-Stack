# Track Stack: Architecture & Design Specification

> [!NOTE]
> **AI-Assisted Development**: Track Stack was built with the assistance of AI (Google Antigravity and Gemini models) under the developer's architectural direction, defining problem requirements from the Mirai School of Technology (MSOT) brief, establishing data models, reviewing output, and testing continuously.

---

## 1. System Philosophy & Core Pillars
Track Stack is engineered against three core design axioms:
1. **VERIFIED**: Every attendance, submission, score, and certificate is backed by cryptographic proof (rotating HMAC tokens, SHA-256 digests) and strict audit logging. No unverified records exist.
2. **LOW EFFORT FOR STAKEHOLDERS**: Club coordinators can run entire club sessions and mark rosters with single-tap controls directly from a mobile browser. Campus managers receive automated, mathematically reconciled reports.
3. **STUDENT-OWNED RECORD**: Every student maintains an indisputable co-curricular transcript and cryptographically verifiable certificates with public QR lookup.

---

## 2. Multi-Campus Hierarchy
- **Delhi-NCR**: Primary operational campus (fully seeded).
- **Bangalore & Jaipur**: Inter-campus satellite nodes.
- **Societies & Clubs**:
  - *Parent Societies*: NexCell (Entrepreneurship), Malhar (Cultural), Khel Society (Sports), Kaizen Society (Technical).
  - *Sub-Clubs of Kaizen*: Kaizen Dev Club, Competitive Programming (CP) Club, Kaizen Intelligence (KI).
  - Enforced 2-club membership constraint per student with database-level waitlist promotion triggers.

---

## 3. Cryptographic Verification & Anti-Proxy Engine
- **Session Tokens**: Time-stepped rotating tokens (`ts_chk_...`) signed with HMAC-SHA256, changing every 25 seconds with 2-second clock-skew tolerance to block screenshot sharing.
- **Geofencing**: Haversine distance verification checks real-time GPS coordinates against campus coordinates (default 300m radius).
- **Anti-Proxy Device Fingerprinting**: Combines browser attributes and viewport signatures to detect multiple student check-ins originating from identical hardware.
- **Certificate Anti-Tamper Signatures**: Certificates encode a canonical SHA-256 payload HMAC signature into the generated PDF and database. Public `/verify/[certificateId]` dynamically recomputes the signature to detect tampering or revocation.

---

## 4. UI/UX & Design Tokens
- **Theme**: Dark Navy base (`#060B18`), surface (`#0D1428`), elevated (`#141C36`), border (`#1F2A4D`) with high-contrast light mode toggle.
- **Brand Gradients**: Cyan (`#22D3EE`) &rarr; Blue (`#3B82F6`) &rarr; Violet (`#8B5CF6`).
- **Typography**: Inter (UI interfaces) and Sora / Space Grotesk (headings). Tabular monospace numbers for countdown timers and code verification.
- **Mascot & Avatars**: Reusable `<LumiAvatar />` component with idle floating bob, active thinking pulse, and reduced-motion compliance.
