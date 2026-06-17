import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  await requireUser();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const input = await request.formData();
  const file = input.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Upload an image file." }, { status: 400 });
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

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: upload
  });
  const payload = await response.json();
  if (!response.ok || !payload.secure_url) {
    return NextResponse.json({ error: payload.error?.message || "Upload failed." }, { status: 502 });
  }

  return NextResponse.json({ secureUrl: payload.secure_url });
}
