import { NextRequest, NextResponse } from "next/server";
import { normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";
import { connectToMongoDB } from "@/lib/mongodb";
import { buildKhivaMenu } from "@/lib/khiva-menu-data";
import { EstablishmentModel } from "@/models/Establishment";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { slug?: string };
    const slug = normalizeSlug(body.slug);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    await connectToMongoDB();
    const place = await EstablishmentModel.findOne({ slug, $or: [{ ownerId: userId }, { userId }] });
    if (!place) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    if (Array.isArray(place.categories) && place.categories.length > 0) {
      return NextResponse.json({ error: "Menu already exists" }, { status: 409 });
    }

    place.categories = buildKhivaMenu(place.language);
    await place.save();

    return NextResponse.json({ ok: true, importedCategories: place.categories.length });
  } catch (error) {
    console.error("[API /api/places/import-khiva POST] Failed", error);
    return NextResponse.json({ error: "Failed to import khiva menu" }, { status: 500 });
  }
}
