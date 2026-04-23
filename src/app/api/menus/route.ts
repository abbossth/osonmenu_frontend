import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { normalizeName, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      isVisible?: boolean;
      insertSide?: "left" | "right";
    };
    const slug = normalizeSlug(body.slug);
    const name = normalizeName(body.name);
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    const insertSide = body.insertSide === "left" ? "left" : "right";
    if (!slug || !name) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.menus)) establishment.menus = [];

    const menu = {
      id: `menu-${randomUUID().slice(0, 8)}`,
      name,
      order: insertSide === "left" ? 0 : establishment.menus.length,
      isVisible,
    };

    if (insertSide === "left") {
      establishment.menus.forEach((entry: { order: number }) => {
        entry.order += 1;
      });
    }
    establishment.menus.push(menu);
    establishment.menus.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    establishment.menus.forEach((entry: { order: number }, index: number) => {
      entry.order = index;
    });
    await establishment.save();

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error("[API /api/menus POST] Failed", error);
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
  }
}

