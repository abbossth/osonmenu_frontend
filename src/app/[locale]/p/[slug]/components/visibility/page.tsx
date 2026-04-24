"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuCategory, MenuItem, MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };

type FlatItem = {
  id: string;
  name: string;
  categoryName: string;
  isVisible: boolean;
  isAvailable: boolean;
};

export default function ComponentsVisibilityPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [items, setItems] = useState<FlatItem[]>([]);

  const authorizedFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const token = firebaseUser ? await firebaseUser.getIdToken() : "";
    return fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  }, [firebaseUser]);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const res = await authorizedFetch(`/api/places/${slug}/menu`);
      if (!res.ok) return;
      const data = (await res.json()) as MenuResponse;
      if (!data.place) return;
      setPlace(data.place);
      const flat = (data.place.categories ?? []).flatMap((category: MenuCategory) =>
        category.items.map((item: MenuItem) => ({
          id: item._id,
          name: item.name,
          categoryName: category.name,
          isVisible: item.isVisible ?? true,
          isAvailable: item.isAvailable ?? true,
        })),
      );
      setItems(flat);
    }
    void load();
  }, [slug, authorizedFetch]);

  const accentColor = place?.color?.trim() || "#f7906c";

  const updates = useMemo(
    () => items.map((item) => ({ itemId: item.id, isVisible: item.isVisible, isAvailable: item.isAvailable })),
    [items],
  );

  async function saveVisibility() {
    const res = await authorizedFetch("/api/components/visibility", {
      method: "PATCH",
      body: JSON.stringify({ slug, updates }),
    });
    if (!res.ok) return;
  }

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/components`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            ←
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-neutral-800">{t("sections.visibility")}</h1>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-neutral-800">{item.name}</p>
                  <p className="text-sm text-neutral-500">{item.categoryName}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, isAvailable: event.target.checked } : entry,
                          ),
                        )
                      }
                    />
                    {t("visibility.inStock")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isVisible}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, isVisible: event.target.checked } : entry,
                          ),
                        )
                      }
                    />
                    {t("visibility.visible")}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void saveVisibility()}
          className="mt-4 cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {t("actions.save")}
        </button>
      </div>
      <BottomNav locale={locale} slug={slug} active="components" accentColor={accentColor} />
    </div>
  );
}

