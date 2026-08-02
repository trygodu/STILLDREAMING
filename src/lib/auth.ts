import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "sd_admin_session";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "insecure-dev-secret";
}

/** Signed, timestamped token so the cookie can't be forged or replayed indefinitely. */
export function createAdminToken(): string {
  const issuedAt = Date.now().toString();
  const sig = createHmac("sha256", secret()).update(issuedAt).digest("hex");
  return `${issuedAt}.${sig}`;
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;

  const expected = createHmac("sha256", secret()).update(issuedAt).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

  const ageMs = Date.now() - Number(issuedAt);
  const maxAgeMs = 1000 * 60 * 60 * 24 * 7; // 7 days
  return ageMs >= 0 && ageMs < maxAgeMs;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
