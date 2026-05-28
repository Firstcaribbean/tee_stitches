import crypto from "node:crypto";

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function getCloudinaryCredentials(): CloudinaryCredentials | null {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  let parsed: Partial<CloudinaryCredentials> = {};

  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      parsed = {
        cloudName: url.hostname,
        apiKey: decodeURIComponent(url.username),
        apiSecret: decodeURIComponent(url.password)
      };
    } catch {
      parsed = {};
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || parsed.cloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || parsed.apiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || parsed.apiSecret;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function signCloudinaryParams(params: Record<string, string | number | boolean>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export function isAdminRequest(request: Request) {
  const user = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "tee-stitches-admin";
  const expected = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

  return request.headers.get("authorization") === expected;
}

export function siteConfigUrl(cloudName: string) {
  return `https://res.cloudinary.com/${cloudName}/raw/upload/tee-stitches/config/site-config.json`;
}
