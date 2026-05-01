"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faArrowLeft, faCompass, faLocationDot, faMagnifyingGlass, faMapLocationDot, faPenToSquare, faPhone, faStar, faWifi, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AddItemModal } from "@/components/MenuBuilder/AddItemModal";
import { CategoryList } from "@/components/MenuUI/CategoryList";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { ImageEditorModal } from "@/components/MenuUI/ImageEditorModal";
import { ItemList } from "@/components/MenuUI/ItemList";
import { MenuTabs } from "@/components/MenuUI/MenuTabs";
import { useAuth } from "@/components/providers/auth-provider";
import { getDefaultCategoryImage } from "@/lib/category-default-image";
import { uploadImageToFirebase } from "@/lib/firebase-upload";
import type { MenuCategory, MenuGroup, MenuItem, MenuLocalizedText, MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place: MenuPlace; isOwner?: boolean; canEdit?: boolean };
type CategoryFormState = {
  name: string;
  nameI18n: MenuLocalizedText;
  description: string;
  imageUrl: string;
  isVisible: boolean;
};
type LocaleCode = "uz" | "ru" | "en";
const ALL_LOCALES: LocaleCode[] = ["uz", "ru", "en"];

function normalizeEnabledLanguages(place: Pick<MenuPlace, "enabledLanguages"> | null | undefined): LocaleCode[] {
  const raw = place?.enabledLanguages;
  if (!Array.isArray(raw) || raw.length === 0) return [...ALL_LOCALES];
  const filtered = raw.filter((entry): entry is LocaleCode => entry === "uz" || entry === "ru" || entry === "en");
  return filtered.length ? filtered : ["uz"];
}
type EstablishmentFormState = {
  name: string;
  colorTheme: "light" | "dark";
  color: string;
  currency: "UZS" | "USD";
  currencySymbol: string;
  logoUrl: string;
  backgroundImage: string;
  wifiPassword: string;
  phone: string;
  guestsCanOrder: boolean;
  hideMenuButtons: boolean;
  country: string;
  countryI18n: MenuLocalizedText;
  city: string;
  cityI18n: MenuLocalizedText;
  address: string;
  googleMapsLink: string;
  yandexMapsLink: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  tripAdvisor: string;
  googleReviews: string;
  additionalInfo: string;
  additionalInfoI18n: MenuLocalizedText;
};
type MenuFormState = {
  name: string;
  nameI18n: MenuLocalizedText;
  isVisible: boolean;
  insertSide: "left" | "right";
};
type ImageEditorTarget = "category" | "logo" | "background";

function sortCategories(categories: MenuCategory[]) {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({ ...category, items: [...category.items].sort((a, b) => a.order - b.order) }));
}

function buildMenus(categories: MenuCategory[], fallbackMenus: MenuGroup[] = []) {
  const grouped = new Map<string, MenuGroup>();

  for (const category of categories) {
    const menuId = category.menuId || "main";
    const fallbackMenu = fallbackMenus.find((menu) => menu.id === menuId);
    if (!grouped.has(menuId)) {
      grouped.set(menuId, {
        id: menuId,
        name: category.menuName || fallbackMenu?.name || "Menu",
        nameI18n: fallbackMenu?.nameI18n,
        categories: [],
      });
    }
    grouped.get(menuId)?.categories.push(category);
  }

  for (const menu of fallbackMenus) {
    if (!grouped.has(menu.id)) {
      grouped.set(menu.id, { ...menu, categories: [] });
    }
  }

  return Array.from(grouped.values());
}

function toExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export default function PublicMenuPage() {
  const t = useTranslations("ProfilePanel.menuBuilder");
  const { firebaseUser } = useAuth();
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const menuFromQuery = searchParams.get("menu");
  const categoryFromQuery = searchParams.get("category");
  const langFromQueryRaw = searchParams.get("lang");
  const langFromQuery: LocaleCode | null =
    langFromQueryRaw === "uz" || langFromQueryRaw === "ru" || langFromQueryRaw === "en"
      ? langFromQueryRaw
      : null;
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOrder, setMenuOrder] = useState<string[]>([]);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [menuRenameOpen, setMenuRenameOpen] = useState(false);
  const [menuRenameId, setMenuRenameId] = useState<string | null>(null);
  const [menuRenameName, setMenuRenameName] = useState("");
  const [menuRenameNameI18n, setMenuRenameNameI18n] = useState<MenuLocalizedText>({ uz: "", ru: "", en: "" });
  const [menuDeleteTarget, setMenuDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormState>({
    name: "",
    nameI18n: { uz: "", ru: "", en: "" },
    isVisible: true,
    insertSide: "right",
  });
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<MenuCategory | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<MenuCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: "",
    nameI18n: { uz: "", ru: "", en: "" },
    description: "",
    imageUrl: "",
    isVisible: true,
  });
  const [establishmentEditorOpen, setEstablishmentEditorOpen] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [editorState, setEditorState] = useState<{ open: boolean; target: ImageEditorTarget | null; imageUrl: string }>({
    open: false,
    target: null,
    imageUrl: "",
  });
  const [establishmentForm, setEstablishmentForm] = useState<EstablishmentFormState>({
    name: "",
    colorTheme: "light",
    color: "#f7906c",
    currency: "UZS",
    currencySymbol: "",
    logoUrl: "",
    backgroundImage: "",
    wifiPassword: "",
    phone: "",
    guestsCanOrder: true,
    hideMenuButtons: false,
    country: "",
    countryI18n: { uz: "", ru: "", en: "" },
    city: "",
    cityI18n: { uz: "", ru: "", en: "" },
    address: "",
    googleMapsLink: "",
    yandexMapsLink: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter: "",
    tripAdvisor: "",
    googleReviews: "",
    additionalInfo: "",
    additionalInfoI18n: { uz: "", ru: "", en: "" },
  });
  const [contentLanguage, setContentLanguage] = useState<LocaleCode>("uz");
  const tempCategoryIdRef = useRef(0);
  const tempItemIdRef = useRef(0);
  const langFromQueryRef = useRef<LocaleCode | null>(langFromQuery);
  langFromQueryRef.current = langFromQuery;
  const wasItemsPanelRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const categoryImageInputRef = useRef<HTMLInputElement | null>(null);

  const categories = useMemo(() => (place ? sortCategories(place.categories) : []), [place]);
  const menus = useMemo(() => buildMenus(categories, place?.menus ?? []), [categories, place]);
  const orderedMenus = useMemo(() => {
    if (!menuOrder.length) return menus;
    const rank = new Map(menuOrder.map((id, index) => [id, index]));
    return [...menus].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }, [menuOrder, menus]);
  const queryMenuId =
    menuFromQuery && orderedMenus.some((menu) => menu.id === menuFromQuery) ? menuFromQuery : null;
  const menuWithCategories = orderedMenus.find((menu) => menu.categories.length > 0) ?? null;
  const hasExplicitMenuSelection = Boolean(
    queryMenuId || (activeMenuId && orderedMenus.some((menu) => menu.id === activeMenuId)),
  );
  const preferredActiveMenuId =
    queryMenuId ??
    (activeMenuId && orderedMenus.some((menu) => menu.id === activeMenuId) ? activeMenuId : orderedMenus[0]?.id ?? null);
  const preferredActiveMenu = orderedMenus.find((menu) => menu.id === preferredActiveMenuId) ?? null;
  const resolvedActiveMenuId =
    !hasExplicitMenuSelection && preferredActiveMenu && preferredActiveMenu.categories.length === 0 && menuWithCategories
      ? menuWithCategories.id
      : preferredActiveMenu?.id ?? null;
  const activeMenu = orderedMenus.find((menu) => menu.id === resolvedActiveMenuId) ?? null;
  const activeMenuCategories = activeMenu?.categories ?? [];
  const filteredActiveMenuCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeMenuCategories;
    return activeMenuCategories.filter((category) => {
      const categoryName = pickLocalized(category.nameI18n, category.name).toLowerCase();
      const categoryDescription = (category.description ?? "").toLowerCase();
      const itemMatches = category.items.some((item) => {
        const itemName = pickLocalized(item.nameI18n, item.name).toLowerCase();
        const itemDescription = pickLocalized(item.descriptionI18n, item.description).toLowerCase();
        return itemName.includes(query) || itemDescription.includes(query);
      });
      return categoryName.includes(query) || categoryDescription.includes(query) || itemMatches;
    });
  }, [activeMenuCategories, searchQuery, contentLanguage]);
  const resolvedActiveCategoryId =
    categoryFromQuery && activeMenuCategories.some((category) => category._id === categoryFromQuery)
      ? categoryFromQuery
      : activeCategoryId && activeMenuCategories.some((category) => category._id === activeCategoryId)
        ? activeCategoryId
        : activeMenuCategories[0]?._id ?? null;
  const activeCategory = activeMenuCategories.find((category) => category._id === resolvedActiveCategoryId) ?? null;
  const showItemsPanel = Boolean(categoryFromQuery && activeCategory && activeCategory._id === categoryFromQuery);
  const filteredMenuItems = useMemo(() => {
    if (!showItemsPanel || !activeCategory) return [];
    const query = searchQuery.trim().toLowerCase();
    const all = [...activeCategory.items].sort((a, b) => a.order - b.order);
    if (!query) return all;
    return all.filter(
      (item) =>
        pickLocalized(item.nameI18n, item.name).toLowerCase().includes(query) ||
        pickLocalized(item.descriptionI18n, item.description).toLowerCase().includes(query),
    );
  }, [activeCategory, showItemsPanel, searchQuery, contentLanguage]);
  const isAdminMode = canEdit;
  const isLightTheme = (place?.colorTheme ?? "light") === "light";
  const accentColor = place?.color?.trim() || "#f7906c";
  const enabledLanguages = useMemo(() => normalizeEnabledLanguages(place), [place]);
  const primaryLanguage: LocaleCode = useMemo(() => {
    const base = place?.language;
    if (base === "uz" || base === "ru" || base === "en") return base;
    return "uz";
  }, [place?.language]);
  const secondaryLanguages = useMemo(
    () => enabledLanguages.filter((entry) => entry !== primaryLanguage),
    [enabledLanguages, primaryLanguage],
  );
  const address = place?.address?.trim() ?? "";
  const city = pickLocalized(place?.cityI18n, place?.city ?? "").trim();
  const country = pickLocalized(place?.countryI18n, place?.country ?? "").trim();
  const phone = place?.phone?.trim() ?? "";
  const wifiPassword = place?.wifiPassword?.trim() ?? "";
  const locationLine = [address, city, country].filter(Boolean).join(", ");
  const mapLinks = [
    { label: "Google Maps", icon: faMapLocationDot, value: place?.googleMapsLink?.trim() ?? "" },
    { label: "Yandex Maps", icon: faLocationDot, value: place?.yandexMapsLink?.trim() ?? "" },
  ].filter((entry) => entry.value.length > 0);
  const socialLinks = [
    { label: "Instagram", icon: faInstagram, value: place?.instagram ?? "" },
    { label: "Facebook", icon: faFacebookF, value: place?.facebook ?? "" },
    { label: "TikTok", icon: faTiktok, value: place?.tiktok ?? "" },
    { label: "Twitter", icon: faXTwitter, value: place?.twitter ?? "" },
    { label: "TripAdvisor", icon: faCompass, value: place?.tripAdvisor ?? "" },
    { label: "Google Reviews", icon: faStar, value: place?.googleReviews ?? "" },
  ].filter((entry) => entry.value.trim().length > 0);
  const languageLabel: Record<LocaleCode, string> = {
    uz: "Uzbek (O'zbek)",
    ru: "Russian (Русский)",
    en: "English (English)",
  };

  useEffect(() => {
    if (!place) return;
    if (enabledLanguages.includes(contentLanguage)) return;
    const next = enabledLanguages.includes(primaryLanguage) ? primaryLanguage : enabledLanguages[0] ?? "uz";
    setContentLanguage(next);
  }, [place, enabledLanguages, primaryLanguage, contentLanguage]);

  function pickLocalized(text: MenuLocalizedText | undefined, fallback: string) {
    if (!text) return fallback;
    return text[contentLanguage] || text.uz || text.ru || text.en || fallback;
  }
  useEffect(() => {
    async function loadMenu() {
      if (!slug) return;
      try {
        setPageLoading(true);
        setError(null);

        const headers: HeadersInit = {};
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            headers.Authorization = `Bearer ${token}`;
          } catch {
            // Public view continues without auth token.
          }
        }

        const res = await fetch(`/api/places/${slug}/menu`, { headers });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Failed to fetch menu");
        }
        const data = (await res.json()) as MenuResponse;
        setPlace(data.place);
        const availableLanguages = normalizeEnabledLanguages(data.place);
        const qLang = langFromQueryRef.current;
        const placeLang = data.place.language;
        const preferredLanguage =
          qLang && availableLanguages.includes(qLang)
            ? qLang
            : placeLang === "uz" || placeLang === "ru" || placeLang === "en"
              ? availableLanguages.includes(placeLang)
                ? placeLang
                : availableLanguages[0] || "uz"
              : availableLanguages[0] || "uz";
        setContentLanguage(preferredLanguage);
        setCanEdit(Boolean(data.canEdit || data.isOwner));
        const sortedCategories = sortCategories(data.place.categories);
        const menusBuilt = buildMenus(sortedCategories, data.place.menus ?? []);
        const urlCategoryEntity =
          categoryFromQuery && sortedCategories.some((c) => c._id === categoryFromQuery)
            ? sortedCategories.find((c) => c._id === categoryFromQuery)!
            : null;
        let initialMenuId: string | null = null;
        if (urlCategoryEntity) {
          initialMenuId = urlCategoryEntity.menuId || "main";
        } else if (menuFromQuery && menusBuilt.some((m) => m.id === menuFromQuery)) {
          initialMenuId = menuFromQuery;
        } else {
          initialMenuId = menusBuilt[0]?.id ?? null;
        }
        const menuBlock = menusBuilt.find((m) => m.id === initialMenuId) ?? menusBuilt[0] ?? null;
        const categoriesInMenu = menuBlock?.categories ?? [];
        const initialCategoryId =
          urlCategoryEntity && categoriesInMenu.some((c) => c._id === urlCategoryEntity._id)
            ? urlCategoryEntity._id
            : categoriesInMenu.sort((a, b) => a.order - b.order)[0]?._id ?? null;
        setMenuOrder((data.place.menus ?? []).map((menu) => menu.id));
        setActiveMenuId(initialMenuId);
        setActiveCategoryId(initialCategoryId);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "";
        setError(message || t("errors.fetchMenu"));
      } finally {
        setPageLoading(false);
      }
    }
    void loadMenu();
  }, [firebaseUser, slug, t]);

  /** Menu content language from `?lang=` — no refetch; keeps state in sync on back/forward or shared links. */
  useEffect(() => {
    if (!langFromQuery || !place) return;
    if (!enabledLanguages.includes(langFromQuery)) return;
    setContentLanguage(langFromQuery);
  }, [langFromQuery, place, enabledLanguages]);

  /** Keep selection in sync with URL when `menu` / `category` change without refetching (e.g. browser back/forward). */
  useEffect(() => {
    if (!place) return;

    const sorted = sortCategories(place.categories);
    const menusBuilt = buildMenus(sorted, place.menus ?? []);

    if (categoryFromQuery) {
      const cat = sorted.find((c) => c._id === categoryFromQuery);
      if (cat) {
        setActiveMenuId(cat.menuId || "main");
        setActiveCategoryId(categoryFromQuery);
      }
      return;
    }

    if (menuFromQuery && menusBuilt.some((m) => m.id === menuFromQuery)) {
      setActiveMenuId(menuFromQuery);
      const cats = menusBuilt.find((m) => m.id === menuFromQuery)?.categories ?? [];
      const firstId = [...cats].sort((a, b) => a.order - b.order)[0]?._id ?? null;
      setActiveCategoryId(firstId);
    }
  }, [place, categoryFromQuery, menuFromQuery]);

  /** Scroll to top when opening the items list (category → items); keeps category grid scroll position when going back. */
  useEffect(() => {
    if (showItemsPanel && !wasItemsPanelRef.current) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    wasItemsPanelRef.current = showItemsPanel;
  }, [showItemsPanel]);

  useEffect(() => {
    async function verifyEditAccess() {
      if (!firebaseUser || !slug) return;
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`/api/places/${slug}/team`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setCanEdit(true);
        }
      } catch {
        // keep existing permission state from menu endpoint
      }
    }
    void verifyEditAccess();
  }, [firebaseUser, slug]);

  useEffect(() => {
    if (!slug || !queryMenuId || !resolvedActiveMenuId || queryMenuId === resolvedActiveMenuId) return;
    router.replace(`/${locale}/p/${slug}?menu=${resolvedActiveMenuId}&lang=${contentLanguage}`, { scroll: false });
  }, [contentLanguage, locale, queryMenuId, resolvedActiveMenuId, router, slug]);

  async function authorizedFetch(input: string, init: RequestInit = {}) {
    if (!firebaseUser || !isAdminMode) throw new Error("Unauthorized");
    const token = await firebaseUser.getIdToken();
    const res = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || `Request failed: ${res.status}`);
    }
    return res;
  }

  async function addCategory(payload: CategoryFormState) {
    if (!place || !isAdminMode) return;
    const targetMenu = activeMenu;
    if (!targetMenu) return;
    const previous = place;
    const resolvedMenuName = pickLocalized(targetMenu.nameI18n, targetMenu.name);
    const optimistic: MenuCategory = {
      _id: `temp-category-${tempCategoryIdRef.current++}`,
      menuId: targetMenu.id,
      menuName: resolvedMenuName,
      name: payload.name,
      nameI18n: payload.nameI18n,
      description: payload.description,
      imageUrl: payload.imageUrl || getDefaultCategoryImage(payload.name),
      isVisible: payload.isVisible,
      order: place.categories.length,
      items: [],
    };
    setPlace({ ...place, categories: [...place.categories, optimistic] });
    try {
      const res = await authorizedFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, menuId: targetMenu.id, menuName: resolvedMenuName, ...payload }),
      });
      const data = (await res.json()) as { category: MenuCategory };
      setPlace((current) =>
        current
          ? {
              ...current,
              categories: current.categories.map((category) => (category._id === optimistic._id ? data.category : category)),
            }
          : current,
      );
      setActiveCategoryId(data.category._id);
      setActiveMenuId(targetMenu.id);
    } catch {
      setPlace(previous);
      setError(t("errors.categoryCreate"));
    }
  }

  async function createMenu(
    name: string,
    nameI18n: MenuLocalizedText,
    insertSide: "left" | "right",
    isVisible: boolean,
  ) {
    if (!place || !isAdminMode) return;
    try {
      const res = await authorizedFetch("/api/menus", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, name, nameI18n, isVisible, insertSide }),
      });
      const data = (await res.json()) as {
        menu: { id: string; name: string; nameI18n?: MenuLocalizedText; order: number; isVisible: boolean };
      };
      setPlace((current) =>
        current
          ? {
              ...current,
              menus: [...(current.menus ?? []), { ...data.menu, categories: [] }],
            }
          : current,
      );
      setMenuOrder((current) => {
        const base = current.length ? [...current] : orderedMenus.map((menu) => menu.id);
        return insertSide === "left" ? [data.menu.id, ...base] : [...base, data.menu.id];
      });
      if (!activeMenuId) {
        setActiveMenuId(data.menu.id);
      }
    } catch (menuError) {
      setError(menuError instanceof Error ? menuError.message : "Failed to create menu");
    }
  }

  async function updateCategory(categoryId: string, payload: CategoryFormState) {
    if (!place || !isAdminMode) return;
    const previous = place;
    setPlace({
      ...place,
      categories: place.categories.map((category) => (category._id === categoryId ? { ...category, ...payload } : category)),
    });
    try {
      await authorizedFetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          slug: place.slug,
          menuId: activeCategory?.menuId ?? activeMenu?.id ?? "main",
          menuName: activeCategory?.menuName ?? (activeMenu ? pickLocalized(activeMenu.nameI18n, activeMenu.name) : "Menu"),
          ...payload,
        }),
      });
    } catch {
      setPlace(previous);
      setError(t("errors.categoryUpdate"));
    }
  }

  async function deleteCategory(categoryId: string) {
    if (!place || !isAdminMode) return;
    const previous = place;
    setPlace({
      ...place,
      categories: place.categories.filter((category) => category._id !== categoryId),
    });
    try {
      await authorizedFetch(`/api/categories/${categoryId}?slug=${place.slug}`, { method: "DELETE" });
      if (categoryFromQuery === categoryId) {
        router.replace(publicMenuHref({ menu: resolvedActiveMenuId, lang: contentLanguage }), { scroll: false });
      }
      if (activeCategoryId === categoryId) {
        const nextCategoryId = previous.categories.find((category) => category._id !== categoryId)?._id ?? null;
        setActiveCategoryId(nextCategoryId);
      }
    } catch {
      setPlace(previous);
      setError(t("errors.categoryDelete"));
    }
  }

  function openCreateCategoryModal() {
    setCategoryToEdit(null);
    setCategoryForm({
      name: "",
      nameI18n: { uz: "", ru: "", en: "" },
      description: "",
      imageUrl: "",
      isVisible: true,
    });
    setCategoryEditorOpen(true);
  }

  function openCreateMenuModal(position: "left" | "right") {
    setMenuForm({
      name: "",
      nameI18n: { uz: "", ru: "", en: "" },
      isVisible: true,
      insertSide: position,
    });
    setMenuEditorOpen(true);
  }

  function submitCreateMenuModal() {
    const menuI18n = {
      uz: menuForm.nameI18n.uz.trim(),
      ru: menuForm.nameI18n.ru.trim(),
      en: menuForm.nameI18n.en.trim(),
    };
    menuI18n[primaryLanguage] = menuForm.name.trim();
    const menuName = menuI18n[primaryLanguage] || menuI18n.uz || menuI18n.ru || menuI18n.en;
    if (!menuName) return;
    void createMenu(menuName, menuI18n, menuForm.insertSide, menuForm.isVisible);
    setMenuEditorOpen(false);
  }

  function openEditCategoryModal(category: MenuCategory) {
    const categoryNameI18n = category.nameI18n ?? { uz: category.name, ru: category.name, en: category.name };
    setCategoryToEdit(category);
    setCategoryForm({
      name: categoryNameI18n[primaryLanguage] || category.name,
      nameI18n: categoryNameI18n,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      isVisible: category.isVisible ?? true,
    });
    setCategoryEditorOpen(true);
  }

  async function submitCategoryModal() {
    const payload = {
      name: categoryForm.name.trim(),
      nameI18n: {
        uz: categoryForm.nameI18n.uz.trim(),
        ru: categoryForm.nameI18n.ru.trim(),
        en: categoryForm.nameI18n.en.trim(),
      },
      description: categoryForm.description.trim(),
      imageUrl: categoryForm.imageUrl.trim(),
      isVisible: categoryForm.isVisible,
    };
    payload.nameI18n[primaryLanguage] = payload.name;
    payload.name = payload.nameI18n[primaryLanguage] || payload.nameI18n.uz || payload.nameI18n.ru || payload.nameI18n.en;
    if (!payload.name) return;
    if (categoryToEdit) {
      await updateCategory(categoryToEdit._id, payload);
    } else {
      await addCategory(payload);
    }
    setCategoryEditorOpen(false);
  }

  async function reorderCategories(categoryIds: string[]) {
    if (!place || !isAdminMode) return;
    const previous = place;
    const rank = new Map(categoryIds.map((id, index) => [id, index]));
    setPlace({
      ...place,
      categories: place.categories
        .map((category) => ({ ...category, order: rank.get(category._id) ?? category.order }))
        .sort((a, b) => a.order - b.order),
    });
    try {
      await authorizedFetch("/api/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, menuId: activeMenu?.id ?? "main", categoryIds }),
      });
    } catch {
      setPlace(previous);
      setError(t("errors.categoryReorder"));
    }
  }

  async function moveCategory(categoryId: string, direction: "left" | "right") {
    if (!isAdminMode) return;
    const ids = activeMenuCategories.map((category) => category._id);
    const currentIndex = ids.indexOf(categoryId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    await reorderCategories(next);
  }

  async function saveItem(payload: {
    name: string;
    nameI18n: MenuLocalizedText;
    description: string;
    descriptionI18n: MenuLocalizedText;
    price: number;
    imageUrl: string;
    badge: "popular" | "new" | null;
  }) {
    if (!place || !activeCategory || !isAdminMode) return;
    if (activeCategory._id.startsWith("temp-")) {
      setError(t("errors.categoryPending"));
      return;
    }
    const previous = place;

    if (editingItem) {
      setPlace({
        ...place,
        categories: place.categories.map((category) =>
          category._id === activeCategory._id
            ? {
                ...category,
                items: category.items.map((item) => (item._id === editingItem._id ? { ...item, ...payload } : item)),
              }
            : category,
        ),
      });
      try {
        await authorizedFetch(`/api/items/${editingItem._id}`, {
          method: "PATCH",
          body: JSON.stringify({ slug: place.slug, ...payload }),
        });
      } catch (itemError) {
        setPlace(previous);
        setError(itemError instanceof Error ? itemError.message : t("errors.itemUpdate"));
      }
      return;
    }

    const optimisticItem: MenuItem = {
      _id: `temp-item-${tempItemIdRef.current++}`,
      order: activeCategory.items.length,
      ...payload,
    };
    setPlace({
      ...place,
      categories: place.categories.map((category) =>
        category._id === activeCategory._id ? { ...category, items: [...category.items, optimisticItem] } : category,
      ),
    });

    try {
      const res = await authorizedFetch("/api/items", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, categoryId: activeCategory._id, ...payload }),
      });
      const data = (await res.json()) as { item: MenuItem };
      setPlace((current) =>
        current
          ? {
              ...current,
              categories: current.categories.map((category) =>
                category._id === activeCategory._id
                  ? { ...category, items: category.items.map((item) => (item._id === optimisticItem._id ? data.item : item)) }
                  : category,
              ),
            }
          : current,
      );
    } catch (itemError) {
      setPlace(previous);
      setError(itemError instanceof Error ? itemError.message : t("errors.itemCreate"));
    }
  }

  async function reorderItems(itemIds: string[]) {
    if (!place || !activeCategory || !isAdminMode) return;
    const previous = place;
    const rank = new Map(itemIds.map((id, index) => [id, index]));
    setPlace({
      ...place,
      categories: place.categories.map((category) =>
        category._id === activeCategory._id
          ? {
              ...category,
              items: category.items.map((item) => ({ ...item, order: rank.get(item._id) ?? item.order })).sort((a, b) => a.order - b.order),
            }
          : category,
      ),
    });
    try {
      await authorizedFetch("/api/items/reorder", {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, categoryId: activeCategory._id, itemIds }),
      });
    } catch (itemError) {
      setPlace(previous);
      setError(itemError instanceof Error ? itemError.message : t("errors.itemReorder"));
    }
  }

  async function moveItem(itemId: string, direction: "up" | "down") {
    if (!activeCategory || !isAdminMode) return;
    const ids = activeCategory.items.map((item) => item._id);
    const currentIndex = ids.indexOf(itemId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    await reorderItems(next);
  }

  async function deleteItem(itemId: string) {
    if (!place || !activeCategory || !isAdminMode) return;
    const previous = place;
    setPlace({
      ...place,
      categories: place.categories.map((category) =>
        category._id === activeCategory._id ? { ...category, items: category.items.filter((item) => item._id !== itemId) } : category,
      ),
    });
    try {
      await authorizedFetch(`/api/items/${itemId}?slug=${place.slug}`, { method: "DELETE" });
    } catch (itemError) {
      setPlace(previous);
      setError(itemError instanceof Error ? itemError.message : t("errors.itemDelete"));
    }
  }

  function openEstablishmentEditor() {
    if (!place) return;
    const countryI18n = place.countryI18n ?? { uz: place.country ?? "", ru: place.country ?? "", en: place.country ?? "" };
    const cityI18n = place.cityI18n ?? { uz: place.city ?? "", ru: place.city ?? "", en: place.city ?? "" };
    const additionalInfoI18n =
      place.additionalInfoI18n ?? {
        uz: place.additionalInfo ?? "",
        ru: place.additionalInfo ?? "",
        en: place.additionalInfo ?? "",
      };
    setEstablishmentForm({
      name: place.name,
      colorTheme: place.colorTheme ?? "light",
      color: place.color ?? "#f7906c",
      currency: place.currency,
      currencySymbol: place.currencySymbol ?? "",
      logoUrl: place.logoUrl ?? "",
      backgroundImage: place.backgroundImage ?? "",
      wifiPassword: place.wifiPassword ?? "",
      phone: place.phone ?? "",
      guestsCanOrder: Boolean(place.guestsCanOrder),
      hideMenuButtons: Boolean(place.hideMenuButtons),
      country: countryI18n[primaryLanguage] || place.country || "",
      countryI18n,
      city: cityI18n[primaryLanguage] || place.city || "",
      cityI18n,
      address: place.address ?? "",
      googleMapsLink: place.googleMapsLink ?? "",
      yandexMapsLink: place.yandexMapsLink ?? "",
      instagram: place.instagram ?? "",
      facebook: place.facebook ?? "",
      tiktok: place.tiktok ?? "",
      twitter: place.twitter ?? "",
      tripAdvisor: place.tripAdvisor ?? "",
      googleReviews: place.googleReviews ?? "",
      additionalInfo: additionalInfoI18n[primaryLanguage] || place.additionalInfo || "",
      additionalInfoI18n,
    });
    setEstablishmentEditorOpen(true);
  }

  async function saveEstablishment() {
    if (!place || !isAdminMode) return;
    const previous = place;
    const normalizedCountryI18n = {
      uz: establishmentForm.countryI18n.uz.trim(),
      ru: establishmentForm.countryI18n.ru.trim(),
      en: establishmentForm.countryI18n.en.trim(),
    };
    const normalizedCityI18n = {
      uz: establishmentForm.cityI18n.uz.trim(),
      ru: establishmentForm.cityI18n.ru.trim(),
      en: establishmentForm.cityI18n.en.trim(),
    };
    const normalizedAdditionalInfoI18n = {
      uz: establishmentForm.additionalInfoI18n.uz.trim(),
      ru: establishmentForm.additionalInfoI18n.ru.trim(),
      en: establishmentForm.additionalInfoI18n.en.trim(),
    };
    normalizedCountryI18n[primaryLanguage] = establishmentForm.country.trim();
    normalizedCityI18n[primaryLanguage] = establishmentForm.city.trim();
    normalizedAdditionalInfoI18n[primaryLanguage] = establishmentForm.additionalInfo.trim();
    const normalizedForm = {
      ...establishmentForm,
      countryI18n: normalizedCountryI18n,
      cityI18n: normalizedCityI18n,
      additionalInfoI18n: normalizedAdditionalInfoI18n,
      country:
        (normalizedCountryI18n[primaryLanguage] || establishmentForm.country || normalizedCountryI18n.uz || normalizedCountryI18n.ru || normalizedCountryI18n.en).trim(),
      city:
        (normalizedCityI18n[primaryLanguage] || establishmentForm.city || normalizedCityI18n.uz || normalizedCityI18n.ru || normalizedCityI18n.en).trim(),
      additionalInfo:
        (normalizedAdditionalInfoI18n[primaryLanguage] ||
          establishmentForm.additionalInfo ||
          normalizedAdditionalInfoI18n.uz ||
          normalizedAdditionalInfoI18n.ru ||
          normalizedAdditionalInfoI18n.en).trim(),
    };
    setPlace({ ...place, ...normalizedForm });
    try {
      const res = await authorizedFetch(`/api/places/${place.slug}`, {
        method: "PATCH",
        body: JSON.stringify(normalizedForm),
      });
      const data = (await res.json()) as { place: Partial<MenuPlace> };
      setPlace((current) => (current ? { ...current, ...data.place } : current));
      setEstablishmentEditorOpen(false);
    } catch {
      setPlace(previous);
      setError("Failed to update establishment");
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    setImageUploadError(null);
    try {
      const url = await uploadImageToFirebase(file, { folder: "establishment-logo", maxWidthOrHeight: 1200 });
      setEstablishmentForm((current) => ({ ...current, logoUrl: url }));
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBackgroundUpload(file: File | null) {
    if (!file) return;
    setUploadingBackground(true);
    setImageUploadError(null);
    try {
      const url = await uploadImageToFirebase(file, { folder: "establishment-bg", maxWidthOrHeight: 2000 });
      setEstablishmentForm((current) => ({ ...current, backgroundImage: url }));
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Background upload failed");
    } finally {
      setUploadingBackground(false);
    }
  }

  async function handleCategoryImageUpload(file: File | null) {
    if (!file) return;
    setUploadingCategoryImage(true);
    setImageUploadError(null);
    try {
      const url = await uploadImageToFirebase(file, { folder: "category-bg", maxWidthOrHeight: 1800 });
      setCategoryForm((current) => ({ ...current, imageUrl: url }));
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Category image upload failed");
    } finally {
      setUploadingCategoryImage(false);
    }
  }

  async function handleSaveEditedImage(blob: Blob) {
    if (!editorState.target) return;
    const editedFile = new File([blob], `edited-${editorState.target}-${Date.now()}.jpg`, { type: "image/jpeg" });
    if (editorState.target === "logo") {
      await handleLogoUpload(editedFile);
      return;
    }
    if (editorState.target === "background") {
      await handleBackgroundUpload(editedFile);
      return;
    }
    await handleCategoryImageUpload(editedFile);
  }

  function publicMenuHref(parts: { menu?: string | null; category?: string | null; lang?: LocaleCode }) {
    const q = new URLSearchParams();
    if (parts.menu) q.set("menu", parts.menu);
    if (parts.category) q.set("category", parts.category);
    q.set("lang", parts.lang ?? contentLanguage);
    return `/${locale}/p/${slug}?${q.toString()}`;
  }

  function handleCategorySelect(categoryId: string) {
    setActiveCategoryId(categoryId);
    setSearchQuery("");
    router.replace(
      publicMenuHref({ menu: resolvedActiveMenuId, category: categoryId, lang: contentLanguage }),
      { scroll: false },
    );
  }

  function handleBackToCategories() {
    setSearchQuery("");
    router.replace(publicMenuHref({ menu: resolvedActiveMenuId, lang: contentLanguage }), { scroll: false });
  }

  function handleMenuSelect(menuId: string) {
    setActiveMenuId(menuId);
    const nextCategoryId = orderedMenus.find((menu) => menu.id === menuId)?.categories[0]?._id ?? null;
    setActiveCategoryId(nextCategoryId);
    setSearchQuery("");
    router.replace(publicMenuHref({ menu: menuId, lang: contentLanguage }), { scroll: false });
  }

  function moveMenu(menuId: string, direction: "left" | "right") {
    if (!place || !isAdminMode) return;
    const source = menuOrder.length ? [...menuOrder] : orderedMenus.map((menu) => menu.id);
    const index = source.indexOf(menuId);
    if (index < 0) return;
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= source.length) return;
    const next = [...source];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setMenuOrder(next);
    void authorizedFetch("/api/menus/reorder", {
      method: "PATCH",
      body: JSON.stringify({ slug: place.slug, menuIds: next }),
    }).catch(() => {
      setMenuOrder(source);
      setError("Failed to reorder menu");
    });
  }

  function openEditMenuModal(menuId: string) {
    if (!place || !isAdminMode) return;
    const menu = orderedMenus.find((entry) => entry.id === menuId);
    if (!menu) return;
    setMenuRenameId(menuId);
    const menuNameI18n = menu.nameI18n ?? { uz: menu.name, ru: menu.name, en: menu.name };
    setMenuRenameName(menuNameI18n[primaryLanguage] || menu.name);
    setMenuRenameNameI18n(menuNameI18n);
    setMenuRenameOpen(true);
  }

  async function submitMenuRenameModal() {
    if (!place || !isAdminMode || !menuRenameId) return;
    const menu = orderedMenus.find((entry) => entry.id === menuRenameId);
    if (!menu) return;
    const nameI18n = {
      uz: menuRenameNameI18n.uz.trim(),
      ru: menuRenameNameI18n.ru.trim(),
      en: menuRenameNameI18n.en.trim(),
    };
    nameI18n[primaryLanguage] = menuRenameName.trim();
    const nextName = nameI18n[primaryLanguage] || nameI18n.uz || nameI18n.ru || nameI18n.en;
    if (!nextName) return;
    try {
      await authorizedFetch(`/api/menus/${menuRenameId}`, {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, name: nextName, nameI18n, isVisible: true }),
      });
      setPlace((current) =>
        current
          ? {
              ...current,
              menus: (current.menus ?? []).map((entry) => (entry.id === menuRenameId ? { ...entry, name: nextName, nameI18n } : entry)),
              categories: current.categories.map((category) =>
                category.menuId === menuRenameId ? { ...category, menuName: nextName } : category,
              ),
            }
          : current,
      );
      setMenuRenameOpen(false);
      setMenuRenameId(null);
      setMenuRenameName("");
      setMenuRenameNameI18n({ uz: "", ru: "", en: "" });
    } catch {
      setError("Failed to rename menu");
    }
  }

  function openDeleteMenuModal(menuId: string) {
    if (!place || !isAdminMode) return;
    const menu = orderedMenus.find((entry) => entry.id === menuId);
    if (!menu) return;
    setMenuDeleteTarget({ id: menu.id, name: pickLocalized(menu.nameI18n, menu.name) });
  }

  async function confirmDeleteMenu() {
    if (!place || !isAdminMode || !menuDeleteTarget) return;
    const menuId = menuDeleteTarget.id;
    try {
      await authorizedFetch(`/api/menus/${menuId}?slug=${place.slug}`, { method: "DELETE" });
      setPlace((current) =>
        current
          ? {
              ...current,
              menus: (current.menus ?? []).filter((entry) => entry.id !== menuId),
              categories: current.categories.filter((category) => category.menuId !== menuId),
            }
          : current,
      );
      const nextOrder = (menuOrder.length ? menuOrder : orderedMenus.map((entry) => entry.id)).filter((id) => id !== menuId);
      setMenuOrder(nextOrder);
      if (activeMenuId === menuId) {
        const fallback = orderedMenus.find((entry) => entry.id !== menuId)?.id ?? null;
        setActiveMenuId(fallback);
        setActiveCategoryId(orderedMenus.find((entry) => entry.id === fallback)?.categories[0]?._id ?? null);
      }
      setMenuDeleteTarget(null);
    } catch {
      setError("Failed to delete menu");
    }
  }

  return (
    <div className={isLightTheme ? "min-h-screen bg-neutral-100 text-neutral-900" : "min-h-screen bg-[#0f0f0f] text-neutral-100"}>
      {error ? (
        <div className="mx-auto mb-2 max-w-[620px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {pageLoading ? (
        <div className={`mx-auto mt-2 max-w-[620px] rounded-[30px] p-6 shadow-sm ${isLightTheme ? "border border-neutral-200 bg-white" : "border border-white/10 bg-[#121212]"}`}>
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-800" />
          <div className="mt-5 h-8 w-48 animate-pulse rounded-lg bg-neutral-800" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-neutral-800" />
          <div className="mt-6 h-12 animate-pulse rounded-full bg-neutral-800" />
          <div className="mt-4 h-28 animate-pulse rounded-2xl bg-neutral-800" />
        </div>
      ) : (
        <>
          {(showItemsPanel || (isAdminMode && !showItemsPanel)) && (
            <div className="pointer-events-none fixed left-0 right-0 top-[max(1.25rem,calc(env(safe-area-inset-top,0px)+1rem))] z-30 flex justify-center pl-[max(1rem,env(safe-area-inset-left,0px))] pr-4 sm:pl-12 sm:pr-6">
              <div className="pointer-events-auto flex w-full max-w-[620px] justify-start gap-2">
                {showItemsPanel ? (
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-neutral-900 shadow-md ring-1 ring-black/5"
                    aria-label="Back to categories"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-base" />
                  </button>
                ) : null}
                {isAdminMode && !showItemsPanel ? (
                  <button
                    type="button"
                    onClick={() => router.push("/admin/places")}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-neutral-900 shadow-md ring-1 ring-black/5"
                    aria-label="Close menu editor"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-base" />
                  </button>
                ) : null}
              </div>
            </div>
          )}
          <div className={`mx-auto mt-2 max-w-[620px] overflow-hidden rounded-[30px] shadow-sm ${isLightTheme ? "border border-neutral-200 bg-white" : "border border-white/10 bg-[#121212]"}`}>
          <div
            className="relative h-44 overflow-hidden"
            style={
              place?.backgroundImage
                ? {
                    backgroundImage: `url(${place.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!place?.backgroundImage ? (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#b34b5f,transparent_45%),radial-gradient(circle_at_80%_30%,#e08a9b,transparent_50%),radial-gradient(circle_at_50%_80%,#945666,transparent_40%),linear-gradient(135deg,#6f3243,#bd6778)]" />
            ) : (
              <div className="absolute inset-0 bg-black/20" />
            )}
            {place?.logoUrl ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={place.logoUrl} alt={place.name} className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}
            {enabledLanguages.length > 1 ? (
              <div className="absolute bottom-3 right-3 z-30">
                <select
                  value={contentLanguage}
                  onChange={(event) => {
                    const nextLang = event.target.value as LocaleCode;
                    setContentLanguage(nextLang);
                    router.replace(
                      publicMenuHref({
                        menu: resolvedActiveMenuId,
                        category: categoryFromQuery,
                        lang: nextLang,
                      }),
                      { scroll: false },
                    );
                  }}
                  className="rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold text-neutral-900 shadow outline-none"
                >
                  {enabledLanguages.map((langCode) => (
                    <option key={langCode} value={langCode}>
                      {languageLabel[langCode]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div
            className={`mx-1 -mt-5 rounded-[26px] px-2 pt-8 sm:mx-2 sm:px-3 sm:pt-9 ${
              isLightTheme ? "bg-white" : "bg-[#121212]"
            }`}
          >
            <div className="mt-1 flex items-center gap-2">
              <h1 className={`text-4xl font-semibold tracking-tight ${isLightTheme ? "text-neutral-900" : "text-white"}`}>{place?.name ?? "ABBOS"}</h1>
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={openEstablishmentEditor}
                  className="text-neutral-500 transition hover:text-neutral-200"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              ) : null}
            </div>
            {locationLine || phone || wifiPassword ? (
              <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${isLightTheme ? "text-neutral-600" : "text-neutral-400"}`}>
                {locationLine ? (
                  <p className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                    <span>{locationLine}</span>
                  </p>
                ) : null}
                {phone ? (
                  <p className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faPhone} className="text-xs" />
                    <span>{phone}</span>
                  </p>
                ) : null}
                {wifiPassword ? (
                  <p className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faWifi} className="text-xs" />
                    <span>{wifiPassword}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
            {mapLinks.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {mapLinks.map((entry) => (
                  <a
                    key={entry.label}
                    href={toExternalUrl(entry.value)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                      isLightTheme
                        ? "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                        : "border-white/15 text-neutral-300 hover:bg-white/10"
                    }`}
                  >
                    <FontAwesomeIcon icon={entry.icon} />
                    <span>{entry.label}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {socialLinks.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {socialLinks.map((entry) => (
                  <a
                    key={entry.label}
                    href={toExternalUrl(entry.value)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      isLightTheme
                        ? "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                        : "border-white/15 text-neutral-300 hover:bg-white/10"
                    }`}
                    aria-label={entry.label}
                    title={entry.label}
                  >
                    <FontAwesomeIcon icon={entry.icon} />
                  </a>
                ))}
              </div>
            ) : null}
            {pickLocalized(place?.additionalInfoI18n, place?.additionalInfo ?? "").trim() ? (
              <p className={`mt-2 text-sm ${isLightTheme ? "text-neutral-700" : "text-neutral-300"}`}>
                {pickLocalized(place?.additionalInfoI18n, place?.additionalInfo ?? "")}
              </p>
            ) : null}

            <div className="mt-2">
              <MenuTabs
                menus={orderedMenus.map((menu) => ({ id: menu.id, name: pickLocalized(menu.nameI18n, menu.name) }))}
                activeMenuId={resolvedActiveMenuId}
                accentColor={accentColor}
                isLight={isLightTheme}
                isAdmin={isAdminMode}
                onMoveLeft={(menuId) => moveMenu(menuId, "left")}
                onMoveRight={(menuId) => moveMenu(menuId, "right")}
                onEdit={openEditMenuModal}
                onDelete={openDeleteMenuModal}
                onAddLeft={() => openCreateMenuModal("left")}
                onAddRight={() => openCreateMenuModal("right")}
                onSelect={handleMenuSelect}
              />
            </div>

            <div className={`mt-3 flex items-center rounded-full px-4 py-2.5 ${isLightTheme ? "bg-neutral-100" : "bg-white/5"}`}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className={`w-full bg-transparent text-base outline-none ${isLightTheme ? "text-neutral-700" : "text-neutral-200"}`}
              />
              <span className={`grid h-8 w-8 place-items-center rounded-full text-lg ${isLightTheme ? "border border-neutral-300 bg-white text-neutral-500" : "border border-white/10 bg-black/40 text-neutral-400"}`}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
              </span>
            </div>

            {isAdminMode ? (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-300">ADD CATEGORY</p>
                <button
                  type="button"
                  onClick={openCreateCategoryModal}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full py-1.5 text-2xl text-white transition brightness-95 hover:brightness-105"
                  style={{ backgroundColor: accentColor }}
                >
                  +
                </button>
              </div>
            ) : null}

            <div className={`mt-4 space-y-5 ${isAdminMode ? "pb-20" : "pb-4"}`}>
              {showItemsPanel ? (
                <div className="space-y-4">
                  <h3 className={`text-xl font-semibold ${isLightTheme ? "text-neutral-900" : "text-neutral-100"}`}>
                    {pickLocalized(activeCategory?.nameI18n, activeCategory?.name ?? "")}
                  </h3>
                  {filteredMenuItems.length === 0 ? (
                    <div className="space-y-3">
                      <div
                        className={`w-full rounded-2xl border border-dashed p-8 text-center text-sm ${
                          isLightTheme ? "border-neutral-300 text-neutral-500" : "border-neutral-600 text-neutral-400"
                        }`}
                      >
                        {t("items.empty")}
                      </div>
                      {isAdminMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(null);
                            setItemModalOpen(true);
                          }}
                          className="inline-flex w-full items-center justify-center rounded-full py-1 text-2xl text-white transition brightness-95 hover:brightness-105"
                          style={{ backgroundColor: accentColor }}
                        >
                          +
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isAdminMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(null);
                            setItemModalOpen(true);
                          }}
                          className="inline-flex w-full items-center justify-center rounded-full py-1 text-2xl text-white transition brightness-95 hover:brightness-105"
                          style={{ backgroundColor: accentColor }}
                        >
                          +
                        </button>
                      ) : null}
                      <ItemList
                        currencySymbol={place?.currencySymbol}
                        accentColor={accentColor}
                        isLight={isLightTheme}
                        isAdmin={isAdminMode}
                        onMoveUp={(id) => void moveItem(id, "up")}
                        onMoveDown={(id) => void moveItem(id, "down")}
                        onEdit={(id) => {
                          const item = activeCategory?.items.find((entry) => entry._id === id) ?? null;
                          if (!item) return;
                          setEditingItem(item);
                          setItemModalOpen(true);
                        }}
                        onDelete={(id) => void deleteItem(id)}
                        onAddUnder={() => {
                          setEditingItem(null);
                          setItemModalOpen(true);
                        }}
                        items={filteredMenuItems.map((item) => ({
                          id: item._id,
                          name: pickLocalized(item.nameI18n, item.name),
                          description: pickLocalized(item.descriptionI18n, item.description),
                          imageUrl: item.imageUrl,
                          price: item.price,
                          badge: item.badge,
                        }))}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <CategoryList
                    categories={filteredActiveMenuCategories.map((category) => ({
                      id: category._id,
                      name: pickLocalized(category.nameI18n, category.name),
                      imageUrl: category.imageUrl,
                    }))}
                    activeCategoryId={categoryFromQuery}
                    accentColor={accentColor}
                    isAdmin={isAdminMode}
                    onMoveUp={(categoryId) => void moveCategory(categoryId, "left")}
                    onMoveDown={(categoryId) => void moveCategory(categoryId, "right")}
                    onEdit={(categoryId) => {
                      const category = activeMenuCategories.find((entry) => entry._id === categoryId);
                      if (category) openEditCategoryModal(category);
                    }}
                    onDelete={(categoryId) => {
                      const category = activeMenuCategories.find((entry) => entry._id === categoryId);
                      if (category) setCategoryToRemove(category);
                    }}
                    onAddUnder={() => openCreateCategoryModal()}
                    onSelect={handleCategorySelect}
                  />
                  {filteredActiveMenuCategories.length === 0 ? (
                    <div
                      className={`w-full rounded-2xl border border-dashed p-6 text-center text-sm ${
                        isLightTheme ? "border-neutral-300 text-neutral-500" : "border-white/20 text-neutral-400"
                      }`}
                    >
                      No categories found
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {isAdminMode ? <BottomNav locale={locale} slug={slug} active="menu" accentColor={accentColor} /> : null}
        </div>
        </>
      )}

      {isAdminMode && menuEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setMenuEditorOpen(false)}>
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Create menu</h3>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Menu name *</span>
                <input
                  value={menuForm.name}
                  onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {secondaryLanguages.map((langCode) => (
                  <input
                    key={`menu-name-${langCode}`}
                    value={menuForm.nameI18n[langCode]}
                    onChange={(event) =>
                      setMenuForm((current) => ({
                        ...current,
                        nameI18n: { ...current.nameI18n, [langCode]: event.target.value },
                      }))
                    }
                    placeholder={`Menu name (${langCode.toUpperCase()})`}
                    className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                  />
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={menuForm.isVisible}
                  onChange={(event) => setMenuForm((current) => ({ ...current, isVisible: event.target.checked }))}
                />
                Menu is visible
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMenuEditorOpen(false)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCreateMenuModal}
                className="rounded-xl bg-orange-400 px-5 py-2 font-semibold text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode && menuRenameOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setMenuRenameOpen(false)}>
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Edit menu</h3>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Menu name *</span>
              <input
                value={menuRenameName}
                onChange={(event) => setMenuRenameName(event.target.value)}
                className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {secondaryLanguages.map((langCode) => (
                <input
                  key={`menu-rename-${langCode}`}
                  value={menuRenameNameI18n[langCode]}
                  onChange={(event) =>
                    setMenuRenameNameI18n((current) => ({ ...current, [langCode]: event.target.value }))
                  }
                  placeholder={`Menu name (${langCode.toUpperCase()})`}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMenuRenameOpen(false)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitMenuRenameModal()}
                className="rounded-xl px-5 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode && menuDeleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setMenuDeleteTarget(null)}>
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Delete menu</h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              Delete menu &quot;{menuDeleteTarget.name}&quot; and all categories inside it?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMenuDeleteTarget(null)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteMenu()}
                className="rounded-xl bg-red-500 px-5 py-2 font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode && categoryEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setCategoryEditorOpen(false)}>
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {categoryToEdit ? "Edit category" : "Create category"}
            </h3>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">
                  Category name*
                </span>
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {secondaryLanguages.map((langCode) => (
                  <input
                    key={`category-name-${langCode}`}
                    value={categoryForm.nameI18n[langCode]}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        nameI18n: { ...current.nameI18n, [langCode]: event.target.value },
                      }))
                    }
                    placeholder={`Name (${langCode.toUpperCase()})`}
                    className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                  />
                ))}
              </div>
              <label className="block">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Description</span>
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  className="h-28 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={categoryForm.isVisible}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, isVisible: event.target.checked }))}
                />
                Category is visible
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Category background image</span>
                <div className="space-y-2">
                  <label className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-base text-neutral-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                    {categoryForm.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={categoryForm.imageUrl} alt={categoryForm.name || "Category preview"} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute right-2 top-2 z-10 flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEditorState({ open: true, target: "category", imageUrl: categoryForm.imageUrl });
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setCategoryForm((current) => ({ ...current, imageUrl: "" }));
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>{uploadingCategoryImage ? "Uploading..." : "Upload category image"}</span>
                    )}
                    <input
                      ref={categoryImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleCategoryImageUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <input
                    value={categoryForm.imageUrl}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    placeholder="Or paste image URL"
                    className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs text-neutral-500 outline-none transition focus:border-orange-400 dark:border-neutral-800 dark:text-neutral-400"
                  />
                </div>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCategoryEditorOpen(false)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitCategoryModal()}
                className="rounded-xl bg-orange-400 px-5 py-2 font-semibold text-white"
              >
                {categoryToEdit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode && categoryToRemove ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setCategoryToRemove(null)}>
          <div className="w-full max-w-[340px] rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Remove {categoryToRemove.name} section?</h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">All menu items in this section will be deleted</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCategoryToRemove(null)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteCategory(categoryToRemove._id);
                  setCategoryToRemove(null);
                }}
                className="rounded-xl bg-orange-400 px-5 py-2 font-semibold text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode && establishmentEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setEstablishmentEditorOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Edit establishment info</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Establishment name *</span>
                <input
                  value={establishmentForm.name}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, name: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Color theme *</span>
                <select
                  value={establishmentForm.colorTheme}
                  onChange={(e) =>
                    setEstablishmentForm((c) => ({ ...c, colorTheme: e.target.value === "dark" ? "dark" : "light" }))
                  }
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={establishmentForm.color || "#f7906c"}
                    onChange={(e) => setEstablishmentForm((c) => ({ ...c, color: e.target.value }))}
                    className="h-11 w-14 cursor-pointer rounded-xl border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                  <input
                    value={establishmentForm.color}
                    onChange={(e) => setEstablishmentForm((c) => ({ ...c, color: e.target.value }))}
                    className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                    placeholder="#f7906c"
                  />
                </div>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Currency *</span>
                <select
                  value={establishmentForm.currency}
                  onChange={(e) =>
                    setEstablishmentForm((c) => ({ ...c, currency: e.target.value === "USD" ? "USD" : "UZS" }))
                  }
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="UZS">Uzbekistani So&apos;m (so&apos;m)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Currency symbol</span>
                <input
                  value={establishmentForm.currencySymbol}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, currencySymbol: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Logo</span>
                <div className="space-y-2">
                  <label className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-base text-neutral-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                    {establishmentForm.logoUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={establishmentForm.logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute right-2 top-2 z-10 flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEditorState({ open: true, target: "logo", imageUrl: establishmentForm.logoUrl });
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEstablishmentForm((current) => ({ ...current, logoUrl: "" }));
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleLogoUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <input
                    value={establishmentForm.logoUrl}
                    onChange={(e) => setEstablishmentForm((c) => ({ ...c, logoUrl: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs text-neutral-500 outline-none transition focus:border-orange-400 dark:border-neutral-800 dark:text-neutral-400"
                    placeholder="Or paste image URL"
                  />
                </div>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Background image</span>
                <div className="space-y-2">
                  <label className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-base text-neutral-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                    {establishmentForm.backgroundImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={establishmentForm.backgroundImage} alt="Background preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute right-2 top-2 z-10 flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEditorState({ open: true, target: "background", imageUrl: establishmentForm.backgroundImage });
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEstablishmentForm((current) => ({ ...current, backgroundImage: "" }));
                            }}
                            className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>{uploadingBackground ? "Uploading..." : "Upload background"}</span>
                    )}
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleBackgroundUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <input
                    value={establishmentForm.backgroundImage}
                    onChange={(e) => setEstablishmentForm((c) => ({ ...c, backgroundImage: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs text-neutral-500 outline-none transition focus:border-orange-400 dark:border-neutral-800 dark:text-neutral-400"
                    placeholder="Or paste image URL"
                  />
                </div>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Wi-Fi password</span>
                <input
                  value={establishmentForm.wifiPassword}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, wifiPassword: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Phone</span>
                <input
                  value={establishmentForm.phone}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, phone: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={establishmentForm.guestsCanOrder}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, guestsCanOrder: e.target.checked }))}
                />
                Guests can make orders
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={establishmentForm.hideMenuButtons}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, hideMenuButtons: e.target.checked }))}
                />
                Hide menus buttons
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Country</span>
                <input
                  value={establishmentForm.country}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, country: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {secondaryLanguages.map((langCode) => (
                    <input
                      key={`country-${langCode}`}
                      value={establishmentForm.countryI18n[langCode]}
                      onChange={(event) =>
                        setEstablishmentForm((current) => ({
                          ...current,
                          countryI18n: { ...current.countryI18n, [langCode]: event.target.value },
                        }))
                      }
                      placeholder={`Country (${langCode.toUpperCase()})`}
                      className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  ))}
                </div>
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">City</span>
                <input
                  value={establishmentForm.city}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, city: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {secondaryLanguages.map((langCode) => (
                    <input
                      key={`city-${langCode}`}
                      value={establishmentForm.cityI18n[langCode]}
                      onChange={(event) =>
                        setEstablishmentForm((current) => ({
                          ...current,
                          cityI18n: { ...current.cityI18n, [langCode]: event.target.value },
                        }))
                      }
                      placeholder={`City (${langCode.toUpperCase()})`}
                      className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  ))}
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Address</span>
                <input
                  value={establishmentForm.address}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, address: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Google Maps link</span>
                <input
                  value={establishmentForm.googleMapsLink}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, googleMapsLink: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Yandex Maps link</span>
                <input
                  value={establishmentForm.yandexMapsLink}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, yandexMapsLink: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Instagram</span>
                <input
                  value={establishmentForm.instagram}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, instagram: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Facebook</span>
                <input
                  value={establishmentForm.facebook}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, facebook: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">TikTok</span>
                <input
                  value={establishmentForm.tiktok}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, tiktok: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">X (Twitter)</span>
                <input
                  value={establishmentForm.twitter}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, twitter: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Trip Advisor</span>
                <input
                  value={establishmentForm.tripAdvisor}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, tripAdvisor: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Google reviews</span>
                <input
                  value={establishmentForm.googleReviews}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, googleReviews: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Additional info</span>
                <textarea
                  value={establishmentForm.additionalInfo}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, additionalInfo: e.target.value }))}
                  className="h-24 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {secondaryLanguages.map((langCode) => (
                    <textarea
                      key={`additional-info-${langCode}`}
                      value={establishmentForm.additionalInfoI18n[langCode]}
                      onChange={(event) =>
                        setEstablishmentForm((current) => ({
                          ...current,
                          additionalInfoI18n: { ...current.additionalInfoI18n, [langCode]: event.target.value },
                        }))
                      }
                      placeholder={`Additional info (${langCode.toUpperCase()})`}
                      className="h-20 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  ))}
                </div>
              </label>
            </div>
            {imageUploadError ? <p className="mt-3 text-sm text-red-500">{imageUploadError}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEstablishmentEditorOpen(false)}
                className="rounded-xl bg-orange-100 px-5 py-2 font-semibold text-orange-500"
              >
                Cancel
              </button>
              <button type="button" onClick={() => void saveEstablishment()} className="rounded-xl bg-orange-400 px-5 py-2 font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdminMode ? (
        <AddItemModal
          open={itemModalOpen}
          onClose={() => {
            setItemModalOpen(false);
            setEditingItem(null);
          }}
          item={editingItem}
          enabledLanguages={enabledLanguages}
          primaryLanguage={primaryLanguage}
          onSave={saveItem}
          labels={{
            addTitle: t("items.addModalTitle"),
            editTitle: t("items.editModalTitle"),
            name: t("items.name"),
            description: t("items.description"),
            price: t("items.price"),
            image: t("items.image"),
            badge: t("items.badge"),
            badgeNone: t("items.badgeNone"),
            badgePopular: t("badges.popular"),
            badgeNew: t("badges.new"),
            save: t("actions.save"),
            cancel: t("actions.cancel"),
            requiredName: t("errors.itemNameRequired"),
            requiredPrice: t("errors.itemPriceRequired"),
            uploadImage: t("items.uploadImage"),
          }}
        />
      ) : null}
      <ImageEditorModal
        open={editorState.open}
        imageUrl={editorState.imageUrl}
        aspect={16 / 9}
        onClose={() => setEditorState({ open: false, target: null, imageUrl: "" })}
        onSave={handleSaveEditedImage}
      />
    </div>
  );
}
