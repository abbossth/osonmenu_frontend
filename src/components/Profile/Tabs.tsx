"use client";

export type ProfileTab = "places" | "profile";

type TabsProps = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  placesLabel: string;
  profileLabel: string;
};

export function Tabs({ activeTab, onChange, placesLabel, profileLabel }: TabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => onChange("places")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          activeTab === "places"
            ? "bg-orange-500 text-white"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        {placesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("profile")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          activeTab === "profile"
            ? "bg-orange-500 text-white"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        {profileLabel}
      </button>
    </div>
  );
}
