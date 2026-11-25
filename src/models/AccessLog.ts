import { Schema, Types, model, models } from "mongoose";

/** Super-admin amallari va to'lovlar tarixi (faqat qo'shiladi, o'zgartirilmaydi). */
export type AccessLogDocument = {
  establishmentId: Types.ObjectId;
  slug: string;
  name: string;
  type: "extend" | "block" | "unblock" | "update";
  amount?: number;
  period?: string;
  from?: Date | null;
  until?: Date | null;
  note?: string;
  byUid: string;
  byEmail?: string;
  createdAt: Date;
};

const accessLogSchema = new Schema<AccessLogDocument>(
  {
    establishmentId: { type: Schema.Types.ObjectId, ref: "Establishment", required: true, index: true },
    slug: { type: String, default: "" },
    name: { type: String, default: "" },
    type: { type: String, enum: ["extend", "block", "unblock", "update"], required: true },
    amount: { type: Number, default: 0 },
    period: { type: String, default: "" },
    from: { type: Date, default: null },
    until: { type: Date, default: null },
    note: { type: String, default: "", trim: true },
    byUid: { type: String, required: true },
    byEmail: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false, collection: "accesslogs" },
);

export const AccessLogModel = models.AccessLog || model<AccessLogDocument>("AccessLog", accessLogSchema);
