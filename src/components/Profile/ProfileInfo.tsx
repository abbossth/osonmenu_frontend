"use client";

import { useMemo, useState } from "react";
import type { AppUser } from "@/components/providers/auth-provider";

type ProfileInfoProps = {
  title: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
  saveLabel: string;
  successLabel: string;
  unsavedLabel: string;
  requiredError: string;
  minNameError: string;
  genericError: string;
  user: AppUser | null;
  onSave: (payload: { firstName: string; lastName: string }) => Promise<AppUser>;
};

export function ProfileInfo({
  title,
  firstNameLabel,
  lastNameLabel,
  emailLabel,
  saveLabel,
  successLabel,
  unsavedLabel,
  requiredError,
  minNameError,
  genericError,
  user,
  onSave,
}: ProfileInfoProps) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [touched, setTouched] = useState({ firstName: false, lastName: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialFirstName = user?.firstName ?? "";
  const initialLastName = user?.lastName ?? "";
  const dirty = firstName.trim() !== initialFirstName || lastName.trim() !== initialLastName;

  const firstNameError = useMemo(() => {
    if (!touched.firstName) return null;
    if (!firstName.trim()) return requiredError;
    if (firstName.trim().length < 2) return minNameError;
    return null;
  }, [firstName, minNameError, requiredError, touched.firstName]);

  const lastNameError = useMemo(() => {
    if (!touched.lastName) return null;
    if (!lastName.trim()) return requiredError;
    if (lastName.trim().length < 2) return minNameError;
    return null;
  }, [lastName, minNameError, requiredError, touched.lastName]);

  const invalid = Boolean(firstNameError || lastNameError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ firstName: true, lastName: true });
    setSuccess(null);
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError(requiredError);
      return;
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError(minNameError);
      return;
    }

    try {
      setSaving(true);
      const updated = await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setSuccess(successLabel);
    } catch {
      setError(genericError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{firstNameLabel}</label>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
              className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                firstNameError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                  : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
              }`}
            />
            {firstNameError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{firstNameError}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{lastNameLabel}</label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
              className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                lastNameError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                  : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
              }`}
            />
            {lastNameError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{lastNameError}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{emailLabel}</label>
          <input
            value={user?.email ?? "-"}
            disabled
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          />
        </div>

        {dirty ? <p className="text-xs font-medium text-orange-600 dark:text-orange-400">{unsavedLabel}</p> : null}
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}

        <button
          type="submit"
          disabled={!dirty || invalid || saving}
          className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "..." : saveLabel}
        </button>
      </form>
    </section>
  );
}
