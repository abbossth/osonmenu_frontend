import { NextRequest, NextResponse } from "next/server";
import { normalizeName, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as { slug?: string; name?: string; isVisible?: boolean };
    const slug = normalizeSlug(body.slug);
    const name = normalizeName(body.name);
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    if (!slug || !id || !name) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.menus)) establishment.menus = [];

    const menu = establishment.menus.find((entry: { id: string }) => entry.id === id);
    if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    menu.name = name;
    menu.isVisible = isVisible;
    if (Array.isArray(establishment.categories)) {
      establishment.categories.forEach((category: { menuId?: string; menuName?: string }) => {
        if ((category.menuId || "main") === id) category.menuName = name;
      });
    }
    await establishment.save();
    return NextResponse.json({ menu });
  } catch (error) {
    console.error("[API /api/menus/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
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
    if (!Array.isArray(establishment.menus)) establishment.menus = [];
    if (!Array.isArray(establishment.categories)) establishment.categories = [];

    establishment.menus = establishment.menus.filter((entry: { id: string }) => entry.id !== id);
    establishment.categories = establishment.categories.filter(
      (category: { menuId?: string }) => (category.menuId || "main") !== id,
    );
    establishment.menus.forEach((entry: { order: number }, index: number) => {
      entry.order = index;
    });
    await establishment.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/menus/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}

