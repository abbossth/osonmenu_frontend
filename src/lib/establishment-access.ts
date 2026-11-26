/**
 * Restoran menyusiga kirish holati (obuna).
 *
 * - isBlocked = true          → menyu yopiq (admin qo'lda o'chirgan)
 * - paidUntil < hozir          → menyu yopiq (muddat tugagan) — avtomatik, cron kerak emas
 * - paidUntil yo'q (null)      → muddatsiz, ochiq (bu funksiyadan oldin yaratilgan restoranlar)
 */
export type AccessSource = {
  isBlocked?: boolean | null;
  paidUntil?: Date | string | null;
  blockedMessage?: string | null;
  blockReason?: string | null;
};

export type AccessState = {
  blocked: boolean;
  reason: "manual" | "expired" | null;
  paidUntil: string | null;
  daysLeft: number | null;
  message: string;
  /** Menyu to'lov qilinmagani uchun yopilganmi (muddat tugagan yoki "payment" sababi bilan o'chirilgan) */
  paymentRequired: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Toshkent vaqti (UTC+5, yozgi vaqt yo'q) */
const TZ_OFFSET_MS = 5 * 60 * 60 * 1000;

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getAccessState(source: AccessSource, now = Date.now()): AccessState {
  const paidUntil = toDate(source.paidUntil);
  const message = typeof source.blockedMessage === "string" ? source.blockedMessage : "";
  const daysLeft = paidUntil ? Math.ceil((paidUntil.getTime() - now) / DAY_MS) : null;
  const base = { paidUntil: paidUntil ? paidUntil.toISOString() : null, daysLeft, message };

  if (source.isBlocked) {
    const paymentRequired = !source.blockReason || source.blockReason === "payment";
    return { ...base, blocked: true, reason: "manual", paymentRequired };
  }
  if (paidUntil && paidUntil.getTime() <= now) {
    return { ...base, blocked: true, reason: "expired", paymentRequired: true };
  }
  return { ...base, blocked: false, reason: null, paymentRequired: false };
}

/** Berilgan vaqtning Toshkent bo'yicha kun oxiri (23:59:59.999). */
export function endOfDayTashkent(date: Date) {
  const local = new Date(date.getTime() + TZ_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 23, 59, 59, 999) - TZ_OFFSET_MS,
  );
}

/** "YYYY-MM-DD" → shu kunning Toshkent bo'yicha oxiri. */
export function parseDateInputTashkent(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - TZ_OFFSET_MS);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Oy qo'shish (31-yanvar + 1 oy = 28/29-fevral). */
export function addMonths(date: Date, months: number) {
  const local = new Date(date.getTime() + TZ_OFFSET_MS);
  const day = local.getUTCDate();
  const target = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  target.setUTCHours(local.getUTCHours(), local.getUTCMinutes());
  return new Date(target.getTime() - TZ_OFFSET_MS);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}
