"use client";

type Locale = "uz" | "ru" | "en";

export type MenuAccessInfo = {
  blocked: boolean;
  reason: "manual" | "expired" | null;
  paidUntil: string | null;
  daysLeft: number | null;
  message: string;
  paymentRequired?: boolean;
};

export type MenuBlockedInfo = {
  name: string;
  logoUrl: string;
  message: string;
  paymentRequired: boolean;
  isOwner: boolean;
  reason: "manual" | "expired" | null;
  paidUntil: string | null;
};

/** OsonMenu bilan bog'lanish (Vercel env): to'lov uchun restoran egasiga ko'rsatiladi. */
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ?? "";
const SUPPORT_TELEGRAM = (process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM?.trim() ?? "").replace(/^@|^https?:\/\/t\.me\//, "");

type ScreenText = {
  guestTitle: string;
  guestBody: string;
  ownerTitle: string;
  ownerExpired: (date: string) => string;
  ownerManual: string;
  ownerAction: string;
  noContact: string;
  call: string;
  telegram: string;
  profile: string;
  otherTitle: string;
  otherGuest: string;
  otherOwner: string;
};

const TEXT: Record<Locale, ScreenText> = {
  uz: {
    guestTitle: "Menyu vaqtincha o'chirilgan",
    guestBody:
      "Ushbu restoran OsonMenu xizmati uchun to'lovni amalga oshirmagani sababli menyu vaqtincha o'chirilgan. To'lov qilingach, menyu yana ochiladi.",
    ownerTitle: "To'lov talab qilinadi",
    ownerExpired: (d) => `OsonMenu obunangiz muddati ${d} kuni tugagan. Menyungiz mijozlar uchun yopildi.`,
    ownerManual: "To'lov qilinmagani sababli menyungiz o'chirib qo'yildi. Mijozlar menyuni ko'ra olmaydi.",
    ownerAction: "Menyuni qayta yoqish uchun to'lovni amalga oshiring va biz bilan bog'laning:",
    noContact: "Menyuni qayta yoqish uchun to'lovni amalga oshiring va OsonMenu administratoriga murojaat qiling.",
    call: "Qo'ng'iroq qilish",
    telegram: "Telegram orqali yozish",
    profile: "Profilga o'tish",
    otherTitle: "Menyu vaqtincha mavjud emas",
    otherGuest: "Iltimos, keyinroq urinib ko'ring yoki xodimlarga murojaat qiling.",
    otherOwner: "Menyungiz administrator tomonidan vaqtincha o'chirilgan. Batafsil ma'lumot uchun biz bilan bog'laning.",
  },
  ru: {
    guestTitle: "Меню временно отключено",
    guestBody:
      "Меню этого ресторана временно отключено из-за неоплаты сервиса OsonMenu. После оплаты меню снова станет доступно.",
    ownerTitle: "Требуется оплата",
    ownerExpired: (d) => `Срок вашей подписки OsonMenu истёк ${d}. Меню закрыто для гостей.`,
    ownerManual: "Ваше меню отключено из-за неоплаты. Гости не могут его открыть.",
    ownerAction: "Чтобы снова включить меню, оплатите подписку и свяжитесь с нами:",
    noContact: "Чтобы снова включить меню, оплатите подписку и свяжитесь с администратором OsonMenu.",
    call: "Позвонить",
    telegram: "Написать в Telegram",
    profile: "Перейти в профиль",
    otherTitle: "Меню временно недоступно",
    otherGuest: "Пожалуйста, попробуйте позже или обратитесь к персоналу.",
    otherOwner: "Ваше меню временно отключено администратором. Свяжитесь с нами для подробностей.",
  },
  en: {
    guestTitle: "Menu temporarily disabled",
    guestBody:
      "This restaurant's menu is temporarily disabled because its OsonMenu subscription has not been paid. It will be available again once payment is made.",
    ownerTitle: "Payment required",
    ownerExpired: (d) => `Your OsonMenu subscription expired on ${d}. Your menu is closed for guests.`,
    ownerManual: "Your menu has been disabled due to non-payment. Guests cannot open it.",
    ownerAction: "To turn your menu back on, make the payment and contact us:",
    noContact: "To turn your menu back on, make the payment and contact the OsonMenu administrator.",
    call: "Call",
    telegram: "Message on Telegram",
    profile: "Go to profile",
    otherTitle: "Menu temporarily unavailable",
    otherGuest: "Please try again later or ask the staff.",
    otherOwner: "Your menu has been temporarily disabled by the administrator. Contact us for details.",
  },
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000); // Toshkent vaqti
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/**
 * Menyu o'rniga ko'rsatiladigan ekran.
 * - To'lov sababli (muddat tugagan yoki "To'lov qilinmadi" bilan o'chirilgan): to'lov haqida xabar
 * - Egasi/jamoa: obuna holati + bog'lanish tugmalari
 */
export function MenuBlockedScreen({ locale, info }: { locale: Locale; info: MenuBlockedInfo }) {
  const t = TEXT[locale] ?? TEXT.uz;
  const { name, logoUrl, message, paymentRequired, isOwner } = info;

  const title = paymentRequired ? (isOwner ? t.ownerTitle : t.guestTitle) : t.otherTitle;
  const body = !paymentRequired
    ? isOwner ? t.otherOwner : t.otherGuest
    : !isOwner
      ? t.guestBody
      : info.reason === "expired" && info.paidUntil
        ? t.ownerExpired(fmtDate(info.paidUntil))
        : t.ownerManual;
  const hasContact = Boolean(SUPPORT_PHONE || SUPPORT_TELEGRAM);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 py-10 text-center text-neutral-100">
      <div className="w-full max-w-sm">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="mx-auto mb-5 h-20 w-20 rounded-2xl object-cover opacity-60 grayscale" />
        ) : null}
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${paymentRequired ? "bg-red-500/15 text-red-400" : "bg-orange-500/15 text-orange-400"} ${logoUrl ? "hidden" : ""}`}
        >
          {paymentRequired ? (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
              <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v2h16V7H4Zm0 5v5h16v-5H4Zm2 2h5v2H6v-2Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
              <path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3Z" />
            </svg>
          )}
        </div>
        {name ? <p className="mb-2 text-sm text-neutral-400">{name}</p> : null}
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-300">{body}</p>

        {isOwner ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <p className="text-sm leading-relaxed text-neutral-300">{hasContact ? t.ownerAction : t.noContact}</p>
            {hasContact ? (
              <div className="mt-3 flex flex-col gap-2">
                {SUPPORT_PHONE ? (
                  <a
                    href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {t.call}: {SUPPORT_PHONE}
                  </a>
                ) : null}
                {SUPPORT_TELEGRAM ? (
                  <a
                    href={`https://t.me/${SUPPORT_TELEGRAM}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {t.telegram}: @{SUPPORT_TELEGRAM}
                  </a>
                ) : null}
              </div>
            ) : null}
            <a
              href={`/${locale}/profile`}
              className="mt-2 flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-neutral-200"
            >
              {t.profile}
            </a>
          </div>
        ) : null}

        {message ? <p className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-sm">{message}</p> : null}
      </div>
    </div>
  );
}

const BANNER_TEXT: Record<Locale, { blocked: string; expired: string; soon: (d: number) => string; contact: string }> = {
  uz: {
    blocked: "Menyuingiz o'chirib qo'yilgan — mijozlar uni ko'ra olmaydi.",
    expired: "Obuna muddati tugagan — menyu mijozlar uchun yopiq.",
    soon: (d) => `Obuna muddati ${d} kundan keyin tugaydi.`,
    contact: "To'lov uchun OsonMenu bilan bog'laning.",
  },
  ru: {
    blocked: "Ваше меню отключено — гости не могут его открыть.",
    expired: "Срок подписки истёк — меню закрыто для гостей.",
    soon: (d) => `Подписка закончится через ${d} дн.`,
    contact: "Для оплаты свяжитесь с OsonMenu.",
  },
  en: {
    blocked: "Your menu is disabled — guests cannot open it.",
    expired: "Your subscription has expired — the menu is closed for guests.",
    soon: (d) => `Your subscription ends in ${d} day(s).`,
    contact: "Contact OsonMenu to pay.",
  },
};

/** Egasi / jamoa ko'radigan ogohlantirish (muddat tugagan yoki tez tugaydi). */
export function OwnerAccessBanner({ locale, access }: { locale: Locale; access: MenuAccessInfo | null }) {
  if (!access) return null;
  const soon = !access.blocked && access.daysLeft !== null && access.daysLeft <= 3;
  if (!access.blocked && !soon) return null;
  const t = BANNER_TEXT[locale] ?? BANNER_TEXT.uz;
  const title = access.blocked
    ? access.reason === "expired" ? t.expired : t.blocked
    : t.soon(Math.max(access.daysLeft ?? 0, 0));
  const tone = access.blocked
    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
    : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
  return (
    <div className={`mx-auto mb-2 max-w-[620px] rounded-xl border px-4 py-3 text-sm ${tone}`} role="alert">
      <b className="font-semibold">{title}</b> {t.contact}
    </div>
  );
}
