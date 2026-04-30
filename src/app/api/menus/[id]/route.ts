import { NextRequest, NextResponse } from "next/server";
import { normalizeName, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { CategoryEntityModel } from "@/models/CategoryEntity";
import { EstablishmentModel } from "@/models/Establishment";
import { ItemEntityModel } from "@/models/ItemEntity";
import { MenuEntityModel } from "@/models/MenuEntity";

type Params = { params: Promise<{ id: string }> };
function normalizeMenuNameI18nByLocales(
  input: { uz?: string; ru?: string; en?: string } | undefined,
  fallback: string,
) {
  return {
    uz: normalizeName(input?.uz ?? fallback),
    ru: normalizeName(input?.ru ?? fallback),
    en: normalizeName(input?.en ?? fallback),
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      isVisible?: boolean;
    };
    const slug = normalizeSlug(body.slug);
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    if (!slug || !id) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.menus)) establishment.menus = [];

    const menuEntity = await MenuEntityModel.findOne({ establishmentId: establishment._id, id }).lean();
    let menu = establishment.menus.find((entry: { id: string }) => entry.id === id);
    if (!menu && !menuEntity) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    if (!menu) {
      const fallbackName = normalizeName(menuEntity?.name) || "Menu";
      const fallbackNameI18n = {
        uz: normalizeName(menuEntity?.nameI18n?.uz ?? fallbackName),
        ru: normalizeName(menuEntity?.nameI18n?.ru ?? fallbackName),
        en: normalizeName(menuEntity?.nameI18n?.en ?? fallbackName),
      };
      menu = {
        id,
        name: fallbackName,
        nameI18n: fallbackNameI18n,
        order: establishment.menus.length,
        isVisible: typeof menuEntity?.isVisible === "boolean" ? menuEntity.isVisible : true,
      };
      establishment.menus.push(menu);
    }
    const previousName = normalizeName(menu.name) || normalizeName(menuEntity?.name) || "Menu";
    const previousNameI18n = {
      uz: normalizeName(menu.nameI18n?.uz ?? menuEntity?.nameI18n?.uz ?? previousName),
      ru: normalizeName(menu.nameI18n?.ru ?? menuEntity?.nameI18n?.ru ?? previousName),
      en: normalizeName(menu.nameI18n?.en ?? menuEntity?.nameI18n?.en ?? previousName),
    };
    const name = normalizeName(body.name) || previousName;
    const nameI18n = normalizeMenuNameI18nByLocales(
      {
        uz: typeof body.nameI18n?.uz === "string" ? body.nameI18n.uz : previousNameI18n.uz,
        ru: typeof body.nameI18n?.ru === "string" ? body.nameI18n.ru : previousNameI18n.ru,
        en: typeof body.nameI18n?.en === "string" ? body.nameI18n.en : previousNameI18n.en,
      },
      name,
    );
    menu.name = name;
    menu.nameI18n = nameI18n;
    menu.isVisible = isVisible;
    if (Array.isArray(establishment.categories)) {
      establishment.categories.forEach((category: { menuId?: string; menuName?: string }) => {
        if ((category.menuId || "main") === id) category.menuName = name;
      });
    }
    // Ensure nested i18n changes in menu objects are persisted reliably.
    establishment.markModified("menus");
    await establishment.save();
    await MenuEntityModel.updateOne(
      { establishmentId: establishment._id, id },
      { $set: { name, nameI18n, isVisible } },
      { upsert: true },
    );
    const persistedMenu = await MenuEntityModel.findOne({ establishmentId: establishment._id, id }).lean();
    const persistedName = normalizeName(persistedMenu?.name) || name;
    const persistedNameI18n = normalizeMenuNameI18nByLocales(
      {
        uz: persistedMenu?.nameI18n?.uz ?? nameI18n.uz,
        ru: persistedMenu?.nameI18n?.ru ?? nameI18n.ru,
        en: persistedMenu?.nameI18n?.en ?? nameI18n.en,
      },
      persistedName,
    );
    const persistedVisibility = typeof persistedMenu?.isVisible === "boolean" ? persistedMenu.isVisible : isVisible;
    await EstablishmentModel.updateOne(
      { _id: establishment._id, "menus.id": id },
      {
        $set: {
          "menus.$.name": persistedName,
          "menus.$.nameI18n.uz": persistedNameI18n.uz,
          "menus.$.nameI18n.ru": persistedNameI18n.ru,
          "menus.$.nameI18n.en": persistedNameI18n.en,
          "menus.$.isVisible": persistedVisibility,
        },
      },
    );
    await CategoryEntityModel.updateMany(
      { establishmentId: establishment._id, menuId: id },
      { $set: { menuName: name } },
    );
    return NextResponse.json({
      menu: {
        ...menu,
        name: persistedName,
        nameI18n: persistedNameI18n,
        isVisible: persistedVisibility,
      },
    });
  } catch (error) {
    console.error("[API /api/menus/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
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
    if (!Array.isArray(establishment.menus)) establishment.menus = [];
    if (!Array.isArray(establishment.categories)) establishment.categories = [];

    establishment.menus = establishment.menus.filter((entry: { id: string }) => entry.id !== id);
    establishment.categories = establishment.categories.filter(
      (category: { menuId?: string }) => (category.menuId || "main") !== id,
    );
    establishment.menus.forEach((entry: { order: number }, index: number) => {
      entry.order = index;
    });
    await establishment.save();
    const categories = await CategoryEntityModel.find({ establishmentId: establishment._id, menuId: id }).select("_id").lean();
    const categoryIds = categories.map((entry) => entry._id);
    await Promise.all([
      MenuEntityModel.deleteOne({ establishmentId: establishment._id, id }),
      CategoryEntityModel.deleteMany({ establishmentId: establishment._id, menuId: id }),
      categoryIds.length ? ItemEntityModel.deleteMany({ establishmentId: establishment._id, categoryId: { $in: categoryIds } }) : Promise.resolve(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/menus/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}

