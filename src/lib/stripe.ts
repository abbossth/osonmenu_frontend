import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Stripe mijozi birinchi ishlatilganda yaratiladi (modul yuklanganda emas).
 * Shunda STRIPE_SECRET_KEY bo'lmagan muhitlarda (masalan Vercel preview) build yiqilmaydi —
 * xato faqat Stripe API haqiqatan chaqirilganda chiqadi.
 */
export function getStripe() {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
    client = new Stripe(secretKey);
  }
  return client;
}

/** Eski `stripe.xxx` chaqiruvlari o'zgarmasdan ishlashi uchun dangasa proksi. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
