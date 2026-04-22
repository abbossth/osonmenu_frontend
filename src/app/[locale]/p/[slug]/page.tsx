"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AddItemModal } from "@/components/MenuBuilder/AddItemModal";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuCategory, MenuItem, MenuLocalizedText, MenuPlace } from "@/components/MenuBuilder/types";

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

function sortCategories(categories: MenuCategory[]) {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({ ...category, items: [...category.items].sort((a, b) => a.order - b.order) }));
}

export default function PublicMenuPage() {
  const t = useTranslations("ProfilePanel.menuBuilder");
  const { firebaseUser } = useAuth();
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();

  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const resolvedActiveCategoryId =
    activeCategoryId && categories.some((category) => category._id === activeCategoryId)
      ? activeCategoryId
      : categories[0]?._id ?? null;
  const activeCategory = categories.find((category) => category._id === resolvedActiveCategoryId) ?? null;
  const isAdminMode = Boolean(firebaseUser?.uid && place?.ownerId && firebaseUser.uid === place.ownerId);

  const filteredItems = (() => {
    if (!activeCategory) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeCategory.items;
    return activeCategory.items.filter(
      (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    );
  })();

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
        const firstCategoryId = data.place.categories.sort((a, b) => a.order - b.order)[0]?._id ?? null;
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
    const previous = place;
    const optimistic: MenuCategory = {
      _id: `temp-category-${tempCategoryIdRef.current++}`,
      name: payload.name,
      nameI18n: payload.nameI18n,
      description: payload.description,
      imageUrl: payload.imageUrl,
      isVisible: payload.isVisible,
      order: place.categories.length,
      items: [],
    };
    setPlace({ ...place, categories: [...place.categories, optimistic] });
    try {
      const res = await authorizedFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, ...payload }),
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
    } catch {
      setPlace(previous);
      setError(t("errors.categoryCreate"));
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
        body: JSON.stringify({ slug: place.slug, ...payload }),
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
      await addCategory({
        ...payload,
        description: "",
        imageUrl: "",
      });
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
        body: JSON.stringify({ slug: place.slug, categoryIds }),
      });
    } catch {
      setPlace(previous);
      setError(t("errors.categoryReorder"));
    }
  }

  async function moveCategory(categoryId: string, direction: "left" | "right") {
    if (!isAdminMode) return;
    const ids = categories.map((category) => category._id);
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

  async function deleteItem(itemId: string) {
    if (!place || !activeCategory || !isAdminMode) return;
    const confirmed = window.confirm(t("confirmDeleteItem"));
    if (!confirmed) return;
    const previous = place;
    setPlace({
      ...place,
      categories: place.categories.map((category) =>
        category._id === activeCategory._id ? { ...category, items: category.items.filter((item) => item._id !== itemId) } : category,
      ),
    });
    try {
      await authorizedFetch(`/api/items/${itemId}?slug=${place.slug}`, { method: "DELETE" });
    } catch {
      setPlace(previous);
      setError(t("errors.itemDelete"));
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
              items: category.items
                .map((item) => ({ ...item, order: rank.get(item._id) ?? item.order }))
                .sort((a, b) => a.order - b.order),
            }
          : category,
      ),
    });
    try {
      await authorizedFetch("/api/items/reorder", {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, categoryId: activeCategory._id, itemIds }),
      });
    } catch {
      setPlace(previous);
      setError(t("errors.itemReorder"));
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

  function handleCategorySelect(categoryId: string) {
    setActiveCategoryId(categoryId);
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {error ? (
        <div className="mx-auto mb-2 max-w-[620px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {pageLoading ? (
        <div className="mx-auto max-w-[620px] rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-5 h-8 w-48 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-6 h-12 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-4 h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        </div>
      ) : (
        <div className="mx-auto max-w-[620px] overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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

          <div className="-mt-4 rounded-t-[28px] bg-white p-4 dark:bg-neutral-900 sm:p-5">
            <div className="flex items-center gap-2">
              <h1 className="text-5xl font-semibold text-neutral-900 dark:text-white">{place?.name ?? "ABBOS"}</h1>
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={openEstablishmentEditor}
                  className="text-neutral-500 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  ✎
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              ◉ {place?.city || "Awesome City"}, {place?.country || "The Best Country"}   〰 {place?.wifiPassword || "CoolWiFiPassword"}
            </p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {place?.additionalInfo || "Here you can add any additional information about your QR code menu"}
            </p>

            <div className="mt-3 flex flex-wrap items-start gap-1.5">
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={openCreateCategoryModal}
                  className="h-7 w-7 rounded-full bg-orange-400 text-lg font-medium leading-none text-white shadow-sm"
                >
                  +
                </button>
              ) : null}
              {categories.map((category) => (
                <div key={category._id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(category._id)}
                    className={`rounded-full border px-4 py-1.5 text-2xl font-semibold leading-none transition ${
                      resolvedActiveCategoryId === category._id
                        ? "border-orange-400 bg-orange-400 text-white"
                        : "border-orange-300 bg-white text-orange-400 hover:bg-orange-50 dark:border-orange-500/50 dark:bg-transparent dark:hover:bg-orange-500/10"
                    }`}
                  >
                    {pickLocalized(category.nameI18n, category.name)}
                  </button>
                  {isAdminMode ? (
                    <div className="flex items-center justify-center gap-1 rounded-xl bg-orange-300 px-2.5 py-1 text-white shadow-sm">
                      <button type="button" onClick={() => void moveCategory(category._id, "left")} className="text-xs">
                        ↩
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(category)}
                        className="text-xs"
                      >
                        ✎
                      </button>
                      <button type="button" onClick={() => void moveCategory(category._id, "right")} className="text-xs">
                        ↪
                      </button>
                      <button type="button" onClick={() => setCategoryToRemove(category)} className="text-xs">
                        🗑
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={openCreateCategoryModal}
                  className="h-7 w-7 rounded-full bg-orange-400 text-lg font-medium leading-none text-white shadow-sm"
                >
                  +
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex items-center rounded-full bg-neutral-100 px-4 py-2.5 dark:bg-neutral-800">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-base text-neutral-700 outline-none dark:text-neutral-200"
              />
              <span className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 bg-white text-lg text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
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

            <div className={`mt-4 space-y-4 ${isAdminMode ? "pb-20" : "pb-4"}`}>
              {activeCategory ? (
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                  {pickLocalized(activeCategory.nameI18n, activeCategory.name)}
                </h3>
              ) : null}

              {!activeCategory ? (
                <div className="w-full rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  {t("items.noCategory")}
                </div>
              ) : filteredItems.length === 0 ? (
                isAdminMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setItemModalOpen(true);
                    }}
                    className="w-full rounded-2xl border border-dashed border-neutral-300 p-8 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    {t("items.empty")}
                  </button>
                ) : (
                  <div className="w-full rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    {t("items.empty")}
                  </div>
                )
              ) : (
                filteredItems.map((item, index) => (
                  <div key={item._id} className="space-y-3">
                    {isAdminMode && index === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemModalOpen(true);
                        }}
                        className="inline-flex w-full items-center justify-center rounded-full bg-orange-300 py-1 text-2xl text-white transition hover:bg-orange-400"
                      >
                        +
                      </button>
                    ) : null}

                    <article className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
                      <div className="relative">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-800" />
                        )}
                        {isAdminMode ? (
                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs text-neutral-700 shadow">
                            <button type="button" onClick={() => void moveItem(item._id, "up")}>
                              ⇧
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setItemModalOpen(true);
                              }}
                            >
                              ✎
                            </button>
                            <button type="button" onClick={() => void deleteItem(item._id)}>
                              🗑
                            </button>
                            <button type="button" onClick={() => void moveItem(item._id, "down")}>
                              ⇩
                            </button>
                          </div>
                        ) : null}
                        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/45 px-3 py-1 text-4xl font-semibold text-white">
                          {pickLocalized(item.nameI18n, item.name)}
                        </p>
                      </div>
                    </article>

                    {isAdminMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemModalOpen(true);
                        }}
                        className="inline-flex w-full items-center justify-center rounded-full bg-orange-300 py-1 text-2xl text-white transition hover:bg-orange-400"
                      >
                        +
                      </button>
                    ) : null}
                  </div>
                ))
              )}
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

      {isAdminMode && categoryEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-neutral-900">
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {categoryToEdit ? "Edit section" : "Create menu"}
            </h3>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">
                  {categoryToEdit ? "Section name*" : "Menu name*"}
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
              {categoryToEdit ? (
                <label className="block">
                  <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Section description</span>
                  <textarea
                    value={categoryForm.description}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                    className="h-28 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </label>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={categoryForm.isVisible}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, isVisible: event.target.checked }))}
                />
                {categoryToEdit ? "Section is visible" : "Menu is visible"}
              </label>
              {categoryToEdit ? (
                <label className="block">
                  <span className="mb-1 block text-sm text-neutral-500 dark:text-neutral-400">Section background image</span>
                  <input
                    value={categoryForm.imageUrl}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-dashed border-neutral-300 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:text-neutral-100"
                  />
                </label>
              ) : null}
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
