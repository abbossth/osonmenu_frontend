"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CategoryList } from "./CategoryList";
import { Header } from "./Header";
import { MenuItemCard, type DemoMenuItem } from "./MenuItemCard";
import { SearchBar } from "./SearchBar";

type CategoryId = "salads" | "coldStarters" | "mainDishes" | "soups" | "drinks";
const CATEGORY_ORDER: CategoryId[] = ["salads", "coldStarters", "mainDishes", "soups", "drinks"];

export function DemoMenu() {
  const t = useTranslations("DemoMenu");
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [search, setSearch] = useState("");

  const items = useMemo(() => t.raw("items") as DemoMenuItem[], [t]);

  const categories = useMemo(() => {
    const images = t.raw("categoryImages") as Record<string, string>;
    return CATEGORY_ORDER.map((id) => ({
      id,
      title: t(`categories.${id}`),
      image: images[id],
    }));
  }, [t]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    const current = items.filter((item) => item.category === activeCategory);
    const query = search.trim().toLowerCase();
    if (!query) return current;
    return current.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [activeCategory, items, search]);

  const activeLabel = activeCategory ? t(`categories.${activeCategory}`) : "";

  return (
    <section id="demo-menu" className="border-b border-neutral-200 py-20 dark:border-neutral-800 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>

        <div className="mx-auto mt-14 max-w-md">
          <div className="rounded-[2.6rem] bg-neutral-900 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-black/40">
            <div className="overflow-hidden rounded-[2rem] bg-[#0f0f0f] text-white">
              <Header onBack={() => setActiveCategory(null)} backVisible={Boolean(activeCategory)} />

              <div className="rounded-t-[1.8rem] bg-[#121212] px-3 pb-3 pt-4">
                <div className="rounded-2xl bg-[#121212] p-3 ring-1 ring-white/10">
                  <h3 className="text-4xl font-semibold leading-none tracking-tight">{t("venue")}</h3>
                  <p className="mt-1.5 text-sm text-neutral-400">{t("location")}</p>
                  <span className="mt-3 inline-flex rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    {activeCategory ? activeLabel : t("menuPill")}
                  </span>
                </div>

                <div className="mt-3">
                  <SearchBar value={search} onChange={setSearch} />
                </div>
              </div>

              <div className="h-[min(72vh,660px)] overflow-y-auto px-3 pb-4 pt-2">
                <AnimatePresence mode="wait">
                  {!activeCategory ? (
                    <motion.div key="home">
                      <CategoryList
                        categories={categories}
                        onSelect={(id) => {
                          setSearch("");
                          setActiveCategory(id as CategoryId);
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.24 }}
                      className="space-y-2.5"
                    >
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => <MenuItemCard key={item.id} item={item} />)
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-[#151515] p-6 text-center text-sm text-neutral-400">
                          {t("noResults")}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pb-3">
                <div className="mx-auto h-1 w-12 rounded-full bg-neutral-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
