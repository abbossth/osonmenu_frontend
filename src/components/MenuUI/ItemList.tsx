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
        {items.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            imageUrl={item.imageUrl}
            price={item.price}
            badge={item.badge}
            currencySymbol={currencySymbol}
            isAdmin={isAdmin}
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
