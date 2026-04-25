"use client";

import { useState } from "react";
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
  isLight?: boolean;
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
  isLight = false,
  isAdmin = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddUnder,
}: ItemCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="space-y-2">
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`overflow-hidden rounded-2xl ${
          isLight ? "border border-neutral-200 bg-white" : "border border-white/10 bg-[#131313]"
        }`}
      >
        {imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              className="h-48 w-full cursor-zoom-in object-cover"
              onClick={() => setIsPreviewOpen(true)}
            />
            {badge ? (
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: accentColor }}
              >
                {badge}
              </span>
            ) : null}
            {isAdmin ? (
              <div
                className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur ${
                  isLight ? "border border-black/10 bg-white/85 text-neutral-800" : "border border-white/20 bg-black/70 text-white"
                }`}
              >
                <button type="button" onClick={() => onMoveUp?.(id)}>⇧</button>
                <button type="button" onClick={() => onMoveDown?.(id)}>⇩</button>
                <button type="button" onClick={() => onEdit?.(id)}>✎</button>
                <button type="button" onClick={() => onDelete?.(id)}>🗑</button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-1 p-3">
          {!imageUrl && badge ? (
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: accentColor }}
            >
              {badge}
            </span>
          ) : null}
          {!imageUrl && isAdmin ? (
            <div
              className={`mb-1 flex items-center justify-end gap-1 rounded-full px-2 py-1 text-xs backdrop-blur ${
                isLight ? "border border-black/10 bg-neutral-100 text-neutral-800" : "border border-white/20 bg-black/40 text-white"
              }`}
            >
              <button type="button" onClick={() => onMoveUp?.(id)}>⇧</button>
              <button type="button" onClick={() => onMoveDown?.(id)}>⇩</button>
              <button type="button" onClick={() => onEdit?.(id)}>✎</button>
              <button type="button" onClick={() => onDelete?.(id)}>🗑</button>
            </div>
          ) : null}
          <h4 className={`text-lg font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{name}</h4>
          <p className={`line-clamp-2 text-sm ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>{description}</p>
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
      {isPreviewOpen && imageUrl ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute right-4 top-4 z-[121] h-10 w-10 rounded-full bg-black/70 text-xl text-white"
            aria-label="Close image preview"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
