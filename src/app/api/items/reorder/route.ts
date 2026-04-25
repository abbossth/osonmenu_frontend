import { NextRequest, NextResponse } from "next/server";
import { asObjectId, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { ItemEntityModel } from "@/models/ItemEntity";

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
    await Promise.all(
      category.items.map(
        (item: {
          _id: unknown;
          name?: string;
          nameI18n?: unknown;
          description?: string;
          descriptionI18n?: unknown;
          price?: number;
          imageUrl?: string;
          badge?: "popular" | "new" | null;
          isVisible?: boolean;
          isAvailable?: boolean;
          addonIds?: string[];
          order: number;
        }) =>
          ItemEntityModel.updateOne(
            { _id: item._id, establishmentId: establishment._id },
            {
              $set: {
                establishmentId: establishment._id,
                categoryId: categoryObjectId,
                name: item.name || "",
                nameI18n: item.nameI18n || { uz: "", ru: "", en: "" },
                description: item.description || "",
                descriptionI18n: item.descriptionI18n || { uz: "", ru: "", en: "" },
                price: typeof item.price === "number" ? item.price : 0,
                imageUrl: item.imageUrl || "",
                badge: item.badge ?? null,
                isVisible: typeof item.isVisible === "boolean" ? item.isVisible : true,
                isAvailable: typeof item.isAvailable === "boolean" ? item.isAvailable : true,
                addonIds: Array.isArray(item.addonIds) ? item.addonIds : [],
                order: item.order,
              },
            },
            { upsert: true },
          ),
      ),
    );

    return NextResponse.json({ items: category.items });
  } catch (error) {
    console.error("[API /api/items/reorder PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}

