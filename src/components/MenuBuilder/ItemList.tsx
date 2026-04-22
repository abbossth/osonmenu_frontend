"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { MenuCategory, MenuItem } from "./types";
import { ItemCard } from "./ItemCard";

type ItemListProps = {
  category: MenuCategory | null;
  currency: "UZS" | "USD";
  onAddClick: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onReorderItems: (itemIds: string[]) => void;
  labels: {
    title: string;
    add: string;
    empty: string;
    noCategory: string;
    edit: string;
    delete: string;
    badges: {
      popular: string;
      new: string;
    };
  };
};

function reorderIds(ids: string[], activeId: string, overId: string) {
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);
  if (activeIndex === -1 || overIndex === -1) return ids;
  const next = [...ids];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

export function ItemList({
  category,
  currency,
  onAddClick,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  labels,
}: ItemListProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    if (!category || !event.over || event.active.id === event.over.id) return;
    const ids = category.items.map((item) => item._id);
    const nextIds = reorderIds(ids, String(event.active.id), String(event.over.id));
    onReorderItems(nextIds);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {category ? `${labels.title}: ${category.name}` : labels.noCategory}
        </h3>
        <button
          type="button"
          onClick={onAddClick}
          disabled={!category}
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + {labels.add}
        </button>
      </div>

      {!category ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {labels.noCategory}
        </div>
      ) : category.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {labels.empty}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={category.items.map((item) => item._id)} strategy={rectSortingStrategy}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  currency={currency}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  labels={{
                    edit: labels.edit,
                    delete: labels.delete,
                    badges: labels.badges,
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

