"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace, MenuScheduledPrice } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };

export default function ComponentsScheduledPricesPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [entries, setEntries] = useState<MenuScheduledPrice[]>([]);
  const [targetName, setTargetName] = useState("");
  const [price, setPrice] = useState("");
  const [startAt, setStartAt] = useState("");

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
      const [menuRes, scheduledRes] = await Promise.all([
        authorizedFetch(`/api/places/${slug}/menu`),
        authorizedFetch(`/api/components/scheduled-prices?slug=${slug}`),
      ]);
      if (menuRes.ok) {
        const data = (await menuRes.json()) as MenuResponse;
        if (data.place) setPlace(data.place);
      }
      if (scheduledRes.ok) {
        const data = (await scheduledRes.json()) as { scheduledPrices: MenuScheduledPrice[] };
        setEntries(data.scheduledPrices ?? []);
      }
    }
    void load();
  }, [slug, authorizedFetch]);

  const accentColor = place?.color?.trim() || "#f7906c";

  async function createScheduledPrice() {
    if (!targetName.trim() || !price.trim() || !startAt.trim()) return;
    const res = await authorizedFetch("/api/components/scheduled-prices", {
      method: "POST",
      body: JSON.stringify({
        slug,
        targetType: "item",
        targetId: targetName.trim().toLowerCase().replace(/\s+/g, "-"),
        targetName: targetName.trim(),
        price: Number(price),
        startAt,
        enabled: true,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { scheduledPrice: MenuScheduledPrice };
    setEntries((current) => [...current, data.scheduledPrice]);
    setTargetName("");
    setPrice("");
    setStartAt("");
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

        <h1 className="mt-5 text-3xl font-semibold text-neutral-800">{t("sections.scheduledPrices")}</h1>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={targetName}
              onChange={(event) => setTargetName(event.target.value)}
              placeholder={t("scheduled.targetName")}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none"
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={t("scheduled.price")}
              type="number"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none"
            />
            <input
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              type="datetime-local"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void createScheduledPrice()}
            className="mt-3 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {t("actions.add")}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-neutral-800">{entry.targetName}</p>
                  <p className="text-sm text-neutral-500">{new Date(entry.startAt).toLocaleString()}</p>
                </div>
                <p className="font-semibold text-neutral-700">{entry.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav locale={locale} slug={slug} active="components" accentColor={accentColor} />
    </div>
  );
}

