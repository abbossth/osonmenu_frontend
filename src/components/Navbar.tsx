"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/providers/auth-provider";

const anchors = [
  { key: "features", hash: "#features" },
  { key: "how", hash: "#how" },
  { key: "demo", hash: "#demo" },
  { key: "pricing", hash: "#pricing" },
] as const;

export function Navbar() {
  const t = useTranslations("Nav");
  const { firebaseUser, appUser, loading } = useAuth();
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

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {!loading && firebaseUser ? (
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                {initials || "U"}
              </span>
              <span className="max-w-[9rem] truncate">{fullName}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="hidden rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 sm:inline-flex dark:bg-orange-500 dark:text-white dark:hover:bg-orange-400"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
