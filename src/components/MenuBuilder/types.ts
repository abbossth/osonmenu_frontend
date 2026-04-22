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
  order: number;
};

export type MenuCategory = {
  _id: string;
  name: string;
  nameI18n: MenuLocalizedText;
  description: string;
  imageUrl: string;
  isVisible: boolean;
  order: number;
  items: MenuItem[];
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
  categories: MenuCategory[];
};

