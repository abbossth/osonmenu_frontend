import { NextRequest, NextResponse } from "next/server";
import { normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { slug?: string; categoryIds?: string[] };
    const slug = normalizeSlug(body.slug);
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    if (!slug || categoryIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const rankMap = new Map(categoryIds.map((id, index) => [id, index]));
    establishment.categories.forEach((category: { _id: unknown; order: number }, index: number) => {
      category.order = rankMap.get(String(category._id)) ?? index;
    });
    establishment.categories.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    establishment.categories.forEach((category: { order: number }, index: number) => {
      category.order = index;
    });
    await establishment.save();

    return NextResponse.json({ categories: establishment.categories });
  } catch (error) {
    console.error("[API /api/categories/reorder PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}

