"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PhoneMenuMockup } from "@/components/landing/phone-menu-mockup";
import { useTheme } from "@/components/theme-provider";
import { LANDING_IMAGES } from "@/lib/landing-images";

type Lang = "uz" | "en" | "ru";

const translations = {
  uz: {
    brand: "osonmenu",
    status: "QR menu platformasi",
    panelLabelLanguage: "Til",
    panelLabelTheme: "Rejim",
    navShowcase: "Galereya",
    navBenefits: "Afzalliklar",
    navPricing: "Tariflar",
    navFaq: "FAQ",
    navContact: "Bog'lanish",
    navCta: "Boshlash",
    heroEyebrow: "Restoran · kafe · bar",
    heroTitle: "Mijozlar ko'zi oldida chiroyli raqamli menyu — bir QR bilan",
    heroDescription:
      "Suratlar, tavsiflar, aksiyalar va ko'p tillilik bitta zamonaviy menyuda. Siz esa narx va taomlarni bir necha soniya ichida yangilaysiz.",
    ctaPrimary: "Demo olish",
    ctaSecondary: "Ko'rinishni ochish",
    metric1: "30 kun",
    metric1Label: "bepul sinov",
    metric2: "3 til",
    metric2Label: "mijoz uchun",
    metric3: "24/7",
    metric3Label: "onlayn menyu",
    phoneTag: "QR menu",
    phoneRestaurant: "Oson Grill",
    phoneSection: "Mashhur taomlar",
    phoneCartSummary: "3 ta mahsulot",
    phoneCartTotal: "255 000 so'm",
    phoneItems: [
      { name: "Smash burger", price: "89 000 so'm", badge: "Yangi" },
      { name: "Lavash maxi", price: "55 000 so'm" },
      { name: "Limonad chiller", price: "28 000 so'm", badge: "Aksiya" },
    ],
    bentoTitle: "Menyu shunchaki ro'yxat emas — sotuv vositasi",
    bentoSubtitle:
      "Taom suratlari, aniq narxlar va til almashtirish mijozda ishonch va iştaha yaratadi.",
    bento: [
      {
        title: "Vizual sotuv",
        body: "Har bir pozitsiya surat va tavsif bilan — o'rtacha chek oshadi.",
      },
      {
        title: "Tez yangilanish",
        body: "Yangi taom yoki narxni bir zumda qo'shing, qayta chop etish shart emas.",
      },
      {
        title: "Turistlar uchun",
        body: "Bir tugma bilan UZ / EN / RU — xizmat sifati yuqori ko'rinadi.",
      },
      {
        title: "QR tayyor",
        body: "Stol, eshik yoki vitrina uchun tayyor QR va havola.",
      },
    ],
    showcaseTitle: "Restoran muhitiga mos dizayn",
    showcaseSubtitle:
      "Qorong'u zal yorug' interyer — menyumiz ikkala rejimda ham o'qiladi va brendingiz ajralib turadi.",
    whyTitle: "Nega aynan osonmenu?",
    whyItems: [
      "Qog'oz menyu va PDFdan ancha interaktiv",
      "Buyurtma va savol uchun kamroq kutish",
      "Aksiya va combo'larni bir joyda ko'rsatish",
      "Xodimlar uchun qulay admin panel",
    ],
    howTitle: "4 qadamda ishga tushadi",
    howSteps: [
      "1. Profil va bo'limlarni yaratamiz",
      "2. Taomlar, narxlar, suratlar",
      "3. QR kodlarni joylashtirasiz",
      "4. Mijozlar menyuni ochadi — siz nazorat qilasiz",
    ],
    pricingTitle: "Tariflar",
    pricingSubtitle: "1 oy — 120 000 so'mdan. Uzoqroq muddat — yanada arzon.",
    period: "muddat",
    som: "so'm",
    featured: "Eng ommabop",
    monthlyText: "oyiga",
    vatText: "QQS alohida hisoblanishi mumkin",
    plans: [
      { name: "Oylik", price: "120 000", description: "Tez start, minimal xavf." },
      { name: "3 oylik", price: "330 000", description: "Moslashuvchan, tejamkor." },
      {
        name: "6 oylik",
        price: "600 000",
        description: "Ko'pchilik tanlaydigan balans.",
        featured: true,
      },
      { name: "1 yillik", price: "1 080 000", description: "Eng yaxshi narxdagi yillik." },
    ],
    featuresTitle: "Tarif ichida nimalar bor",
    includedFeatures: [
      "Cheksiz bo'lim va taomlar",
      "QR generator va chop etish uchun fayl",
      "Mobil va web admin",
      "Xodim rollari",
      "3 til (UZ / EN / RU)",
      "Aksiya, eski/yangi narx, vaqtincha yopish",
      "Cheksiz ko'rish va skan",
      "Havola (Google Maps, ijtimoiy tarmoq)",
    ],
    faqTitle: "Savollar",
    faqs: [
      {
        q: "Qog'oz menyu bilan solishtirganda nimasi yaxshi?",
        a: "Har doim dolzarb, tez tahrirlanadi va mijoz kutish vaqtini qisqartiradi.",
      },
      {
        q: "PDF menyudan farqi?",
        a: "PDF statik. Bizda surat, tavsif, aksiya va til almashtirish bor.",
      },
      {
        q: "Har o'zgarish uchun sizga yozish kerakmi?",
        a: "Yo'q, panel orqali o'zingiz yoki jamoa boshqaradi.",
      },
      {
        q: "Sinab ko'rish mumkinmi?",
        a: "Ha — 30 kun bepul.",
      },
    ],
    contactTitle: "Brendingiz uchun demo tayyorlaymiz",
    contactDescription:
      "Telefon yoki Telegram orqali yozing — 24 soat ichida namuna menyuni ko'rsatamiz.",
    contactButton: "Bog'lanish",
    light: "Yorqin",
    dark: "Qora",
    footerNote: "© 2026 osonmenu. Barcha huquqlar himoyalangan.",
  },
  en: {
    brand: "osonmenu",
    status: "QR menu platform",
    panelLabelLanguage: "Language",
    panelLabelTheme: "Theme",
    navShowcase: "Gallery",
    navBenefits: "Benefits",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navContact: "Contact",
    navCta: "Get started",
    heroEyebrow: "Restaurant · cafe · bar",
    heroTitle: "A stunning digital menu your guests actually enjoy — one QR away",
    heroDescription:
      "Photos, descriptions, promos, and multilingual switching in one modern menu. Update dishes and prices in seconds from a single panel.",
    ctaPrimary: "Get a demo",
    ctaSecondary: "See the look",
    metric1: "30 days",
    metric1Label: "free trial",
    metric2: "3 languages",
    metric2Label: "for guests",
    metric3: "24/7",
    metric3Label: "online menu",
    phoneTag: "QR menu",
    phoneRestaurant: "Oson Grill",
    phoneSection: "Popular picks",
    phoneCartSummary: "3 items",
    phoneCartTotal: "255,000 UZS",
    phoneItems: [
      { name: "Smash burger", price: "89,000 UZS", badge: "New" },
      { name: "Lavash maxi", price: "55,000 UZS" },
      { name: "Chiller lemonade", price: "28,000 UZS", badge: "Sale" },
    ],
    bentoTitle: "Your menu is not a list — it is a sales surface",
    bentoSubtitle:
      "Food photography, clear pricing, and language switching build trust and appetite.",
    bento: [
      {
        title: "Visual selling",
        body: "Every item with photo and story — higher average check.",
      },
      {
        title: "Fast updates",
        body: "Add a dish or change a price instantly — no reprints.",
      },
      {
        title: "Tourist-ready",
        body: "One tap UZ / EN / RU — better service perception.",
      },
      {
        title: "QR-ready",
        body: "Print-ready QR and a shareable link for tables and maps.",
      },
    ],
    showcaseTitle: "Designed for real restaurant lighting",
    showcaseSubtitle:
      "Dark dining room or bright terrace — the menu stays readable and on-brand.",
    whyTitle: "Why osonmenu?",
    whyItems: [
      "More interactive than paper or PDF",
      "Less waiting, smoother ordering flow",
      "Promos and combos in one place",
      "Easy admin for your team",
    ],
    howTitle: "Live in four steps",
    howSteps: [
      "1. We set up profile and categories",
      "2. Dishes, prices, and photos",
      "3. You place QR codes",
      "4. Guests browse — you stay in control",
    ],
    pricingTitle: "Pricing",
    pricingSubtitle: "From 120,000 UZS / month. Longer terms — better value.",
    period: "term",
    som: "UZS",
    featured: "Most popular",
    monthlyText: "/ month",
    vatText: "VAT may apply separately",
    plans: [
      { name: "Monthly", price: "120,000", description: "Low risk, quick start." },
      { name: "3 months", price: "330,000", description: "Flexible and cheaper." },
      {
        name: "6 months",
        price: "600,000",
        description: "Best balance for growing venues.",
        featured: true,
      },
      { name: "1 year", price: "1,080,000", description: "Best annual value." },
    ],
    featuresTitle: "Included in every plan",
    includedFeatures: [
      "Unlimited categories and items",
      "QR generator and print assets",
      "Mobile and web admin",
      "Staff roles",
      "3 languages (UZ / EN / RU)",
      "Promos, old/new price, hide item",
      "Unlimited views and scans",
      "Shareable link (Maps, social)",
    ],
    faqTitle: "FAQ",
    faqs: [
      {
        q: "Why not keep paper menus?",
        a: "Digital stays fresh, saves print costs, and speeds up ordering.",
      },
      {
        q: "How is this better than PDF?",
        a: "PDF is static. We offer photos, promos, languages, and instant edits.",
      },
      {
        q: "Do we message you for every edit?",
        a: "No — your team manages everything in the admin panel.",
      },
      {
        q: "Can we try first?",
        a: "Yes — 30 days free.",
      },
    ],
    contactTitle: "We will prepare a demo for your brand",
    contactDescription:
      "Message us on phone or Telegram — we show a sample menu within 24 hours.",
    contactButton: "Contact",
    light: "Light",
    dark: "Dark",
    footerNote: "© 2026 osonmenu. All rights reserved.",
  },
  ru: {
    brand: "osonmenu",
    status: "Платформа QR-меню",
    panelLabelLanguage: "Язык",
    panelLabelTheme: "Режим",
    navShowcase: "Галерея",
    navBenefits: "Преимущества",
    navPricing: "Тарифы",
    navFaq: "FAQ",
    navContact: "Контакты",
    navCta: "Начать",
    heroEyebrow: "Ресторан · кафе · бар",
    heroTitle: "Красивое цифровое меню, которое гости реально открывают — один QR",
    heroDescription:
      "Фото, описания, акции и переключение языков в одном современном меню. Цены и блюда обновляются за секунды из одной панели.",
    ctaPrimary: "Запросить демо",
    ctaSecondary: "Посмотреть стиль",
    metric1: "30 дней",
    metric1Label: "бесплатно",
    metric2: "3 языка",
    metric2Label: "для гостей",
    metric3: "24/7",
    metric3Label: "онлайн-меню",
    phoneTag: "QR-меню",
    phoneRestaurant: "Oson Grill",
    phoneSection: "Популярное",
    phoneCartSummary: "3 позиции",
    phoneCartTotal: "255 000 сум",
    phoneItems: [
      { name: "Смэш-бургер", price: "89 000 сум", badge: "Новинка" },
      { name: "Лаваш макси", price: "55 000 сум" },
      { name: "Лимонад чиллер", price: "28 000 сум", badge: "Акция" },
    ],
    bentoTitle: "Меню — не список, а поверхность продаж",
    bentoSubtitle:
      "Фуд-фото, понятные цены и языки повышают доверие и аппетит.",
    bento: [
      {
        title: "Визуальные продажи",
        body: "Каждая позиция с фото и историей — выше средний чек.",
      },
      {
        title: "Быстрые обновления",
        body: "Новое блюдо или цена — мгновенно, без перепечатки.",
      },
      {
        title: "Для туристов",
        body: "UZ / EN / RU в один тап — сервис выглядит дороже.",
      },
      {
        title: "Готово к QR",
        body: "QR для столов и ссылка для карт и соцсетей.",
      },
    ],
    showcaseTitle: "Под реальное освещение зала",
    showcaseSubtitle:
      "Тёмный зал или светлая терраса — меню остаётся читаемым и в стиле бренда.",
    whyTitle: "Почему osonmenu?",
    whyItems: [
      "Интерактивнее бумаги и PDF",
      "Меньше ожидания, проще заказ",
      "Акции и комбо в одном месте",
      "Удобная админка для команды",
    ],
    howTitle: "Запуск за 4 шага",
    howSteps: [
      "1. Профиль и категории",
      "2. Блюда, цены, фото",
      "3. Размещаете QR",
      "4. Гости смотрят — вы управляете",
    ],
    pricingTitle: "Тарифы",
    pricingSubtitle: "От 120 000 сум в месяц. Дольше срок — выгоднее.",
    period: "срок",
    som: "сум",
    featured: "Популярный",
    monthlyText: "в месяц",
    vatText: "НДС может начисляться отдельно",
    plans: [
      { name: "1 месяц", price: "120 000", description: "Быстрый старт." },
      { name: "3 месяца", price: "330 000", description: "Гибко и дешевле." },
      {
        name: "6 месяцев",
        price: "600 000",
        description: "Лучший баланс.",
        featured: true,
      },
      { name: "1 год", price: "1 080 000", description: "Максимальная выгода." },
    ],
    featuresTitle: "Что входит в тариф",
    includedFeatures: [
      "Безлимит категорий и позиций",
      "Генератор QR и файлы для печати",
      "Админка: мобильная и web",
      "Роли сотрудников",
      "3 языка (UZ / EN / RU)",
      "Акции, старая/новая цена, скрытие",
      "Безлимит просмотров и сканов",
      "Ссылка для карт и соцсетей",
    ],
    faqTitle: "Вопросы",
    faqs: [
      {
        q: "Чем лучше бумажного меню?",
        a: "Всегда актуально, дешевле в поддержке, быстрее заказ.",
      },
      {
        q: "Чем лучше PDF?",
        a: "PDF статичен. У нас фото, акции, языки и мгновенные правки.",
      },
      {
        q: "Нужно писать вам при каждом изменении?",
        a: "Нет — всё в админ-панели.",
      },
      {
        q: "Есть пробный период?",
        a: "Да — 30 дней бесплатно.",
      },
    ],
    contactTitle: "Подготовим демо под ваш бренд",
    contactDescription:
      "Напишите в Telegram или позвоните — покажем пример меню за 24 часа.",
    contactButton: "Связаться",
    light: "Светлый",
    dark: "Тёмный",
    footerNote: "© 2026 osonmenu. Все права защищены.",
  },
} as const;

const bentoPhotos = [
  LANDING_IMAGES.bento1,
  LANDING_IMAGES.bento2,
  LANDING_IMAGES.bento3,
  LANDING_IMAGES.bento4,
] as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("uz");
  const { theme, setTheme } = useTheme();
  const t = useMemo(() => translations[lang], [lang]);
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/brand/logo-dark-bg.png" : "/brand/logo-light-bg.png";

  const phoneItems = t.phoneItems.map((item, i) => ({
    name: item.name,
    price: item.price,
    badge: "badge" in item && item.badge ? item.badge : undefined,
    image: [LANDING_IMAGES.dishThumb1, LANDING_IMAGES.dishThumb2, LANDING_IMAGES.dishThumb3][i]!,
  }));

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/85">
        <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <Image
              src={logoSrc}
              alt="osonmenu"
              width={160}
              height={64}
              className="h-9 w-auto rounded-lg"
              priority
            />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              {t.brand}
            </span>
          </a>

          <nav className="order-3 hidden w-full items-center justify-center gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-300 md:order-none md:flex md:w-auto">
            <a className="transition hover:text-blue-600 dark:hover:text-blue-400" href="#showcase">
              {t.navShowcase}
            </a>
            <a className="transition hover:text-blue-600 dark:hover:text-blue-400" href="#benefits">
              {t.navBenefits}
            </a>
            <a className="transition hover:text-blue-600 dark:hover:text-blue-400" href="#pricing">
              {t.navPricing}
            </a>
            <a className="transition hover:text-blue-600 dark:hover:text-blue-400" href="#faq">
              {t.navFaq}
            </a>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
              {(["uz", "en", "ru"] as Lang[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase ${
                    lang === item
                      ? "bg-blue-600 text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  !isDark ? "bg-amber-400 text-neutral-900" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {t.light}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  isDark ? "bg-blue-600 text-white" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {t.dark}
              </button>
            </div>
            <a
              href="#contact"
              className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 sm:inline-flex"
            >
              {t.navCta}
            </a>
          </div>
        </header>
      </div>

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-2xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40 lg:min-h-[580px]">
            <Image
              src={LANDING_IMAGES.heroAmbient}
              alt=""
              fill
              priority
              className="object-cover opacity-35 dark:opacity-20"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-blue-50/80 dark:from-neutral-950 dark:via-neutral-950/95 dark:to-blue-950/40" />
            <div className="relative grid items-center gap-12 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-16">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {t.heroEyebrow}
                </p>
                <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {t.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500"
                  >
                    {t.ctaPrimary}
                  </a>
                  <a
                    href="#showcase"
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-300/90 bg-amber-50 px-6 py-3.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50"
                  >
                    {t.ctaSecondary}
                  </a>
                </div>
                <div className="mt-10 grid grid-cols-3 gap-3 border-t border-neutral-200/80 pt-8 dark:border-neutral-800">
                  {[
                    { value: t.metric1, label: t.metric1Label },
                    { value: t.metric2, label: t.metric2Label },
                    { value: t.metric3, label: t.metric3Label },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 sm:text-xl">
                        {m.value}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="absolute -right-6 top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-to-tr from-fuchsia-500/20 via-blue-500/20 to-amber-400/25 blur-3xl lg:block" />
                <PhoneMenuMockup
                  menuTag={t.phoneTag}
                  restaurant={t.phoneRestaurant}
                  section={t.phoneSection}
                  items={phoneItems}
                  cartSummary={t.phoneCartSummary}
                  cartTotal={t.phoneCartTotal}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bento gallery */}
        <section id="showcase" className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.bentoTitle}</h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t.bentoSubtitle}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.bento.map((cell, i) => (
              <article
                key={cell.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={bentoPhotos[i]!}
                    alt={cell.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
                    {cell.title}
                  </p>
                </div>
                <p className="flex-1 p-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {cell.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Wide showcase */}
        <section id="experience" className="relative mx-5 mb-20 overflow-hidden rounded-[2rem] border border-neutral-200 dark:border-neutral-800 sm:mx-6 lg:mx-auto lg:max-w-7xl">
          <div className="relative aspect-[21/9] min-h-[280px] w-full sm:min-h-[360px]">
            <Image
              src={LANDING_IMAGES.wideShowcase}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex max-w-xl flex-col justify-center px-8 py-10 sm:px-12">
              <h2 className="text-2xl font-semibold text-white sm:text-4xl">{t.showcaseTitle}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
                {t.showcaseSubtitle}
              </p>
              <a
                href="#pricing"
                className="mt-8 inline-flex w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-amber-50"
              >
                {t.navPricing} →
              </a>
            </div>
          </div>
        </section>

        {/* Benefits + how */}
        <section id="benefits" className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-xl font-semibold sm:text-2xl">{t.whyTitle}</h2>
              <ul className="mt-6 space-y-3">
                {t.whyItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950/50"
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <span className="text-neutral-700 dark:text-neutral-200">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-600/20">
              <h2 className="text-xl font-semibold sm:text-2xl">{t.howTitle}</h2>
              <ol className="mt-6 space-y-4">
                {t.howSteps.map((step) => (
                  <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/95">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold">
                      {step.slice(0, 1)}
                    </span>
                    <span>{step.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">{t.pricingTitle}</h2>
              <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">{t.pricingSubtitle}</p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.plans.map((plan) => {
              const isFeatured = "featured" in plan && plan.featured;
              return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  isFeatured
                    ? "border-blue-500 bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-600/30"
                    : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                }`}
              >
                {isFeatured ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {t.featured}
                  </span>
                ) : null}
                <p className="text-lg font-semibold">{plan.name}</p>
                <p className={`mt-4 text-3xl font-bold ${isFeatured ? "" : "text-neutral-900 dark:text-white"}`}>
                  {plan.price}{" "}
                  <span className={`text-base font-semibold ${isFeatured ? "text-white/80" : "text-neutral-500"}`}>
                    {t.som}
                  </span>
                </p>
                <p
                  className={`mt-1 text-xs uppercase tracking-wide ${isFeatured ? "text-white/70" : "text-neutral-500"}`}
                >
                  {t.period} · {t.monthlyText}
                </p>
                <p className={`mt-4 flex-1 text-sm ${isFeatured ? "text-white/90" : "text-neutral-600 dark:text-neutral-300"}`}>
                  {plan.description}
                </p>
              </article>
            );
            })}
          </div>
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">{t.vatText}</p>
        </section>

        {/* Features grid */}
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
          <div className="rounded-[2rem] border border-neutral-200 bg-white px-6 py-10 dark:border-neutral-800 dark:bg-neutral-900 sm:px-10">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">{t.featuresTitle}</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.includedFeatures.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950/50"
                >
                  <span className="text-emerald-500" aria-hidden>
                    ✓
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-5 pb-20 sm:px-6">
          <h2 className="text-center text-2xl font-semibold">{t.faqTitle}</h2>
          <div className="mt-8 space-y-2">
            {t.faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-neutral-200 bg-white px-4 py-1 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <summary className="cursor-pointer list-none py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-neutral-400 transition group-open:rotate-180">▼</span>
                  </span>
                </summary>
                <p className="border-t border-neutral-100 pb-4 pt-2 text-sm leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-blue-200/50 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-2xl sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-xl">
              <h2 className="text-2xl font-semibold sm:text-3xl">{t.contactTitle}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">{t.contactDescription}</p>
              <button
                type="button"
                className="mt-8 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-amber-50"
              >
                {t.contactButton}
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          {t.footerNote}
        </footer>
      </main>
    </div>
  );
}
