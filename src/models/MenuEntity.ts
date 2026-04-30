import { Schema, model, models, type Types } from "mongoose";

export type MenuEntityDocument = {
  establishmentId: Types.ObjectId;
  id: string;
  name: string;
  nameI18n?: { uz?: string; ru?: string; en?: string };
  order: number;
  isVisible?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const menuEntitySchema = new Schema<MenuEntityDocument>(
  {
    establishmentId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Establishment" },
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    order: { type: Number, required: true, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

menuEntitySchema.index({ establishmentId: 1, id: 1 }, { unique: true });
menuEntitySchema.index({ establishmentId: 1, order: 1 });

export const MenuEntityModel = models.MenuEntity || model<MenuEntityDocument>("MenuEntity", menuEntitySchema);
