"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { HeaderUserBadge } from "@/components/MenuUI/HeaderUserBadge";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faExternalLink, faXmark } from "@fortawesome/free-solid-svg-icons";
import { STRIPE_PRICE_IDS, type StripePlanKey } from "@/lib/stripe-pricing";

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

type BillingTransaction = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl: string;
  description: string;
};

type BillingResponse = {
  canManageBilling: boolean;
  billing: {
    customerEmail: string;
    subscriptionStatus: "active" | "inactive";
    currentPlan: string;
    currentProductId?: string;
    currentPeriodEnd: string | null;
    transactions: BillingTransaction[];
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
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState<StripePlanKey>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [billing, setBilling] = useState<BillingResponse["billing"]>({
    customerEmail: "",
    subscriptionStatus: "inactive",
    currentPlan: "",
    currentProductId: "",
    currentPeriodEnd: null,
    transactions: [],
  });

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      if (!firebaseUser) {
        setBillingLoading(false);
        return;
      }

      try {
        setBillingLoading(true);
        setBillingError(null);
        const token = await firebaseUser.getIdToken();
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        const [menuRes, billingRes] = await Promise.all([
          fetch(`/api/places/${slug}/menu`, { headers }),
          fetch(`/api/stripe/billing?slug=${slug}`, { headers }),
        ]);

        if (menuRes.ok) {
          const menuData = (await menuRes.json()) as MenuResponse;
          if (menuData.place) setPlace(menuData.place);
        }

        if (!billingRes.ok) {
          const payload = (await billingRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Failed to load billing");
        }

        const billingData = (await billingRes.json()) as BillingResponse;
        setCanManageBilling(Boolean(billingData.canManageBilling));
        setBilling(billingData.billing);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load billing";
        setBillingError(message);
      } finally {
        setBillingLoading(false);
      }
    }

    void loadData();
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
      ] as const satisfies ReadonlyArray<{ key: StripePlanKey; data: PricingPlan }>,
    [pricing],
  );
  const selectedPlan = planEntries.find((entry) => entry.key === selectedPlanKey)?.data ?? pricing.plans.monthly;
  const currentPlanKey =
    (Object.entries(STRIPE_PRICE_IDS).find(([, id]) => {
      if (!id) return false;
      return id === billing.currentPlan || id === (billing.currentProductId || "");
    })?.[0] as StripePlanKey | undefined) || null;
  const currentPlan = currentPlanKey
    ? planEntries.find((entry) => entry.key === currentPlanKey)?.data ?? null
    : null;

  function money(amount: number) {
    return `${new Intl.NumberFormat("ru-RU").format(amount)} ${pricing.currency.uzsSuffix}`;
  }

  function formatAmount(amountMinor: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amountMinor / 100);
  }

  async function startCheckout() {
    if (!firebaseUser || !canManageBilling) return;
    const priceId = STRIPE_PRICE_IDS[selectedPlanKey];
    if (!priceId) {
      setBillingError("Stripe price is not configured for this plan.");
      return;
    }

    try {
      setCheckoutLoading(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/stripe/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug, priceId }),
      });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !payload?.url) throw new Error(payload?.error || "Failed to start checkout");
      window.location.href = payload.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start checkout";
      setBillingError(message);
    } finally {
      setCheckoutLoading(false);
      setChangePlanOpen(false);
    }
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
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <HeaderUserBadge firebaseUser={firebaseUser} ownerId={place?.ownerId} accentColor={accentColor} />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/p/${slug}/more`)}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 text-3xl font-semibold text-neutral-800"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          <span>Billing</span>
        </button>

        {billingError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {billingError}
          </p>
        ) : null}

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-neutral-700">
                Establishment{" "}
                <span className={billing.subscriptionStatus === "active" ? "text-emerald-500" : "text-red-500"}>
                  {billing.subscriptionStatus === "active" ? "Active" : "Inactive"}
                </span>
              </p>
              <p className="text-sm text-neutral-500">
                {billing.currentPeriodEnd
                  ? `Paid till ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                  : "No active billing period"}
              </p>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-neutral-700">
                  Subscription{" "}
                  <span className={billing.subscriptionStatus === "active" ? "text-emerald-500" : "text-red-500"}>
                    {billing.subscriptionStatus === "active" ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="text-sm text-neutral-700">
                  Current plan:{" "}
                  {currentPlan ? `${money(currentPlan.prices.yearly)} / ${currentPlan.months} month` : "Not selected"}
                </p>
                <p className="text-xs text-neutral-500">VAT may be applied to payments</p>
              </div>
              <button
                type="button"
                onClick={() => setChangePlanOpen(true)}
                disabled={!canManageBilling || billingLoading}
                className="cursor-pointer rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Change
              </button>
            </div>

            <div className="rounded-xl border border-neutral-100 p-3">
              <p className="text-sm text-neutral-700">Invoice email: {billing.customerEmail || "Not set"}</p>
              {!canManageBilling ? (
                <p className="mt-1 text-xs text-neutral-500">Only owner can manage billing.</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-neutral-100 p-3">
              <p className="text-sm text-neutral-700">Billing source: Stripe Checkout</p>
              <p className="mt-1 text-xs text-neutral-500">Payments are securely processed by Stripe.</p>
            </div>

            {billing.currentPlan ? (
              <div className="rounded-xl border border-neutral-100 p-3">
                <p className="text-xs text-neutral-500">Current Stripe price</p>
                <p className="text-sm font-semibold text-neutral-700">{billing.currentPlan}</p>
              </div>
            ) : null}

            {billingLoading ? (
              <p className="text-sm text-neutral-500">Loading billing details...</p>
            ) : null}

            {billing.subscriptionStatus === "active" ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Subscription активен
              </p>
            ) : null}
          </div>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-neutral-800">Transaction history</h2>
        <div className="mt-3 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          {billingLoading ? (
            <p className="text-sm text-neutral-500">Loading transactions...</p>
          ) : billing.transactions.length === 0 ? (
            <p className="text-sm text-neutral-500">No transactions yet.</p>
          ) : (
            billing.transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-xl border border-neutral-100 p-3">
                <p className="text-sm text-neutral-500">{new Date(transaction.createdAt).toLocaleString()}</p>
                <p className="text-base font-semibold text-neutral-800">
                  {formatAmount(transaction.amount, transaction.currency)} • {transaction.status}
                </p>
                {transaction.description ? (
                  <p className="text-sm text-neutral-500">{transaction.description}</p>
                ) : null}
                {transaction.invoiceUrl ? (
                  <a
                    href={transaction.invoiceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600"
                  >
                    Invoice
                    <FontAwesomeIcon icon={faExternalLink} className="text-xs" />
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav locale={locale} slug={slug} active="more" accentColor={accentColor} />

      {changePlanOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6">
            <h2 className="text-4xl font-semibold text-neutral-800">Change plan</h2>
            <p className="mt-3 text-sm text-neutral-600">
              Current plan: {currentPlan ? `${money(currentPlan.prices.yearly)} / ${currentPlan.months} month` : "None"}
            </p>
            <label className="mt-3 block text-sm text-neutral-500">New plan*</label>
            <select
              value={selectedPlanKey}
              onChange={(event) => setSelectedPlanKey((event.target.value as StripePlanKey) ?? "monthly")}
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
                onClick={() => void startCheckout()}
                disabled={checkoutLoading}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {checkoutLoading ? "Redirecting..." : "Proceed to payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
