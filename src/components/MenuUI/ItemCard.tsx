"use client";

import { motion } from "framer-motion";

type MenuBadge = "popular" | "new" | null;

type ItemCardProps = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  currencySymbol?: string;
  badge?: MenuBadge;
  accentColor?: string;
  isAdmin?: boolean;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddUnder?: (id: string) => void;
};

function formatPrice(price: number, currencySymbol?: string) {
  const value = new Intl.NumberFormat("ru-RU").format(price);
  return currencySymbol ? `${value} ${currencySymbol}` : value;
}

export function ItemCard({
  id,
  name,
  description,
  imageUrl,
  price,
  badge = null,
  currencySymbol = "",
  accentColor = "#ff4048",
  isAdmin = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddUnder,
}: ItemCardProps) {
  return (
    <div className="space-y-2">
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#131313]"
      >
        <div className="relative">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-48 w-full object-cover" />
          ) : (
            <div className="h-48 w-full bg-neutral-800" />
          )}
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: accentColor }}>
              {badge}
            </span>
          ) : null}
          {isAdmin ? (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
              <button type="button" onClick={() => onMoveUp?.(id)}>⇧</button>
              <button type="button" onClick={() => onMoveDown?.(id)}>⇩</button>
              <button type="button" onClick={() => onEdit?.(id)}>✎</button>
              <button type="button" onClick={() => onDelete?.(id)}>🗑</button>
            </div>
          ) : null}
        </div>
        <div className="space-y-1 p-3">
          <h4 className="text-lg font-semibold text-white">{name}</h4>
          <p className="line-clamp-2 text-sm text-neutral-400">{description}</p>
          <p className="pt-1 text-2xl font-semibold" style={{ color: accentColor }}>{formatPrice(price, currencySymbol)}</p>
        </div>
      </motion.article>
      {isAdmin ? (
        <button
          type="button"
          onClick={() => onAddUnder?.(id)}
          className="inline-flex w-full items-center justify-center rounded-full py-1 text-2xl text-white transition brightness-95 hover:brightness-105"
          style={{ backgroundColor: accentColor }}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
