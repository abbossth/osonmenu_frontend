import { Features } from "@/components/Features";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";

const DemoPreview = dynamic(() => import("@/components/DemoPreview").then((m) => ({ default: m.DemoPreview })), {
  loading: () => <BelowFoldFallback />,
});

const DemoMenu = dynamic(() => import("@/components/DemoMenu/DemoMenu").then((m) => ({ default: m.DemoMenu })), {
  loading: () => <BelowFoldFallback />,
});

const Testimonials = dynamic(() => import("@/components/Testimonials").then((m) => ({ default: m.Testimonials })), {
  loading: () => <BelowFoldFallback />,
});

const PricingSection = dynamic(
  () => import("@/components/Pricing/PricingSection").then((m) => ({ default: m.PricingSection })),
  { loading: () => <BelowFoldFallback /> },
);

function BelowFoldFallback() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      aria-hidden
    >
      <div className="h-64 animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/60" />
    </div>
  );
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <DemoPreview />
      <DemoMenu />
      <Testimonials />
      <PricingSection />
      <FinalCta />
      <Footer />
    </div>
  );
}
