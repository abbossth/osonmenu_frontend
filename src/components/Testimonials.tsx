"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const items = useMemo(() => t.raw("items") as { quote: string; name: string; role: string }[], [t]);

  return (
    <section className="border-b border-neutral-200 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/30 sm:py-28">
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
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-14 grid gap-4 lg:grid-cols-3"
        >
          {items.map((q) => (
            <motion.figure
              key={q.name}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900">
                  {q.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{q.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">{q.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
