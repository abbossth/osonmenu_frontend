"use client";

import { useTranslations } from "next-intl";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useTranslations("DemoMenu");

  return (
    <label className="relative block">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-full border border-white/10 bg-neutral-900 px-10 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-neutral-500">
        ⌕
      </span>
    </label>
  );
}
