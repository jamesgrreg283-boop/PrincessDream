import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "apd_admin";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function getCookieValue(req, name) {
  const raw = req.headers.cookie;
  if (!raw || typeof raw !== "string") return null;
  const parts = raw.split(";");
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    if (k !== name) continue;
    return decodeURIComponent(p.slice(idx + 1).trim());
  }
  return null;
}

export function createSignedSessionToken() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not configured");
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySignedSessionToken(token) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!token || !secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (!timingSafeEqualStr(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export function assertAdminSession(req) {
  const token = getCookieValue(req, ADMIN_COOKIE_NAME);
  if (!verifySignedSessionToken(token)) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
}

export function verifyAdminPassword(plain) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    const err = new Error("Admin is not configured");
    err.statusCode = 500;
    throw err;
  }
  return timingSafeEqualStr(plain, secret);
}

export function isSecureCookieEnv() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function buildSetSessionCookieHeader(token) {
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${MAX_AGE_SEC}`,
    "SameSite=Lax",
  ];
  if (isSecureCookieEnv()) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearSessionCookieHeader() {
  const parts = [
    `${ADMIN_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    "SameSite=Lax",
  ];
  if (isSecureCookieEnv()) parts.push("Secure");
  return parts.join("; ");
}
