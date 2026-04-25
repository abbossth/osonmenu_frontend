import { NextRequest, NextResponse } from "next/server";
import {
  asObjectId,
  normalizeBadge,
  normalizeName,
  normalizePrice,
  normalizeSlug,
  verifyUserId,
  findUserEstablishment,
} from "@/app/api/_utils/menu-builder";
import { ItemEntityModel } from "@/models/ItemEntity";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      slug?: string;
      categoryId?: string;
      name?: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      description?: string;
      descriptionI18n?: { uz?: string; ru?: string; en?: string };
      price?: number | string;
      imageUrl?: string;
      badge?: "popular" | "new" | null;
      isVisible?: boolean;
      isAvailable?: boolean;
      addonIds?: string[];
    };

    const slug = normalizeSlug(body.slug);
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    const name = normalizeName(body.name);
    const nameI18n = {
      uz: normalizeName(body.nameI18n?.uz ?? name),
      ru: normalizeName(body.nameI18n?.ru ?? name),
      en: normalizeName(body.nameI18n?.en ?? name),
    };
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const descriptionI18n = {
      uz: normalizeName(body.descriptionI18n?.uz ?? description),
      ru: normalizeName(body.descriptionI18n?.ru ?? description),
      en: normalizeName(body.descriptionI18n?.en ?? description),
    };
    const price = normalizePrice(body.price);
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const badge = normalizeBadge(body.badge);
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;
    const addonIds = Array.isArray(body.addonIds)
      ? body.addonIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];

    if (!slug || !categoryId || !name || Number.isNaN(price)) {
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

    const nextOrder = category.items.length;
    category.items.push({
      name,
      nameI18n,
      description,
      descriptionI18n,
      price,
      imageUrl,
      badge,
      isVisible,
      isAvailable,
      addonIds,
      order: nextOrder,
    });
    await establishment.save();
    const item = category.items[category.items.length - 1];
    await ItemEntityModel.updateOne(
      { _id: item._id, establishmentId: establishment._id },
      {
        $set: {
          establishmentId: establishment._id,
          categoryId: categoryObjectId,
          name,
          nameI18n,
          description,
          descriptionI18n,
          price,
          imageUrl,
          badge,
          isVisible,
          isAvailable,
          addonIds,
          order: nextOrder,
        },
      },
      { upsert: true },
    );
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[API /api/items POST] Failed", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

