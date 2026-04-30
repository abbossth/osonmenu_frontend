import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LocalizedPricingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queryParams = (await searchParams) || {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/${locale}${suffix}#pricing`);
}
