import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "../_lib/cors.mjs";
import {
  ADMIN_COOKIE_NAME,
  getCookieValue,
  verifySignedSessionToken,
} from "../_lib/adminSession.mjs";

export default async function handler(req, res) {
  const origin = getRequestOrigin(req);
  if (handleOptionsCredentials(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!origin || !isAllowedFrontendOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCorsCredentials(res, origin);

  const token = getCookieValue(req, ADMIN_COOKIE_NAME);
  const ok = verifySignedSessionToken(token);
  return res.status(200).json({ ok });
}
