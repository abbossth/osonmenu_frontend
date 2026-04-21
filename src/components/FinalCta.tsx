"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function FinalCta() {
  const t = useTranslations("FinalCta");

  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 px-8 py-14 text-center shadow-2xl dark:border-neutral-800"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(249,115,22,0.2),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.16),transparent_40%)]" />
          <motion.h2 variants={fadeUp} className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("title")}
          </motion.h2>
          <motion.p variants={fadeUp} className="relative mx-auto mt-4 max-w-xl text-sm text-neutral-400 sm:text-base">
            {t("subtitle")}
          </motion.p>
          <motion.div variants={fadeUp} className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#pricing"
              className="inline-flex rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-orange-300"
            >
              {t("primary")}
            </a>
            <a
              href="mailto:hello@osonmenu.app"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("secondary")}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
