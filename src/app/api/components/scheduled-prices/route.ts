import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findUserEstablishment, normalizeName, normalizePrice, normalizeSlug, verifyUserId } from "@/app/api/_utils/menu-builder";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.scheduledPrices)) establishment.scheduledPrices = [];
    return NextResponse.json({ scheduledPrices: establishment.scheduledPrices });
  } catch (error) {
    console.error("[API /api/components/scheduled-prices GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch scheduled prices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const targetId = normalizeName(body.targetId);
    const targetName = normalizeName(body.targetName);
    const price = normalizePrice(body.price);
    const startAtRaw = normalizeName(body.startAt);
    const startAt = startAtRaw ? new Date(startAtRaw) : new Date();
    if (!slug || !targetId || !targetName || Number.isNaN(price) || Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.scheduledPrices)) establishment.scheduledPrices = [];
    const scheduledPrice = {
      id: `scheduled-${randomUUID().slice(0, 8)}`,
      targetType: body.targetType === "addon" ? "addon" : "item",
      targetId,
      targetName,
      price,
      startAt,
      enabled: typeof body.enabled === "boolean" ? body.enabled : true,
    };
    establishment.scheduledPrices.push(scheduledPrice);
    await establishment.save();
    return NextResponse.json({ scheduledPrice }, { status: 201 });
  } catch (error) {
    console.error("[API /api/components/scheduled-prices POST] Failed", error);
    return NextResponse.json({ error: "Failed to create scheduled price" }, { status: 500 });
  }
}

