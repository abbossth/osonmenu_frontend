import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: unknown): value is Locale {
  return value === "uz" || value === "ru" || value === "en";
}

function clearDisabledLanguagesFromI18n(
  value: unknown,
  enabled: Locale[],
  fallback = "",
) {
  const source = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const enabledSet = new Set(enabled);
  return {
    uz: enabledSet.has("uz") ? (typeof source.uz === "string" ? source.uz.trim() : fallback) : "",
    ru: enabledSet.has("ru") ? (typeof source.ru === "string" ? source.ru.trim() : fallback) : "",
    en: enabledSet.has("en") ? (typeof source.en === "string" ? source.en.trim() : fallback) : "",
  };
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
    const enabledLanguagesRaw = Array.isArray(body.enabledLanguages)
      ? body.enabledLanguages.filter(isLocale)
      : Array.isArray(establishment.enabledLanguages)
        ? establishment.enabledLanguages.filter(isLocale)
        : [...LOCALES];
    const enabledLanguages = enabledLanguagesRaw.length ? enabledLanguagesRaw : ["uz"];
    establishment.enabledLanguages = enabledLanguages;
    if (isLocale(body.language)) {
      establishment.language = body.language;
      if (!establishment.enabledLanguages.includes(body.language)) {
        establishment.enabledLanguages.push(body.language);
      }
    }
    if (!establishment.enabledLanguages.includes(establishment.language)) {
      establishment.language = establishment.enabledLanguages[0] || "uz";
    }

    if (Array.isArray(establishment.menus)) {
      establishment.menus = establishment.menus.map((menu: { name?: string; nameI18n?: unknown }) => {
        const fallback = typeof menu.name === "string" ? menu.name : "Menu";
        return {
          ...menu,
          nameI18n: clearDisabledLanguagesFromI18n(menu.nameI18n, establishment.enabledLanguages as Locale[], fallback),
        };
      });
      establishment.markModified("menus");
    }

    establishment.countryI18n = clearDisabledLanguagesFromI18n(
      establishment.countryI18n,
      establishment.enabledLanguages as Locale[],
      typeof establishment.country === "string" ? establishment.country : "",
    );
    establishment.cityI18n = clearDisabledLanguagesFromI18n(
      establishment.cityI18n,
      establishment.enabledLanguages as Locale[],
      typeof establishment.city === "string" ? establishment.city : "",
    );
    establishment.additionalInfoI18n = clearDisabledLanguagesFromI18n(
      establishment.additionalInfoI18n,
      establishment.enabledLanguages as Locale[],
      typeof establishment.additionalInfo === "string" ? establishment.additionalInfo : "",
    );

    if (Array.isArray(establishment.categories)) {
      establishment.categories = establishment.categories.map((category: {
        name?: string;
        nameI18n?: unknown;
        items?: Array<{ name?: string; description?: string; nameI18n?: unknown; descriptionI18n?: unknown }>;
      }) => ({
        ...category,
        nameI18n: clearDisabledLanguagesFromI18n(category.nameI18n, establishment.enabledLanguages as Locale[], typeof category.name === "string" ? category.name : ""),
        items: Array.isArray(category.items)
          ? category.items.map((item: { name?: string; description?: string; nameI18n?: unknown; descriptionI18n?: unknown }) => ({
              ...item,
              nameI18n: clearDisabledLanguagesFromI18n(item.nameI18n, establishment.enabledLanguages as Locale[], typeof item.name === "string" ? item.name : ""),
              descriptionI18n: clearDisabledLanguagesFromI18n(
                item.descriptionI18n,
                establishment.enabledLanguages as Locale[],
                typeof item.description === "string" ? item.description : "",
              ),
            }))
          : [],
      }));
      establishment.markModified("categories");
    }

    await establishment.save();
    return NextResponse.json({ language: establishment.language, enabledLanguages: establishment.enabledLanguages });
  } catch (error) {
    console.error("[API /api/components/locales PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update locales" }, { status: 500 });
  }
}

