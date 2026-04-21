"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useThemeContext } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const t = useTranslations("Nav");
  const { theme, setTheme } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return <span className="inline-flex h-9 w-[5.5rem] rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />;
  }

  const isDark = theme === "dark";

  return (
    <div
      className="flex rounded-full border border-neutral-200 bg-neutral-100/90 p-0.5 dark:border-neutral-800 dark:bg-neutral-900/90"
      role="group"
      aria-label={t("theme")}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
          !isDark
            ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
            : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
        aria-pressed={!isDark}
      >
        {t("light")}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
          isDark
            ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
            : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
        aria-pressed={isDark}
      >
        {t("dark")}
      </button>
    </div>
  );
}
