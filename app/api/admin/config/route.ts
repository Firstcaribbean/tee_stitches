import { NextResponse } from "next/server";
import { getCloudinaryCredentials, isAdminRequest, signCloudinaryParams, siteConfigUrl } from "../../cloudinary-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getCloudinaryCredentials();
  if (!credentials) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }

  const config = await request.json();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    invalidate: true,
    overwrite: true,
    public_id: "tee-stitches/config/site-config.json",
    timestamp
  };
  const signature = signCloudinaryParams(params, credentials.apiSecret);
  const body = new FormData();
  body.append("file", new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }), "site-config.json");
  body.append("api_key", credentials.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("public_id", params.public_id);
  body.append("overwrite", "true");
  body.append("invalidate", "true");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/raw/upload`, {
    method: "POST",
    body
  });

  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: siteConfigUrl(credentials.cloudName) });
}
