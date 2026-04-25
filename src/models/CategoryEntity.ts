import { Schema, model, models, type Types } from "mongoose";

type MenuLocalizedText = { uz?: string; ru?: string; en?: string };

export type CategoryEntityDocument = {
  establishmentId: Types.ObjectId;
  menuId: string;
  menuName: string;
  name: string;
  nameI18n?: MenuLocalizedText;
  description?: string;
  imageUrl?: string;
  isVisible?: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

const categoryEntitySchema = new Schema<CategoryEntityDocument>(
  {
    establishmentId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Establishment" },
    menuId: { type: String, required: true, default: "main", trim: true },
    menuName: { type: String, required: true, default: "Menu", trim: true },
    name: { type: String, required: true, trim: true },
    nameI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, timestamps: true },
);

categoryEntitySchema.index({ establishmentId: 1, menuId: 1, order: 1 });

export const CategoryEntityModel =
  models.CategoryEntity || model<CategoryEntityDocument>("CategoryEntity", categoryEntitySchema);
