"use client";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";

export default function ProfilePage() {
  const { firebaseUser, appUser, logout, loading } = useAuth();
  const router = useRouter();

  const fullName =
    appUser?.fullName?.trim() || firebaseUser?.displayName?.trim() || firebaseUser?.email?.split("@")[0] || "User";
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
              {initials || "U"}
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{fullName}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{appUser?.email || firebaseUser?.email}</p>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                await logout();
                router.replace("/");
              }}
              className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
