"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { memo } from "react";

export type DemoMenuItem = {
  id: string;
  category: string;
  image: string;
  title: string;
  description: string;
  price: string;
  badge: string | null;
};

type MenuItemCardProps = {
  item: DemoMenuItem;
};

function MenuItemCardInner({ item }: MenuItemCardProps) {
  const t = useTranslations("DemoMenu.badges");

  const badgeLabel =
    item.badge && (item.badge === "popular" || item.badge === "new" || item.badge === "sale")
      ? t(item.badge as "popular" | "new" | "sale")
      : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#131313] p-2.5 transition hover:border-white/20">
      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-neutral-900">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 420px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        {badgeLabel ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 px-0.5 pb-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold leading-snug text-white">{item.title}</h4>
          <p className="text-lg font-semibold tabular-nums text-rose-400">{item.price}</p>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-400">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export const MenuItemCard = memo(MenuItemCardInner);
