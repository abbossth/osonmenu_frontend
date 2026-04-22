import type { EstablishmentDocument } from "@/models/Establishment";

type LangValue = { uz: string; ru: string; en: string };

type StaticCategory = {
  id: string;
  imageUrl: string;
  label: LangValue;
};

type StaticSalad = {
  id: string;
  name: LangValue;
  price: number;
};

export const KHIVA_CATEGORIES: StaticCategory[] = [
  {
    id: "salads",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=70",
    label: { uz: "Salatlar", ru: "САЛАТЫ", en: "SALADS" },
  },
  {
    id: "cold",
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=1200&q=70",
    label: { uz: "Sovuq gazaklar", ru: "ХОЛОДНЫЕ ЗАКУСКИ", en: "COLD APPETIZERS" },
  },
  {
    id: "garnish",
    imageUrl: "https://images.unsplash.com/photo-1543339318-b43dc53e19b3?auto=format&fit=crop&w=1200&q=70",
    label: { uz: "Garnir / sous", ru: "ГАРНИР СОУСА", en: "SIDES & SAUCES" },
  },
  {
    id: "soups",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=70",
    label: { uz: "Sho'rvalar", ru: "СУПЫ", en: "SOUPS" },
  },
  {
    id: "main",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=70",
    label: { uz: "Asosiy taomlar", ru: "ОСНОВНЫЕ БЛЮДА", en: "MAIN DISHES" },
  },
];

export const KHIVA_SALADS: StaticSalad[] = [
  { id: "crispy_eggplant", name: { uz: "Qarsildoq baqlajon", ru: "Хрустящие баклажан", en: "Crispy Eggplant" }, price: 50000 },
  { id: "greek", name: { uz: "Grekcha salat", ru: "Греческий салат", en: "Greek Salad" }, price: 45000 },
  { id: "osiya", name: { uz: "Osiya salati", ru: "Салат Осия", en: "Osiya Salad" }, price: 55000 },
  { id: "caesar_chicken", name: { uz: "Tovuqli Sezar", ru: "Цезарь с курицей", en: "Caesar with Chicken" }, price: 45000 },
  { id: "achichuk", name: { uz: "Achchiq-chuchuk", ru: "Аччик чучик", en: "Achichuk" }, price: 25000 },
  { id: "chirokchi", name: { uz: "Chiroqchi", ru: "Чирокчи", en: "Chirokchi" }, price: 35000 },
];

function byLanguage<T extends LangValue>(value: T, language: EstablishmentDocument["language"]) {
  return value[language] || value.uz;
}

export function buildKhivaMenu(language: EstablishmentDocument["language"]) {
  return KHIVA_CATEGORIES.map((category, categoryIndex) => {
    if (category.id !== "salads") {
      return {
        name: byLanguage(category.label, language),
        order: categoryIndex,
        items: [],
      };
    }

    return {
      name: byLanguage(category.label, language),
      order: categoryIndex,
      items: KHIVA_SALADS.map((item, itemIndex) => ({
        name: byLanguage(item.name, language),
        description: "",
        price: item.price,
        imageUrl: category.imageUrl,
        badge: null,
        order: itemIndex,
      })),
    };
  });
}
