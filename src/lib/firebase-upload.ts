"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";

type UploadOptions = {
  folder: "establishment-bg" | "establishment-logo" | "category-bg" | "menu-items";
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
};

function extractSlugFromPathname() {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const pIndex = parts.indexOf("p");
  if (pIndex === -1 || pIndex + 1 >= parts.length) return "";
  return parts[pIndex + 1] ?? "";
}

function isUnauthorizedStorageError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === "storage/unauthorized" || maybe.message?.includes("storage/unauthorized") === true;
}

export async function uploadImageToFirebase(file: File, options: UploadOptions) {
  let uploadFile: File | Blob = file;
  try {
    uploadFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? 0.7,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1800,
      useWebWorker: true,
    });
  } catch {
    uploadFile = file;
  }

  const rawName =
    ("name" in uploadFile && typeof uploadFile.name === "string" && uploadFile.name.trim()
      ? uploadFile.name
      : file.name) || `upload-${Date.now()}.jpg`;
  const safeName = rawName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  const contentType =
    ("type" in uploadFile && typeof uploadFile.type === "string" && uploadFile.type.trim()
      ? uploadFile.type
      : file.type) || "image/jpeg";

  try {
    const storage = getFirebaseStorage();
    const fileRef = ref(storage, `${options.folder}/${Date.now()}-${safeName}`);
    await uploadBytes(fileRef, uploadFile, { contentType });
    return await getDownloadURL(fileRef);
  } catch (error) {
    if (isUnauthorizedStorageError(error) && typeof window !== "undefined") {
      try {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("Please sign in to upload image.");
        }

        const token = await currentUser.getIdToken();
        const slug = extractSlugFromPathname();
        if (!slug) {
          throw new Error("Could not determine place slug for upload.");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", options.folder);
        formData.append("slug", slug);

        const response = await fetch("/api/uploads/firebase", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!response.ok || !data?.url) {
          throw new Error(data?.error || "Server upload failed");
        }
        return data.url;
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Unknown upload error";
        throw new Error(`Firebase upload failed: ${fallbackMessage}`);
      }
    }

    const message = error instanceof Error ? error.message : "Unknown upload error";
    throw new Error(`Firebase upload failed: ${message}`);
  }
}

