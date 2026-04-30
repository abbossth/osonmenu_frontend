"use client";

import { AnimatePresence, motion } from "framer-motion";
import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CurrencyCode } from "./CurrencyToggle";

export type BillingCycle = "monthly" | "yearly";

export type PricingPlan = {
  name: string;
  label: string;
  months: number;
  prices: Record<BillingCycle, number>;
  oldPrices?: Partial<Record<BillingCycle, number>>;
  microcopy: Record<BillingCycle, string>;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

type PricingCardProps = {
  plan: PricingPlan;
  mostPopularText: string;
  billingCycle: BillingCycle;
  currency: CurrencyCode;
  uzsSuffix: string;
  perMonthText: string;
  onSubscribe?: () => void;
  subscribing?: boolean;
  subscribeLabel?: string;
};

function formatCurrency(valueUZS: number, currency: CurrencyCode, uzsSuffix: string) {
  const formatWithSeparator = (value: number, separator: "," | " ") => {
    const integer = Math.round(value).toString();
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  };

  if (currency === "USD") {
    const usd = valueUZS / 12500;
    const rounded = usd >= 10 ? Math.round(usd) : Math.round(usd * 10) / 10;
    if (rounded >= 10) {
      return `$${formatWithSeparator(rounded, ",")}`;
    }
    return `$${rounded.toFixed(1).replace(/\.0$/, "")}`;
  }

  return `${formatWithSeparator(valueUZS, " ")} ${uzsSuffix}`;
}

export function PricingCard({
  plan,
  mostPopularText,
  billingCycle,
  currency,
  uzsSuffix,
  perMonthText,
  onSubscribe,
  subscribing = false,
  subscribeLabel,
}: PricingCardProps) {
  const isHighlighted = Boolean(plan.highlighted);
  const priceValue = plan.prices[billingCycle];
  const currentOldPriceValue = plan.oldPrices?.[billingCycle];
  const perMonthValue = Math.round(priceValue / plan.months);
  const currentOldPrice = currentOldPriceValue
    ? formatCurrency(currentOldPriceValue, currency, uzsSuffix)
    : undefined;
  const currentBreakdown = `~${formatCurrency(perMonthValue, currency, uzsSuffix)} / ${perMonthText}`;
  const currentMicrocopy = plan.microcopy[billingCycle];
  const [animatedPrice, setAnimatedPrice] = useState(priceValue);
  const previousPriceRef = useRef(priceValue);

  useEffect(() => {
    const controls = animate(previousPriceRef.current, priceValue, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (latest) => setAnimatedPrice(latest),
    });
    previousPriceRef.current = priceValue;
    return () => controls.stop();
  }, [priceValue]);

  return (
    <motion.article
      whileHover={{ y: -8, scale: isHighlighted ? 1.055 : 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-shadow ${
        isHighlighted
          ? "scale-100 border-orange-400/70 bg-gradient-to-b from-neutral-900 to-neutral-950 text-white shadow-[0_20px_50px_-18px_rgba(249,115,22,0.45)] dark:border-orange-300/60 dark:from-neutral-50 dark:to-white dark:text-neutral-900 dark:shadow-[0_18px_45px_-18px_rgba(249,115,22,0.35)]"
          : "border-neutral-200 bg-white text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
      }`}
    >
      {isHighlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-900">
          {mostPopularText}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            isHighlighted
              ? "bg-white/20 text-white dark:bg-neutral-900/10 dark:text-neutral-700"
              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          }`}
        >
          {plan.label}
        </span>
      </div>

      <div className="mt-5">
        {currentOldPrice ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`old-${billingCycle}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`text-sm line-through ${
                isHighlighted ? "text-white/60 dark:text-neutral-500" : "text-neutral-400"
              }`}
            >
              {currentOldPrice}
            </motion.p>
          </AnimatePresence>
        ) : (
          <p className="h-[1.25rem]" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`price-${billingCycle}-${currency}`}
            initial={{ opacity: 0.5, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.35, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-1 text-3xl font-semibold tracking-tight"
          >
            {formatCurrency(animatedPrice, currency, uzsSuffix)}
          </motion.p>
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`breakdown-${billingCycle}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`mt-1 text-sm ${
              isHighlighted ? "text-orange-200 dark:text-orange-600" : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {currentBreakdown}
          </motion.p>
        </AnimatePresence>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className={isHighlighted ? "text-orange-300 dark:text-orange-500" : "text-orange-500"}>
              ✓
            </span>
            <span className={isHighlighted ? "text-white/90 dark:text-neutral-700" : "text-neutral-700 dark:text-neutral-300"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSubscribe}
        disabled={subscribing}
        className={`mt-7 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
          isHighlighted
            ? "bg-orange-400 text-neutral-900 hover:bg-orange-300"
            : "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500"
        } ${subscribing ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {subscribing ? (subscribeLabel || plan.cta) : plan.cta}
      </button>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`microcopy-${billingCycle}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`mt-2 text-xs ${
            isHighlighted ? "text-white/70 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {currentMicrocopy}
        </motion.p>
      </AnimatePresence>
    </motion.article>
  );
}
