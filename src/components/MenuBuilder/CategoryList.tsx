"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { MenuCategory } from "./types";
import { CategoryItem } from "./CategoryItem";

type CategoryListProps = {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onSaveName: (id: string, name: string) => Promise<void>;
  onAddClick: () => void;
  labels: {
    title: string;
    add: string;
    empty: string;
    rename: string;
    delete: string;
    save: string;
    cancel: string;
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

export function CategoryList({
  categories,
  activeCategoryId,
  onSelect,
  onReorder,
  onDelete,
  onSaveName,
  onAddClick,
  labels,
}: CategoryListProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const ids = categories.map((category) => category._id);
    const nextIds = reorderIds(ids, String(event.active.id), String(event.over.id));
    onReorder(nextIds);
  }

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{labels.title}</h2>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-400"
        >
          + {labels.add}
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {labels.empty}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((category) => category._id)} strategy={rectSortingStrategy}>
            <div className="space-y-2">
              {categories.map((category) => (
                <CategoryItem
                  key={category._id}
                  category={category}
                  active={activeCategoryId === category._id}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onSaveName={onSaveName}
                  labels={labels}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </aside>
  );
}

