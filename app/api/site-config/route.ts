import { NextResponse } from "next/server";
import { getCloudinaryCredentials, siteConfigUrl } from "../cloudinary-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = getCloudinaryCredentials();

  if (!credentials) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 404 });
  }

  const response = await fetch(`${siteConfigUrl(credentials.cloudName)}?v=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ error: "No published site config yet." }, { status: 404 });
  }

  const config = await response.json();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
