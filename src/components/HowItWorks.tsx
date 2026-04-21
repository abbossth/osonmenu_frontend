"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function HowItWorks() {
  const t = useTranslations("How");
  const steps = useMemo(() => t.raw("steps") as { n: string; title: string; body: string }[], [t]);

  return (
    <section id="how" className="border-b border-neutral-200 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/40 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            {t("title")}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-neutral-600 dark:text-neutral-400">
            {t("subtitle")}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mt-16 grid gap-8 lg:grid-cols-3"
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className="relative rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950"
            >
              {i < steps.length - 1 ? (
                <div className="absolute -right-4 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-gradient-to-r from-neutral-300 to-transparent lg:block dark:from-neutral-700" />
              ) : null}
              <span className="text-xs font-bold tabular-nums text-amber-500">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
