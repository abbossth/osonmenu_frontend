import { NextRequest, NextResponse } from "next/server";
import { normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { CategoryEntityModel } from "@/models/CategoryEntity";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { slug?: string; menuId?: string; categoryIds?: string[] };
    const slug = normalizeSlug(body.slug);
    const menuId = normalizeSlug(body.menuId) || "main";
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    if (!slug || categoryIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const rankMap = new Map(categoryIds.map((id, index) => [id, index]));
    const scoped = establishment.categories.filter(
      (category: { menuId?: string }) => (category.menuId || "main") === menuId,
    );
    scoped.forEach((category: { _id: unknown; order: number }, index: number) => {
      category.order = rankMap.get(String(category._id)) ?? index;
    });
    scoped.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    scoped.forEach((category: { order: number }, index: number) => {
      category.order = index;
    });
    await establishment.save();
    await Promise.all(
      scoped.map((category: { _id: unknown; menuName?: string; name?: string; nameI18n?: unknown; description?: string; imageUrl?: string; isVisible?: boolean; order: number }) =>
        CategoryEntityModel.updateOne(
          { _id: category._id, establishmentId: establishment._id },
          {
            $set: {
              establishmentId: establishment._id,
              menuId,
              menuName: category.menuName || "Menu",
              name: category.name || "Untitled",
              nameI18n: category.nameI18n || { uz: "", ru: "", en: "" },
              description: category.description || "",
              imageUrl: category.imageUrl || "",
              isVisible: typeof category.isVisible === "boolean" ? category.isVisible : true,
              order: category.order,
            },
          },
          { upsert: true },
        ),
      ),
    );

    return NextResponse.json({ categories: establishment.categories });
  } catch (error) {
    console.error("[API /api/categories/reorder PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}

