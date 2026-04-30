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

type Params = { params: Promise<{ id: string }> };

function findCategoryByItemId(
  establishment: Awaited<ReturnType<typeof findUserEstablishment>>,
  itemObjectId: NonNullable<ReturnType<typeof asObjectId>>,
) {
  if (!establishment) return null;
  return establishment.categories.find((category: { items: { id: (id: unknown) => unknown } }) =>
    Boolean(category.items.id(itemObjectId)),
  );
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const itemObjectId = asObjectId(id);
    if (!itemObjectId) return NextResponse.json({ error: "Invalid item id" }, { status: 400 });

    const body = (await request.json()) as {
      slug?: string;
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
    if (!slug) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const category = findCategoryByItemId(establishment, itemObjectId);
    if (!category) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const item = category.items.id(itemObjectId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    const name = normalizeName(body.name) || item.name;
    const nameI18n = {
      uz:
        typeof body.nameI18n?.uz === "string"
          ? normalizeName(body.nameI18n.uz)
          : normalizeName(item.nameI18n?.uz ?? name),
      ru:
        typeof body.nameI18n?.ru === "string"
          ? normalizeName(body.nameI18n.ru)
          : normalizeName(item.nameI18n?.ru ?? name),
      en:
        typeof body.nameI18n?.en === "string"
          ? normalizeName(body.nameI18n.en)
          : normalizeName(item.nameI18n?.en ?? name),
    };
    const description =
      typeof body.description === "string" ? body.description.trim() : item.description || "";
    const descriptionI18n = {
      uz:
        typeof body.descriptionI18n?.uz === "string"
          ? normalizeName(body.descriptionI18n.uz)
          : normalizeName(item.descriptionI18n?.uz ?? description),
      ru:
        typeof body.descriptionI18n?.ru === "string"
          ? normalizeName(body.descriptionI18n.ru)
          : normalizeName(item.descriptionI18n?.ru ?? description),
      en:
        typeof body.descriptionI18n?.en === "string"
          ? normalizeName(body.descriptionI18n.en)
          : normalizeName(item.descriptionI18n?.en ?? description),
    };
    const parsedPrice = normalizePrice(body.price);
    const price = Number.isNaN(parsedPrice) ? item.price : parsedPrice;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : item.imageUrl || "";
    const badge = body.badge === undefined ? item.badge : normalizeBadge(body.badge);
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : Boolean(item.isVisible);
    const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : Boolean(item.isAvailable);
    const addonIds = Array.isArray(body.addonIds)
      ? body.addonIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : Array.isArray(item.addonIds)
        ? item.addonIds
        : [];

    item.name = name;
    item.nameI18n = nameI18n;
    item.description = description;
    item.descriptionI18n = descriptionI18n;
    item.price = price;
    item.imageUrl = imageUrl;
    item.badge = badge;
    item.isVisible = isVisible;
    item.isAvailable = isAvailable;
    item.addonIds = addonIds;
    await establishment.save();
    await ItemEntityModel.updateOne(
      { _id: itemObjectId, establishmentId: establishment._id },
      {
        $set: {
          establishmentId: establishment._id,
          categoryId: category._id,
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
          order: item.order,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[API /api/items/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const itemObjectId = asObjectId(id);
    if (!itemObjectId) return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }
    const category = findCategoryByItemId(establishment, itemObjectId);
    if (!category) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    const item = category.items.id(itemObjectId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    item.deleteOne();

    category.items.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    category.items.forEach((currentItem: { order: number }, index: number) => {
      currentItem.order = index;
    });
    await establishment.save();
    await ItemEntityModel.deleteOne({ _id: itemObjectId, establishmentId: establishment._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/items/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

