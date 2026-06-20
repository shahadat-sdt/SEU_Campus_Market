import "server-only";

import crypto from "crypto";
import { DomainError } from "@/lib/domain/errors";
import { withRetry, withTimeout } from "@/lib/decorators/fetch-decorators";

const resilientFetch = withRetry(withTimeout(fetch, 10_000), 2);

export const cloudinaryAdapter = {
  async uploadImage(file: File) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
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
