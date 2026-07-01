import { NextResponse } from "next/server";
import { getCloudinaryCredentials, signCloudinaryParams } from "../../cloudinary-utils";
import { getAdminSessionToken, verifyAdminSession } from "../../admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyAdminSession(getAdminSessionToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getCloudinaryCredentials();
  if (!credentials) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No upload file was received." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder: "tee-stitches/uploads",
    timestamp,
    unique_filename: true
  };
  const signature = signCloudinaryParams(params, credentials.apiSecret);
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", credentials.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", params.folder);
  body.append("unique_filename", "true");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`, {
    method: "POST",
    body
  });

  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: 502 });
  }

  const result = await response.json() as {
    public_id: string;
    original_filename?: string;
    secure_url: string;
    resource_type: string;
    format?: string;
  };

  return NextResponse.json({
    id: result.public_id,
    name: file.name || result.original_filename || result.public_id,
    type: result.resource_type === "video" ? "video" : result.format === "gif" ? "animation" : "image",
    url: result.secure_url
  });
}
