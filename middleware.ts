import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "tee-stitches-admin";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  const expected = `Basic ${btoa(`${ADMIN_USER}:${ADMIN_PASSWORD}`)}`;

  if (header === expected) {
    return NextResponse.next();
  }

  return new NextResponse("Admin authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tee Stitches Admin"'
    }
  });
}

export const config = {
  matcher: ["/admin/:path*"]
};
