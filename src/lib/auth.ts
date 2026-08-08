import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "sd_admin_session";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "insecure-dev-secret";
}

/** Signed, timestamped token binding the cookie to a user id — no server-side session store needed. */
export function createSessionToken(userId: string): string {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Returns the userId if the token is validly signed and unexpired, otherwise null. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [userId, issuedAt, sig] = token.split(".");
  if (!userId || !issuedAt || !sig) return null;

  const expected = createHmac("sha256", secret()).update(`${userId}.${issuedAt}`).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  const ageMs = Date.now() - Number(issuedAt);
  const maxAgeMs = 1000 * 60 * 60 * 24 * 30; // 30 days
  if (ageMs < 0 || ageMs >= maxAgeMs) return null;

  return userId;
}

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHex] = hash.split(":");
  if (!salt || !storedHex) return false;

  const stored = Buffer.from(storedHex, "hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}
