import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "../_lib/cors.mjs";
import {
  buildSetSessionCookieHeader,
  createSignedSessionToken,
  verifyAdminPassword,
} from "../_lib/adminSession.mjs";

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  if (typeof b === "string" && b.length > 0) {
    try {
      return JSON.parse(b);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const origin = getRequestOrigin(req);
  if (handleOptionsCredentials(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!origin || !isAllowedFrontendOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCorsCredentials(res, origin);

  const body = parseBody(req);
  const password = String(body?.password ?? "");

  try {
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: "Invalid password" });
    }
  } catch (e) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }

  try {
    const token = createSignedSessionToken();
    res.setHeader("Set-Cookie", buildSetSessionCookieHeader(token));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Login failed" });
  }
}
