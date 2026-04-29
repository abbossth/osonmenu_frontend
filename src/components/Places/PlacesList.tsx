"use client";

import { Place, PlaceCard } from "./PlaceCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";

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
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
            </div>
            <p className="mt-3 text-lg font-semibold text-neutral-700 dark:text-neutral-200">{addButton}</p>
          </button>
        ) : null}
      </div>
    </section>
  );
}
