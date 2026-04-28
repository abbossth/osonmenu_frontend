import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { buildDefaultMenu } from "@/lib/default-menu";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function serialize(place: {
  _id: unknown;
  ownerId?: string;
  userId: string;
  name: string;
  slug: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
  createdAt: Date;
}) {
  return {
    _id: String(place._id),
    ownerId: place.ownerId ?? place.userId,
    userId: place.userId,
    name: place.name,
    slug: place.slug,
    currency: place.currency,
    language: place.language,
    createdAt: place.createdAt,
  };
}

const slugRegex = /^[a-z0-9-]+$/;
const allowedCurrencies = new Set(["UZS", "USD"]);
const allowedLanguages = new Set(["uz", "ru", "en"]);

function slugify(input: string) {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "place";
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildUniqueSlug(preferred: string) {
  const base = slugify(preferred);
  const pattern = new RegExp(`^${escapeRegex(base)}(?:-(\\d+))?$`);
  const existing = await EstablishmentModel.find({ slug: { $regex: pattern } })
    .select({ slug: 1, _id: 0 })
    .lean();

  if (!existing.some((entry) => entry.slug === base)) {
    return base;
  }

  const usedNumbers = new Set(
    existing
      .map((entry) => {
        if (entry.slug === base) return 0;
        const match = entry.slug.match(new RegExp(`^${escapeRegex(base)}-(\\d+)$`));
        return match ? Number.parseInt(match[1], 10) : null;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value)),
  );

  let suffix = 1;
  while (usedNumbers.has(suffix)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    await connectToMongoDB();
    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "slugs") {
      const allSlugs = await EstablishmentModel.find({})
        .select({ slug: 1, _id: 0 })
        .lean();
      return NextResponse.json({ slugs: allSlugs.map((entry) => entry.slug) });
    }

    const places = await EstablishmentModel.find({
      $or: [{ ownerId: decoded.uid }, { userId: decoded.uid }],
    })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ places: places.map(serialize) });
  } catch (error) {
    console.error("[API /api/places GET] Failed to fetch places", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      currency?: "UZS" | "USD";
      language?: "uz" | "ru" | "en";
    };

    const name = body.name?.trim();
    const requestedSlug = body.slug?.trim().toLowerCase() ?? "";
    const currency = body.currency;
    const language = body.language;

    if (
      !name ||
      name.length < 2 ||
      !currency ||
      !allowedCurrencies.has(currency) ||
      !language ||
      !allowedLanguages.has(language)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectToMongoDB();

    if (requestedSlug && slugRegex.test(requestedSlug)) {
      const duplicateSlug = await EstablishmentModel.exists({ slug: requestedSlug });
      if (duplicateSlug) {
        return NextResponse.json({ error: "Slug already exists", code: "duplicate_slug" }, { status: 409 });
      }
    }

    const slugSource = requestedSlug && slugRegex.test(requestedSlug) ? requestedSlug : name;
    const slug = await buildUniqueSlug(slugSource);

    const created = await EstablishmentModel.create({
      ownerId: decoded.uid,
      userId: decoded.uid,
      name,
      slug,
      currency,
      language,
      menus: [{ id: "main", name: "Menu", order: 0, isVisible: true }],
      categories: buildDefaultMenu(language),
    });

    return NextResponse.json({ place: serialize(created) }, { status: 201 });
  } catch (error: unknown) {
    const isDuplicateKey =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number" &&
      (error as { code: number }).code === 11000;

    if (isDuplicateKey) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    console.error("[API /api/places POST] Failed to create place", error);
    return NextResponse.json({ error: "Failed to create place" }, { status: 500 });
  }
}
