"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { HeaderUserBadge } from "@/components/MenuUI/HeaderUserBadge";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuAddonGroup, MenuPlace } from "@/components/MenuBuilder/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrashCan } from "@fortawesome/free-solid-svg-icons";

type MenuResponse = { place?: MenuPlace };

export default function ComponentsAddonsPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [addons, setAddons] = useState<MenuAddonGroup[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"single" | "multiple">("single");

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
      if (res.ok) {
        const data = (await res.json()) as MenuResponse;
        if (data.place) {
          setPlace(data.place);
          setAddons(data.place.addons ?? []);
        }
      }
    }
    void load();
  }, [slug, authorizedFetch]);

  async function createAddon() {
    if (!name.trim()) return;
    const res = await authorizedFetch("/api/components/addons", {
      method: "POST",
      body: JSON.stringify({ slug, name: name.trim(), type, options: [] }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { addon: MenuAddonGroup };
    setAddons((current) => [...current, data.addon]);
    setName("");
  }

  async function deleteAddon(id: string) {
    const res = await authorizedFetch(`/api/components/addons/${id}?slug=${slug}`, { method: "DELETE" });
    if (!res.ok) return;
    setAddons((current) => current.filter((addon) => addon.id !== id));
  }

  const accentColor = place?.color?.trim() || "#f7906c";

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/components`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-base" />
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <HeaderUserBadge firebaseUser={firebaseUser} ownerId={place?.ownerId} accentColor={accentColor} />
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-800">{t("sections.addons")}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("addons.namePlaceholder")}
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value === "multiple" ? "multiple" : "single")}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none"
            >
              <option value="single">{t("addons.singleChoice")}</option>
              <option value="multiple">{t("addons.multipleChoice")}</option>
            </select>
            <button
              type="button"
              onClick={() => void createAddon()}
              className="cursor-pointer rounded-xl px-4 py-2 font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {t("actions.create")}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {addons.map((addon) => (
            <div key={addon.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-neutral-800">{addon.name}</p>
                  <p className="text-sm text-neutral-500">
                    {addon.type === "multiple" ? t("addons.multipleChoice") : t("addons.singleChoice")} • {addon.options.length} {t("addons.options")}
                  </p>
                </div>
                <button type="button" onClick={() => void deleteAddon(addon.id)} className="cursor-pointer text-red-500">
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav locale={locale} slug={slug} active="components" accentColor={accentColor} />
    </div>
  );
}

