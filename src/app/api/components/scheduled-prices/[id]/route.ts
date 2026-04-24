import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeName, normalizePrice, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as {
      slug?: string;
      targetType?: "item" | "addon";
      targetId?: string;
      targetName?: string;
      price?: number | string;
      startAt?: string;
      enabled?: boolean;
    };
    const slug = normalizeSlug(body.slug);
    if (!slug || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.scheduledPrices)) establishment.scheduledPrices = [];
    const scheduledPrice = establishment.scheduledPrices.find((entry: { id: string }) => entry.id === id);
    if (!scheduledPrice) return NextResponse.json({ error: "Scheduled price not found" }, { status: 404 });
    if (body.targetType === "item" || body.targetType === "addon") scheduledPrice.targetType = body.targetType;
    if (typeof body.targetId === "string") scheduledPrice.targetId = normalizeName(body.targetId);
    if (typeof body.targetName === "string") scheduledPrice.targetName = normalizeName(body.targetName);
    if (body.price !== undefined) {
      const price = normalizePrice(body.price);
      if (!Number.isNaN(price)) scheduledPrice.price = price;
    }
    if (typeof body.startAt === "string" && body.startAt.trim()) {
      const date = new Date(body.startAt);
      if (!Number.isNaN(date.getTime())) scheduledPrice.startAt = date;
    }
    if (typeof body.enabled === "boolean") scheduledPrice.enabled = body.enabled;
    await establishment.save();
    return NextResponse.json({ scheduledPrice });
  } catch (error) {
    console.error("[API /api/components/scheduled-prices/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update scheduled price" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.scheduledPrices)) establishment.scheduledPrices = [];
    establishment.scheduledPrices = establishment.scheduledPrices.filter((entry: { id: string }) => entry.id !== id);
    await establishment.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/components/scheduled-prices/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete scheduled price" }, { status: 500 });
  }
}

