"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

type Area = { width: number; height: number; x: number; y: number };

type ImageEditorModalProps = {
  open: boolean;
  imageUrl: string;
  aspect?: number;
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
};

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image for editing"));
    image.src = url;
  });
}

function toRadians(degree: number) {
  return (degree * Math.PI) / 180;
}

function rotatedSize(width: number, height: number, rotation: number) {
  const rad = toRadians(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  const bounds = rotatedSize(image.width, image.height, rotation);
  canvas.width = bounds.width;
  canvas.height = bounds.height;

  ctx.translate(bounds.width / 2, bounds.height / 2);
  ctx.rotate(toRadians(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Canvas is not supported in this browser");

  const maxOutputSide = 1600;
  const largestSide = Math.max(pixelCrop.width, pixelCrop.height);
  const scale = largestSide > maxOutputSide ? maxOutputSide / largestSide : 1;
  const outputWidth = Math.max(1, Math.round(pixelCrop.width * scale));
  const outputHeight = Math.max(1, Math.round(pixelCrop.height * scale));

  cropCanvas.width = outputWidth;
  cropCanvas.height = outputHeight;
  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to export cropped image"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
}

export function ImageEditorModal({ open, imageUrl, aspect = 16 / 9, onClose, onSave }: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRender = open && Boolean(imageUrl);
  const safeImageUrl = useMemo(() => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("blob:") || imageUrl.startsWith("/api/image-proxy")) return imageUrl;
    if (imageUrl.startsWith("data:image/")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
  }, [imageUrl]);
  const zoomLabel = useMemo(() => `${zoom.toFixed(1)}x`, [zoom]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleSave() {
    if (!imageUrl || !croppedAreaPixels) return;
    try {
      setSaving(true);
      setError(null);
      const blob = await getCroppedBlob(safeImageUrl, croppedAreaPixels, rotation);
      await onSave(blob);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save edited image");
    } finally {
      setSaving(false);
    }
  }

  if (!canRender) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#141519] p-4 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-[420px] overflow-hidden rounded-xl bg-black">
          <Cropper
            image={safeImageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            cropStyle={{ border: "2px dashed #ff4d5a" }}
            showGrid={false}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(1, Number((current - 0.2).toFixed(2))))}
              className="h-11 w-11 rounded-full border border-[#ff4d5a] text-xl text-[#ff4d5a]"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(4, Number((current + 0.2).toFixed(2))))}
              className="h-11 w-11 rounded-full border border-[#ff4d5a] text-xl text-[#ff4d5a]"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setRotation((current) => (current + 90) % 360)}
              className="h-11 rounded-full border border-[#ff4d5a] px-4 text-sm text-[#ff4d5a]"
            >
              Rotate
            </button>
            <span className="text-sm text-neutral-400">{zoomLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-[#2b1519] px-6 py-3 text-lg font-semibold text-[#ff4d5a]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-2xl bg-[#ff4d5a] px-6 py-3 text-lg font-semibold text-black disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
