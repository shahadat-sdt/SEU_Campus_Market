import "server-only";

import crypto from "crypto";
import { DomainError } from "@/shared/lib/domain/errors";
import { withRetry, withTimeout } from "@/shared/lib/decorators/fetch-decorators";

const resilientFetch = withRetry(withTimeout(fetch, 10_000), 2);

function cloudinaryConfig() {
  const explicit = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  };

  if (explicit.cloudName && explicit.apiKey && explicit.apiSecret) return explicit;

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) return explicit;

  try {
    const url = new URL(cloudinaryUrl);
    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password)
    };
  } catch {
    return explicit;
  }
}

export const cloudinaryAdapter = {
  async uploadImage(file: File) {
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new DomainError("Cloudinary is not configured.", "CLOUDINARY_NOT_CONFIGURED");
    }

    if (!file.type.startsWith("image/")) {
      throw new DomainError("Upload an image file.", "INVALID_IMAGE");
    }

    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "seu-campus-market";
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

    const upload = new FormData();
    upload.set("file", file);
    upload.set("api_key", apiKey);
    upload.set("timestamp", timestamp);
    upload.set("folder", folder);
    upload.set("signature", signature);

    const response = await resilientFetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: upload
    });
    const payload = await response.json();
    if (!response.ok || !payload.secure_url) {
      throw new DomainError(payload.error?.message || "Upload failed.", "UPLOAD_FAILED");
    }

    return String(payload.secure_url);
  }
};
