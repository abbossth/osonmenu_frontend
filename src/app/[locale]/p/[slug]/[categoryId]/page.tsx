import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string; categoryId: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
};

/** Legacy path: `/p/[slug]/[categoryId]` → single-page menu with `?category=` (client-side UX). */
export default async function LegacyCategoryRoute({ params, searchParams }: Props) {
  const { locale, slug, categoryId } = await params;
  const sp = searchParams ? await searchParams : {};
  const langRaw = sp.lang;
  const lang = typeof langRaw === "string" ? langRaw : Array.isArray(langRaw) ? langRaw[0] : undefined;

  const q = new URLSearchParams();
  q.set("category", categoryId);
  if (lang) q.set("lang", lang);

  redirect(`/${locale}/p/${slug}?${q.toString()}`);
}
