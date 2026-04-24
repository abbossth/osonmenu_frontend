"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };

export default function ComponentsPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);

  useEffect(() => {
    async function loadPlace() {
      if (!slug) return;
      const headers: HeadersInit = {};
      if (firebaseUser) {
        try {
          headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
        } catch {}
      }
      const res = await fetch(`/api/places/${slug}/menu`, { headers });
      if (!res.ok) return;
      const data = (await res.json()) as MenuResponse;
      if (data.place) setPlace(data.place);
    }
    void loadPlace();
  }, [firebaseUser, slug]);

  const accentColor = place?.color?.trim() || "#f7906c";

  const cards = [
    { id: "addons", title: t("sections.addons"), icon: "☰" },
    { id: "visibility", title: t("sections.visibility"), icon: "◉" },
    { id: "locales", title: t("sections.locales"), icon: "文" },
    { id: "scheduled-prices", title: t("sections.scheduledPrices"), icon: "🗓" },
  ];

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            ×
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
        </div>

        <h1 className="mt-5 text-3xl font-semibold text-neutral-800">{t("title")}</h1>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => router.push(`/${locale}/p/${slug}/components/${card.id}`)}
              className="cursor-pointer rounded-2xl bg-white px-4 py-5 text-left shadow-sm transition hover:shadow"
            >
              <div className="text-lg text-neutral-500">{card.icon}</div>
              <p className="mt-2 text-xl font-semibold text-neutral-800">{card.title}</p>
            </button>
          ))}
        </div>
      </div>

      <BottomNav locale={locale} slug={slug} active="components" accentColor={accentColor} />
    </div>
  );
}

