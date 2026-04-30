import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToMongoDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import { UserModel } from "@/models/User";

function resolveSubscriptionState(status: Stripe.Subscription.Status): "active" | "inactive" {
  return status === "active" || status === "trialing" ? "active" : "inactive";
}

async function updateUserFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const user = await UserModel.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  const priceId = subscription.items.data[0]?.price?.id || "";
  user.subscriptionStatus = resolveSubscriptionState(subscription.status);
  user.currentPlan = priceId;
  user.currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  await user.save();
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Invalid webhook configuration" }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    await connectToMongoDB();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (userId && customerId) {
        const user = await UserModel.findById(userId);
        if (user) {
          user.stripeCustomerId = customerId;
          user.subscriptionStatus = "active";
          await user.save();
        }
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (userId) {
          const user = await UserModel.findById(userId);
          if (user) {
            user.subscriptionStatus = resolveSubscriptionState(subscription.status);
            user.currentPlan = subscription.items.data[0]?.price?.id || "";
            user.currentPeriodEnd = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null;
            await user.save();
          }
        } else {
          await updateUserFromSubscription(subscription);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserFromSubscription(subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const user = await UserModel.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = "inactive";
        user.currentPlan = "";
        user.currentPeriodEnd = null;
        await user.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[API /api/stripe/webhook POST] Failed", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 400 });
  }
}
