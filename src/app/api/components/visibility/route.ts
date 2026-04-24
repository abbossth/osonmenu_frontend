import { NextRequest, NextResponse } from "next/server";
import { asObjectId, findUserEstablishment, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      slug?: string;
      updates?: Array<{ itemId?: string; isVisible?: boolean; isAvailable?: boolean }>;
    };
    const slug = normalizeSlug(body.slug);
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (!slug || updates.length === 0) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) establishment.categories = [];

    for (const entry of updates) {
      const itemId = typeof entry.itemId === "string" ? entry.itemId : "";
      const objectId = asObjectId(itemId);
      if (!objectId) continue;
      const category = establishment.categories.find((cat: { items: { id: (id: unknown) => unknown } }) =>
        Boolean(cat.items.id(objectId)),
      );
      if (!category) continue;
      const item = category.items.id(objectId);
      if (!item) continue;
      if (typeof entry.isVisible === "boolean") item.isVisible = entry.isVisible;
      if (typeof entry.isAvailable === "boolean") item.isAvailable = entry.isAvailable;
    }
    await establishment.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/components/visibility PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }
}

