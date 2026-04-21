"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type DemoCategory = {
  id: string;
  title: string;
  image: string;
};

type CategoryCardProps = {
  category: DemoCategory;
  onSelect: (id: string) => void;
};

export function CategoryCard({ category, onSelect }: CategoryCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(category.id)}
      className="group relative block w-full overflow-hidden rounded-2xl border border-white/10"
    >
      <div className="relative h-36 w-full">
        <Image
          src={category.image}
          alt={category.title}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
      </div>
      <p className="absolute inset-0 grid place-items-center px-4 text-center text-2xl font-semibold uppercase tracking-[0.08em] text-white">
        {category.title}
      </p>
    </motion.button>
  );
}
