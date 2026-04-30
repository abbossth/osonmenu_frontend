import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    await connectToMongoDB();

    const user = await UserModel.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        _id: String(user._id),
        firebaseUid: user.firebaseUid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        stripeCustomerId: user.stripeCustomerId || "",
        subscriptionStatus: user.subscriptionStatus || "inactive",
        currentPlan: user.currentPlan || "",
        currentPeriodEnd: user.currentPeriodEnd || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /api/me GET] Failed to fetch user", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
