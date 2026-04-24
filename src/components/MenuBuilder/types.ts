export type MenuBadge = "popular" | "new" | null;
export type MenuLocalizedText = {
  uz: string;
  ru: string;
  en: string;
};

export type MenuItem = {
  _id: string;
  name: string;
  nameI18n: MenuLocalizedText;
  description: string;
  descriptionI18n: MenuLocalizedText;
  price: number;
  imageUrl: string;
  badge: MenuBadge;
  isVisible?: boolean;
  isAvailable?: boolean;
  addonIds?: string[];
  order: number;
};

export type MenuAddonOption = {
  id: string;
  name: string;
  nameI18n: MenuLocalizedText;
  price: number;
  order: number;
};

export type MenuAddonGroup = {
  id: string;
  name: string;
  nameI18n: MenuLocalizedText;
  type: "single" | "multiple";
  options: MenuAddonOption[];
  isVisible: boolean;
  order: number;
};

export type MenuScheduledPrice = {
  id: string;
  targetType: "item" | "addon";
  targetId: string;
  targetName: string;
  price: number;
  startAt: string;
  enabled: boolean;
};

export type MenuCategory = {
  _id: string;
  menuId: string;
  menuName: string;
  name: string;
  nameI18n: MenuLocalizedText;
  description: string;
  imageUrl: string;
  isVisible: boolean;
  order: number;
  items: MenuItem[];
};

export type MenuGroup = {
  id: string;
  name: string;
  order?: number;
  isVisible?: boolean;
  categories: MenuCategory[];
};

export type MenuPlace = {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  colorTheme: "light" | "dark";
  color: string;
  currencySymbol: string;
  logoUrl: string;
  backgroundImage: string;
  wifiPassword: string;
  phone: string;
  guestsCanOrder: boolean;
  hideMenuButtons: boolean;
  country: string;
  city: string;
  address: string;
  googleMapsLink: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  tripAdvisor: string;
  googleReviews: string;
  additionalInfo: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
  enabledLanguages?: Array<"uz" | "ru" | "en">;
  menus: MenuGroup[];
  categories: MenuCategory[];
  addons?: MenuAddonGroup[];
  scheduledPrices?: MenuScheduledPrice[];
};

