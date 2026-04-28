"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faQrcode, faShapes, faUtensils } from "@fortawesome/free-solid-svg-icons";

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
  const activeClass = (tab: BottomNavTab) =>
    active === tab ? "text-neutral-900" : "text-neutral-500 dark:text-neutral-400";
  const activeStyle = (tab: BottomNavTab) => (active === tab ? { color: accentColor } : undefined);

  return (
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[620px] -translate-x-1/2 border-t border-neutral-200 bg-white/95 px-3 pb-2 pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="grid grid-cols-4 gap-1">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}`)}
          className={`cursor-pointer rounded-xl px-2 py-2 text-center transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${activeClass("menu")}`}
        style={activeStyle("menu")}
      >
          <div className="text-[18px]">
            <FontAwesomeIcon icon={faUtensils} />
          </div>
          <div className="mt-1 text-[12px] font-medium">{t("menu")}</div>
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/components`)}
          className={`cursor-pointer rounded-xl px-2 py-2 text-center transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${activeClass("components")}`}
        style={activeStyle("components")}
      >
          <div className="text-[18px]">
            <FontAwesomeIcon icon={faShapes} />
          </div>
          <div className="mt-1 text-[12px] font-medium">{t("components")}</div>
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/qr-code`)}
          className={`cursor-pointer rounded-xl px-2 py-2 text-center transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${activeClass("qr")}`}
        style={activeStyle("qr")}
      >
          <div className="text-[18px]">
            <FontAwesomeIcon icon={faQrcode} />
          </div>
          <div className="mt-1 text-[12px] font-medium">{t("qrCode")}</div>
      </button>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/p/${slug}/more`)}
          className={`cursor-pointer rounded-xl px-2 py-2 text-center transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${activeClass("more")}`}
        style={activeStyle("more")}
      >
          <div className="text-[18px]">
            <FontAwesomeIcon icon={faEllipsis} />
          </div>
          <div className="mt-1 text-[12px] font-medium">{t("more")}</div>
      </button>
      </div>
    </div>
  );
}

