import { DemoMenu } from "@/components/DemoMenu/DemoMenu";
import { DemoPreview } from "@/components/DemoPreview";
import { Features } from "@/components/Features";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/Pricing/PricingSection";
import { Testimonials } from "@/components/Testimonials";
import { setRequestLocale } from "next-intl/server";

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
