"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const explore = [
  { key: "features", hash: "#features" },
  { key: "pricing", hash: "#pricing" },
  { key: "demo", hash: "#demo" },
  { key: "how", hash: "#how" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  return (
    <footer className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-neutral-900">
              OM
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">{nav("brand")}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{t("tagline")}</p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t("explore")}</p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              {explore.map((l) => (
                <li key={l.key}>
                  <a href={l.hash} className="transition hover:text-neutral-900 dark:hover:text-white">
                    {nav(l.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t("legal")}</p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a href="#" className="transition hover:text-neutral-900 dark:hover:text-white">
                  {t("privacy")}
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-neutral-900 dark:hover:text-white">
                  {t("terms")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="#"
            aria-label="X"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-center text-xs text-neutral-500 sm:px-6">{t("rights")}</p>
    </footer>
  );
}
