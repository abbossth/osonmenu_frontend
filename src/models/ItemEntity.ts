import { Schema, model, models, type Types } from "mongoose";

type MenuLocalizedText = { uz?: string; ru?: string; en?: string };

export type ItemEntityDocument = {
  establishmentId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  nameI18n?: MenuLocalizedText;
  description?: string;
  descriptionI18n?: MenuLocalizedText;
  price: number;
  imageUrl?: string;
  badge?: "popular" | "new" | null;
  isVisible?: boolean;
  isAvailable?: boolean;
  addonIds?: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

const itemEntitySchema = new Schema<ItemEntityDocument>(
  {
    establishmentId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Establishment" },
    categoryId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "CategoryEntity" },
    name: { type: String, required: true, trim: true },
    nameI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    description: { type: String, default: "", trim: true },
    descriptionI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    badge: { type: String, enum: ["popular", "new", null], default: null },
    isVisible: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    addonIds: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, timestamps: true },
);

itemEntitySchema.index({ establishmentId: 1, categoryId: 1, order: 1 });

export const ItemEntityModel = models.ItemEntity || model<ItemEntityDocument>("ItemEntity", itemEntitySchema);
