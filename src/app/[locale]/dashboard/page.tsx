import { Navbar } from "@/components/Navbar";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            You are logged in successfully.
          </p>
        </div>
      </main>
    </div>
  );
}
