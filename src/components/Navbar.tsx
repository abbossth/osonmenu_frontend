"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/providers/auth-provider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

const anchors = [
  { key: "features", hash: "#features" },
  { key: "how", hash: "#how" },
  { key: "demo", hash: "#demo" },
  { key: "pricing", hash: "#pricing" },
] as const;

export function Navbar() {
  const t = useTranslations("Nav");
  const { firebaseUser, appUser, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fullName =
    appUser?.fullName?.trim() || firebaseUser?.displayName?.trim() || firebaseUser?.email?.split("@")[0] || "User";
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/80"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10">
            <Image src="/brand/osonmenu-primary-logo.png" alt="OsonMenu logo" fill className="object-cover" sizes="32px" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">{t("brand")}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex dark:text-neutral-400">
          {anchors.map((a) => (
            <a
              key={a.key}
              href={a.hash}
              className="transition hover:text-neutral-900 dark:hover:text-white"
            >
              {t(a.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {!loading && firebaseUser ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 sm:gap-2 sm:px-3 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white sm:h-7 sm:w-7 sm:text-[11px]">
                {initials || "U"}
              </span>
              <span className="max-w-[6rem] truncate sm:max-w-[9rem]">{fullName}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-400 sm:px-4 sm:py-2 sm:text-sm dark:bg-orange-500 dark:text-white dark:hover:bg-orange-400"
            >
              {t("login")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!loading && firebaseUser ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                {initials || "U"}
              </span>
              <span className="max-w-[4.5rem] truncate">{fullName}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-orange-400"
            >
              {t("login")}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="text-sm" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-200/80 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/95 md:hidden"
          >
            <nav className="space-y-1">
              {anchors.map((a) => (
                <a
                  key={a.key}
                  href={a.hash}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {t(a.key)}
                </a>
              ))}
            </nav>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
