"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("AppError");

  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-neutral-50 px-6 py-16 text-center dark:bg-neutral-950">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t("title")}</h1>
      <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">{t("description")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {t("retry")}
      </button>
    </div>
  );
}
