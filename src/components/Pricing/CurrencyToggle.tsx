"use client";

import { motion } from "framer-motion";

export type CurrencyCode = "UZS" | "USD";

type CurrencyToggleProps = {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  uzsLabel: string;
  usdLabel: string;
};

export function CurrencyToggle({ value, onChange, uzsLabel, usdLabel }: CurrencyToggleProps) {
  return (
    <div className="relative inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <motion.span
        className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-neutral-900 dark:bg-white"
        animate={{ x: value === "UZS" ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      />
      <button
        type="button"
        onClick={() => onChange("UZS")}
        className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
          value === "UZS"
            ? "text-white dark:text-neutral-900"
            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        }`}
      >
        {uzsLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("USD")}
        className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
          value === "USD"
            ? "text-white dark:text-neutral-900"
            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        }`}
      >
        {usdLabel}
      </button>
    </div>
  );
}
