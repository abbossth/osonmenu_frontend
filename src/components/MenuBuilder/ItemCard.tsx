"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import Image from "next/image";
import type { MenuItem } from "./types";

type ItemCardProps = {
  item: MenuItem;
  currency: "UZS" | "USD";
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  labels: {
    edit: string;
    delete: string;
    badges: {
      popular: string;
      new: string;
    };
  };
};

export function ItemCard({ item, currency, onEdit, onDelete, labels }: ItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex gap-3">
        <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={192}
              height={160}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-neutral-500 dark:text-neutral-400">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-base font-semibold text-neutral-900 dark:text-white">{item.name}</h4>
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Drag item"
            >
              ::
            </button>
          </div>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">{item.description}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {currency === "USD" ? `$${item.price.toFixed(2)}` : `${Math.round(item.price).toLocaleString("ru-RU")} so'm`}
            </p>
            {item.badge ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                {item.badge === "popular" ? labels.badges.popular : labels.badges.new}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          {labels.edit}
        </button>
        <button
          type="button"
          onClick={() => onDelete(item._id)}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {labels.delete}
        </button>
      </div>
    </article>
  );
}

