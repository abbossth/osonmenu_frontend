"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AddItemModal } from "@/components/MenuBuilder/AddItemModal";
import { CategoryList } from "@/components/MenuUI/CategoryList";
import { MenuTabs } from "@/components/MenuUI/MenuTabs";
import { useAuth } from "@/components/providers/auth-provider";
import { getDefaultCategoryImage } from "@/lib/category-default-image";
import type { MenuCategory, MenuGroup, MenuItem, MenuLocalizedText, MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place: MenuPlace; isOwner?: boolean };
type CategoryFormState = {
  name: string;
  nameI18n: MenuLocalizedText;
  description: string;
  imageUrl: string;
  isVisible: boolean;
};
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
  city: string;
  address: string;
  googleMapsLink: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  tripAdvisor: string;
  googleReviews: string;
  additionalInfo: string;
};
type MenuFormState = {
  name: string;
  isVisible: boolean;
  insertSide: "left" | "right";
};

function sortCategories(categories: MenuCategory[]) {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({ ...category, items: [...category.items].sort((a, b) => a.order - b.order) }));
}

function buildMenus(categories: MenuCategory[], fallbackMenus: MenuGroup[] = []) {
  const grouped = new Map<string, MenuGroup>();

  for (const category of categories) {
    const menuId = category.menuId || "main";
    if (!grouped.has(menuId)) {
      grouped.set(menuId, {
        id: menuId,
        name: category.menuName || fallbackMenus.find((menu) => menu.id === menuId)?.name || "Menu",
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

export default function PublicMenuPage() {
  const t = useTranslations("ProfilePanel.menuBuilder");
  const { firebaseUser } = useAuth();
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();

  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOrder, setMenuOrder] = useState<string[]>([]);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>({ name: "", isVisible: true, insertSide: "right" });
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
    city: "",
    address: "",
    googleMapsLink: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter: "",
    tripAdvisor: "",
    googleReviews: "",
    additionalInfo: "",
  });
  const tempCategoryIdRef = useRef(0);
  const tempItemIdRef = useRef(0);

  const categories = useMemo(() => (place ? sortCategories(place.categories) : []), [place]);
  const menus = useMemo(() => buildMenus(categories, place?.menus ?? []), [categories, place]);
  const orderedMenus = useMemo(() => {
    if (!menuOrder.length) return menus;
    const rank = new Map(menuOrder.map((id, index) => [id, index]));
    return [...menus].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }, [menuOrder, menus]);
  const resolvedActiveMenuId =
    activeMenuId && orderedMenus.some((menu) => menu.id === activeMenuId) ? activeMenuId : orderedMenus[0]?.id ?? null;
  const activeMenu = orderedMenus.find((menu) => menu.id === resolvedActiveMenuId) ?? null;
  const activeMenuCategories = activeMenu?.categories ?? [];
  const resolvedActiveCategoryId =
    activeCategoryId && activeMenuCategories.some((category) => category._id === activeCategoryId)
      ? activeCategoryId
      : activeMenuCategories[0]?._id ?? null;
  const activeCategory = activeMenuCategories.find((category) => category._id === resolvedActiveCategoryId) ?? null;
  const isAdminMode = Boolean(firebaseUser?.uid && place?.ownerId && firebaseUser.uid === place.ownerId);

  function pickLocalized(text: MenuLocalizedText | undefined, fallback: string) {
    if (!text) return fallback;
    return text[locale] || text.uz || text.ru || text.en || fallback;
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
        const firstMenu = data.place.menus?.[0] ?? null;
        const firstCategoryId = firstMenu?.categories?.[0]?._id ?? null;
        setMenuOrder((data.place.menus ?? []).map((menu) => menu.id));
        setActiveMenuId(firstMenu?.id ?? null);
        setActiveCategoryId(firstCategoryId);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "";
        setError(message || t("errors.fetchMenu"));
      } finally {
        setPageLoading(false);
      }
    }
    void loadMenu();
  }, [firebaseUser, slug, t]);

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
    const optimistic: MenuCategory = {
      _id: `temp-category-${tempCategoryIdRef.current++}`,
      menuId: targetMenu.id,
      menuName: targetMenu.name,
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
        body: JSON.stringify({ slug: place.slug, menuId: targetMenu.id, menuName: targetMenu.name, ...payload }),
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

  async function createMenu(name: string, insertSide: "left" | "right", isVisible: boolean) {
    if (!place || !isAdminMode) return;
    try {
      const res = await authorizedFetch("/api/menus", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, name, isVisible, insertSide }),
      });
      const data = (await res.json()) as { menu: { id: string; name: string; order: number; isVisible: boolean } };
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
      setActiveMenuId(data.menu.id);
      setActiveCategoryId(null);
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
          menuName: activeCategory?.menuName ?? activeMenu?.name ?? "Menu",
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
    setCategoryForm({ name: "", nameI18n: { uz: "", ru: "", en: "" }, description: "", imageUrl: "", isVisible: true });
    setCategoryEditorOpen(true);
  }

  function openCreateMenuModal(position: "left" | "right") {
    setMenuForm({ name: "", isVisible: true, insertSide: position });
    setMenuEditorOpen(true);
  }

  function submitCreateMenuModal() {
    const menuName = menuForm.name.trim();
    if (!menuName) return;
    void createMenu(menuName, menuForm.insertSide, menuForm.isVisible);
    setMenuEditorOpen(false);
  }

  function openEditCategoryModal(category: MenuCategory) {
    setCategoryToEdit(category);
    setCategoryForm({
      name: category.name,
      nameI18n: category.nameI18n ?? { uz: category.name, ru: category.name, en: category.name },
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
    payload.name = payload.name || payload.nameI18n.uz || payload.nameI18n.ru || payload.nameI18n.en;
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

  function openEstablishmentEditor() {
    if (!place) return;
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
      country: place.country ?? "",
      city: place.city ?? "",
      address: place.address ?? "",
      googleMapsLink: place.googleMapsLink ?? "",
      instagram: place.instagram ?? "",
      facebook: place.facebook ?? "",
      tiktok: place.tiktok ?? "",
      twitter: place.twitter ?? "",
      tripAdvisor: place.tripAdvisor ?? "",
      googleReviews: place.googleReviews ?? "",
      additionalInfo: place.additionalInfo ?? "",
    });
    setEstablishmentEditorOpen(true);
  }

  async function saveEstablishment() {
    if (!place || !isAdminMode) return;
    const previous = place;
    setPlace({ ...place, ...establishmentForm });
    try {
      const res = await authorizedFetch(`/api/places/${place.slug}`, {
        method: "PATCH",
        body: JSON.stringify(establishmentForm),
      });
      const data = (await res.json()) as { place: Partial<MenuPlace> };
      setPlace((current) => (current ? { ...current, ...data.place } : current));
      setEstablishmentEditorOpen(false);
    } catch {
      setPlace(previous);
      setError("Failed to update establishment");
    }
  }

  function handleCategorySelect(categoryId: string) {
    setActiveCategoryId(categoryId);
    setSearchQuery("");
    router.push(`/${locale}/p/${slug}/${categoryId}`);
  }

  function handleMenuSelect(menuId: string) {
    setActiveMenuId(menuId);
    const nextCategoryId = orderedMenus.find((menu) => menu.id === menuId)?.categories[0]?._id ?? null;
    setActiveCategoryId(nextCategoryId);
    setSearchQuery("");
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

  async function editMenu(menuId: string) {
    if (!place || !isAdminMode) return;
    const menu = orderedMenus.find((entry) => entry.id === menuId);
    if (!menu) return;
    const nextName = window.prompt("Menu name", menu.name)?.trim();
    if (!nextName || nextName === menu.name) return;
    try {
      await authorizedFetch(`/api/menus/${menuId}`, {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, name: nextName, isVisible: true }),
      });
      setPlace((current) =>
        current
          ? {
              ...current,
              menus: (current.menus ?? []).map((entry) => (entry.id === menuId ? { ...entry, name: nextName } : entry)),
              categories: current.categories.map((category) =>
                category.menuId === menuId ? { ...category, menuName: nextName } : category,
              ),
            }
          : current,
      );
    } catch {
      setError("Failed to rename menu");
    }
  }

  async function deleteMenu(menuId: string) {
    if (!place || !isAdminMode) return;
    const menu = orderedMenus.find((entry) => entry.id === menuId);
    if (!menu) return;
    const confirmed = window.confirm(`Delete menu "${menu.name}" and all its categories?`);
    if (!confirmed) return;
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
    } catch {
      setError("Failed to delete menu");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100">
      {error ? (
        <div className="mx-auto mb-2 max-w-[620px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {pageLoading ? (
        <div className="mx-auto max-w-[620px] rounded-[28px] border border-white/10 bg-[#121212] p-6 shadow-sm">
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-800" />
          <div className="mt-5 h-8 w-48 animate-pulse rounded-lg bg-neutral-800" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-neutral-800" />
          <div className="mt-6 h-12 animate-pulse rounded-full bg-neutral-800" />
          <div className="mt-4 h-28 animate-pulse rounded-2xl bg-neutral-800" />
        </div>
      ) : (
        <div className="mx-auto max-w-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] shadow-sm">
          <div className="relative h-44 bg-[radial-gradient(circle_at_20%_20%,#b34b5f,transparent_45%),radial-gradient(circle_at_80%_30%,#e08a9b,transparent_50%),radial-gradient(circle_at_50%_80%,#945666,transparent_40%),linear-gradient(135deg,#6f3243,#bd6778)]">
            {isAdminMode ? (
              <button
                type="button"
                onClick={() => router.push("/admin/places")}
                className="absolute left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-neutral-900 shadow"
              >
                ×
              </button>
            ) : null}
          </div>

          <div className="-mt-4 rounded-t-[28px] bg-[#121212] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <h1 className="text-5xl font-semibold text-white">{place?.name ?? "ABBOS"}</h1>
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={openEstablishmentEditor}
                  className="text-neutral-500 transition hover:text-neutral-200"
                >
                  ✎
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              ◉ {place?.city || "Awesome City"}, {place?.country || "The Best Country"}   〰 {place?.wifiPassword || "CoolWiFiPassword"}
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              {place?.additionalInfo || "Here you can add any additional information about your QR code menu"}
            </p>

            <div className="mt-3">
              <MenuTabs
                menus={orderedMenus.map((menu) => ({ id: menu.id, name: menu.name }))}
                activeMenuId={resolvedActiveMenuId}
                isAdmin={isAdminMode}
                onMoveLeft={(menuId) => moveMenu(menuId, "left")}
                onMoveRight={(menuId) => moveMenu(menuId, "right")}
                onEdit={(menuId) => void editMenu(menuId)}
                onDelete={(menuId) => void deleteMenu(menuId)}
                onAddLeft={() => openCreateMenuModal("left")}
                onAddRight={() => openCreateMenuModal("right")}
                onSelect={handleMenuSelect}
              />
            </div>

            <div className="mt-4 flex items-center rounded-full bg-white/5 px-4 py-2.5">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-base text-neutral-200 outline-none"
              />
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/40 text-lg text-neutral-400">
                ⌕
              </span>
            </div>

            {isAdminMode ? (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-300">ADD CATEGORY</p>
                <button
                  type="button"
                  onClick={openCreateCategoryModal}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-orange-300 py-1.5 text-2xl text-white transition hover:bg-orange-400"
                >
                  +
                </button>
              </div>
            ) : null}

            <div className={`mt-4 space-y-5 ${isAdminMode ? "pb-20" : "pb-4"}`}>
              <CategoryList
                categories={activeMenuCategories.map((category) => ({
                  id: category._id,
                  name: pickLocalized(category.nameI18n, category.name),
                  imageUrl: category.imageUrl,
                }))}
                activeCategoryId={resolvedActiveCategoryId}
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

            </div>
          </div>

          {isAdminMode ? (
            <div className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[620px] -translate-x-1/2 items-center justify-around border-t border-neutral-200 bg-white py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <button type="button" className="text-center text-xs text-orange-400">
                <div className="text-base">✎</div>
                Edit menu
              </button>
              <button type="button" className="text-center text-xs text-neutral-500">
                <div className="text-base">🧩</div>
                Components
              </button>
              <button type="button" className="text-center text-xs text-neutral-500">
                <div className="text-base">⌗</div>
                QR code
              </button>
              <button type="button" className="text-center text-xs text-neutral-500">
                <div className="text-base">⋯</div>
                More
              </button>
            </div>
          ) : null}
        </div>
      )}

      {isAdminMode && menuEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-neutral-900">
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

      {isAdminMode && categoryEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-neutral-900">
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
                <input
                  value={categoryForm.nameI18n.uz}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, nameI18n: { ...current.nameI18n, uz: event.target.value } }))
                  }
                  placeholder="Name (UZ)"
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
                <input
                  value={categoryForm.nameI18n.ru}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, nameI18n: { ...current.nameI18n, ru: event.target.value } }))
                  }
                  placeholder="Name (RU)"
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
                <input
                  value={categoryForm.nameI18n.en}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, nameI18n: { ...current.nameI18n, en: event.target.value } }))
                  }
                  placeholder="Name (EN)"
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
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
                <input
                  value={categoryForm.imageUrl}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-dashed border-neutral-300 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:text-neutral-100"
                />
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[340px] rounded-3xl bg-white p-6 dark:bg-neutral-900">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-neutral-900">
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
                <input
                  value={establishmentForm.color}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, color: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
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
                <input
                  value={establishmentForm.logoUrl}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, logoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-dashed border-neutral-300 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:text-neutral-100"
                  placeholder="Upload logo URL"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Background image</span>
                <input
                  value={establishmentForm.backgroundImage}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, backgroundImage: e.target.value }))}
                  className="w-full rounded-xl border border-dashed border-neutral-300 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:text-neutral-100"
                  placeholder="Upload background URL"
                />
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
              </label>
              <label>
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">City</span>
                <input
                  value={establishmentForm.city}
                  onChange={(e) => setEstablishmentForm((c) => ({ ...c, city: e.target.value }))}
                  className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
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
              </label>
            </div>

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
          onClose={() => setItemModalOpen(false)}
          item={editingItem}
          onSave={saveItem}
          labels={{
            addTitle: t("items.addModalTitle"),
            editTitle: t("items.editModalTitle"),
            name: t("items.name"),
            nameUz: `${t("items.name")} (UZ)`,
            nameRu: `${t("items.name")} (RU)`,
            nameEn: `${t("items.name")} (EN)`,
            description: t("items.description"),
            descriptionUz: `${t("items.description")} (UZ)`,
            descriptionRu: `${t("items.description")} (RU)`,
            descriptionEn: `${t("items.description")} (EN)`,
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
    </div>
  );
}
