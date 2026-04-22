"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Place } from "./PlaceCard";

type AddPlacePayload = {
  name: string;
  slug: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
};

type AddPlaceModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: AddPlacePayload) => Promise<Place>;
  existingSlugs: string[];
  labels: {
    title: string;
    name: string;
    slug: string;
    currency: string;
    language: string;
    save: string;
    cancel: string;
    required: string;
    invalidSlug: string;
    duplicateSlug: string;
    genericError: string;
    success: string;
    urlPrefix: string;
  };
};

const slugRegex = /^[a-z0-9]+$/;

function isDuplicateSlugError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "duplicate_slug"
  );
}

export function AddPlaceModal({ open, onClose, onCreate, existingSlugs, labels }: AddPlaceModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState<"UZS" | "USD">("UZS");
  const [language, setLanguage] = useState<"uz" | "ru" | "en">("uz");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !normalizedSlug || !currency || !language) {
      setError(labels.required);
      return;
    }
    if (!slugRegex.test(normalizedSlug)) {
      setError(labels.invalidSlug);
      return;
    }
    if (existingSlugs.includes(normalizedSlug)) {
      setError(labels.duplicateSlug);
      return;
    }

    try {
      setLoading(true);
      await onCreate({
        name: name.trim(),
        slug: normalizedSlug,
        currency,
        language,
      });
      setSuccess(labels.success);
      setName("");
      setSlug("");
      setCurrency("UZS");
      setLanguage("uz");
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 700);
    } catch (error) {
      setError(isDuplicateSlugError(error) ? labels.duplicateSlug : labels.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          onClick={onClose}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{labels.title}</h3>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.name}</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.slug}</label>
                <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                  <span className="mr-2 text-neutral-500 dark:text-neutral-400">{labels.urlPrefix}</span>
                  <input
                    value={slug}
                    onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, ""))}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.currency}</label>
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as "UZS" | "USD")}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.language}</label>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as "uz" | "ru" | "en")}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="uz">Uzbek</option>
                    <option value="ru">Russian</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
                >
                  {loading ? "..." : labels.save}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
