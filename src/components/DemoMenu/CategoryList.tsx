"use client";

import { motion } from "framer-motion";
import { CategoryCard, type DemoCategory } from "./CategoryCard";

type CategoryListProps = {
  categories: DemoCategory[];
  onSelect: (id: string) => void;
};

export function CategoryList({ categories, onSelect }: CategoryListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} onSelect={onSelect} />
      ))}
    </motion.div>
  );
}
