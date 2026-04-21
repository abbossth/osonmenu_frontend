import { AuthForm } from "@/components/auth/AuthForm";
import { Navbar } from "@/components/Navbar";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />
      <main className="px-4 py-12 sm:px-6">
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
