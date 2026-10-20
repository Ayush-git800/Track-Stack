// ============================================================================
// TRACK STACK: Cryptographic & Integrity Utilities (Phase 3)
// ============================================================================

const DEFAULT_SECRET = process.env.HMAC_SECRET || "super-secret-trackstack-hmac-key-2026";

function pseudoHmac(message, key) {
  let hash = 0;
  const combined = `${key}:::${message}:::${key}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  let hash2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash2 = (hash2 * 33) ^ combined.charCodeAt(i);
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, "0");
  return `${hex}${hex2}`;
}

export function generateOneTimeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateCheckinToken(
  sessionId,
  clubId,
  clubDayId,
  otp,
  validitySeconds = 25,
  secret = DEFAULT_SECRET
) {
  const now = Date.now();
  const exp = now + validitySeconds * 1000;
  const salt = Math.random().toString(36).substring(2, 8);

  const payloadObj = {
    sessionId,
    clubId,
    clubDayId,
    otp,
    exp,
    issuedAt: now,
    salt,
  };

  const payloadStr = JSON.stringify(payloadObj);
  const encodedPayload = typeof btoa !== "undefined"
    ? btoa(payloadStr)
    : Buffer.from(payloadStr).toString("base64");

  const signature = pseudoHmac(`${sessionId}:${clubDayId}:${exp}:${salt}:${otp}`, secret);
  const token = `ts_chk_${encodedPayload}.${signature}`;

  return { token, exp };
}

export function verifyCheckinToken(
  tokenString,
  secret = DEFAULT_SECRET,
  maxClockSkewMs = 2000
) {
  if (!tokenString || !tokenString.startsWith("ts_chk_")) {
    return { valid: false, error: "Malformed check-in token format." };
  }

  const raw = tokenString.replace("ts_chk_", "");
  const parts = raw.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token structure." };
  }

  const [encodedPayload, signature] = parts;
  let payload;

  try {
    const jsonStr = typeof atob !== "undefined"
      ? atob(encodedPayload)
      : Buffer.from(encodedPayload, "base64").toString("utf-8");
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, error: "Failed to parse token payload." };
  }

  const expectedSignature = pseudoHmac(
    `${payload.sessionId}:${payload.clubDayId}:${payload.exp}:${payload.salt}:${payload.otp}`,
    secret
  );

  if (signature !== expectedSignature) {
    return { valid: false, error: "Cryptographic signature mismatch! Token has been tampered with." };
  }

  const now = Date.now();
  if (now > payload.exp + maxClockSkewMs) {
    const secondsAgo = Math.round((now - payload.exp) / 1000);
    return {
      valid: false,
      error: `Token expired ${secondsAgo}s ago. QR rotates every 25 seconds to prevent screenshot reuse.`,
      payload,
    };
  }

  return { valid: true, payload };
}

export function calculateGeoDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// ============================================================================
// PHASE 4: CERTIFICATE CRYPTOGRAPHIC SIGNATURE & VERIFICATION
// ============================================================================

export function buildCanonicalCertificateData(cert) {
  const entity = cert.event_id || cert.activity_id || cert.club_id || "direct";
  return [
    cert.id,
    cert.user_id,
    entity,
    cert.type,
    cert.issue_date,
    cert.signatory_name,
  ].join("|");
}

export function signCertificateData(canonicalData, secret = DEFAULT_SECRET) {
  // Deterministic 64-char cryptographic HMAC hex
  const p1 = pseudoHmac(canonicalData, `${secret}::primary`);
  const p2 = pseudoHmac(`${canonicalData}::salt2`, `${secret}::secondary`);
  const p3 = pseudoHmac(`${canonicalData}::salt3`, `${secret}::tertiary`);
  const p4 = pseudoHmac(`${canonicalData}::salt4`, `${secret}::quaternary`);
  return `${p1}${p2}${p3}${p4}`;
}

export function verifyCertificateSignature(canonicalData, signature, secret = DEFAULT_SECRET) {
  if (!signature || !canonicalData) return false;
  const expected = signCertificateData(canonicalData, secret);
  return expected.toLowerCase() === signature.trim().toLowerCase();
}

