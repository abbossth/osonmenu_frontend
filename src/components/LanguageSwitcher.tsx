"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<string, string> = { uz: "Oʻzb", ru: "Рус", en: "EN" };

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-600"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
      >
        <span className="tabular-nums">{labels[locale] ?? locale.toUpperCase()}</span>
        <span className="text-neutral-400" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          className="absolute right-0 z-[60] mt-2 min-w-[9rem] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          role="listbox"
        >
          {routing.locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === locale}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                  loc === locale ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-200"
                }`}
                onClick={() => {
                  router.replace(pathname, { locale: loc });
                  try {
                    window.localStorage.setItem("osonmenu-locale", loc);
                  } catch {
                    /* ignore */
                  }
                  setOpen(false);
                }}
              >
                {labels[loc] ?? loc.toUpperCase()}
                {loc === locale ? <span className="text-xs">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
