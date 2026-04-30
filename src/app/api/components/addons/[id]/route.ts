import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeName, normalizePrice, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      type?: "single" | "multiple";
      options?: Array<{ id?: string; name?: string; nameI18n?: { uz?: string; ru?: string; en?: string }; price?: number | string }>;
      isVisible?: boolean;
    };
    const slug = normalizeSlug(body.slug);
    if (!slug || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.addons)) establishment.addons = [];
    const addon = establishment.addons.find((entry: { id: string }) => entry.id === id);
    if (!addon) return NextResponse.json({ error: "Addon not found" }, { status: 404 });

    const name = normalizeName(body.name) || addon.name;
    addon.name = name;
    addon.nameI18n = {
      uz:
        typeof body.nameI18n?.uz === "string"
          ? normalizeName(body.nameI18n.uz)
          : normalizeName(addon.nameI18n?.uz ?? name),
      ru:
        typeof body.nameI18n?.ru === "string"
          ? normalizeName(body.nameI18n.ru)
          : normalizeName(addon.nameI18n?.ru ?? name),
      en:
        typeof body.nameI18n?.en === "string"
          ? normalizeName(body.nameI18n.en)
          : normalizeName(addon.nameI18n?.en ?? name),
    };
    addon.type = body.type === "multiple" ? "multiple" : body.type === "single" ? "single" : addon.type;
    addon.isVisible = typeof body.isVisible === "boolean" ? body.isVisible : addon.isVisible;
    if (Array.isArray(body.options)) {
      addon.options = body.options.map((option, index) => {
        const name = normalizeName(option.name) || `Option ${index + 1}`;
        return {
          id: normalizeName(option.id) || `addon-opt-${randomUUID().slice(0, 8)}`,
          name,
          nameI18n: {
            uz: normalizeName(option.nameI18n?.uz ?? name),
            ru: normalizeName(option.nameI18n?.ru ?? name),
            en: normalizeName(option.nameI18n?.en ?? name),
          },
          price: normalizePrice(option.price) || 0,
          order: index,
        };
      });
    }
    await establishment.save();
    return NextResponse.json({ addon });
  } catch (error) {
    console.error("[API /api/components/addons/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update addon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.addons)) establishment.addons = [];
    establishment.addons = establishment.addons.filter((entry: { id: string }) => entry.id !== id);
    if (Array.isArray(establishment.categories)) {
      establishment.categories.forEach((category: { items?: Array<{ addonIds?: string[] }> }) => {
        if (!Array.isArray(category.items)) return;
        category.items.forEach((item: { addonIds?: string[] }) => {
          if (!Array.isArray(item.addonIds)) return;
          item.addonIds = item.addonIds.filter((addonId) => addonId !== id);
        });
      });
    }
    await establishment.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/components/addons/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete addon" }, { status: 500 });
  }
}

