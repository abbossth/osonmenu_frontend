import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: unknown): value is Locale {
  return value === "uz" || value === "ru" || value === "en";
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      slug?: string;
      language?: Locale;
      enabledLanguages?: Locale[];
    };
    const slug = normalizeSlug(body.slug);
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    const enabledLanguages = Array.isArray(body.enabledLanguages)
      ? body.enabledLanguages.filter(isLocale)
      : Array.isArray(establishment.enabledLanguages)
        ? establishment.enabledLanguages.filter(isLocale)
        : [...LOCALES];
    establishment.enabledLanguages = enabledLanguages.length ? enabledLanguages : [...LOCALES];
    if (isLocale(body.language)) {
      establishment.language = body.language;
      if (!establishment.enabledLanguages.includes(body.language)) {
        establishment.enabledLanguages.push(body.language);
      }
    }
    await establishment.save();
    return NextResponse.json({ language: establishment.language, enabledLanguages: establishment.enabledLanguages });
  } catch (error) {
    console.error("[API /api/components/locales PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update locales" }, { status: 500 });
  }
}

