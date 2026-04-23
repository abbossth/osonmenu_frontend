type Language = "uz" | "ru" | "en";

type LocalizedText = Record<Language, string>;

type DefaultItem = {
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  imageUrl: string;
  badge?: "popular" | "new" | null;
};

type DefaultCategory = {
  name: LocalizedText;
  items: DefaultItem[];
};

const DEFAULT_MENU: DefaultCategory[] = [
  {
    name: { uz: "Food", ru: "Еда", en: "Food" },
    items: [
      {
        name: { uz: "Margherita Pizza", ru: "Пицца Маргарита", en: "Margherita Pizza" },
        description: {
          uz: "Pomidor sousi, mozzarella va rayhon",
          ru: "Томатный соус, моцарелла и базилик",
          en: "Tomato sauce, mozzarella and basil",
        },
        price: 59000,
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
        badge: "popular",
      },
      {
        name: { uz: "Chicken Burger", ru: "Куриный бургер", en: "Chicken Burger" },
        description: {
          uz: "Tovuq filesi, salat va maxsus sous",
          ru: "Куриное филе, салат и фирменный соус",
          en: "Chicken fillet, lettuce and signature sauce",
        },
        price: 48000,
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
        badge: null,
      },
      {
        name: { uz: "Steak", ru: "Стейк", en: "Steak" },
        description: {
          uz: "Grilda pishirilgan mol go'shti",
          ru: "Говяжий стейк на гриле",
          en: "Grilled beef steak",
        },
        price: 89000,
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        badge: "new",
      },
    ],
  },
  {
    name: { uz: "Drinks", ru: "Напитки", en: "Drinks" },
    items: [
      {
        name: { uz: "Mojito", ru: "Мохито", en: "Mojito" },
        description: {
          uz: "Limon, yalpiz va gazli suv",
          ru: "Лимон, мята и газированная вода",
          en: "Lemon, mint and sparkling water",
        },
        price: 29000,
        imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
        badge: null,
      },
      {
        name: { uz: "Iced Tea", ru: "Холодный чай", en: "Iced Tea" },
        description: {
          uz: "Limonli muzli choy",
          ru: "Холодный чай с лимоном",
          en: "Chilled tea with lemon",
        },
        price: 22000,
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
        badge: null,
      },
    ],
  },
  {
    name: { uz: "Salads", ru: "Салаты", en: "Salads" },
    items: [
      {
        name: { uz: "Greek Salad", ru: "Греческий салат", en: "Greek Salad" },
        description: {
          uz: "Yangi sabzavotlar va feta pishlog'i",
          ru: "Свежие овощи и сыр фета",
          en: "Fresh vegetables and feta cheese",
        },
        price: 39000,
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
        badge: null,
      },
      {
        name: { uz: "Caesar", ru: "Цезарь", en: "Caesar" },
        description: {
          uz: "Tovuq, salat bargi va sezar sousi",
          ru: "Курица, листья салата и соус цезарь",
          en: "Chicken, lettuce and caesar dressing",
        },
        price: 44000,
        imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
        badge: "popular",
      },
    ],
  },
  {
    name: { uz: "Desserts", ru: "Десерты", en: "Desserts" },
    items: [
      {
        name: { uz: "Cheesecake", ru: "Чизкейк", en: "Cheesecake" },
        description: {
          uz: "Yengil va qaymoqli desert",
          ru: "Нежный сливочный десерт",
          en: "Light and creamy dessert",
        },
        price: 34000,
        imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=80",
        badge: null,
      },
      {
        name: { uz: "Chocolate Fondant", ru: "Шоколадный фондан", en: "Chocolate Fondant" },
        description: {
          uz: "Issiq shokoladli desert",
          ru: "Теплый шоколадный десерт",
          en: "Warm chocolate dessert",
        },
        price: 37000,
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
        badge: "new",
      },
    ],
  },
];

function translate(value: LocalizedText, language: Language) {
  return value[language] || value.uz;
}

export function buildDefaultMenu(language: Language) {
  const defaultMenuName = translate({ uz: "Menu", ru: "Меню", en: "Menu" }, language);
  return DEFAULT_MENU.map((category, categoryIndex) => ({
    menuId: "main",
    menuName: defaultMenuName,
    name: translate(category.name, language),
    order: categoryIndex,
    items: category.items.map((item, itemIndex) => ({
      name: translate(item.name, language),
      description: translate(item.description, language),
      price: item.price,
      imageUrl: item.imageUrl,
      badge: item.badge ?? null,
      order: itemIndex,
    })),
  }));
}
