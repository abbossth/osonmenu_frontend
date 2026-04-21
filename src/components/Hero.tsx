"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  const t = useTranslations("Hero");
  const previewItems = useMemo(() => t.raw("previewItems") as { title: string; price: string }[], [t]);

  return (
    <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,120,120,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-xl"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400"
          >
            {t("eyebrow")}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-4 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08] dark:text-white"
          >
            {t("title")}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("subtitle")}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400"
            >
              {t("primaryCta")}
            </a>
            <a
              href="#demo-menu"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/70 px-6 py-3 text-sm font-semibold text-neutral-900 backdrop-blur transition hover:-translate-y-0.5 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:hover:border-neutral-500"
            >
              {t("secondaryCta")}
            </a>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-500 dark:text-neutral-500"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {t("trust1")}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              {t("trust2")}
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[340px] lg:max-w-none"
        >
          <div className="absolute -inset-8 rounded-[2.6rem] bg-gradient-to-tr from-orange-500/20 via-transparent to-orange-300/25 blur-3xl" />
          <div className="relative rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 p-1.5 shadow-[0_26px_80px_-18px_rgba(0,0,0,0.65)]">
            <div className="relative mx-auto aspect-[10/16] w-full max-w-[320px] overflow-hidden rounded-[2rem] bg-[#0f0f0f] lg:max-w-[360px]">
              <Image
                src="/demo/hero-mobile-preview.png"
                alt="Demo menu preview"
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 1024px) 320px, 360px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5" />
              <div className="absolute inset-x-3 top-3 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur">
                <span className="text-[10px] font-medium text-white/70">9:41</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">QR MENU</span>
                <span className="h-2 w-2 rounded-full bg-orange-400/90" />
              </div>
              <div className="absolute inset-x-4 bottom-4 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300/90">
                  {t("previewLabel")}
                </p>
                {previewItems.map((row, index) => (
                  <div
                    key={row.title}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[10px] font-semibold text-white/90">
                        {index + 1}
                      </span>
                      <span className="text-xs font-medium text-white">{row.title}</span>
                    </div>
                    <span className="text-xs font-semibold text-rose-300">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
