"use client";

import { Place, PlaceCard } from "./PlaceCard";

type PlacesListProps = {
  title: string;
  addButton: string;
  emptyText: string;
  places: Place[];
  onAddClick: () => void;
  showAddButton?: boolean;
  labels: {
    url: string;
    currency: string;
    language: string;
    createdAt: string;
    editMenu: string;
  };
  domain: string;
};

export function PlacesList({
  title,
  addButton,
  emptyText,
  places,
  onAddClick,
  showAddButton = true,
  labels,
  domain,
}: PlacesListProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h2>
        {places.length === 0 ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyText}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {places.map((place) => (
          <PlaceCard
            key={place._id}
            place={place}
            urlLabel={labels.url}
            currencyLabel={labels.currency}
            languageLabel={labels.language}
            createdAtLabel={labels.createdAt}
            editMenuLabel={labels.editMenu}
            domain={domain}
          />
        ))}

        {showAddButton ? (
          <button
            type="button"
            onClick={onAddClick}
            className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="3" width="12" height="16" rx="2" />
                <path d="M8 7h4M8 11h4M18 15v6M15 18h6" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-semibold text-neutral-700 dark:text-neutral-200">{addButton}</p>
          </button>
        ) : null}
      </div>
    </section>
  );
}
