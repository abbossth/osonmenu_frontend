"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { PricingCard, type PricingPlan } from "./PricingCard";
import { CurrencyToggle, type CurrencyCode } from "./CurrencyToggle";

type PricingMessages = {
  title: string;
  subtitle: string;
  saveUpTo: string;
  mostPopular: string;
  perMonth: string;
  billing: { yearlyHint: string };
  currency: {
    uzs: string;
    usd: string;
    uzsSuffix: string;
  };
  plans: {
    monthly: PricingPlan;
    threeMonths: PricingPlan;
    sixMonths: PricingPlan;
    yearly: PricingPlan;
  };
};

const ORDER: Array<keyof PricingMessages["plans"]> = [
  "monthly",
  "threeMonths",
  "sixMonths",
  "yearly",
];

export function PricingSection() {
  const t = useTranslations("Pricing");
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const data = {
    title: t("title"),
    subtitle: t("subtitle"),
    saveUpTo: t("saveUpTo"),
    mostPopular: t("mostPopular"),
    perMonth: t("perMonth"),
    billing: { yearlyHint: t("billing.yearlyHint") },
    currency: t.raw("currency") as PricingMessages["currency"],
    plans: t.raw("plans") as PricingMessages["plans"],
  } satisfies PricingMessages;
  const billingCycle = "yearly";
  const [currency, setCurrency] = useState<CurrencyCode>("UZS");
  const [mounted, setMounted] = useState(false);
  const [subscribingKey, setSubscribingKey] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCanceled, setPaymentCanceled] = useState(false);

  const planPriceIds = {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "",
    threeMonths: process.env.NEXT_PUBLIC_STRIPE_PRICE_THREE_MONTHS || "",
    sixMonths: process.env.NEXT_PUBLIC_STRIPE_PRICE_SIX_MONTHS || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || "",
  } as const;

  const plans = useMemo(() => ORDER.map((key) => data.plans[key]), [data]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("pricing-currency");
      if (saved === "USD" || saved === "UZS") {
        setCurrency(saved);
      }
      setMounted(true);
    });

    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("pricing-currency", currency);
  }, [currency, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setPaymentSuccess(params.get("success") === "true");
    setPaymentCanceled(params.get("canceled") === "true");
  }, []);

  async function subscribe(planKey: keyof PricingMessages["plans"]) {
    if (!firebaseUser) {
      router.push("/auth/login");
      return;
    }

    const priceId = planPriceIds[planKey];
    if (!priceId) {
      setSubscribeError("Stripe price ID is not configured.");
      return;
    }

    try {
      setSubscribeError(null);
      setSubscribingKey(planKey);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !payload?.url) {
        throw new Error(payload?.error || "Failed to create checkout session");
      }

      window.location.href = payload.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start checkout";
      setSubscribeError(message);
    } finally {
      setSubscribingKey(null);
    }
  }

  return (
    <section id="pricing" className="border-b border-neutral-200 py-20 dark:border-neutral-800 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            {data.title}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-neutral-600 dark:text-neutral-400">
            {data.subtitle}
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700 dark:bg-orange-400/10 dark:text-orange-300"
          >
            {data.saveUpTo}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <CurrencyToggle
              value={currency}
              onChange={setCurrency}
              uzsLabel={data.currency.uzs}
              usdLabel={data.currency.usd}
            />
          </motion.div>
          <motion.p variants={fadeUp} className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {data.billing.yearlyHint}
          </motion.p>
          {paymentSuccess ? (
            <motion.p variants={fadeUp} className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {t("paymentSuccess")}
            </motion.p>
          ) : null}
          {paymentCanceled ? (
            <motion.p variants={fadeUp} className="mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
              {t("paymentCanceled")}
            </motion.p>
          ) : null}
          {subscribeError ? (
            <motion.p variants={fadeUp} className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
              {subscribeError}
            </motion.p>
          ) : null}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${billingCycle}-${currency}`}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.7 }}
            transition={{ duration: 0.22 }}
            className="mt-14"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
            >
              {plans.map((plan, index) => {
                const planKey = ORDER[index];
                return (
                <motion.div key={plan.name} variants={fadeUp} className={plan.highlighted ? "xl:scale-[1.03]" : ""}>
                  <PricingCard
                    plan={plan}
                    mostPopularText={data.mostPopular}
                    billingCycle={billingCycle}
                    currency={currency}
                    uzsSuffix={data.currency.uzsSuffix}
                    perMonthText={data.perMonth}
                    onSubscribe={() => void subscribe(planKey)}
                    subscribing={subscribingKey === planKey}
                    subscribeLabel={t("subscribe")}
                  />
                </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
