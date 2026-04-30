import { NextRequest, NextResponse } from "next/server";
import { verifyUserId, normalizeSlug, findUserEstablishment } from "@/app/api/_utils/menu-builder";
import { connectToMongoDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import { UserModel } from "@/models/User";

function resolveSubscriptionState(status: string): "active" | "inactive" {
  return status === "active" || status === "trialing" ? "active" : "inactive";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    await connectToMongoDB();
    const establishment = await findUserEstablishment(slug, userId);
    if (!establishment) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerFirebaseUid = establishment.ownerId || establishment.userId;
    const canManageBilling = ownerFirebaseUid === userId;
    const ownerUser = await UserModel.findOne({ firebaseUid: ownerFirebaseUid }).lean();
    if (!ownerUser) {
      return NextResponse.json({
        canManageBilling,
        billing: {
          customerEmail: "",
          subscriptionStatus: "inactive",
          currentPlan: "",
          currentPeriodEnd: null,
          transactions: [],
        },
      });
    }

    const customerId = ownerUser.stripeCustomerId || "";
    if (!customerId) {
      return NextResponse.json({
        canManageBilling,
        billing: {
          customerEmail: ownerUser.email,
          subscriptionStatus: ownerUser.subscriptionStatus || "inactive",
          currentPlan: ownerUser.currentPlan || "",
          currentPeriodEnd: ownerUser.currentPeriodEnd || null,
          transactions: [],
        },
      });
    }

    const [customer, invoices, subscriptions] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.invoices.list({ customer: customerId, limit: 50 }),
      stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 }),
    ]);

    const customerEmail =
      typeof customer === "object" && !("deleted" in customer)
        ? customer.email || ownerUser.email
        : ownerUser.email;

    const latestSubscription = subscriptions.data
      .slice()
      .sort((a, b) => b.created - a.created)[0];

    let subscriptionStatus: "active" | "inactive" = ownerUser.subscriptionStatus || "inactive";
    let currentPlan = ownerUser.currentPlan || "";
    let currentProductId = "";
    let currentPeriodEnd = ownerUser.currentPeriodEnd || null;

    if (latestSubscription) {
      const subscriptionItem = latestSubscription.items.data[0];
      subscriptionStatus = resolveSubscriptionState(latestSubscription.status);
      currentPlan = subscriptionItem?.price?.id || "";
      currentProductId =
        typeof subscriptionItem?.price?.product === "string"
          ? subscriptionItem.price.product
          : subscriptionItem?.price?.product?.id || "";
      currentPeriodEnd = subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000)
        : null;
    }

    await UserModel.updateOne(
      { _id: ownerUser._id },
      {
        $set: {
          stripeCustomerId: customerId,
          subscriptionStatus,
          currentPlan,
          currentPeriodEnd,
        },
      },
    );

    return NextResponse.json({
      canManageBilling,
      billing: {
        customerEmail,
        subscriptionStatus,
        currentPlan,
        currentProductId,
        currentPeriodEnd,
        transactions: invoices.data.map((invoice) => ({
          id: invoice.id,
          createdAt: new Date(invoice.created * 1000).toISOString(),
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status || "open",
          invoiceUrl: invoice.hosted_invoice_url || "",
          description: invoice.lines.data[0]?.description || invoice.description || "",
        })),
      },
    });
  } catch (error) {
    console.error("[API /api/stripe/billing GET] Failed", error);
    return NextResponse.json({ error: "Failed to load billing data" }, { status: 500 });
  }
}
