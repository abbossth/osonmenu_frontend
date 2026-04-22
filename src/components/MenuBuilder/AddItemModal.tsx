"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Image from "next/image";
import { getFirebaseStorage } from "@/lib/firebase";
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
    nameUz: string;
    nameRu: string;
    nameEn: string;
    descriptionUz: string;
    descriptionRu: string;
    descriptionEn: string;
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
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionUz, setDescriptionUz] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [price, setPrice] = useState("");
  const [badge, setBadge] = useState<MenuBadge>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(item);
  const title = isEdit ? labels.editTitle : labels.addTitle;

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      setNameUz(item?.nameI18n?.uz ?? item?.name ?? "");
      setNameRu(item?.nameI18n?.ru ?? item?.name ?? "");
      setNameEn(item?.nameI18n?.en ?? item?.name ?? "");
      setDescriptionUz(item?.descriptionI18n?.uz ?? item?.description ?? "");
      setDescriptionRu(item?.descriptionI18n?.ru ?? item?.description ?? "");
      setDescriptionEn(item?.descriptionI18n?.en ?? item?.description ?? "");
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
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const storage = getFirebaseStorage();
      const fileRef = ref(storage, `menu-items/${Date.now()}-${compressedFile.name}`);
      await uploadBytes(fileRef, compressedFile);
      const url = await getDownloadURL(fileRef);
      setImageUrl(url);
    } catch {
      setError(labels.uploadImage);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nameI18n = {
      uz: nameUz.trim(),
      ru: nameRu.trim(),
      en: nameEn.trim(),
    };
    const descriptionI18n = {
      uz: descriptionUz.trim(),
      ru: descriptionRu.trim(),
      en: descriptionEn.trim(),
    };
    const trimmedName = nameI18n.uz || nameI18n.ru || nameI18n.en;
    const trimmedDescription = descriptionI18n.uz || descriptionI18n.ru || descriptionI18n.en;
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
    } catch {
      setError(labels.requiredName);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
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
            className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.nameUz}</label>
                  <input
                    value={nameUz}
                    onChange={(event) => setNameUz(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.nameRu}</label>
                  <input
                    value={nameRu}
                    onChange={(event) => setNameRu(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.nameEn}</label>
                  <input
                    value={nameEn}
                    onChange={(event) => setNameEn(event.target.value)}
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
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.descriptionUz}</label>
                <textarea
                  rows={3}
                  value={descriptionUz}
                  onChange={(event) => setDescriptionUz(event.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.descriptionRu}</label>
                  <textarea
                    rows={3}
                    value={descriptionRu}
                    onChange={(event) => setDescriptionRu(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.descriptionEn}</label>
                  <textarea
                    rows={3}
                    value={descriptionEn}
                    onChange={(event) => setDescriptionEn(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{labels.image}</label>
                  <label className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                    {uploading ? "Uploading..." : labels.uploadImage}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
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

              {preview ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <Image
                    src={preview}
                    alt={nameUz || nameRu || nameEn || "Item preview"}
                    width={800}
                    height={320}
                    className="h-40 w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : null}

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
    </AnimatePresence>
  );
}

