"use client";

import { AnimatePresence } from "framer-motion";
import { ItemCard } from "./ItemCard";

type MenuBadge = "popular" | "new" | null;

type ItemRow = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  badge?: MenuBadge;
};

type ItemListProps = {
  items: ItemRow[];
  currencySymbol?: string;
  accentColor?: string;
  isLight?: boolean;
  isAdmin?: boolean;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddUnder?: (id: string) => void;
};

export function ItemList({
  items,
  currencySymbol,
  accentColor = "#ff4048",
  isLight = false,
  isAdmin = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddUnder,
}: ItemListProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <ItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            imageUrl={item.imageUrl}
            price={item.price}
            badge={item.badge}
            currencySymbol={currencySymbol}
            accentColor={accentColor}
            isLight={isLight}
            isAdmin={isAdmin}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddUnder={onAddUnder}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
