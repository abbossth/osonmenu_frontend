import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyUserId, normalizeSlug, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { getAdminStorageBucket } from "@/lib/firebase-admin";

const ALLOWED_FOLDERS = new Set(["establishment-bg", "establishment-logo", "category-bg", "menu-items"]);

function getExtFromMime(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const slug = normalizeSlug(formData.get("slug"));
    const folderRaw = typeof formData.get("folder") === "string" ? String(formData.get("folder")) : "";
    const folder = folderRaw.trim();

    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    if (!ALLOWED_FOLDERS.has(folder)) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });

    const place = await findUserEstablishment(slug, userId);
    if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

    const bucket = getAdminStorageBucket();
    const ext = getExtFromMime(file.type);
    const objectPath = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;
    const object = bucket.file(objectPath);
    const bytes = Buffer.from(await file.arrayBuffer());

    const downloadToken = randomUUID();
    await object.save(bytes, {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
      resumable: false,
    });

    const encodedPath = encodeURIComponent(objectPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("[API /api/uploads/firebase POST] Failed", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
