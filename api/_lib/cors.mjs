export function isAllowedFrontendOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;

  const extras = (process.env.STRIPE_ALLOWED_FRONTEND_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const u = new URL(origin);
    const { hostname } = u;
    if (hostname.endsWith(".vercel.app")) return true;

    // Extras are *additional* allowed origins (e.g. alternate domains). They must
    // not replace the default HTTPS rule, or any HTTPS site breaks whenever this
    // env var is set (common misconfiguration vs www/apex or custom domains).
    if (extras.includes(origin)) return true;

    if (u.protocol === "https:" && hostname.length > 0) return true;
    return false;
  } catch {
    return false;
  }
}

/** Origin for credentialed requests (cannot use * with credentials). */
export function getRequestOrigin(req) {
  const o = req.headers.origin;
  if (o && typeof o === "string") return o.trim();
  const ref = req.headers.referer;
  if (ref && typeof ref === "string") {
    try {
      return new URL(ref).origin;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export function applyCors(res, requestOrigin) {
  if (isAllowedFrontendOrigin(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
}

/** Same as applyCors plus cookies (admin routes). */
export function applyCorsCredentials(res, requestOrigin) {
  if (!requestOrigin || !isAllowedFrontendOrigin(requestOrigin)) return;
  res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleOptions(req, res) {
  const requestOrigin = req.headers.origin || "";
  if (req.method !== "OPTIONS") return false;
  applyCors(res, requestOrigin);
  res.status(204).end();
  return true;
}

export function handleOptionsCredentials(req, res) {
  if (req.method !== "OPTIONS") return false;
  const origin = getRequestOrigin(req);
  applyCorsCredentials(res, origin);
  res.status(204).end();
  return true;
}
