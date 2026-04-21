"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { LANDING_IMAGES } from "@/lib/landing-images";

const demoDishes = [
  { cat: "chef", img: LANDING_IMAGES.dish1 },
  { cat: "chef", img: LANDING_IMAGES.dish4 },
  { cat: "main", img: LANDING_IMAGES.dish5 },
  { cat: "side", img: LANDING_IMAGES.dish6 },
  { cat: "main", img: LANDING_IMAGES.dish2 },
  { cat: "drink", img: LANDING_IMAGES.dish3 },
] as const;

export function DemoPreview() {
  const t = useTranslations("DemoPreview");
  const nav = useTranslations("Nav");
  const samples = useMemo(() => t.raw("samples") as { title: string; price: string }[], [t]);
  const langPills = useMemo(
    () => [
      { code: "EN", active: true },
      { code: "UZ", active: false },
      { code: "RU", active: false },
    ],
    [],
  );

  return (
    <section id="demo" className="border-b border-neutral-200 py-20 dark:border-neutral-800 sm:py-28">
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
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-14 max-w-md"
        >
          <div className="rounded-[2.4rem] bg-neutral-900 p-1.5 shadow-[0_26px_70px_-20px_rgba(0,0,0,0.7)] ring-1 ring-black/40">
            <div className="overflow-hidden rounded-[1.9rem] bg-[#101010] text-white">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-500/70" />
                </div>
                <div className="mx-auto h-7 flex-1 max-w-[220px] rounded-full bg-white/10 text-center text-[11px] leading-7 text-neutral-300">
                  {t("browserUrl")}
                </div>
              </div>

              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-400">{t("tonight")}</p>
                    <h3 className="text-base font-semibold text-white">{t("chefPicks")}</h3>
                  </div>
                  <div className="flex rounded-full bg-white/10 p-0.5 text-[11px] font-medium ring-1 ring-white/10">
                    {langPills.map((p) => (
                      <span
                        key={p.code}
                        className={`rounded-full px-2.5 py-1 ${
                          p.active ? "bg-white text-neutral-900" : "text-neutral-300"
                        }`}
                      >
                        {p.code}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <span className="shrink-0 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white">
                    {nav("demo")}
                  </span>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-neutral-300">
                    {t("categoriesLabel")}
                  </span>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-neutral-300">
                    {nav("features")}
                  </span>
                </div>
              </div>

              <div className="max-h-[560px] space-y-3 overflow-y-auto px-3 py-3">
                {demoDishes.map((d, idx) => (
                  <article
                    key={`${d.img}-${idx}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171717] transition hover:border-white/20"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={d.img}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold text-white">{samples[idx]?.title ?? ""}</h4>
                        <span className="text-sm font-semibold tabular-nums text-rose-400">
                          {samples[idx]?.price ?? ""}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">{t("tip")}</p>
                      <button
                        type="button"
                        className="mt-2 w-full rounded-lg bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-neutral-900"
                      >
                        {t("add")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
