export type StripePlanKey = "monthly" | "threeMonths" | "sixMonths" | "yearly";

export const STRIPE_PRICE_IDS: Record<StripePlanKey, string> = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "",
  threeMonths: process.env.NEXT_PUBLIC_STRIPE_PRICE_THREE_MONTHS || "",
  sixMonths: process.env.NEXT_PUBLIC_STRIPE_PRICE_SIX_MONTHS || "",
  yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || "",
};

export function getAllowedStripePriceIds() {
  return Object.values(STRIPE_PRICE_IDS).filter((id) => Boolean(id));
}
