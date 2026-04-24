import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeName, normalizePrice, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

type AddonOptionInput = {
  name?: string;
  nameI18n?: { uz?: string; ru?: string; en?: string };
  price?: number | string;
};

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.addons)) establishment.addons = [];
    return NextResponse.json({ addons: establishment.addons });
  } catch (error) {
    console.error("[API /api/components/addons GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch addons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      type?: "single" | "multiple";
      options?: AddonOptionInput[];
      isVisible?: boolean;
    };
    const slug = normalizeSlug(body.slug);
    const name = normalizeName(body.name);
    if (!slug || !name) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.addons)) establishment.addons = [];

    const options = Array.isArray(body.options)
      ? body.options
          .map((option, index) => ({
            id: `addon-opt-${randomUUID().slice(0, 8)}`,
            name: normalizeName(option.name) || `Option ${index + 1}`,
            nameI18n: {
              uz: normalizeName(option.nameI18n?.uz ?? option.name),
              ru: normalizeName(option.nameI18n?.ru ?? option.name),
              en: normalizeName(option.nameI18n?.en ?? option.name),
            },
            price: normalizePrice(option.price) || 0,
            order: index,
          }))
      : [];

    const addon = {
      id: `addon-${randomUUID().slice(0, 8)}`,
      name,
      nameI18n: {
        uz: normalizeName(body.nameI18n?.uz ?? name),
        ru: normalizeName(body.nameI18n?.ru ?? name),
        en: normalizeName(body.nameI18n?.en ?? name),
      },
      type: body.type === "multiple" ? "multiple" : "single",
      options,
      isVisible: typeof body.isVisible === "boolean" ? body.isVisible : true,
      order: establishment.addons.length,
    };
    establishment.addons.push(addon);
    await establishment.save();
    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    console.error("[API /api/components/addons POST] Failed", error);
    return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
  }
}

