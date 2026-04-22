"use client";

import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { MenuCategory } from "./types";

type CategoryItemProps = {
  category: MenuCategory;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveName: (id: string, name: string) => Promise<void>;
  labels: {
    rename: string;
    delete: string;
    save: string;
    cancel: string;
  };
};

export function CategoryItem({ category, active, onSelect, onDelete, onSaveName, labels }: CategoryItemProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(category.name);
  const [saving, setSaving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function handleSave() {
    const nextName = draftName.trim();
    if (!nextName) return;
    try {
      setSaving(true);
      await onSaveName(category._id, nextName);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border p-3 transition ${
        active
          ? "border-orange-400 bg-orange-50/70 dark:border-orange-400/70 dark:bg-orange-500/10"
          : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(category._id)}
          className="min-w-0 flex-1 text-left"
        >
          {editing ? (
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{category.name}</p>
          )}
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Drag category"
        >
          ::
        </button>
      </div>

      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{category.items.length} items</p>

      <div className="mt-2 flex items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-orange-400 disabled:opacity-70"
            >
              {saving ? "..." : labels.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraftName(category.name);
              }}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {labels.cancel}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              {labels.rename}
            </button>
            <button
              type="button"
              onClick={() => onDelete(category._id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {labels.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

