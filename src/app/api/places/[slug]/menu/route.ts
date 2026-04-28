import { NextRequest, NextResponse } from "next/server";
import { verifyUser, normalizeSlug } from "@/app/api/_utils/menu-builder";
import { getDefaultCategoryImage } from "@/lib/category-default-image";
import { connectToMongoDB } from "@/lib/mongodb";
import { CategoryEntityModel } from "@/models/CategoryEntity";
import { EstablishmentModel } from "@/models/Establishment";
import { ItemEntityModel } from "@/models/ItemEntity";
import { MenuEntityModel } from "@/models/MenuEntity";

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
          isVisible: typeof item.isVisible === "boolean" ? item.isVisible : true,
          isAvailable: typeof item.isAvailable === "boolean" ? item.isAvailable : true,
          addonIds: Array.isArray(item.addonIds)
            ? item.addonIds.filter((entry): entry is string => typeof entry === "string")
            : [],
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

function normalizeAddons(addons: unknown) {
  if (!Array.isArray(addons)) return [];
  return addons
    .filter((addon): addon is Record<string, unknown> => typeof addon === "object" && addon !== null)
    .map((addon, addonIndex) => ({
      id: typeof addon.id === "string" && addon.id.trim() ? addon.id.trim() : `addon-${addonIndex}`,
      name: typeof addon.name === "string" ? addon.name : "Addon",
      nameI18n: normalizeI18n(addon.nameI18n, typeof addon.name === "string" ? addon.name : "Addon"),
      type: addon.type === "multiple" ? "multiple" : "single",
      options: Array.isArray(addon.options)
        ? addon.options
            .filter((option): option is Record<string, unknown> => typeof option === "object" && option !== null)
            .map((option, optionIndex) => ({
              id:
                typeof option.id === "string" && option.id.trim()
                  ? option.id.trim()
                  : `addon-${addonIndex}-option-${optionIndex}`,
              name: typeof option.name === "string" ? option.name : "Option",
              nameI18n: normalizeI18n(option.nameI18n, typeof option.name === "string" ? option.name : "Option"),
              price: typeof option.price === "number" && Number.isFinite(option.price) ? option.price : 0,
              order: normalizeOrder(option.order, optionIndex),
            }))
            .sort((a, b) => a.order - b.order)
            .map((option, index) => ({ ...option, order: index }))
        : [],
      isVisible: typeof addon.isVisible === "boolean" ? addon.isVisible : true,
      order: normalizeOrder(addon.order, addonIndex),
    }))
    .sort((a, b) => a.order - b.order)
    .map((addon, index) => ({ ...addon, order: index }));
}

function normalizeScheduledPrices(scheduledPrices: unknown) {
  if (!Array.isArray(scheduledPrices)) return [];
  return scheduledPrices
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry, index) => ({
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `scheduled-${index}`,
      targetType: entry.targetType === "addon" ? "addon" : "item",
      targetId: typeof entry.targetId === "string" ? entry.targetId : "",
      targetName: typeof entry.targetName === "string" ? entry.targetName : "Item",
      price: typeof entry.price === "number" && Number.isFinite(entry.price) ? entry.price : 0,
      startAt:
        entry.startAt instanceof Date
          ? entry.startAt.toISOString()
          : typeof entry.startAt === "string"
            ? entry.startAt
            : new Date().toISOString(),
      enabled: typeof entry.enabled === "boolean" ? entry.enabled : true,
    }));
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
    let authUser: { uid: string; email: string } | null = null;
    try {
      authUser = await verifyUser(request);
    } catch {
      authUser = null;
    }

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    await connectToMongoDB();
    const candidates = await EstablishmentModel.find({ slug }).sort({ createdAt: 1 });
    const establishment =
      authUser
        ? candidates.find((entry) => {
            const ownerId = entry.ownerId || entry.userId;
            if (ownerId === authUser.uid) return true;
            const members = Array.isArray(entry.teamMembers)
              ? (entry.teamMembers as Array<{ userId?: string; email?: string }>)
              : [];
            return members.some((member) => {
              const memberUserId = typeof member.userId === "string" ? member.userId : "";
              const memberEmail = typeof member.email === "string" ? member.email.toLowerCase() : "";
              return memberUserId === authUser.uid || (authUser.email && memberEmail === authUser.email);
            });
          }) ?? candidates[0]
        : candidates[0];
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerId = establishment.ownerId || establishment.userId;
    const isOwner = Boolean(authUser?.uid && ownerId === authUser.uid);
    let teamMembers: Array<{ userId?: string; email?: string }> = Array.isArray(establishment.teamMembers)
      ? establishment.teamMembers
      : [];
    if (authUser?.uid && authUser.email) {
      let changed = false;
      teamMembers = teamMembers.map((member) => {
        const memberEmail = typeof member.email === "string" ? member.email.toLowerCase() : "";
        const memberUserId = typeof member.userId === "string" ? member.userId : "";
        if (!memberUserId && memberEmail === authUser?.email) {
          changed = true;
          return { ...member, userId: authUser.uid };
        }
        return member;
      });
      if (changed) {
        establishment.teamMembers = teamMembers as never;
        establishment.markModified("teamMembers");
        await establishment.save();
      }
    }
    const isTeamMember = Boolean(
      authUser?.uid &&
        teamMembers.some((member) => {
          const memberUserId = typeof member.userId === "string" ? member.userId : "";
          const memberEmail = typeof member.email === "string" ? member.email.toLowerCase() : "";
          return memberUserId === authUser.uid || (authUser.email && memberEmail === authUser.email);
        }),
    );
    const canEdit = isOwner || isTeamMember;
    const [menuDocs, categoryDocs] = await Promise.all([
      MenuEntityModel.find({ establishmentId: establishment._id }).lean(),
      CategoryEntityModel.find({ establishmentId: establishment._id }).lean(),
    ]);
    const categoryIds = categoryDocs.map((entry) => entry._id);
    const itemDocs =
      categoryIds.length > 0
        ? await ItemEntityModel.find({ establishmentId: establishment._id, categoryId: { $in: categoryIds } }).lean()
        : [];

    const useEntityCollections = menuDocs.length > 0 || categoryDocs.length > 0 || itemDocs.length > 0;

    const categories = useEntityCollections
      ? categoryDocs
          .map((category, categoryIndex) => {
            const items = itemDocs
              .filter((item) => String(item.categoryId) === String(category._id))
              .map((item, itemIndex) => ({
                _id: String(item._id),
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
                isVisible: typeof item.isVisible === "boolean" ? item.isVisible : true,
                isAvailable: typeof item.isAvailable === "boolean" ? item.isAvailable : true,
                addonIds: Array.isArray(item.addonIds)
                  ? item.addonIds.filter((entry: unknown): entry is string => typeof entry === "string")
                  : [],
                order: normalizeOrder(item.order, itemIndex),
              }))
              .sort((a, b) => a.order - b.order)
              .map((item, index) => ({ ...item, order: index }));

            return {
              _id: String(category._id),
              menuId:
                typeof category.menuId === "string" && category.menuId.trim() ? category.menuId.trim() : "main",
              menuName:
                typeof category.menuName === "string" && category.menuName.trim() ? category.menuName.trim() : "Menu",
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
          .map((category, index) => ({ ...category, order: index }))
      : normalizeCategories(establishment.categories);

    const menus = useEntityCollections
      ? buildMenus(
          categories,
          menuDocs.map((menu, index) => ({
            id: menu.id,
            name: menu.name,
            order: normalizeOrder(menu.order, index),
            isVisible: typeof menu.isVisible === "boolean" ? menu.isVisible : true,
          })),
        )
      : buildMenus(
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
    const addons = normalizeAddons(establishment.addons);
    const scheduledPrices = normalizeScheduledPrices(establishment.scheduledPrices);
    const enabledLanguages = Array.isArray(establishment.enabledLanguages)
      ? establishment.enabledLanguages.filter((entry: unknown): entry is "uz" | "ru" | "en" =>
          entry === "uz" || entry === "ru" || entry === "en",
        )
      : ["uz", "ru", "en"];

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
            : "",
        currency: establishment.currency,
        language: establishment.language,
        enabledLanguages,
        menus,
        categories,
        addons,
        scheduledPrices,
      },
      isOwner,
      canEdit,
    });
  } catch (error) {
    console.error("[API /api/places/[slug]/menu GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

