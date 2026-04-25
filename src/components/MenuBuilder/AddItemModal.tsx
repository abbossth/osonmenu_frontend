"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { uploadImageToFirebase } from "@/lib/firebase-upload";
import { ImageEditorModal } from "@/components/MenuUI/ImageEditorModal";
import type { MenuBadge, MenuItem, MenuLocalizedText } from "./types";

type AddItemModalProps = {
  open: boolean;
  item?: MenuItem | null;
  labels: {
    addTitle: string;
    editTitle: string;
    name: string;
    description: string;
    price: string;
    image: string;
    badge: string;
    badgeNone: string;
    badgePopular: string;
    badgeNew: string;
    save: string;
    cancel: string;
    requiredName: string;
    requiredPrice: string;
    uploadImage: string;
  };
  onClose: () => void;
  onSave: (payload: {
    name: string;
    nameI18n: MenuLocalizedText;
    description: string;
    descriptionI18n: MenuLocalizedText;
    price: number;
    imageUrl: string;
    badge: MenuBadge;
  }) => Promise<void>;
};

export function AddItemModal({ open, item, labels, onClose, onSave }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [badge, setBadge] = useState<MenuBadge>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(item);
  const title = isEdit ? labels.editTitle : labels.addTitle;

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      setName(item?.name ?? "");
      setDescription(item?.description ?? "");
      setPrice(item ? String(item.price) : "");
      setBadge(item?.badge ?? null);
      setImageUrl(item?.imageUrl ?? "");
      setError(null);
      setUploading(false);
      setLoading(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, item]);

  const preview = useMemo(() => imageUrl.trim(), [imageUrl]);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToFirebase(file, { folder: "menu-items", maxWidthOrHeight: 1600 });
      setImageUrl(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : labels.uploadImage);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const nameI18n = {
      uz: trimmedName,
      ru: trimmedName,
      en: trimmedName,
    };
    const descriptionI18n = {
      uz: trimmedDescription,
      ru: trimmedDescription,
      en: trimmedDescription,
    };
    const parsedPrice = Number(price);
    if (!trimmedName) {
      setError(labels.requiredName);
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError(labels.requiredPrice);
      return;
    }
    try {
      setLoading(true);
      await onSave({
        name: trimmedName,
        nameI18n,
        description: trimmedDescription,
        descriptionI18n,
        price: parsedPrice,
        imageUrl: preview,
        badge,
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : labels.requiredName);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEditedImage(blob: Blob) {
    const editedFile = new File([blob], `item-edited-${Date.now()}.jpg`, { type: "image/jpeg" });
    setUploading(true);
    try {
      const url = await uploadImageToFirebase(editedFile, { folder: "menu-items", maxWidthOrHeight: 1600 });
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="add-item-modal"
          className="fixed inset-0 z-[90] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
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
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.name}</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.price}</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.description}</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.image}</label>
                  <div className="space-y-2">
                    <label className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                      {preview ? (
                        <>
                          <Image src={preview} alt={name || "Item preview"} fill className="object-cover" unoptimized />
                          <div className="absolute inset-0 bg-black/35" />
                          <div className="absolute right-2 top-2 z-10 flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditorOpen(true);
                              }}
                              className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setImageUrl("");
                              }}
                              className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <span>{uploading ? "Uploading..." : labels.uploadImage}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <input
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="Or paste image URL"
                      className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs text-neutral-500 outline-none transition focus:border-orange-400 dark:border-neutral-800 dark:text-neutral-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.badge}</label>
                  <select
                    value={badge ?? "none"}
                    onChange={(event) =>
                      setBadge(
                        event.target.value === "popular" || event.target.value === "new"
                          ? event.target.value
                          : null,
                      )
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  >
                    <option value="none">{labels.badgeNone}</option>
                    <option value="popular">{labels.badgePopular}</option>
                    <option value="new">{labels.badgeNew}</option>
                  </select>
                </div>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
                >
                  {loading ? "..." : labels.save}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
      {editorOpen ? (
        <ImageEditorModal
          key="add-item-image-editor"
          open={editorOpen}
          imageUrl={preview}
          aspect={16 / 9}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveEditedImage}
        />
      ) : null}
    </AnimatePresence>
  );
}

