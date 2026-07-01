import crypto from "node:crypto";

const SESSION_COOKIE = "tee-stitches-admin-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_SESSION_SECRET = "tee-stitches-admin-session-secret";

type CookieMap = Record<string, string>;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.CLOUDINARY_API_SECRET || DEFAULT_SESSION_SECRET;
}

export function parseCookies(cookieHeader: string | null): CookieMap {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const index = chunk.indexOf("=");
        return index === -1 ? [chunk, ""] : [chunk.slice(0, index), decodeURIComponent(chunk.slice(index + 1))];
      })
  );
}

export function createAdminSession(username: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${username}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyAdminSession(token: string | undefined) {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const [username, expiryValue] = payload.split(":");
  const expiry = Number(expiryValue);
  if (!username || !Number.isFinite(expiry) || Date.now() > expiry) return false;

  const expected = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function getAdminSessionToken(request: Request) {
  return parseCookies(request.headers.get("cookie"))[SESSION_COOKIE];
}

export function adminSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax${secure}`;
}

export function clearAdminSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
