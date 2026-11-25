"use client";

type Locale = "uz" | "ru" | "en";

export type MenuAccessInfo = {
  blocked: boolean;
  reason: "manual" | "expired" | null;
  paidUntil: string | null;
  daysLeft: number | null;
  message: string;
};

const BLOCKED_TEXT: Record<Locale, { title: string; body: string }> = {
  uz: { title: "Menyu vaqtincha mavjud emas", body: "Iltimos, keyinroq urinib ko'ring yoki xodimlarga murojaat qiling." },
  ru: { title: "Меню временно недоступно", body: "Пожалуйста, попробуйте позже или обратитесь к персоналу." },
  en: { title: "Menu temporarily unavailable", body: "Please try again later or ask the staff." },
};

/** Mijoz ko'radigan ekran: restoran obunasi to'xtatilgan. */
export function MenuBlockedScreen({
  locale,
  name,
  logoUrl,
  message,
}: {
  locale: Locale;
  name: string;
  logoUrl?: string;
  message?: string;
}) {
  const text = BLOCKED_TEXT[locale] ?? BLOCKED_TEXT.uz;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-center text-neutral-100">
      <div className="w-full max-w-sm">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="mx-auto mb-5 h-20 w-20 rounded-2xl object-cover opacity-60 grayscale" />
        ) : (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
              <path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3Z" />
            </svg>
          </div>
        )}
        {name ? <p className="mb-2 text-sm text-neutral-400">{name}</p> : null}
        <h1 className="text-xl font-bold">{text.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{text.body}</p>
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
