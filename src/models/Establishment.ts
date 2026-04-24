import { Schema, model, models } from "mongoose";

export type EstablishmentDocument = {
  ownerId: string;
  userId: string;
  name: string;
  slug: string;
  colorTheme?: "light" | "dark";
  color?: string;
  currencySymbol?: string;
  logoUrl?: string;
  backgroundImage?: string;
  wifiPassword?: string;
  phone?: string;
  guestsCanOrder?: boolean;
  hideMenuButtons?: boolean;
  country?: string;
  city?: string;
  address?: string;
  googleMapsLink?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  tripAdvisor?: string;
  googleReviews?: string;
  additionalInfo?: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
  categories: {
    _id: string;
    menuId: string;
    menuName: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isVisible?: boolean;
    order: number;
    items: {
      _id: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      badge?: "popular" | "new" | null;
      isVisible?: boolean;
      isAvailable?: boolean;
      addonIds?: string[];
      order: number;
    }[];
  }[];
  addons?: {
    id: string;
    name: string;
    nameI18n?: { uz?: string; ru?: string; en?: string };
    type: "single" | "multiple";
    options: {
      id: string;
      name: string;
      nameI18n?: { uz?: string; ru?: string; en?: string };
      price: number;
      order: number;
    }[];
    isVisible?: boolean;
    order: number;
  }[];
  scheduledPrices?: {
    id: string;
    targetType: "item" | "addon";
    targetId: string;
    targetName: string;
    price: number;
    startAt: Date;
    enabled?: boolean;
  }[];
  menus?: {
    id: string;
    name: string;
    order: number;
    isVisible?: boolean;
  }[];
  enabledLanguages?: Array<"uz" | "ru" | "en">;
  createdAt: Date;
};

const menuItemSchema = new Schema(
  {
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
  { _id: true },
);

const addonOptionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    price: { type: Number, required: true, min: 0 },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const addonGroupSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameI18n: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    type: { type: String, enum: ["single", "multiple"], default: "single" },
    options: { type: [addonOptionSchema], default: [] },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const scheduledPriceSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    targetType: { type: String, enum: ["item", "addon"], required: true },
    targetId: { type: String, required: true, trim: true },
    targetName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    startAt: { type: Date, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const menuCategorySchema = new Schema(
  {
    menuId: { type: String, default: "main", trim: true },
    menuName: { type: String, default: "Menu", trim: true },
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
    items: { type: [menuItemSchema], default: [] },
  },
  { _id: true },
);

const establishmentSchema = new Schema<EstablishmentDocument>(
  {
    ownerId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true, lowercase: true, trim: true },
    colorTheme: { type: String, enum: ["light", "dark"], default: "light" },
    color: { type: String, default: "#f7906c" },
    currencySymbol: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    wifiPassword: { type: String, default: "CoolWiFiPassword" },
    phone: { type: String, default: "" },
    guestsCanOrder: { type: Boolean, default: true },
    hideMenuButtons: { type: Boolean, default: false },
    country: { type: String, default: "The Best Country", trim: true },
    city: { type: String, default: "Awesome City", trim: true },
    address: { type: String, default: "", trim: true },
    googleMapsLink: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    twitter: { type: String, default: "", trim: true },
    tripAdvisor: { type: String, default: "", trim: true },
    googleReviews: { type: String, default: "", trim: true },
    additionalInfo: { type: String, default: "Here you can add any additional information about your QR code menu", trim: true },
    currency: { type: String, required: true, enum: ["UZS", "USD"] },
    language: { type: String, required: true, enum: ["uz", "ru", "en"] },
    enabledLanguages: { type: [String], default: ["uz", "ru", "en"] },
    menus: {
      type: [
        new Schema(
          {
            id: { type: String, required: true, trim: true },
            name: { type: String, required: true, trim: true },
            order: { type: Number, required: true, default: 0 },
            isVisible: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: [{ id: "main", name: "Menu", order: 0, isVisible: true }],
    },
    categories: { type: [menuCategorySchema], default: [] },
    addons: { type: [addonGroupSchema], default: [] },
    scheduledPrices: { type: [scheduledPriceSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

establishmentSchema.pre("validate", function syncOwnerAndUser() {
  if (!this.ownerId && this.userId) {
    this.ownerId = this.userId;
  }
  if (!this.userId && this.ownerId) {
    this.userId = this.ownerId;
  }
});

establishmentSchema.index({ ownerId: 1, slug: 1 }, { unique: true });
establishmentSchema.index({ userId: 1, slug: 1 }, { unique: true });

export const EstablishmentModel =
  models.Establishment || model<EstablishmentDocument>("Establishment", establishmentSchema);
