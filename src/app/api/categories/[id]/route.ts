import { NextRequest, NextResponse } from "next/server";
import { asObjectId, normalizeName, normalizeSlug, verifyUserId, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { CategoryEntityModel } from "@/models/CategoryEntity";
import { ItemEntityModel } from "@/models/ItemEntity";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as {
      slug?: string;
      menuId?: string;
      menuName?: string;
      name?: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      description?: string;
      imageUrl?: string;
      isVisible?: boolean;
    };
    const slug = normalizeSlug(body.slug);
    const menuId = typeof body.menuId === "string" ? body.menuId.trim() || "main" : "main";
    const menuName = normalizeName(body.menuName) || "Menu";
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    if (!slug) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const categoryObjectId = asObjectId(id);
    if (!categoryObjectId) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const category = establishment.categories.id(categoryObjectId);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const name = normalizeName(body.name) || category.name;
    const nameI18n = {
      uz:
        typeof body.nameI18n?.uz === "string"
          ? normalizeName(body.nameI18n.uz)
          : normalizeName(category.nameI18n?.uz ?? name),
      ru:
        typeof body.nameI18n?.ru === "string"
          ? normalizeName(body.nameI18n.ru)
          : normalizeName(category.nameI18n?.ru ?? name),
      en:
        typeof body.nameI18n?.en === "string"
          ? normalizeName(body.nameI18n.en)
          : normalizeName(category.nameI18n?.en ?? name),
    };
    const description =
      typeof body.description === "string" ? body.description.trim() : category.description || "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : category.imageUrl || "";
    category.name = name;
    category.menuId = menuId;
    category.menuName = menuName;
    category.nameI18n = nameI18n;
    category.description = description;
    category.imageUrl = imageUrl;
    category.isVisible = isVisible;
    await establishment.save();
    await CategoryEntityModel.updateOne(
      { _id: categoryObjectId, establishmentId: establishment._id },
      {
        $set: {
          establishmentId: establishment._id,
          menuId,
          menuName,
          name,
          nameI18n,
          description,
          imageUrl,
          isVisible,
          order: category.order,
        },
      },
      { upsert: true },
    );
    return NextResponse.json({ category });
  } catch (error) {
    console.error("[API /api/categories/:id PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const categoryObjectId = asObjectId(id);
    if (!categoryObjectId) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const category = establishment.categories.id(categoryObjectId);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    category.deleteOne();

    establishment.categories.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    establishment.categories.forEach((item: { order: number }, index: number) => {
      item.order = index;
    });
    await establishment.save();
    await Promise.all([
      CategoryEntityModel.deleteOne({ _id: categoryObjectId, establishmentId: establishment._id }),
      ItemEntityModel.deleteMany({ categoryId: categoryObjectId, establishmentId: establishment._id }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/categories/:id DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

