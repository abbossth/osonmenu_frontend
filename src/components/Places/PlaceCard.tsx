"use client";

import { Link } from "@/i18n/navigation";

export type Place = {
  _id: string;
  ownerId: string;
  userId: string;
  name: string;
  slug: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
  createdAt: string;
};

type PlaceCardProps = {
  place: Place;
  urlLabel: string;
  currencyLabel: string;
  languageLabel: string;
  createdAtLabel: string;
  editMenuLabel: string;
  domain: string;
};

export function PlaceCard({
  place,
  editMenuLabel,
  domain,
}: PlaceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20h16" />
          <path d="M7 4l3 7m7-7l-3 7M12 11v9" />
          <path d="M6 11h12" />
        </svg>
      </div>
      <h4 className="mt-3 text-3xl font-semibold leading-none tracking-tight text-neutral-900 dark:text-white">{place.name}</h4>
      <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
        {domain}/p/{place.slug}
      </p>
      <div className="mt-auto pt-4">
        <Link
          href={`/p/${place.slug}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-orange-400 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-300"
        >
          {editMenuLabel}
        </Link>
      </div>
    </article>
  );
}
