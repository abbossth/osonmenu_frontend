"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type BottomNavTab = "menu" | "components" | "qr" | "more";

type BottomNavProps = {
  locale: string;
  slug: string;
  active: BottomNavTab;
  accentColor: string;
};

export function BottomNav({ locale, slug, active, accentColor }: BottomNavProps) {
  const router = useRouter();
  const t = useTranslations("ProfilePanel.menuBuilder.components.bottomNav");
  const activeClass = (tab: BottomNavTab) => (active === tab ? "" : "text-neutral-500");
  const activeStyle = (tab: BottomNavTab) => (active === tab ? { color: accentColor } : undefined);

  return (
    <div className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[620px] -translate-x-1/2 items-center justify-around border-t border-neutral-200 bg-white py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}`)}
        className={`cursor-pointer text-center text-xs ${activeClass("menu")}`}
        style={activeStyle("menu")}
      >
        <div className="text-base">✎</div>
        {t("menu")}
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/components`)}
        className={`cursor-pointer text-center text-xs ${activeClass("components")}`}
        style={activeStyle("components")}
      >
        <div className="text-base">🧩</div>
        {t("components")}
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/qr-code`)}
        className={`cursor-pointer text-center text-xs ${activeClass("qr")}`}
        style={activeStyle("qr")}
      >
        <div className="text-base">⌗</div>
        {t("qrCode")}
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/more`)}
        className={`cursor-pointer text-center text-xs ${activeClass("more")}`}
        style={activeStyle("more")}
      >
        <div className="text-base">⋯</div>
        {t("more")}
      </button>
    </div>
  );
}

