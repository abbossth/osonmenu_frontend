import { NextRequest, NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";
import { UserModel } from "@/models/User";
import { PLACE_FIELDS, type PlaceLean, noStore, requireSuperAdmin, serializePlace } from "../_shared";

/** Barcha restoranlar ro'yxati (faqat super-admin). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if ("error" in auth) return auth.error;

    await connectToMongoDB();
    const places = (await EstablishmentModel.find({})
      .select(PLACE_FIELDS)
      .sort({ createdAt: -1 })
      .lean()) as unknown as PlaceLean[];

    const ownerIds = [...new Set(places.map((p) => p.ownerId || p.userId).filter(Boolean))] as string[];
    const owners = (await UserModel.find({ firebaseUid: { $in: ownerIds } })
      .select("firebaseUid email fullName")
      .lean()) as unknown as Array<{ firebaseUid: string; email: string; fullName: string }>;
    const ownerByUid = new Map(owners.map((o) => [o.firebaseUid, o]));

    return NextResponse.json(
      {
        me: { uid: auth.admin.uid, email: auth.admin.email },
        places: places.map((p) => serializePlace(p, ownerByUid.get(p.ownerId || p.userId || ""))),
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("[API /api/superadmin/places GET] Failed", error);
    return NextResponse.json({ error: "Failed to load places" }, { status: 500 });
  }
}
