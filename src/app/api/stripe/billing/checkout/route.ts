import { NextRequest, NextResponse } from "next/server";
import { verifyUserId, normalizeSlug, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { connectToMongoDB } from "@/lib/mongodb";
import { getAllowedStripePriceIds } from "@/lib/stripe-pricing";
import { stripe } from "@/lib/stripe";
import { UserModel } from "@/models/User";

async function resolveStripePriceId(inputId: string, preferredCurrency?: string | null) {
  if (inputId.startsWith("price_")) return inputId;
  if (inputId.startsWith("prod_")) {
    const prices = await stripe.prices.list({
      product: inputId,
      active: true,
      type: "recurring",
      limit: 100,
    });
    if (preferredCurrency) {
      const matchedByCurrency = prices.data.find(
        (price) => price.currency.toLowerCase() === preferredCurrency.toLowerCase(),
      );
      if (matchedByCurrency) return matchedByCurrency.id;
    }
    const defaultPrice = prices.data[0];
    return defaultPrice?.id || "";
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { slug?: string; priceId?: string };
    const slug = normalizeSlug(body.slug);
    const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";
    if (!slug || !priceId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const allowedPriceIds = new Set(getAllowedStripePriceIds());
    if (!allowedPriceIds.has(priceId)) {
      return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
    }
    await connectToMongoDB();
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerFirebaseUid = establishment.ownerId || establishment.userId;
    if (ownerFirebaseUid !== userId) {
      return NextResponse.json({ error: "Only owner can manage billing" }, { status: 403 });
    }

    const ownerUser = await UserModel.findOne({ firebaseUid: ownerFirebaseUid });
    if (!ownerUser) return NextResponse.json({ error: "Owner user not found" }, { status: 404 });

    let preferredCurrency: string | null = null;
    if (ownerUser.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: ownerUser.stripeCustomerId,
        status: "all",
        limit: 10,
      });
      const latestSubscription = subscriptions.data
        .slice()
        .sort((a, b) => b.created - a.created)[0];
      preferredCurrency = latestSubscription?.items.data[0]?.price?.currency || null;
    }

    const resolvedPriceId = await resolveStripePriceId(priceId, preferredCurrency);
    if (!resolvedPriceId) {
      return NextResponse.json(
        { error: "Configured product has no recurring price for current subscription currency" },
        { status: 400 },
      );
    }

    let customerId = (ownerUser.stripeCustomerId || "").trim();
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ownerUser.email,
        metadata: { userId: String(ownerUser._id), establishmentSlug: slug },
      });
      customerId = customer.id;
      ownerUser.stripeCustomerId = customer.id;
      await ownerUser.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: { userId: String(ownerUser._id), establishmentSlug: slug },
      subscription_data: {
        metadata: { userId: String(ownerUser._id), establishmentSlug: slug },
      },
    });

    if (!session.url) return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[API /api/stripe/billing/checkout POST] Failed", error);
    const message = error instanceof Error ? error.message : "Failed to start billing checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
