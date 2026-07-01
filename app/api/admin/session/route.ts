import { NextResponse } from "next/server";
import { adminSessionCookie, clearAdminSessionCookie, createAdminSession, getAdminSessionToken, verifyAdminSession } from "../../../api/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASSWORD = "tee-stitches-admin";

async function loadAllowedSecurity(request: Request) {
  try {
    const response = await fetch(new URL("/api/site-config", request.url), { cache: "no-store" });
    if (response.ok) {
      const config = await response.json() as { security?: { username: string; password: string } };
      if (config.security?.username && config.security.password) return config.security;
    }
  } catch {
    // fall through to defaults
  }

  return {
    username: DEFAULT_ADMIN_USER,
    password: DEFAULT_ADMIN_PASSWORD
  };
}

export async function GET(request: Request) {
  return NextResponse.json({ ok: verifyAdminSession(getAdminSessionToken(request)) });
}

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  const security = await loadAllowedSecurity(request);

  if (body.username !== security.username || body.password !== security.password) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const token = createAdminSession(body.username);
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", adminSessionCookie(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearAdminSessionCookie());
  return response;
}
