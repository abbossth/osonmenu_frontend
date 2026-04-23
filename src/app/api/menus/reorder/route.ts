import { NextRequest, NextResponse } from "next/server";
import { normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { slug?: string; menuIds?: string[] };
    const slug = normalizeSlug(body.slug);
    const menuIds = Array.isArray(body.menuIds) ? body.menuIds : [];
    if (!slug || menuIds.length === 0) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.menus)) establishment.menus = [];

    const rank = new Map(menuIds.map((id, index) => [id, index]));
    establishment.menus.forEach((menu: { id: string; order: number }, index: number) => {
      menu.order = rank.get(menu.id) ?? index;
    });
    establishment.menus.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    establishment.menus.forEach((menu: { order: number }, index: number) => {
      menu.order = index;
    });
    await establishment.save();
    return NextResponse.json({ menus: establishment.menus });
  } catch (error) {
    console.error("[API /api/menus/reorder PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to reorder menus" }, { status: 500 });
  }
}

