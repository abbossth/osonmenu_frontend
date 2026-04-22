import { NextRequest, NextResponse } from "next/server";
import { asObjectId, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      slug?: string;
      categoryId?: string;
      itemIds?: string[];
    };
    const slug = normalizeSlug(body.slug);
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    const itemIds = Array.isArray(body.itemIds) ? body.itemIds : [];
    if (!slug || !categoryId || itemIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const categoryObjectId = asObjectId(categoryId);
    if (!categoryObjectId) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }
    const category = establishment.categories.id(categoryObjectId);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (!Array.isArray(category.items)) {
      category.items = [];
    }

    const rankMap = new Map(itemIds.map((id, index) => [id, index]));
    category.items.forEach((item: { _id: unknown; order: number }, index: number) => {
      item.order = rankMap.get(String(item._id)) ?? index;
    });
    category.items.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    category.items.forEach((item: { order: number }, index: number) => {
      item.order = index;
    });
    await establishment.save();

    return NextResponse.json({ items: category.items });
  } catch (error) {
    console.error("[API /api/items/reorder PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}

