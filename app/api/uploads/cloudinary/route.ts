import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { DomainError } from "@/lib/domain/errors";
import { cloudinaryAdapter } from "@/lib/adapters/cloudinary-adapter";

export async function POST(request: Request) {
  await requireUser();

  const input = await request.formData();
  const file = input.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an image file." }, { status: 400 });
  }

  try {
    const secureUrl = await cloudinaryAdapter.uploadImage(file);
    return NextResponse.json({ secureUrl });
  } catch (error) {
    if (error instanceof DomainError && error.code === "CLOUDINARY_NOT_CONFIGURED") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof DomainError && error.code === "INVALID_IMAGE") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 502 });
  }
}
