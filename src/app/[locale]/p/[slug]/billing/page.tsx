"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };
type PricingPlan = {
  name: string;
  months: number;
  prices: { monthly: number; yearly: number };
};

type PricingMessages = {
  plans: {
    monthly: PricingPlan;
    threeMonths: PricingPlan;
    sixMonths: PricingPlan;
    yearly: PricingPlan;
  };
  currency: {
    uzsSuffix: string;
  };
};

export default function BillingPage() {
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const tPricing = useTranslations("Pricing");
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [editInvoiceEmailOpen, setEditInvoiceEmailOpen] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState("bosskodevelopment@gmail.com");
  const [selectedPlanKey, setSelectedPlanKey] = useState<"monthly" | "threeMonths" | "sixMonths" | "yearly">("monthly");

  useEffect(() => {
    async function loadPlace() {
      if (!slug) return;
      const headers: HeadersInit = {};
      if (firebaseUser) {
        try {
          headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
        } catch {}
      }
      const res = await fetch(`/api/places/${slug}/menu`, { headers });
      if (!res.ok) return;
      const data = (await res.json()) as MenuResponse;
      if (data.place) setPlace(data.place);
    }
    void loadPlace();
  }, [firebaseUser, slug]);

  const accentColor = place?.color?.trim() || "#f7906c";
  const pricing = useMemo(
    () =>
      ({
        plans: tPricing.raw("plans"),
        currency: tPricing.raw("currency"),
      }) as PricingMessages,
    [tPricing],
  );
  const planEntries = useMemo(
    () =>
      [
        { key: "monthly", data: pricing.plans.monthly },
        { key: "threeMonths", data: pricing.plans.threeMonths },
        { key: "sixMonths", data: pricing.plans.sixMonths },
        { key: "yearly", data: pricing.plans.yearly },
      ] as const,
    [pricing],
  );
  const selectedPlan = planEntries.find((entry) => entry.key === selectedPlanKey)?.data ?? pricing.plans.monthly;
  const currentPlan = pricing.plans.monthly;

  function money(amount: number) {
    return `${new Intl.NumberFormat("ru-RU").format(amount)} ${pricing.currency.uzsSuffix}`;
  }

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/more`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            ×
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/p/${slug}/more`)}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 text-3xl font-semibold text-neutral-800"
        >
          <span aria-hidden>←</span>
          <span>Billing</span>
        </button>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-neutral-700">
                  Establishment <span className="text-emerald-500">Active</span>
                </p>
                <p className="text-sm text-neutral-500">Paid till 28 Apr, 2026</p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-neutral-700">
                  Subscription <span className="text-emerald-500">Active</span>
                </p>
                <p className="text-sm text-neutral-700">
                  Current plan: {money(currentPlan.prices.yearly)} / {currentPlan.months} month
                </p>
                <p className="text-xs text-neutral-500">VAT may be applied to payments</p>
              </div>
              <button
                type="button"
                onClick={() => setChangePlanOpen(true)}
                className="cursor-pointer rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-400"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-700">Payment method: Card (3744)</p>
              <button type="button" className="cursor-pointer rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-400">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-700">Invoice email: {invoiceEmail}</p>
              <button
                type="button"
                onClick={() => setEditInvoiceEmailOpen(true)}
                className="cursor-pointer rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-400"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-neutral-800">Transaction history</h2>
        <div className="mt-3 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="rounded-xl border border-neutral-100 p-3">
            <p className="text-sm text-neutral-500">28.03.2026 13:15</p>
            <p className="text-base font-semibold text-neutral-800">Successful payment • 11.2 USD</p>
            <p className="text-sm text-neutral-500">Added 1 month. Establishment works till 28.04.2026</p>
          </div>
          <div className="rounded-xl border border-neutral-100 p-3">
            <p className="text-sm text-neutral-500">28.03.2026 13:15</p>
            <p className="text-base font-semibold text-neutral-800">Retry charge requested</p>
            <p className="text-sm text-neutral-500">Owner requested retry from current card.</p>
          </div>
        </div>
      </div>

      <BottomNav locale={locale} slug={slug} active="more" accentColor={accentColor} />

      {changePlanOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6">
            <h2 className="text-4xl font-semibold text-neutral-800">Change plan</h2>
            <p className="mt-3 text-sm text-neutral-600">
              Current plan: {money(currentPlan.prices.yearly)} / {currentPlan.months} month
            </p>
            <label className="mt-3 block text-sm text-neutral-500">New plan*</label>
            <select
              value={selectedPlanKey}
              onChange={(event) =>
                setSelectedPlanKey(
                  (event.target.value as "monthly" | "threeMonths" | "sixMonths" | "yearly") ?? "monthly",
                )
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 outline-none"
            >
              {planEntries.map((plan) => (
                <option key={plan.key} value={plan.key}>
                  {money(plan.data.prices.yearly)} / {plan.data.months} month
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-neutral-500">
              Selected: {selectedPlan.name} ({money(selectedPlan.prices.yearly)})
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setChangePlanOpen(false)}
                className="cursor-pointer rounded-xl bg-orange-50 px-6 py-2 font-semibold text-orange-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setChangePlanOpen(false)}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editInvoiceEmailOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6">
            <h2 className="text-4xl font-semibold text-neutral-800">Change invoice email</h2>
            <label className="mt-4 block text-sm text-neutral-500">Email*</label>
            <input
              value={invoiceEmail}
              onChange={(event) => setInvoiceEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditInvoiceEmailOpen(false)}
                className="cursor-pointer rounded-xl bg-orange-50 px-6 py-2 font-semibold text-orange-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setEditInvoiceEmailOpen(false)}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

