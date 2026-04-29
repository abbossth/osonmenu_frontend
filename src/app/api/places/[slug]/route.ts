import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

type Params = { params: Promise<{ slug: string }> };

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;

    const place = await findUserEstablishment(slug, userId);
    if (!place) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    place.name = str(body.name, place.name);
    place.colorTheme = body.colorTheme === "dark" ? "dark" : "light";
    place.color = str(body.color, place.color || "#f7906c");
    place.currency = body.currency === "USD" ? "USD" : "UZS";
    place.currencySymbol = str(body.currencySymbol, place.currencySymbol || "");
    place.logoUrl = str(body.logoUrl, place.logoUrl || "");
    place.backgroundImage = str(body.backgroundImage, place.backgroundImage || "");
    place.wifiPassword = str(body.wifiPassword, place.wifiPassword || "");
    place.phone = str(body.phone, place.phone || "");
    place.guestsCanOrder = typeof body.guestsCanOrder === "boolean" ? body.guestsCanOrder : Boolean(place.guestsCanOrder);
    place.hideMenuButtons = typeof body.hideMenuButtons === "boolean" ? body.hideMenuButtons : Boolean(place.hideMenuButtons);
    place.country = str(body.country, place.country || "");
    place.city = str(body.city, place.city || "");
    place.address = str(body.address, place.address || "");
    place.googleMapsLink = str(body.googleMapsLink, place.googleMapsLink || "");
    // Use strict:false so the field is persisted even if a stale dev model cache is still active.
    place.set("yandexMapsLink", str(body.yandexMapsLink, place.yandexMapsLink || ""), { strict: false });
    place.instagram = str(body.instagram, place.instagram || "");
    place.facebook = str(body.facebook, place.facebook || "");
    place.tiktok = str(body.tiktok, place.tiktok || "");
    place.twitter = str(body.twitter, place.twitter || "");
    place.tripAdvisor = str(body.tripAdvisor, place.tripAdvisor || "");
    place.googleReviews = str(body.googleReviews, place.googleReviews || "");
    place.additionalInfo = str(body.additionalInfo, place.additionalInfo || "");

    await place.save();

    return NextResponse.json({
      place: {
        _id: String(place._id),
        ownerId: place.ownerId || place.userId,
        name: place.name,
        slug: place.slug,
        colorTheme: place.colorTheme || "light",
        color: place.color || "#f7906c",
        currency: place.currency,
        currencySymbol: place.currencySymbol || "",
        logoUrl: place.logoUrl || "",
        backgroundImage: place.backgroundImage || "",
        wifiPassword: place.wifiPassword || "",
        phone: place.phone || "",
        guestsCanOrder: Boolean(place.guestsCanOrder),
        hideMenuButtons: Boolean(place.hideMenuButtons),
        country: place.country || "",
        city: place.city || "",
        address: place.address || "",
        googleMapsLink: place.googleMapsLink || "",
        yandexMapsLink: place.yandexMapsLink || "",
        instagram: place.instagram || "",
        facebook: place.facebook || "",
        tiktok: place.tiktok || "",
        twitter: place.twitter || "",
        tripAdvisor: place.tripAdvisor || "",
        googleReviews: place.googleReviews || "",
        additionalInfo: place.additionalInfo || "",
      },
    });
  } catch (error) {
    console.error("[API /api/places/[slug] PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update establishment" }, { status: 500 });
  }
}
