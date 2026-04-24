"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };
type LocaleCode = "uz" | "ru" | "en";
const LOCALES: LocaleCode[] = ["uz", "ru", "en"];

export default function ComponentsLocalesPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [primary, setPrimary] = useState<LocaleCode>("uz");
  const [enabled, setEnabled] = useState<LocaleCode[]>(["uz", "ru", "en"]);

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
      setPrimary(data.place.language);
      setEnabled((data.place.enabledLanguages as LocaleCode[] | undefined) ?? ["uz", "ru", "en"]);
    }
    void load();
  }, [slug, authorizedFetch]);

  const accentColor = place?.color?.trim() || "#f7906c";
  const localeLabel = useMemo(() => ({ uz: "Uzbek", ru: "Russian", en: "English" }), []);

  async function saveLocales() {
    const res = await authorizedFetch("/api/components/locales", {
      method: "PATCH",
      body: JSON.stringify({ slug, language: primary, enabledLanguages: enabled }),
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

        <h1 className="mt-5 text-3xl font-semibold text-neutral-800">{t("sections.locales")}</h1>
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="space-y-3">
            {LOCALES.map((code) => (
              <div key={code} className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled.includes(code)}
                    onChange={(event) =>
                      setEnabled((current) =>
                        event.target.checked
                          ? Array.from(new Set([...current, code]))
                          : current.filter((entry) => entry !== code),
                      )
                    }
                  />
                  {localeLabel[code]}
                </label>
                <button
                  type="button"
                  onClick={() => setPrimary(code)}
                  className="cursor-pointer rounded-lg px-3 py-1 text-sm"
                  style={primary === code ? { color: accentColor, fontWeight: 700 } : undefined}
                >
                  {primary === code ? t("locales.primary") : t("locales.makePrimary")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void saveLocales()}
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

