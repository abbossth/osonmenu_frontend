"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

type HeaderProps = {
  onBack: () => void;
  backVisible: boolean;
};

const localeLabels: Record<string, string> = {
  uz: "O'z",
  ru: "Рус",
  en: "EN",
};

export function Header({ onBack, backVisible }: HeaderProps) {
  const t = useTranslations("DemoMenu");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "uz" ? "ru" : locale === "ru" ? "en" : "uz";

  return (
    <div className="relative h-28 overflow-hidden rounded-t-[1.6rem] bg-neutral-900">
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-black/50" />
      <Image
        src={t("coverImage")}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 420px"
        className="object-cover opacity-90"
      />

      <div className="relative z-10 flex items-start justify-between px-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          className={`grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/15 transition ${
            backVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label={t("back")}
        >
          ←
        </button>
        <div className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
          {t("brand")}
        </div>
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: nextLocale })}
          className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15"
          aria-label={t("language")}
        >
          {localeLabels[locale] ?? locale.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
