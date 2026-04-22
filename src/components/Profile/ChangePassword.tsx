"use client";

import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

type ChangePasswordProps = {
  title: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  updateButton: string;
  minLengthError: string;
  mismatchError: string;
  successMessage: string;
  genericError: string;
};

export function ChangePassword({
  title,
  newPasswordLabel,
  confirmPasswordLabel,
  newPasswordPlaceholder,
  confirmPasswordPlaceholder,
  showPasswordLabel,
  hidePasswordLabel,
  updateButton,
  minLengthError,
  mismatchError,
  successMessage,
  genericError,
}: ChangePasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError(minLengthError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(mismatchError);
      return;
    }

    try {
      setLoading(true);
      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) {
        setError(genericError);
        return;
      }
      await updatePassword(currentUser, newPassword);
      setSuccess(successMessage);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {newPasswordLabel}
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              placeholder={newPasswordPlaceholder}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 pr-20 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              {showNewPassword ? hidePasswordLabel : showPasswordLabel}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {confirmPasswordLabel}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              placeholder={confirmPasswordPlaceholder}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 pr-20 text-sm text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              {showConfirmPassword ? hidePasswordLabel : showPasswordLabel}
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
        >
          {loading ? "..." : updateButton}
        </button>
      </form>
    </section>
  );
}
