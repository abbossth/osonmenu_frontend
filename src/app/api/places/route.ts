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

const slugRegex = /^[a-z0-9]+$/;
const allowedCurrencies = new Set(["UZS", "USD"]);
const allowedLanguages = new Set(["uz", "ru", "en"]);

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    await connectToMongoDB();

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
    const slug = body.slug?.trim().toLowerCase();
    const currency = body.currency;
    const language = body.language;

    if (
      !name ||
      name.length < 2 ||
      !slug ||
      !slugRegex.test(slug) ||
      !currency ||
      !allowedCurrencies.has(currency) ||
      !language ||
      !allowedLanguages.has(language)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectToMongoDB();

    const existingSlug = await EstablishmentModel.findOne({
      slug,
      $or: [{ ownerId: decoded.uid }, { userId: decoded.uid }],
    }).lean();
    if (existingSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const created = await EstablishmentModel.create({
      ownerId: decoded.uid,
      userId: decoded.uid,
      name,
      slug,
      currency,
      language,
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
