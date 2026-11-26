import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";
import { AccessLogModel } from "@/models/AccessLog";
import { UserModel } from "@/models/User";
import { addDays, addMonths, endOfDayTashkent, parseDateInputTashkent } from "@/lib/establishment-access";
import { PLACE_FIELDS, type PlaceLean, noStore, requireSuperAdmin, serializePlace } from "../../_shared";

type Params = { params: Promise<{ id: string }> };

const BLOCK_REASONS = ["payment", "request", "violation", "other"] as const;
type BlockReason = (typeof BLOCK_REASONS)[number];
const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  payment: "To'lov qilinmadi",
  request: "Restoran so'rovi",
  violation: "Qoidabuzarlik",
  other: "Boshqa",
};

function str(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function num(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? n : NaN;
}
function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Restoran obunasini boshqarish (faqat super-admin).
 *
 * body.action:
 *  - "extend"  { months? | days? | until?: "YYYY-MM-DD", extendFromCurrent?, amount?, note? } — muddat bilan yoqish
 *  - "block"   { reason?: "payment"|"request"|"violation"|"other", message?, note? } — darhol o'chirish
 *  - "unblock" { }                      — qayta yoqish (to'langan muddat hali tugamagan bo'lsa)
 *  - "update"  { monthlyFee?, adminNote? }
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireSuperAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return bad("Invalid id");

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = str(body.action, 20);

    await connectToMongoDB();
    const place = (await EstablishmentModel.findById(id).select(PLACE_FIELDS).lean()) as unknown as PlaceLean | null;
    if (!place) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const now = new Date();
    const currentUntil = place.paidUntil ? new Date(place.paidUntil) : null;
    const set: Record<string, unknown> = {};
    const log: Record<string, unknown> = { type: action };

    if (action === "extend") {
      const months = num(body.months);
      const days = num(body.days);
      const untilRaw = str(body.until, 10);
      const canExtend = Boolean(body.extendFromCurrent) && currentUntil && currentUntil > now;
      const base = canExtend ? currentUntil! : now;

      let until: Date | null = null;
      let period = "";
      if (untilRaw) {
        until = parseDateInputTashkent(untilRaw);
        period = "Aniq sanagacha";
      } else if (Number.isInteger(months) && months >= 1 && months <= 36) {
        until = endOfDayTashkent(addMonths(base, months));
        period = months === 12 ? "1 yil" : `${months} oy`;
      } else if (Number.isInteger(days) && days >= 1 && days <= 366) {
        until = endOfDayTashkent(addDays(base, days));
        period = `${days} kun`;
      }
      if (!until) return bad("Muddat noto'g'ri ko'rsatilgan");
      if (until <= now) return bad("Muddat kelajakdagi sana bo'lishi kerak");

      const amount = num(body.amount);
      Object.assign(set, { isBlocked: false, paidUntil: until, blockedMessage: "" });
      Object.assign(log, {
        period,
        from: currentUntil,
        until,
        amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
        note: str(body.note, 200),
      });
    } else if (action === "block") {
      const reason = str(body.reason, 20);
      const blockReason = BLOCK_REASONS.includes(reason as BlockReason) ? (reason as BlockReason) : "payment";
      Object.assign(set, { isBlocked: true, blockReason, blockedMessage: str(body.message, 160) });
      Object.assign(log, { note: [BLOCK_REASON_LABELS[blockReason], str(body.note, 200)].filter(Boolean).join(" · ") });
    } else if (action === "unblock") {
      Object.assign(set, { isBlocked: false, blockedMessage: "" });
      Object.assign(log, { until: currentUntil });
    } else if (action === "update") {
      const fee = num(body.monthlyFee);
      if (body.monthlyFee !== undefined) {
        if (!Number.isFinite(fee) || fee < 0) return bad("Oylik to'lov noto'g'ri");
        set.monthlyFee = Math.round(fee);
      }
      if (body.adminNote !== undefined) set.adminNote = str(body.adminNote, 500);
      Object.assign(log, { note: `Oylik to'lov: ${set.monthlyFee ?? place.monthlyFee ?? 0}` });
    } else {
      return bad("Unknown action");
    }

    // updateOne — eski hujjatlardagi boshqa maydonlarni validatsiyadan o'tkazmasdan faqat shu maydonlarni yozadi
    await EstablishmentModel.updateOne({ _id: place._id }, { $set: set });
    await AccessLogModel.create({
      ...log,
      establishmentId: place._id,
      slug: place.slug,
      name: place.name,
      byUid: auth.admin.uid,
      byEmail: auth.admin.email,
    });

    const updated = (await EstablishmentModel.findById(id).select(PLACE_FIELDS).lean()) as unknown as PlaceLean;
    const owner = (await UserModel.findOne({ firebaseUid: updated.ownerId || updated.userId })
      .select("email fullName")
      .lean()) as unknown as { email?: string; fullName?: string } | null;

    return NextResponse.json({ place: serializePlace(updated, owner) }, { headers: noStore });
  } catch (error) {
    console.error("[API /api/superadmin/places/[id] POST] Failed", error);
    return NextResponse.json({ error: "Failed to update place" }, { status: 500 });
  }
}
