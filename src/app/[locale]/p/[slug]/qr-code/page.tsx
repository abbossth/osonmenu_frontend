"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { HeaderUserBadge } from "@/components/MenuUI/HeaderUserBadge";
import { useAuth } from "@/components/providers/auth-provider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

type MenuResponse = { place?: { name?: string; color?: string } };

export default function QrCodePage() {
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";

  const [placeName, setPlaceName] = useState("MENU");
  const [accentColor, setAccentColor] = useState("#f7906c");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const menuUrl = useMemo(() => {
    if (typeof window === "undefined") return `/${locale}/p/${slug}`;
    return `${window.location.origin}/${locale}/p/${slug}`;
  }, [locale, slug]);

  useEffect(() => {
    async function loadPlace() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/places/${slug}/menu`);
        if (!res.ok) return;
        const data = (await res.json()) as MenuResponse;
        const nextName = data.place?.name?.trim();
        const nextColor = data.place?.color?.trim();
        if (nextName) setPlaceName(nextName.toUpperCase());
        if (nextColor) setAccentColor(nextColor);
      } catch {
        // Keep fallback UI.
      }
    }

    void loadPlace();
  }, [slug]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(menuUrl, {
      width: 900,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [menuUrl]);

  function downloadQr() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${slug || "menu"}-qr.png`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-[#e8e8e6] text-neutral-900">
      <div className="mx-auto flex w-full max-w-[620px] flex-col px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{placeName}</p>
          <HeaderUserBadge firebaseUser={firebaseUser} accentColor={accentColor} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-neutral-800">QR code</h1>
        <p className="mt-2 text-sm text-neutral-600">You can download and print it</p>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid place-items-center rounded-xl bg-white p-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Menu QR code" className="h-[280px] w-[280px] object-contain sm:h-[320px] sm:w-[320px]" />
            ) : (
              <div className="h-[280px] w-[280px] animate-pulse rounded-xl bg-neutral-200 sm:h-[320px] sm:w-[320px]" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={downloadQr}
          className="mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accentColor }}
        >
          Download
        </button>
      </div>

      <BottomNav locale={locale} slug={slug} active="qr" accentColor={accentColor} />
    </div>
  );
}

