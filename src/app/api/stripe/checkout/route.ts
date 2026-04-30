import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import { UserModel } from "@/models/User";

async function resolveStripePriceId(inputId: string) {
  if (inputId.startsWith("price_")) return inputId;
  if (inputId.startsWith("prod_")) {
    const prices = await stripe.prices.list({
      product: inputId,
      active: true,
      type: "recurring",
      limit: 100,
    });
    return prices.data[0]?.id || "";
  }
  return "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const body = (await request.json()) as { priceId?: string };
    const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";
    if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    const resolvedPriceId = await resolveStripePriceId(priceId);
    if (!resolvedPriceId) {
      return NextResponse.json({ error: "Configured product has no default recurring price" }, { status: 400 });
    }

    await connectToMongoDB();
    const user = await UserModel.findOne({ firebaseUid: decoded.uid });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let customerId = (user.stripeCustomerId || "").trim();
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: String(user._id) },
      });
      customerId = customer.id;
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: { userId: String(user._id) },
      subscription_data: {
        metadata: { userId: String(user._id) },
      },
    });

    if (!session.url) return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[API /api/stripe/checkout POST] Failed", error);
    const message = error instanceof Error ? error.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
