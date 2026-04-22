"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AddCategoryModalProps = {
  open: boolean;
  initialName?: string;
  title: string;
  nameLabel: string;
  saveLabel: string;
  cancelLabel: string;
  requiredError: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

export function AddCategoryModal({
  open,
  initialName = "",
  title,
  nameLabel,
  saveLabel,
  cancelLabel,
  requiredError,
  onClose,
  onSave,
}: AddCategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      setName(initialName);
      setError(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialName, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setError(requiredError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(nextName);
      onClose();
    } catch {
      setError(requiredError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{nameLabel}</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {cancelLabel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
                >
                  {loading ? "..." : saveLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

