import { createHmac, createHash, randomBytes } from "crypto";

/**
 * Standard TOTP (RFC 6238) — SHA-1, 6 digits, 30s step — compatible with Google
 * Authenticator, 1Password, Authy, etc. Implemented directly on Node crypto (no
 * third-party dependency). Secrets are base32; backup codes are sha256-hashed.
 */

export const MFA_ISSUER = "Linoscore Legal";
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP = 30; // seconds

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0, value = 0; const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20)); // 160-bit
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

/** Verify a 6-digit code, tolerating ±1 step of clock drift. */
export function verifyTotp(token: string, secret: string, window = 1): boolean {
  const t = (token || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(t) || !secret) return false;
  const counter = Math.floor(Date.now() / 1000 / STEP);
  for (let w = -window; w <= window; w++) {
    if (hotp(secret, counter + w) === t) return true;
  }
  return false;
}

/** otpauth:// URI for QR enrollment. */
export function keyUri(email: string, secret: string): string {
  const label = encodeURIComponent(`${MFA_ISSUER}:${email}`);
  const params = new URLSearchParams({ secret, issuer: MFA_ISSUER, algorithm: "SHA1", digits: "6", period: String(STEP) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.replace(/\s|-/g, "").toLowerCase()).digest("hex");
}

/** Generate N human-friendly backup codes (plaintext) + their hashes to store. */
export function generateBackupCodes(n = 10): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  for (let i = 0; i < n; i++) {
    const raw = randomBytes(5).toString("hex"); // 10 hex chars
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return { plain, hashed: plain.map(hashBackupCode) };
}
