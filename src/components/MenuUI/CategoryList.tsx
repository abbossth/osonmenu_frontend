"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CategoryCard } from "./CategoryCard";

type CategoryItem = {
  id: string;
  name: string;
  imageUrl?: string;
};

type CategoryListProps = {
  categories: CategoryItem[];
  activeCategoryId: string | null;
  isAdmin?: boolean;
  onMoveUp?: (categoryId: string) => void;
  onMoveDown?: (categoryId: string) => void;
  onEdit?: (categoryId: string) => void;
  onDelete?: (categoryId: string) => void;
  onAddUnder?: (categoryId: string) => void;
  onSelect: (categoryId: string) => void;
};

export function CategoryList({
  categories,
  activeCategoryId,
  isAdmin = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddUnder,
  onSelect,
}: CategoryListProps) {
  return (
    <motion.div layout className="space-y-3">
      <AnimatePresence mode="popLayout">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <CategoryCard
              id={category.id}
              name={category.name}
              imageUrl={category.imageUrl}
              active={category.id === activeCategoryId}
              isAdmin={isAdmin}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddUnder={onAddUnder}
              onClick={onSelect}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
