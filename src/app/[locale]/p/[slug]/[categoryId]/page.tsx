"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AddItemModal } from "@/components/MenuBuilder/AddItemModal";
import { MenuTabs } from "@/components/MenuUI/MenuTabs";
import { ItemList } from "@/components/MenuUI/ItemList";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuCategory, MenuGroup, MenuItem, MenuLocalizedText, MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place: MenuPlace };

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
    if (!grouped.has(menu.id)) grouped.set(menu.id, { ...menu, categories: [] });
  }
  return Array.from(grouped.values());
}

function pickLocalized(locale: "uz" | "ru" | "en", text: MenuLocalizedText | undefined, fallback: string) {
  if (!text) return fallback;
  return text[locale] || text.uz || text.ru || text.en || fallback;
}

export default function CategoryItemsPage() {
  const params = useParams<{ slug: string; locale: string; categoryId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const slug = typeof params.slug === "string" ? params.slug : "";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";

  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuOrder, setMenuOrder] = useState<string[]>([]);

  const categories = useMemo(() => (place ? sortCategories(place.categories) : []), [place]);
  const menus = useMemo(() => buildMenus(categories, place?.menus ?? []), [categories, place]);
  const orderedMenus = useMemo(() => {
    if (!menuOrder.length) return menus;
    const rank = new Map(menuOrder.map((id, index) => [id, index]));
    return [...menus].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }, [menuOrder, menus]);
  const activeCategory = useMemo(
    () => categories.find((category) => category._id === categoryId) ?? null,
    [categories, categoryId],
  );

  const resolvedActiveMenuId =
    activeMenuId && orderedMenus.some((menu) => menu.id === activeMenuId)
      ? activeMenuId
      : activeCategory?.menuId ?? orderedMenus[0]?.id ?? null;
  const isAdminMode = Boolean(firebaseUser?.uid && place?.ownerId && firebaseUser.uid === place.ownerId);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    const query = searchQuery.trim().toLowerCase();
    const all = [...activeCategory.items].sort((a, b) => a.order - b.order);
    if (!query) return all;
    return all.filter(
      (item) =>
        pickLocalized(locale, item.nameI18n, item.name).toLowerCase().includes(query) ||
        pickLocalized(locale, item.descriptionI18n, item.description).toLowerCase().includes(query),
    );
  }, [activeCategory, locale, searchQuery]);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const headers: HeadersInit = {};
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            headers.Authorization = `Bearer ${token}`;
          } catch {
            // keep public flow
          }
        }
        const res = await fetch(`/api/places/${slug}/menu`, { headers });
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = (await res.json()) as MenuResponse;
        setPlace(data.place);
        setMenuOrder((data.place.menus ?? []).map((menu) => menu.id));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [firebaseUser, slug]);

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

  function onMenuSelect(menuId: string) {
    setActiveMenuId(menuId);
    const firstCategoryId = orderedMenus.find((menu) => menu.id === menuId)?.categories[0]?._id;
    if (firstCategoryId) router.push(`/${locale}/p/${slug}/${firstCategoryId}`);
  }

  async function createMenu(insertSide: "left" | "right") {
    if (!place || !isAdminMode) return;
    const name = window.prompt("Menu name")?.trim();
    if (!name) return;
    try {
      const res = await authorizedFetch("/api/menus", {
        method: "POST",
        body: JSON.stringify({ slug: place.slug, name, isVisible: true, insertSide }),
      });
      const data = (await res.json()) as { menu: { id: string; name: string; order: number; isVisible: boolean } };
      setPlace((current) =>
        current ? { ...current, menus: [...(current.menus ?? []), { ...data.menu, categories: [] }] } : current,
      );
      setMenuOrder((current) => {
        const base = current.length ? current : orderedMenus.map((menu) => menu.id);
        return insertSide === "left" ? [data.menu.id, ...base] : [...base, data.menu.id];
      });
    } catch (menuError) {
      setError(menuError instanceof Error ? menuError.message : "Failed to create menu");
    }
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
    const name = window.prompt("Menu name", menu.name)?.trim();
    if (!name || name === menu.name) return;
    try {
      await authorizedFetch(`/api/menus/${menuId}`, {
        method: "PATCH",
        body: JSON.stringify({ slug: place.slug, name, isVisible: true }),
      });
      setPlace((current) =>
        current
          ? {
              ...current,
              menus: (current.menus ?? []).map((entry) => (entry.id === menuId ? { ...entry, name } : entry)),
              categories: current.categories.map((category) =>
                category.menuId === menuId ? { ...category, menuName: name } : category,
              ),
            }
          : current,
      );
    } catch (menuError) {
      setError(menuError instanceof Error ? menuError.message : "Failed to rename menu");
    }
  }

  async function deleteMenu(menuId: string) {
    if (!place || !isAdminMode) return;
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
      setMenuOrder((current) => current.filter((id) => id !== menuId));
    } catch (menuError) {
      setError(menuError instanceof Error ? menuError.message : "Failed to delete menu");
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
      setError(itemError instanceof Error ? itemError.message : "Failed to reorder items");
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
      setError(itemError instanceof Error ? itemError.message : "Failed to delete item");
    }
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
    const previous = place;
    if (editingItem) {
      setPlace({
        ...place,
        categories: place.categories.map((category) =>
          category._id === activeCategory._id
            ? { ...category, items: category.items.map((item) => (item._id === editingItem._id ? { ...item, ...payload } : item)) }
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
        setError(itemError instanceof Error ? itemError.message : "Failed to update item");
      }
      return;
    }

    const optimistic: MenuItem = { _id: `temp-item-${Date.now().toString(36)}`, order: activeCategory.items.length, ...payload };
    setPlace({
      ...place,
      categories: place.categories.map((category) =>
        category._id === activeCategory._id ? { ...category, items: [...category.items, optimistic] } : category,
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
                  ? { ...category, items: category.items.map((item) => (item._id === optimistic._id ? data.item : item)) }
                  : category,
              ),
            }
          : current,
      );
    } catch (itemError) {
      setPlace(previous);
      setError(itemError instanceof Error ? itemError.message : "Failed to create item");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100">
      {error ? <div className="mx-auto mt-4 max-w-[620px] rounded-xl border border-red-600/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      {loading ? (
        <div className="mx-auto mt-4 max-w-[620px] rounded-[28px] border border-white/10 bg-[#121212] p-6">
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-800" />
        </div>
      ) : (
        <div className="mx-auto max-w-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] shadow-sm">
          <div className="relative h-44 bg-[radial-gradient(circle_at_20%_20%,#b34b5f,transparent_45%),radial-gradient(circle_at_80%_30%,#e08a9b,transparent_50%),radial-gradient(circle_at_50%_80%,#945666,transparent_40%),linear-gradient(135deg,#6f3243,#bd6778)]">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/p/${slug}`)}
              className="absolute left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-2xl text-white shadow"
            >
              ←
            </button>
          </div>

          <div className="-mt-4 rounded-t-[28px] bg-[#121212] p-4 sm:p-5">
            <h1 className="text-5xl font-semibold text-white">{place?.name ?? ""}</h1>
            <p className="mt-2 text-sm text-neutral-400">
              ◉ {place?.city || "City"}, {place?.country || "Country"}   〰 {place?.wifiPassword || ""}
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
                onAddLeft={() => void createMenu("left")}
                onAddRight={() => void createMenu("right")}
                onSelect={onMenuSelect}
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

            <div className="mt-4 space-y-4 pb-4">
              <h3 className="text-xl font-semibold text-neutral-100">
                {activeCategory ? pickLocalized(locale, activeCategory.nameI18n, activeCategory.name) : "Category"}
              </h3>
              {filteredItems.length === 0 ? (
                <div className="w-full rounded-2xl border border-dashed border-neutral-700 p-8 text-center text-sm text-neutral-500">
                  Items not found
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
                      className="inline-flex w-full items-center justify-center rounded-full bg-orange-300 py-1 text-2xl text-white transition hover:bg-orange-400"
                    >
                      +
                    </button>
                  ) : null}
                  <ItemList
                    currencySymbol={place?.currencySymbol}
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
                    items={filteredItems.map((item) => ({
                      id: item._id,
                      name: pickLocalized(locale, item.nameI18n, item.name),
                      description: pickLocalized(locale, item.descriptionI18n, item.description),
                      imageUrl: item.imageUrl,
                      price: item.price,
                      badge: item.badge,
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isAdminMode ? (
        <AddItemModal
          open={itemModalOpen}
          onClose={() => {
            setItemModalOpen(false);
            setEditingItem(null);
          }}
          item={editingItem}
          onSave={saveItem}
          labels={{
            addTitle: "Add item",
            editTitle: "Edit item",
            name: "Name",
            nameUz: "Name (UZ)",
            nameRu: "Name (RU)",
            nameEn: "Name (EN)",
            description: "Description",
            descriptionUz: "Description (UZ)",
            descriptionRu: "Description (RU)",
            descriptionEn: "Description (EN)",
            price: "Price",
            image: "Image",
            badge: "Badge",
            badgeNone: "None",
            badgePopular: "Popular",
            badgeNew: "New",
            save: "Save",
            cancel: "Cancel",
            requiredName: "Name required",
            requiredPrice: "Price required",
            uploadImage: "Upload image",
          }}
        />
      ) : null}
    </div>
  );
}

