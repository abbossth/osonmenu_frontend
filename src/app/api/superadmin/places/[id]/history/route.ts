import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToMongoDB } from "@/lib/mongodb";
import { AccessLogModel } from "@/models/AccessLog";
import { noStore, requireSuperAdmin } from "../../../_shared";

type Params = { params: Promise<{ id: string }> };

/** Restoranning to'lovlar va amallar tarixi (faqat super-admin). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireSuperAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await connectToMongoDB();
    const logs = (await AccessLogModel.find({ establishmentId: id })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean()) as unknown as Array<Record<string, unknown>>;

    const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
    return NextResponse.json(
      {
        history: logs.map((h) => ({
          _id: String(h._id),
          type: h.type,
          amount: typeof h.amount === "number" ? h.amount : 0,
          period: h.period ?? "",
          from: iso(h.from),
          until: iso(h.until),
          note: h.note ?? "",
          byEmail: h.byEmail ?? "",
          createdAt: iso(h.createdAt),
        })),
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("[API /api/superadmin/places/[id]/history GET] Failed", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
