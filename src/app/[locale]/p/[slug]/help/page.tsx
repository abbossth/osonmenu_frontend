"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { HeaderUserBadge } from "@/components/MenuUI/HeaderUserBadge";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };

export default function HelpPage() {
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

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/more`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            ×
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <HeaderUserBadge firebaseUser={firebaseUser} ownerId={place?.ownerId} accentColor={accentColor} />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/p/${slug}/more`)}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 text-3xl font-semibold text-neutral-800"
        >
          <span aria-hidden>←</span>
          <span>Help</span>
        </button>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm text-neutral-700 space-y-3">
          <p>We already have answers for most questions in our Knowledge Base.</p>
          <p>If there is no article for your question, you can always contact us here:</p>
          <p>
            <span className="font-semibold">Email:</span> hello@oddmenu.com
          </p>
        </div>
      </div>

      <BottomNav locale={locale} slug={slug} active="more" accentColor={accentColor} />
    </div>
  );
}

