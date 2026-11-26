import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin";
import { getAccessState } from "@/lib/establishment-access";

export const PLACE_FIELDS =
  "name slug ownerId userId phone city logoUrl createdAt isBlocked paidUntil blockedMessage blockReason monthlyFee adminNote";

export type PlaceLean = {
  _id: unknown;
  name: string;
  slug: string;
  ownerId?: string;
  userId?: string;
  phone?: string;
  city?: string;
  logoUrl?: string;
  createdAt?: Date;
  isBlocked?: boolean;
  paidUntil?: Date | null;
  blockedMessage?: string;
  blockReason?: string;
  monthlyFee?: number;
  adminNote?: string;
};

export function serializePlace(place: PlaceLean, owner?: { email?: string; fullName?: string } | null) {
  return {
    _id: String(place._id),
    name: place.name,
    slug: place.slug,
    ownerId: place.ownerId || place.userId || "",
    ownerEmail: owner?.email ?? "",
    ownerName: owner?.fullName ?? "",
    phone: place.phone ?? "",
    city: place.city ?? "",
    logoUrl: place.logoUrl ?? "",
    createdAt: place.createdAt ? new Date(place.createdAt).toISOString() : null,
    isBlocked: Boolean(place.isBlocked),
    paidUntil: place.paidUntil ? new Date(place.paidUntil).toISOString() : null,
    blockedMessage: place.blockedMessage ?? "",
    blockReason: place.blockReason || "payment",
    monthlyFee: typeof place.monthlyFee === "number" ? place.monthlyFee : 0,
    adminNote: place.adminNote ?? "",
    access: getAccessState(place),
  };
}

/** Super-admin bo'lmasa tayyor xato javobini qaytaradi. */
export async function requireSuperAdmin(request: NextRequest) {
  const admin = await verifySuperAdmin(request);
  if (!admin) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (!admin.isAdmin) {
    return {
      error: NextResponse.json({ error: "FORBIDDEN", uid: admin.uid, email: admin.email }, { status: 403 }),
    } as const;
  }
  return { admin } as const;
}

export const noStore = { "Cache-Control": "private, no-store" };
