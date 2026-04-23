import { NextRequest, NextResponse } from "next/server";
import { verifyUserId, normalizeSlug } from "@/app/api/_utils/menu-builder";
import { getDefaultCategoryImage } from "@/lib/category-default-image";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";

type Params = { params: Promise<{ slug: string }> };

function normalizeOrder(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeI18n(value: unknown, fallback = "") {
  const source = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    uz: typeof source.uz === "string" ? source.uz : fallback,
    ru: typeof source.ru === "string" ? source.ru : fallback,
    en: typeof source.en === "string" ? source.en : fallback,
  };
}

function normalizeCategories(categories: unknown) {
  if (!Array.isArray(categories)) return [];

  return categories
    .filter((category): category is Record<string, unknown> => typeof category === "object" && category !== null)
    .map((category, categoryIndex) => {
      const itemsRaw = Array.isArray(category.items) ? category.items : [];
      const items = itemsRaw
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, itemIndex) => ({
          _id: String(item._id ?? `item-${categoryIndex}-${itemIndex}`),
          name: typeof item.name === "string" ? item.name : "",
          nameI18n: normalizeI18n(item.nameI18n, typeof item.name === "string" ? item.name : ""),
          description: typeof item.description === "string" ? item.description : "",
          descriptionI18n: normalizeI18n(
            item.descriptionI18n,
            typeof item.description === "string" ? item.description : "",
          ),
          price: typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0,
          imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
          badge: item.badge === "popular" || item.badge === "new" ? item.badge : null,
          order: normalizeOrder(item.order, itemIndex),
        }))
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index }));

      return {
        _id: String(category._id ?? `category-${categoryIndex}`),
        menuId: typeof category.menuId === "string" && category.menuId.trim() ? category.menuId.trim() : "main",
        menuName: typeof category.menuName === "string" && category.menuName.trim() ? category.menuName.trim() : "Menu",
        name: typeof category.name === "string" ? category.name : "Untitled",
        nameI18n: normalizeI18n(
          category.nameI18n,
          typeof category.name === "string" ? category.name : "Untitled",
        ),
        description: typeof category.description === "string" ? category.description : "",
        imageUrl:
          typeof category.imageUrl === "string" && category.imageUrl.trim()
            ? category.imageUrl.trim()
            : getDefaultCategoryImage(typeof category.name === "string" ? category.name : "menu"),
        isVisible: typeof category.isVisible === "boolean" ? category.isVisible : true,
        order: normalizeOrder(category.order, categoryIndex),
        items,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((category, index) => ({ ...category, order: index }));
}

function buildMenus(
  categories: ReturnType<typeof normalizeCategories>,
  persistedMenus: Array<{ id: string; name: string; order?: number; isVisible?: boolean }> = [],
): Array<{ id: string; name: string; order: number; isVisible: boolean; categories: ReturnType<typeof normalizeCategories> }> {
  const menuMap = new Map<
    string,
    { id: string; name: string; order: number; isVisible: boolean; categories: ReturnType<typeof normalizeCategories> }
  >();
  for (const menu of persistedMenus) {
    if (!menu?.id) continue;
    menuMap.set(menu.id, {
      id: menu.id,
      name: menu.name || "Menu",
      order: typeof menu.order === "number" ? menu.order : menuMap.size,
      isVisible: typeof menu.isVisible === "boolean" ? menu.isVisible : true,
      categories: [],
    });
  }
  for (const category of categories) {
    const menuId = category.menuId || "main";
    if (!menuMap.has(menuId)) {
      menuMap.set(menuId, {
        id: menuId,
        name: category.menuName || "Menu",
        order: menuMap.size,
        isVisible: true,
        categories: [],
      });
    }
    menuMap.get(menuId)?.categories.push(category);
  }
  return Array.from(menuMap.values()).sort((a, b) => a.order - b.order);
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    let userId: string | null = null;
    try {
      userId = await verifyUserId(request);
    } catch {
      userId = null;
    }

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    await connectToMongoDB();
    const establishment = userId
      ? await EstablishmentModel.findOne({ slug, $or: [{ ownerId: userId }, { userId }] }).sort({ createdAt: -1 })
      : await EstablishmentModel.findOne({ slug }).sort({ createdAt: -1 });
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerId = establishment.ownerId || establishment.userId;
    const isOwner = Boolean(userId && ownerId === userId);
    const categories = normalizeCategories(establishment.categories);
    const menus = buildMenus(
      categories,
      Array.isArray(establishment.menus)
        ? establishment.menus.map((menu: { id: string; name: string; order?: number; isVisible?: boolean }) => ({
            id: menu.id,
            name: menu.name,
            order: menu.order,
            isVisible: menu.isVisible,
          }))
        : [],
    );

    return NextResponse.json({
      place: {
        _id: String(establishment._id),
        ownerId,
        name: establishment.name,
        slug: establishment.slug,
        colorTheme: establishment.colorTheme === "dark" ? "dark" : "light",
        color: typeof establishment.color === "string" ? establishment.color : "#f7906c",
        currencySymbol: typeof establishment.currencySymbol === "string" ? establishment.currencySymbol : "",
        logoUrl: typeof establishment.logoUrl === "string" ? establishment.logoUrl : "",
        backgroundImage: typeof establishment.backgroundImage === "string" ? establishment.backgroundImage : "",
        wifiPassword: typeof establishment.wifiPassword === "string" ? establishment.wifiPassword : "CoolWiFiPassword",
        phone: typeof establishment.phone === "string" ? establishment.phone : "",
        guestsCanOrder: typeof establishment.guestsCanOrder === "boolean" ? establishment.guestsCanOrder : true,
        hideMenuButtons: typeof establishment.hideMenuButtons === "boolean" ? establishment.hideMenuButtons : false,
        country: typeof establishment.country === "string" ? establishment.country : "The Best Country",
        city: typeof establishment.city === "string" ? establishment.city : "Awesome City",
        address: typeof establishment.address === "string" ? establishment.address : "",
        googleMapsLink: typeof establishment.googleMapsLink === "string" ? establishment.googleMapsLink : "",
        instagram: typeof establishment.instagram === "string" ? establishment.instagram : "",
        facebook: typeof establishment.facebook === "string" ? establishment.facebook : "",
        tiktok: typeof establishment.tiktok === "string" ? establishment.tiktok : "",
        twitter: typeof establishment.twitter === "string" ? establishment.twitter : "",
        tripAdvisor: typeof establishment.tripAdvisor === "string" ? establishment.tripAdvisor : "",
        googleReviews: typeof establishment.googleReviews === "string" ? establishment.googleReviews : "",
        additionalInfo:
          typeof establishment.additionalInfo === "string"
            ? establishment.additionalInfo
            : "Here you can add any additional information about your QR code menu",
        currency: establishment.currency,
        language: establishment.language,
        menus,
        categories,
      },
      isOwner,
    });
  } catch (error) {
    console.error("[API /api/places/[slug]/menu GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

