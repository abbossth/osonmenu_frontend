import { NextRequest, NextResponse } from "next/server";
import {
  normalizeName,
  normalizeSlug,
  verifyUserId,
  findUserEstablishment,
} from "@/app/api/_utils/menu-builder";
import { CategoryEntityModel } from "@/models/CategoryEntity";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const menuId = normalizeSlug(body.menuId) || "main";
    const menuName = normalizeName(body.menuName) || "Menu";
    const name = normalizeName(body.name);
    const nameI18n = {
      uz: normalizeName(body.nameI18n?.uz ?? name),
      ru: normalizeName(body.nameI18n?.ru ?? name),
      en: normalizeName(body.nameI18n?.en ?? name),
    };
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : true;
    if (!slug || !name) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) {
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }
    if (!Array.isArray(establishment.categories)) {
      establishment.categories = [];
    }

    const nextOrder = establishment.categories.length;
    establishment.categories.push({
      menuId,
      menuName,
      name,
      nameI18n,
      description,
      imageUrl,
      isVisible,
      order: nextOrder,
      items: [],
    });
    await establishment.save();
    const category = establishment.categories[establishment.categories.length - 1];
    await CategoryEntityModel.updateOne(
      { _id: category._id, establishmentId: establishment._id },
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
          order: nextOrder,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[API /api/categories POST] Failed", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

